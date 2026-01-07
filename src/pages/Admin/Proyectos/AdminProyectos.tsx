import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Paper, Chip, IconButton, Stack, Tooltip,
  TextField, MenuItem, InputAdornment, Switch, CircularProgress,
  alpha, Avatar, useTheme, Divider
} from '@mui/material';
import {
  Add, Search, Edit,
  Visibility as VisibilityIcon,
  MonetizationOn as MonetizationOnIcon,
  Image as ImageIcon,
  PlayArrow,
  Apartment as ApartmentIcon,
  CheckCircle,
  Block
} from '@mui/icons-material';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateProyectoDto, ProyectoDto, UpdateProyectoDto } from '../../../types/dto/proyecto.dto';

import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';
import { DataTable, type DataTableColumn } from '../../../components/common/DataTable/DataTable';

import { useSnackbar } from '../../../context/SnackbarContext'; 
import { useModal } from '../../../hooks/useModal';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog/ConfirmDialog';
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import ProyectoService from '../../../services/proyecto.service';

// Modales
import CreateProyectoModal from './components/modals/CreateProyectoModal';
import ConfigCuotasModal from './components/modals/ConfigCuotasModal';
import EditProyectoModal from './components/modals/EditProyectoModal';
import ProjectLotesModal from './components/modals/ProjectLotesModal';
import ManageImagesModal from './components/modals/ManageImagesModal';

type TipoInversionFilter = 'all' | 'mensual' | 'directo';

