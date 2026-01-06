// src/components/Admin/Proyectos/AdminProyectos.tsx

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


import { useSnackbar } from '../../../hooks/useSnackbar';

// Modales y Servicios
import CreateProyectoModal from './components/modals/CreateProyectoModal';
import ConfigCuotasModal from './components/modals/ConfigCuotasModal';
import EditProyectoModal from './components/modals/EditProyectoModal';
import ProjectLotesModal from './components/modals/ProjectLotesModal';
import ManageImagesModal from './components/modals/ManageImagesModal';
import ProyectoService from '../../../services/proyecto.service';

// Hooks y Componentes de Confirmación
import { useModal } from '../../../hooks/useModal';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog/ConfirmDialog';
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import GlobalSnackbar from '../../../components/common/GlobalSnackbarProps/GlobalSnackbarProps';

type TipoInversionFilter = 'all' | 'mensual' | 'directo';
type AppColor = 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';

const AdminProyectos: React.FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();

  // ✅ Hook de Snackbar Global
  const { snackbar, showSuccess, showError, handleClose: closeSnackbar } = useSnackbar();

  // --- HOOKS DE MODALES ---
  const createModal = useModal();
  const cuotasModal = useModal();
  const lotesModal = useModal();
  const editModal = useModal();
  const imagesModal = useModal();
  const confirmDialog = useConfirmDialog();
  
  // Estado de Datos
  const [selectedProject, setSelectedProject] = useState<ProyectoDto | null>(null);

  // Estado para el efecto Flash (Feedback visual)
  const [highlightedId, setHighlightedId] = useState<number | null>(null);

  // --- LOGICA STICKY ---
  const initialStatusRef = useRef<Record<number, boolean>>({});

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<TipoInversionFilter>('all');

  // --- QUERIES & MUTATIONS ---

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

  const createMutation = useMutation({
    mutationFn: async ({ data, image }: { data: CreateProyectoDto; image: File | null }) => {
      const response = await ProyectoService.create(data, image);
      return response.data;
    },
    onSuccess: (newItem) => { 
      queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
      createModal.close();
      
      if (newItem?.id) {
          setHighlightedId(newItem.id);
          setTimeout(() => setHighlightedId(null), 2500);
      }
      
      showSuccess('Proyecto creado correctamente'); // ✅
    },
    onError: (err: any) => showError(`Error al crear: ${err.response?.data?.error || err.message}`) // ✅
  });

  const startMutation = useMutation({
    mutationFn: (id: number) => ProyectoService.startProcess(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
      confirmDialog.close();
      setHighlightedId(id); 
      showSuccess('Proyecto iniciado. Cobros activados.'); // ✅
    },
    onError: (err: any) => {
      confirmDialog.close();
      showError(`Error al iniciar: ${err.response?.data?.error || err.message}`); // ✅
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: UpdateProyectoDto }) =>
      ProyectoService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
      editModal.close(); 
      setHighlightedId(variables.id); 
      showSuccess('Proyecto actualizado correctamente'); // ✅
    },
    onError: (err: any) => showError(`Error al editar: ${err.response?.data?.error || err.message}`) // ✅
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, activo }: { id: number; activo: boolean }) => {
      return ProyectoService.update(id, { activo });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
      confirmDialog.close();
      
      setHighlightedId(variables.id);
      setTimeout(() => setHighlightedId(null), 2500);

      showSuccess(variables.activo ? 'Proyecto ahora es visible' : 'Proyecto ocultado correctamente'); // ✅
    },
    onError: (err: any) => {
      confirmDialog.close();
      showError(`Error: ${err.response?.data?.error || err.message}`); // ✅
    }
  });

  // --- HANDLERS ---

  const handleOpenModal = useCallback((proyecto: ProyectoDto, modalOpenFn: () => void) => {
    setSelectedProject(proyecto);
    modalOpenFn();
  }, []);

  const handleCloseModal = useCallback((modalCloseFn: () => void) => {
    modalCloseFn();
  }, []);

  const handleStartProcessClick = (proyecto: ProyectoDto) => {
    confirmDialog.confirm('start_project_process', proyecto);
  };

  const handleConfirmAction = () => {
    if (!confirmDialog.data) return;
    const projectData = confirmDialog.data as ProyectoDto;
    
    if (confirmDialog.action === 'start_project_process') {
      startMutation.mutate(projectData.id);
    } 
    else if (confirmDialog.action === 'toggle_project_visibility') {
      toggleActiveMutation.mutate({ id: projectData.id, activo: !projectData.activo });
    }
  };

  const filteredProyectos = useMemo(() => {
    const filtered = proyectos.filter(p => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = p.nombre_proyecto.toLowerCase().includes(term);
      const matchesType = filterTipo === 'all' || p.tipo_inversion === filterTipo;
      return matchesSearch && matchesType;
    });

    return filtered.sort((a, b) => {
      const statusA = initialStatusRef.current[a.id] ?? a.activo;
      const statusB = initialStatusRef.current[b.id] ?? b.activo;
      if (statusA !== statusB) return statusA ? -1 : 1;
      return a.nombre_proyecto.localeCompare(b.nombre_proyecto);
    });
  }, [proyectos, searchTerm, filterTipo]);

  const getStatusColor = (status: string): AppColor => {
    switch (status) {
      case 'En proceso': return 'success';
      case 'Finalizado': return 'info';
      case 'En Espera': return 'warning';
      case 'Cancelado': return 'error';
      default: return 'primary';
    }
  };

  const columns = useMemo<DataTableColumn<ProyectoDto>[]>(() => [
    {
      id: 'proyecto',
      label: 'Proyecto / ID',
      minWidth: 250,
      render: (p) => (
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar variant="rounded" sx={{ 
            bgcolor: p.activo ? alpha(theme.palette.primary.main, 0.1) : theme.palette.action.disabledBackground, 
            color: p.activo ? 'primary.main' : 'text.disabled',
            width: 40, height: 40
          }}>
            <ApartmentIcon />
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={700} color={p.activo ? 'text.primary' : 'text.disabled'}>
              {p.nombre_proyecto}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ID: {p.id}
            </Typography>
          </Box>
        </Stack>
      )
    },
    {
      id: 'tipo',
      label: 'Tipo Inversión',
      render: (p) => {
        const isMensual = p.tipo_inversion === 'mensual';
        return (
          <Chip
            label={isMensual ? 'Ahorro' : 'Directo'}
            size="small"
            color={isMensual ? 'primary' : 'default'}
            variant={isMensual ? 'filled' : 'outlined'}
            sx={{ fontWeight: 600, minWidth: 80 }}
          />
        );
      }
    },
    {
      id: 'estado',
      label: 'Estado',
      render: (p) => {
        const colorKey = getStatusColor(p.estado_proyecto);
        const colorMain = theme.palette[colorKey].main;
        return (
          <Chip
            label={p.estado_proyecto}
            size="small"
            sx={{ 
              fontWeight: 600, 
              bgcolor: alpha(colorMain, 0.1),
              color: colorMain,
              border: '1px solid',
              borderColor: alpha(colorMain, 0.2)
            }}
          />
        );
      }
    },
    {
      id: 'finanzas',
      label: 'Inversión Total',
      render: (p) => (
        <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
          {p.moneda} {Number(p.monto_inversion).toLocaleString()}
        </Typography>
      )
    },
    {
      id: 'visibilidad',
      label: 'Visibilidad',
      align: 'center',
      render: (p) => {
        const currentId = confirmDialog.data ? (confirmDialog.data as ProyectoDto).id : null;
        const isProcessingThis = toggleActiveMutation.isPending && currentId === p.id;

        return (
          <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
            {isProcessingThis ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <Tooltip title={p.activo ? 'Ocultar Proyecto' : 'Hacer Visible'}>
                <Switch
                  checked={p.activo}
                  onChange={() => confirmDialog.confirm('toggle_project_visibility', p)}
                  color="success"
                  size="small"
                  disabled={toggleActiveMutation.isPending}
                />
              </Tooltip>
            )}
            
            {!isProcessingThis && (
              <Box display="flex" alignItems="center" gap={0.5}>
                {p.activo ? (
                  <CheckCircle fontSize="inherit" color="success" sx={{ fontSize: 14 }} />
                ) : (
                  <Block fontSize="inherit" color="disabled" sx={{ fontSize: 14 }} />
                )}
                <Typography 
                  variant="caption" 
                  color={p.activo ? 'success.main' : 'text.disabled'}
                  fontWeight={600}
                >
                  {p.activo ? 'Visible' : 'Oculto'}
                </Typography>
              </Box>
            )}
          </Stack>
        );
      }
    },
    {
      id: 'acciones',
      label: 'Acciones',
      align: 'right',
      render: (p) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title="Gestionar Imágenes">
            <IconButton 
              onClick={(e) => { e.stopPropagation(); handleOpenModal(p, imagesModal.open); }} 
              size="small"
              disabled={toggleActiveMutation.isPending}
              sx={{ color: 'primary.main'}}
            >
              <ImageIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {p.tipo_inversion === 'mensual' && (
            <Tooltip title="Configurar Cuota">
              <IconButton 
                onClick={(e) => { e.stopPropagation(); handleOpenModal(p, cuotasModal.open); }} 
                size="small" 
                disabled={toggleActiveMutation.isPending}
              >
                <MonetizationOnIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {p.tipo_inversion === 'mensual' && p.estado_proyecto === 'En Espera' && (
            <Tooltip title="Iniciar Proceso (Activar Cobros)">
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); handleStartProcessClick(p); }}
                disabled={toggleActiveMutation.isPending}
                sx={{ color: "success.main" }}
              >
                <PlayArrow fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Editar">
            <IconButton 
              onClick={(e) => { e.stopPropagation(); handleOpenModal(p, editModal.open); }} 
              size="small"
              disabled={toggleActiveMutation.isPending}
              sx={{ color: 'primary.main' }}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Ver Lotes">
            <IconButton 
              onClick={(e) => { e.stopPropagation(); handleOpenModal(p, lotesModal.open); }} 
              size="small"
              disabled={toggleActiveMutation.isPending}
              sx={{ color: 'info.main' }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ], [theme, toggleActiveMutation.isPending, confirmDialog, handleOpenModal, imagesModal, cuotasModal, editModal, lotesModal]);

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      <PageHeader
        title="Gestión de Proyectos"
        subtitle="Administra el catálogo de inversiones, estados y configuración financiera."
      />

      {/* Barra de Filtros */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', 
          borderRadius: 2, border: '1px solid', borderColor: 'divider', 
          bgcolor: alpha(theme.palette.background.paper, 0.6)
        }} 
      >
        <TextField
          placeholder="Buscar por nombre..."
          size="small"
          sx={{ flexGrow: 1, minWidth: 200 }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{ 
            startAdornment: (<InputAdornment position="start"><Search color="action" /></InputAdornment>),
            sx: { borderRadius: 2 }
          }}
        />
        <TextField
          select
          label="Tipo Inversión"
          size="small"
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value as TipoInversionFilter)}
          sx={{ minWidth: 180, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        >
          <MenuItem value="all">Todos</MenuItem>
          <MenuItem value="directo">Directo (Lotes)</MenuItem>
          <MenuItem value="mensual">Ahorro (Mensual)</MenuItem>
        </TextField>

        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' }, mx: 1 }} />

        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={createModal.open}
          sx={{ borderRadius: 2, fontWeight: 600 }}
        >
          Nuevo Proyecto
        </Button>
      </Paper>

      <QueryHandler isLoading={isLoading} error={error as Error}>
          <DataTable
            columns={columns}
            data={filteredProyectos}
            getRowKey={(p) => p.id}
            isRowActive={(p) => p.activo} 
            highlightedRowId={highlightedId} 
            emptyMessage="No se encontraron proyectos con los filtros actuales."
            pagination={true}
            defaultRowsPerPage={10}
          />
      </QueryHandler>

      {/* --- MODALES --- */}
      <CreateProyectoModal
        {...createModal.modalProps} 
        onSubmit={async (data, image) => { await createMutation.mutateAsync({ data, image }); }}
        isLoading={createMutation.isPending}
      />

      {selectedProject && (
        <>
          <ConfigCuotasModal
            open={cuotasModal.modalProps.open}
            onClose={() => handleCloseModal(cuotasModal.close)}
            proyecto={selectedProject}
          />

          <EditProyectoModal
            open={editModal.modalProps.open}
            onClose={() => handleCloseModal(editModal.close)}
            proyecto={selectedProject}
            onSubmit={async (id, data) => { await updateMutation.mutateAsync({ id, data }); }}
            isLoading={updateMutation.isPending}
          />

          <ProjectLotesModal
            open={lotesModal.modalProps.open}
            onClose={() => handleCloseModal(lotesModal.close)}
            proyecto={selectedProject}
          />

          <ManageImagesModal
            open={imagesModal.modalProps.open}
            onClose={() => handleCloseModal(imagesModal.close)}
            proyecto={selectedProject}
          />
        </>
      )}

      <ConfirmDialog 
        controller={confirmDialog}
        onConfirm={handleConfirmAction}
        isLoading={startMutation.isPending || toggleActiveMutation.isPending}
      />

      {/* ✅ Implementación del GlobalSnackbar */}
      <GlobalSnackbar 
        {...snackbar} 
        onClose={closeSnackbar} 
      />

    </PageContainer>
  );
};

export default AdminProyectos;