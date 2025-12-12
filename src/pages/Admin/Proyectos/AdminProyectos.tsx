import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Button, Paper, Chip, IconButton, Stack, Tooltip,
  TextField, MenuItem, InputAdornment, Snackbar, Alert, Switch, LinearProgress
} from '@mui/material';
import {
  Add, Search, Edit,
  Visibility as VisibilityIcon,
  MonetizationOn as MonetizationOnIcon,
  Image as ImageIcon,
  PlayArrow
} from '@mui/icons-material';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateProyectoDto, ProyectoDto, UpdateProyectoDto } from '../../../types/dto/proyecto.dto';

import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';
import { DataTable, type DataTableColumn } from '../../../components/common/DataTable/DataTable';

// Modales
import CreateProyectoModal from './components/modals/CreateProyectoModal';
import ConfigCuotasModal from './components/modals/ConfigCuotasModal';
import EditProyectoModal from './components/modals/EditProyectoModal';
import ProjectLotesModal from './components/modals/ProjectLotesModal';
import ManageImagesModal from './components/modals/ManageImagesModal';
import ProyectoService from '../../../Services/proyecto.service';

// ✅ 1. IMPORTAMOS EL HOOK
import { useModal } from '../../../hooks/useModal';

type TipoInversionFilter = 'all' | 'mensual' | 'directo';

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info';
}