const AdminProyectos: React.FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { showSuccess } = useSnackbar();

  // --- HOOKS DE MODALES ---
  const createModal = useModal();
  const cuotasModal = useModal();
  const lotesModal = useModal();
  const editModal = useModal();
  const imagesModal = useModal();
  const confirmDialog = useConfirmDialog();
  
  const [selectedProject, setSelectedProject] = useState<ProyectoDto | null>(null);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<TipoInversionFilter>('all');

  const initialStatusRef = useRef<Record<number, boolean>>({});

  // --- QUERIES ---
  const { data: proyectos = [], isLoading, error } = useQuery({
    queryKey: ['adminProyectos'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data
  });

  useEffect(() => {
    if (proyectos.length > 0) {
      proyectos.forEach(p => {
        if (initialStatusRef.current[p.id] === undefined) {
          initialStatusRef.current[p.id] = p.activo;
        }
      });
    }
  }, [proyectos]);

  // --- MUTACIONES ---

  // 1. CREAR
  const createMutation = useMutation({
    mutationFn: (data: CreateProyectoDto) => ProyectoService.create(data),
    onSuccess: (response) => { 
      queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
      createModal.close();
      if (response.data?.id) {
          setHighlightedId(response.data.id);
          setTimeout(() => setHighlightedId(null), 2500);
      }
      showSuccess('Proyecto creado. Use el icono de imagen para subir la portada.');
    }
  });

  // 2. EDITAR (Solución del error TypeScript)
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: UpdateProyectoDto }) => ProyectoService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
      editModal.close(); 
      setHighlightedId(variables.id); 
      showSuccess('Proyecto actualizado correctamente');
    }
  });

  // 3. VISIBILIDAD
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, activo }: { id: number; activo: boolean }) => ProyectoService.update(id, { activo }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
      confirmDialog.close();
      setHighlightedId(variables.id);
      setTimeout(() => setHighlightedId(null), 2500);
      showSuccess(variables.activo ? 'Proyecto ahora es visible' : 'Proyecto ocultado');
    }
  });

  // 4. INICIAR PROCESO
  const startMutation = useMutation({
    mutationFn: (id: number) => ProyectoService.startProcess(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
      confirmDialog.close();
      showSuccess('Proceso de cobros iniciado');
    }
  });

  // --- HANDLERS OPTIMIZADOS (useCallback) ---
  // Estos evitan re-renders innecesarios al pasar funciones estables a los hijos

  const handleCreateSubmit = useCallback(async (data: CreateProyectoDto) => {
    await createMutation.mutateAsync(data);
  }, [createMutation]);

  const handleUpdateSubmit = useCallback(async (id: number, data: UpdateProyectoDto) => {
    await updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const handleAction = useCallback((proyecto: ProyectoDto, action: 'edit' | 'images' | 'cuotas' | 'lotes') => {
    setSelectedProject(proyecto);
    if (action === 'edit') editModal.open();
    else if (action === 'images') imagesModal.open();
    else if (action === 'cuotas') cuotasModal.open();
    else if (action === 'lotes') lotesModal.open();
  }, [editModal, imagesModal, cuotasModal, lotesModal]);

  const handleConfirmAction = useCallback(() => {
    if (!confirmDialog.data) return;
    const project = confirmDialog.data as ProyectoDto;
    
    if (confirmDialog.action === 'start_project_process') {
      startMutation.mutate(project.id);
    } 
    else if (confirmDialog.action === 'toggle_project_visibility') {
      toggleActiveMutation.mutate({ id: project.id, activo: !project.activo });
    }
  }, [confirmDialog, startMutation, toggleActiveMutation]);

  // --- FILTRADO (Memoizado) ---
  const filteredProyectos = useMemo(() => {
    return proyectos.filter(p => {
      const matchesSearch = p.nombre_proyecto.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterTipo === 'all' || p.tipo_inversion === filterTipo;
      return matchesSearch && matchesType;
    });
  }, [proyectos, searchTerm, filterTipo]);

  // --- COLUMNAS (Memoizadas) ---
  const columns = useMemo<DataTableColumn<ProyectoDto>[]>(() => [
    {
      id: 'proyecto',
      label: 'Proyecto / ID',
      render: (p) => (
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
            <ApartmentIcon />
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={700}>{p.nombre_proyecto}</Typography>
            <Typography variant="caption" color="text.secondary">ID: {p.id}</Typography>
          </Box>
        </Stack>
      )
    },
    {
      id: 'tipo',
      label: 'Tipo',
      render: (p) => <Chip label={p.tipo_inversion === 'mensual' ? 'Ahorro' : 'Directo'} size="small" color={p.tipo_inversion === 'mensual' ? 'primary' : 'default'} />
    },
    {
        id: 'finanzas',
        label: 'Inversión',
        render: (p) => <Typography variant="body2" fontWeight={600}>{p.moneda} {Number(p.monto_inversion).toLocaleString()}</Typography>
    },
    {
      id: 'visibilidad',
      label: 'Visibilidad',
      align: 'center',
      render: (p) => (
        <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
          <Switch 
            checked={p.activo} 
            onChange={() => confirmDialog.confirm('toggle_project_visibility', p)} 
            size="small" 
            color="success" 
            disabled={toggleActiveMutation.isPending}
          />
          <Typography variant="caption" fontWeight={600} color={p.activo ? 'success.main' : 'text.disabled'}>
            {p.activo ? 'Visible' : 'Oculto'}
          </Typography>
        </Stack>
      )
    },
    {
      id: 'acciones',
      label: 'Acciones',
      align: 'right',
      render: (p) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title="Imágenes"><IconButton onClick={() => handleAction(p, 'images')} size="small" color="primary"><ImageIcon fontSize="small" /></IconButton></Tooltip>
          {p.tipo_inversion === 'mensual' && (
            <Tooltip title="Cuotas"><IconButton onClick={() => handleAction(p, 'cuotas')} size="small"><MonetizationOnIcon fontSize="small" /></IconButton></Tooltip>
          )}
          {p.tipo_inversion === 'mensual' && p.estado_proyecto === 'En Espera' && (
            <Tooltip title="Iniciar Cobros"><IconButton onClick={() => confirmDialog.confirm('start_project_process', p)} size="small" sx={{ color: "success.main" }}><PlayArrow fontSize="small" /></IconButton></Tooltip>
          )}
          <Tooltip title="Editar"><IconButton onClick={() => handleAction(p, 'edit')} size="small"><Edit fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Lotes"><IconButton onClick={() => handleAction(p, 'lotes')} size="small" color="info"><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
        </Stack>
      )
    }
  ], [theme, toggleActiveMutation.isPending, confirmDialog, handleAction]);

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      <PageHeader title="Gestión de Proyectos" subtitle="Administra el catálogo de inversiones y estados." />

      {/* Barra de Filtros */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <TextField 
          placeholder="Buscar..." size="small" sx={{ flexGrow: 1 }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} 
        />
        <TextField select label="Tipo" size="small" value={filterTipo} onChange={(e) => setFilterTipo(e.target.value as TipoInversionFilter)} sx={{ minWidth: 150 }}>
          <MenuItem value="all">Todos</MenuItem>
          <MenuItem value="directo">Directo</MenuItem>
          <MenuItem value="mensual">Ahorro</MenuItem>
        </TextField>
        <Button variant="contained" startIcon={<Add />} onClick={createModal.open}>Nuevo Proyecto</Button>
      </Paper>

      <QueryHandler isLoading={isLoading} error={error as Error}>
          {/* La tabla ya no se redibuja innecesariamente gracias a los useCallbacks */}
          <DataTable 
            columns={columns} 
            data={filteredProyectos} 
            getRowKey={(p) => p.id} 
            highlightedRowId={highlightedId} 
            pagination={true} 
          />
      </QueryHandler>

      {/* --- MODALES OPTIMIZADOS --- */}

      <CreateProyectoModal
        {...createModal.modalProps} 
        onSubmit={handleCreateSubmit}
        isLoading={createMutation.isPending}
      />

      {selectedProject && (
        <>
          <ConfigCuotasModal {...cuotasModal.modalProps} proyecto={selectedProject} />
          
          <EditProyectoModal 
            {...editModal.modalProps} 
            proyecto={selectedProject} 
            onSubmit={handleUpdateSubmit} // Usamos el callback estable
            isLoading={updateMutation.isPending} // Usamos el estado real de la mutación
          />
          
          <ProjectLotesModal {...lotesModal.modalProps} proyecto={selectedProject} />
          <ManageImagesModal {...imagesModal.modalProps} proyecto={selectedProject} />
        </>
      )}

      <ConfirmDialog 
        controller={confirmDialog}
        onConfirm={handleConfirmAction}
        isLoading={startMutation.isPending || toggleActiveMutation.isPending}
      />

    </PageContainer>
  );
};

export default AdminProyectos;