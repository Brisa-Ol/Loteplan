import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Chip, IconButton, Stack, Tooltip,
  TextField, MenuItem, InputAdornment, Snackbar, Alert, Switch, CircularProgress,
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

// Modales y Servicios
import CreateProyectoModal from './components/modals/CreateProyectoModal';
import ConfigCuotasModal from './components/modals/ConfigCuotasModal';
import EditProyectoModal from './components/modals/EditProyectoModal';
import ProjectLotesModal from './components/modals/ProjectLotesModal';
import ManageImagesModal from './components/modals/ManageImagesModal';
import ProyectoService from '../../../Services/proyecto.service';

// Hooks y Componentes de Confirmación
import { useModal } from '../../../hooks/useModal';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog/ConfirmDialog';
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';

type TipoInversionFilter = 'all' | 'mensual' | 'directo';

// 1. DEFINIMOS LOS COLORES VÁLIDOS DE MUI QUE TIENEN .main
type AppColor = 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info';
}

const AdminProyectos: React.FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();

  // --- HOOKS DE MODALES ---
  const createModal = useModal();
  const cuotasModal = useModal();
  const lotesModal = useModal();
  const editModal = useModal();
  const imagesModal = useModal();
  const confirmDialog = useConfirmDialog();
  
  // Estado de Datos
  const [selectedProject, setSelectedProject] = useState<ProyectoDto | null>(null);

  // Estado para el efecto Flash
  const [highlightedId, setHighlightedId] = useState<number | null>(null);

  // --- LOGICA STICKY (Congelar Orden) ---
  const initialStatusRef = useRef<Record<number, boolean>>({});

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

  // --- QUERIES & MUTATIONS ---

  const { data: proyectos = [], isLoading, error } = useQuery({
    queryKey: ['adminProyectos'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data
  });

  // --- EFECTO PARA CAPTURAR ESTADO INICIAL ---
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
      return ProyectoService.create(data, image);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
      createModal.close();
      showSnackbar('Proyecto creado correctamente', 'success');
    },
    onError: (err: any) => showSnackbar(`Error al crear: ${err.response?.data?.error || err.message}`, 'error')
  });

  const startMutation = useMutation({
    mutationFn: (id: number) => ProyectoService.startProcess(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
      confirmDialog.close();
      showSnackbar('Proyecto iniciado. Cobros activados.', 'success');
    },
    onError: (err: any) => {
        confirmDialog.close();
        showSnackbar(`Error al iniciar: ${err.response?.data?.error || err.message}`, 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: UpdateProyectoDto }) =>
      ProyectoService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
      editModal.close();
      setSelectedProject(null);
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
      confirmDialog.close();
      
      // Efecto Flash
      setHighlightedId(variables.id);
      setTimeout(() => setHighlightedId(null), 2500);

      showSnackbar(variables.activo ? 'Proyecto visible' : 'Proyecto ocultado', 'success');
    },
    onError: (err: any) => {
      confirmDialog.close();
      showSnackbar(`Error: ${err.response?.data?.error || err.message}`, 'error');
    }
  });

  // --- HANDLERS ---

  const handleStartProcessClick = (proyecto: ProyectoDto) => {
    confirmDialog.confirm('start_project_process', proyecto);
  };

  const handleConfirmAction = () => {
    if (!confirmDialog.data) return;
    
    if (confirmDialog.action === 'start_project_process') {
        startMutation.mutate(confirmDialog.data.id);
    } 
    else if (confirmDialog.action === 'toggle_project_visibility') {
        const { id, activo } = confirmDialog.data;
        toggleActiveMutation.mutate({ id, activo: !activo });
    }
  };

  const filteredProyectos = useMemo(() => {
    // 1. Filtrado
    const filtered = proyectos.filter(p => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = p.nombre_proyecto.toLowerCase().includes(term);
      const matchesType = filterTipo === 'all' || p.tipo_inversion === filterTipo;
      return matchesSearch && matchesType;
    });

    // 2. Ordenamiento "Sticky"
    return filtered.sort((a, b) => {
      const statusA = initialStatusRef.current[a.id] ?? a.activo;
      const statusB = initialStatusRef.current[b.id] ?? b.activo;

      if (statusA !== statusB) {
        return statusA ? -1 : 1;
      }
      return a.nombre_proyecto.localeCompare(b.nombre_proyecto);
    });

  }, [proyectos, searchTerm, filterTipo]);

  // 2. ACTUALIZAMOS LA FUNCIÓN PARA DEVOLVER EL TIPO CORRECTO
  // Nota: Cambié 'default' por 'info' o 'secondary' porque theme.palette.default NO existe.
  const getStatusColor = (status: string): AppColor => {
    switch (status) {
      case 'En proceso': return 'success';
      case 'Finalizado': return 'info'; // 'default' no existe en theme.palette, usamos info o secondary
      case 'En Espera': return 'warning';
      case 'Cancelado': return 'error';
      default: return 'primary';
    }
  };

  const closeAndClear = (modalCloseFn: () => void) => {
    modalCloseFn();
    setSelectedProject(null);
  };

  // --- COLUMNAS ---
  const columns: DataTableColumn<ProyectoDto>[] = [
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
            color={isMensual ? 'primary' : 'secondary'}
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
        // 3. USO SEGURO DEL COLOR
        const colorKey = getStatusColor(p.estado_proyecto);
        // Ahora podemos acceder a theme.palette[colorKey] sin errores de TS
        const colorMain = theme.palette[colorKey].main;

        return (
          <Chip
            label={p.estado_proyecto}
            size="small"
            // El Chip acepta estos strings directamente
            color={colorKey} 
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
        const isProcessingThis = toggleActiveMutation.isPending && confirmDialog.data?.id === p.id;

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
                        sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                                color: theme.palette.success.main,
                                '&:hover': { backgroundColor: alpha(theme.palette.success.main, 0.1) },
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                backgroundColor: theme.palette.success.main,
                            },
                        }}
                    />
                </Tooltip>
            )}
            
            {!isProcessingThis && (
               <Box display="flex" alignItems="center" gap={0.5}>
                 {p.activo ? <CheckCircle fontSize="inherit" color="success" sx={{ fontSize: 14 }} /> : <Block fontSize="inherit" color="disabled" sx={{ fontSize: 14 }} />}
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
              onClick={() => { setSelectedProject(p); imagesModal.open(); }} 
              size="small"
              disabled={toggleActiveMutation.isPending}
              sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.1) } }}
            >
              <ImageIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {p.tipo_inversion === 'mensual' && (
            <Tooltip title="Configurar Cuota">
              <IconButton 
                onClick={() => { setSelectedProject(p); cuotasModal.open(); }} 
                size="small" 
                disabled={toggleActiveMutation.isPending}
                sx={{ color: "#E07A4D", '&:hover': { bgcolor: alpha("#E07A4D", 0.1) } }}
              >
                <MonetizationOnIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {p.tipo_inversion === 'mensual' && p.estado_proyecto === 'En Espera' && (
            <Tooltip title="Iniciar Proceso (Activar Cobros)">
              <IconButton
                size="small"
                onClick={() => handleStartProcessClick(p)}
                disabled={toggleActiveMutation.isPending}
                sx={{ color: "success.main", '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.1) } }}
              >
                <PlayArrow fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Editar">
            <IconButton 
              onClick={() => { setSelectedProject(p); editModal.open(); }} 
              size="small"
              disabled={toggleActiveMutation.isPending}
              sx={{ color: 'primary.main', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) } }}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Ver Lotes">
            <IconButton 
              onClick={() => { setSelectedProject(p); lotesModal.open(); }} 
              size="small"
              disabled={toggleActiveMutation.isPending}
              sx={{ color: 'info.main', '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.1) } }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ];

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      <PageHeader
        title="Gestión de Proyectos"
        subtitle="Administra el catálogo de inversiones, estados y configuración financiera."
      />

      {/* Barra de Filtros Estilizada */}
      <Paper 
        elevation={0} 
        sx={{ 
            p: 2, 
            mb: 3, 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 2, 
            alignItems: 'center', 
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
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
            sx={{ borderRadius: 2, fontWeight: 600, boxShadow: theme.shadows[2] }}
        >
          Nuevo Proyecto
        </Button>
      </Paper>

      <QueryHandler isLoading={isLoading} error={error as Error}>
        <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <DataTable
            columns={columns}
            data={filteredProyectos}
            getRowKey={(p) => p.id}
            elevation={0}
            getRowSx={(p) => {
                const isHighlighted = highlightedId === p.id;
                return {
                opacity: p.activo ? 1 : 0.6,
                transition: 'background-color 0.8s ease, opacity 0.3s ease',
                bgcolor: isHighlighted 
                    ? alpha(theme.palette.success.main, 0.15)
                    : (p.activo ? 'inherit' : alpha(theme.palette.action.hover, 0.5)),
                '&:hover': {
                    bgcolor: isHighlighted 
                    ? alpha(theme.palette.success.main, 0.2)
                    : alpha(theme.palette.action.hover, 0.8)
                }
                };
            }}
            emptyMessage="No se encontraron proyectos con los filtros actuales."
            pagination={true}
            defaultRowsPerPage={10}
            />
        </Paper>
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
            open={cuotasModal.isOpen}
            onClose={() => closeAndClear(cuotasModal.close)}
            proyecto={selectedProject}
          />

          <EditProyectoModal
            open={editModal.isOpen}
            onClose={() => closeAndClear(editModal.close)}
            proyecto={selectedProject}
            onSubmit={async (id, data) => { await updateMutation.mutateAsync({ id, data }); }}
            isLoading={updateMutation.isPending}
          />

          <ProjectLotesModal
            open={lotesModal.isOpen}
            onClose={() => closeAndClear(lotesModal.close)}
            proyecto={selectedProject}
          />

          <ManageImagesModal
            open={imagesModal.isOpen}
            onClose={() => closeAndClear(imagesModal.close)}
            proyecto={selectedProject}
          />
        </>
      )}

      {/* Modal de Confirmación Único */}
      <ConfirmDialog 
        controller={confirmDialog}
        onConfirm={handleConfirmAction}
        isLoading={startMutation.isPending || toggleActiveMutation.isPending}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
            severity={snackbar.severity} 
            variant="filled" 
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            sx={{ boxShadow: theme.shadows[4] }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

    </PageContainer>
  );
};

export default AdminProyectos;