const AdminProyectos: React.FC = () => {
  const queryClient = useQueryClient();

  // ✅ 2. MODALES CON HOOK (Ya estaba bien)
  const createModal = useModal();
  const cuotasModal = useModal();
  const lotesModal = useModal();
  const editModal = useModal();
  const imagesModal = useModal();
  
  // Estado de Datos
  const [selectedProject, setSelectedProject] = useState<ProyectoDto | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<TipoInversionFilter>('all');

  // Notificaciones
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false, message: '', severity: 'success'
  });

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // --- Queries & Mutations ---

  const { data: proyectos, isLoading, error } = useQuery({
    queryKey: ['adminProyectos'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data
  });

  const createMutation = useMutation({
    mutationFn: async ({ data, image }: { data: CreateProyectoDto; image: File | null }) => {
      return ProyectoService.create(data, image);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
      createModal.close(); // ✅
      showSnackbar('Proyecto creado correctamente', 'success');
    },
    onError: (err: any) => showSnackbar(`Error al crear: ${err.response?.data?.error || err.message}`, 'error')
  });

  const startMutation = useMutation({
    mutationFn: (id: number) => ProyectoService.startProcess(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
      showSnackbar('Proyecto iniciado. Cobros activados.', 'success');
    },
    onError: (err: any) => showSnackbar(`Error al iniciar: ${err.response?.data?.error || err.message}`, 'error')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: UpdateProyectoDto }) =>
      ProyectoService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
      editModal.close(); // ✅
      showSnackbar('Proyecto actualizado correctamente', 'success');
    },
    onError: (err: any) => showSnackbar(`Error al editar: ${err.response?.data?.error || err.message}`, 'error')
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, activo }: { id: number; activo: boolean }) => {
      return ProyectoService.update(id, { activo });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
      showSnackbar(variables.activo ? 'Proyecto activado' : 'Proyecto desactivado', 'success');
    },
    onError: (err: any) => showSnackbar(`Error: ${err.response?.data?.error || err.message}`, 'error')
  });

  // Helpers y Filtros
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En proceso': return 'success';
      case 'Finalizado': return 'default';
      case 'En Espera': return 'warning';
      case 'Cancelado': return 'error';
      default: return 'primary';
    }
  };

  const filteredProyectos = useMemo(() => {
    if (!proyectos) return [];
    const term = searchTerm.toLowerCase();
    return proyectos.filter(p => {
      const matchesSearch = p.nombre_proyecto.toLowerCase().includes(term);
      const matchesType = filterTipo === 'all' || p.tipo_inversion === filterTipo;
      return matchesSearch && matchesType;
    });
  }, [proyectos, searchTerm, filterTipo]);

  // Handlers
  const handleVerLotes = (proyecto: ProyectoDto) => {
    setSelectedProject(proyecto);
    lotesModal.open();
  };

  const handleConfigCuotas = (proyecto: ProyectoDto) => {
    setSelectedProject(proyecto);
    cuotasModal.open();
  };

  const handleEdit = (proyecto: ProyectoDto) => {
    setSelectedProject(proyecto);
    editModal.open();
  };

  const handleManageImages = (proyecto: ProyectoDto) => {
    setSelectedProject(proyecto);
    imagesModal.open();
  };

  const handleToggleActive = (proyecto: ProyectoDto) => {
    toggleActiveMutation.mutate({ id: proyecto.id, activo: !proyecto.activo });
  };

  const closeAndClear = (modalCloseFn: () => void) => {
    modalCloseFn();
    setSelectedProject(null);
  };

  // Definición de Columnas
  const columns: DataTableColumn<ProyectoDto>[] = [
    {
      id: 'proyecto',
      label: 'Proyecto / ID',
      minWidth: 200,
      render: (p) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>{p.nombre_proyecto}</Typography>
          <Typography variant="caption" color="text.secondary">ID: {p.id}</Typography>
        </Box>
      )
    },
    {
      id: 'tipo',
      label: 'Tipo',
      render: (p) => (
        <Chip
          label={p.tipo_inversion === 'mensual' ? 'Ahorro' : 'Directo'}
          size="small"
          color={p.tipo_inversion === 'mensual' ? 'primary' : 'default'}
          variant={p.tipo_inversion === 'mensual' ? 'filled' : 'outlined'}
          sx={{ fontWeight: 500 }}
        />
      )
    },
    {
      id: 'estado',
      label: 'Estado',
      render: (p) => (
        <Chip
          label={p.estado_proyecto}
          size="small"
          color={getStatusColor(p.estado_proyecto) as any}
          sx={{ fontWeight: 600 }}
        />
      )
    },
    {
      id: 'visibilidad',
      label: 'Visibilidad',
      render: (p) => (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Switch
            checked={p.activo}
            onChange={() => handleToggleActive(p)}
            color="success"
            size="small"
            disabled={toggleActiveMutation.isPending}
          />
          <Typography variant="caption" color={p.activo ? 'success.main' : 'text.disabled'}>
            {p.activo ? 'Visible' : 'Oculto'}
          </Typography>
        </Stack>
      )
    },
    {
      id: 'finanzas',
      label: 'Finanzas',
      render: (p) => (
        <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
          {p.moneda} {Number(p.monto_inversion).toLocaleString()}
        </Typography>
      )
    },
    {
      id: 'progreso',
      label: 'Progreso',
      render: (p) => (
        p.tipo_inversion === 'mensual'
          ? <Typography variant="body2"><strong>{p.suscripciones_actuales}</strong> / {p.obj_suscripciones} Subs</Typography>
          : <Typography variant="body2"><strong>{p.lotes?.length || 0}</strong> Lotes</Typography>
      )
    },
    {
      id: 'acciones',
      label: 'Acciones',
      align: 'right',
      render: (p) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title="Gestionar Imágenes">
            <IconButton onClick={() => handleManageImages(p)} size="small" color="default">
              <ImageIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {p.tipo_inversion === 'mensual' && (
            <Tooltip title="Configurar Cuota Mensual">
              <IconButton onClick={() => handleConfigCuotas(p)} size="small" sx={{ color: "#E07A4D" }}>
                <MonetizationOnIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {p.tipo_inversion === 'mensual' && p.estado_proyecto === 'En Espera' && (
            <Tooltip title="Iniciar Proceso (Activar Cobros)">
              <IconButton
                color="success"
                size="small"
                onClick={() => {
                  if (confirm('¿Iniciar conteo de meses? Esto activará los cobros.')) {
                    startMutation.mutate(p.id);
                  }
                }}
              >
                <PlayArrow fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Editar Proyecto">
            <IconButton color="primary" onClick={() => handleEdit(p)} size="small">
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Ver Lotes">
            <IconButton color="info" onClick={() => handleVerLotes(p)} size="small">
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ];

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        title="Gestión de Proyectos"
        subtitle="Administra el catálogo de inversiones, estados y configuración financiera."
      />

      {/* --- Toolbar --- */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', borderRadius: 2 }} elevation={0} variant="outlined">
        <TextField
          placeholder="Buscar proyecto..."
          size="small"
          sx={{ flexGrow: 1, minWidth: 200 }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: (<InputAdornment position="start"><Search /></InputAdornment>) }}
        />
        <TextField
          select
          label="Tipo Inversión"
          size="small"
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value as TipoInversionFilter)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="all">Todos</MenuItem>
          <MenuItem value="directo">Directo (Lotes)</MenuItem>
          <MenuItem value="mensual">Ahorro (Mensual)</MenuItem>
        </TextField>

        {/* ✅ Usamos createModal.open */}
        <Button variant="contained" startIcon={<Add />} onClick={createModal.open}>
          Nuevo Proyecto
        </Button>
      </Paper>

      {/* --- DataTable --- */}
      <QueryHandler isLoading={isLoading} error={error as Error}>
        <DataTable
          columns={columns}
          data={filteredProyectos}
          getRowKey={(p) => p.id}
          emptyMessage="No se encontraron proyectos con los filtros actuales."
          pagination={true}
          defaultRowsPerPage={10}
        />
      </QueryHandler>

      {/* --- MODALES --- */}

      {/* 1. Create: Ajustado a mutateAsync */}
      <CreateProyectoModal
        {...createModal.modalProps} 
        onSubmit={async (data, image) => {
            // ✅ CORRECCIÓN: Usar mutateAsync para devolver una Promesa
            await createMutation.mutateAsync({ data, image });
        }}
        isLoading={createMutation.isPending}
      />

      <ConfigCuotasModal
        open={cuotasModal.isOpen}
        onClose={() => closeAndClear(cuotasModal.close)}
        proyecto={selectedProject}
      />

      {/* 3. Edit: Ajustado a mutateAsync */}
      <EditProyectoModal
        open={editModal.isOpen}
        onClose={() => closeAndClear(editModal.close)}
        proyecto={selectedProject}
        onSubmit={async (id, data) => {
            // ✅ CORRECCIÓN: Usar mutateAsync para devolver una Promesa
            await updateMutation.mutateAsync({ id, data });
        }}
        isLoading={updateMutation.isPending}
      />

      <ProjectLotesModal
        open={lotesModal.isOpen}
        onClose={() => closeAndClear(lotesModal.close)}
        proyecto={selectedProject}
      />

      {selectedProject && (
        <ManageImagesModal
          open={imagesModal.isOpen}
          onClose={() => closeAndClear(imagesModal.close)}
          proyecto={selectedProject}
        />
      )}

      {/* --- Snackbar --- */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>

    </PageContainer>
  );
};

export default AdminProyectos;