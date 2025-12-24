// src/pages/Admin/Inventario/InventarioLotes.tsx

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Box, Typography, Button, Paper, Chip, IconButton, Stack, Tooltip, TextField, MenuItem, Divider, InputAdornment, LinearProgress, Switch, CircularProgress, alpha, Snackbar, Alert, useTheme, Avatar
} from '@mui/material';
import { 
  Add, Edit, PlayCircleFilled, StopCircle, Warning, Collections, 
  Search, Inventory, Gavel, AssignmentLate, CheckCircle, Person, Block
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

// Tipos
import type { CreateLoteDto, LoteDto, UpdateLoteDto } from '../../../types/dto/lote.dto';

// Componentes Comunes
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';
import { DataTable, type DataTableColumn } from '../../../components/common/DataTable/DataTable';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog/ConfirmDialog';

// Modales y Servicios
import ManageLoteImagesModal from './modals/ManageLoteImagesModal';
import CreateEditLoteModal from './modals/CreateEditLoteModal';
import ProyectoService from '../../../Services/proyecto.service';
import LoteService from '../../../Services/lote.service';

// Hooks
import { useModal } from '../../../hooks/useModal';
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';

interface ApiErrorResponse {
  mensaje?: string;
  message?: string;
  error?: string;
}

// --- COMPONENTE DE TARJETA KPI (Estilo Unificado) ---
const StatCard: React.FC<{ 
  title: string; 
  value: number; 
  icon: React.ReactNode; 
  color: string;
  loading?: boolean;
}> = ({ title, value, icon, color, loading }) => {
  const theme = useTheme();
  // Mapeo seguro de colores
  const paletteColor = (theme.palette as any)[color] || theme.palette.primary;

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2, 
        borderRadius: 2, 
        border: '1px solid', 
        borderColor: 'divider',
        flex: 1, 
        minWidth: 0,
        transition: 'all 0.2s ease',
        '&:hover': {
            borderColor: paletteColor.main,
            transform: 'translateY(-2px)'
        }
      }}
    >
      <Box sx={{ bgcolor: alpha(paletteColor.main, 0.1), color: paletteColor.main, p: 1.5, borderRadius: '50%', display: 'flex' }}>
        {icon}
      </Box>
      <Box sx={{ width: '100%' }}>
        {loading ? (
            <LinearProgress color="inherit" sx={{ width: '60%', mb: 1 }} />
        ) : (
            <Typography variant="h5" fontWeight="bold" color="text.primary">{value}</Typography>
        )}
        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
            {title}
        </Typography>
      </Box>
    </Paper>
  );
};

const InventarioLotes: React.FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  
  // Hooks
  const createEditModal = useModal();
  const imagesModal = useModal();
  const confirmDialog = useConfirmDialog();

  // Estados
  const [selectedLote, setSelectedLote] = useState<LoteDto | null>(null);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success'
  });

  const initialStatusRef = useRef<Record<number, boolean>>({});

  const showMessage = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const proyectoId = params.get('proyecto');
    if (proyectoId) setFilterProject(proyectoId);
  }, []);

  // --- QUERIES ---
  const { data: lotes = [], isLoading: loadingLotes, error } = useQuery({
    queryKey: ['adminLotes'],
    queryFn: async () => (await LoteService.findAllAdmin()).data,
    retry: 1,
    staleTime: 30000,
  });

  const { data: proyectos = [], isLoading: loadingProyectos } = useQuery({
    queryKey: ['adminProyectosSelect'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data,
    retry: 1,
    staleTime: 60000,
  });

  useEffect(() => {
    if (lotes.length > 0) {
      lotes.forEach(l => {
        if (initialStatusRef.current[l.id] === undefined) {
          initialStatusRef.current[l.id] = l.activo;
        }
      });
    }
  }, [lotes]);

  // --- KPIS ---
  const stats = useMemo(() => ({
    total: lotes.length,
    enSubasta: lotes.filter(l => l.estado_subasta === 'activa').length,
    finalizados: lotes.filter(l => l.estado_subasta === 'finalizada').length,
    huerfanos: lotes.filter(l => !l.id_proyecto).length
  }), [lotes]);

  // --- FILTRADO ---
  const filteredLotes = useMemo(() => {
    const filtered = lotes.filter(lote => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = lote.nombre_lote.toLowerCase().includes(term) || lote.id.toString().includes(term);
      let matchesProject = true;
      if (filterProject === 'huerfano') matchesProject = !lote.id_proyecto;
      else if (filterProject !== 'all') matchesProject = lote.id_proyecto === Number(filterProject);
      return matchesSearch && matchesProject;
    });

    return filtered.sort((a, b) => {
      const statusA = initialStatusRef.current[a.id] ?? a.activo;
      const statusB = initialStatusRef.current[b.id] ?? b.activo;
      if (statusA !== statusB) return statusA ? -1 : 1;
      return a.nombre_lote.localeCompare(b.nombre_lote);
    });
  }, [lotes, searchTerm, filterProject]);

  const getErrorMessage = (error: unknown): string => {
    if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        return axiosError.response?.data?.mensaje || axiosError.response?.data?.message || axiosError.message;
    }
    return String(error);
  };

  // --- MUTACIONES ---
  const saveMutation = useMutation({
    mutationFn: async (payload: { dto: CreateLoteDto | UpdateLoteDto; id?: number }) => {
      if (payload.id) return await LoteService.update(payload.id, payload.dto as UpdateLoteDto);
      return await LoteService.create(payload.dto as CreateLoteDto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      createEditModal.close();
      setSelectedLote(null);
      showMessage('Lote guardado correctamente');
    },
    onError: (error: unknown) => showMessage(`Error al guardar: ${getErrorMessage(error)}`, 'error')
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, activo }: { id: number; activo: boolean }) => {
      return await LoteService.update(id, { activo });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      confirmDialog.close();
      setHighlightedId(variables.id);
      setTimeout(() => setHighlightedId(null), 2500);
      showMessage(variables.activo ? 'Lote visible' : 'Lote ocultado');
    },
    onError: (error: unknown) => {
      confirmDialog.close();
      showMessage(`Error al cambiar estado: ${getErrorMessage(error)}`, 'error');
    }
  });

  const startAuction = useMutation({
    mutationFn: (id: number) => LoteService.startAuction(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      confirmDialog.close();
      const data = response.data as any; 
      showMessage(data?.mensaje || 'Subasta iniciada correctamente');
    },
    onError: (error: unknown) => {
      confirmDialog.close();
      showMessage(`Error: ${getErrorMessage(error)}`, 'error');
    }
  });

  const endAuction = useMutation({
    mutationFn: (id: number) => LoteService.endAuction(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      confirmDialog.close();
      const data = response.data as any;
      showMessage(data?.mensaje || 'Subasta finalizada correctamente');
    },
    onError: (error: unknown) => {
      confirmDialog.close();
      showMessage(`Error: ${getErrorMessage(error)}`, 'error');
    }
  });

  const getStatusColor = (estado: string): 'success' | 'info' | 'default' => {
    if (estado === 'activa') return 'success';
    if (estado === 'finalizada') return 'info';
    return 'default';
  };

  // --- HANDLERS ---
  const handleToggleActive = (lote: LoteDto) => confirmDialog.confirm('toggle_lote_visibility', lote);
  const handleStartAuction = (lote: LoteDto) => confirmDialog.confirm('start_auction', lote);
  const handleEndAuction = (lote: LoteDto) => confirmDialog.confirm('end_auction', lote);

  const handleConfirmAction = () => {
    if (!confirmDialog.data) return;
    
    if (confirmDialog.action === 'toggle_lote_visibility') {
      const { id, activo } = confirmDialog.data;
      toggleActiveMutation.mutate({ id, activo: !activo });
    }
    else if (confirmDialog.action === 'start_auction') {
      startAuction.mutate(confirmDialog.data.id);
    }
    else if (confirmDialog.action === 'end_auction') {
      endAuction.mutate(confirmDialog.data.id);
    }
  };

  const handleOpenCreate = () => { setSelectedLote(null); createEditModal.open(); };
  const handleOpenEdit = (lote: LoteDto) => { setSelectedLote(lote); createEditModal.open(); };
  const handleManageImages = (lote: LoteDto) => { setSelectedLote(lote); imagesModal.open(); };
  const handleCloseModals = () => { createEditModal.close(); imagesModal.close(); setTimeout(() => setSelectedLote(null), 300); };

  // ========================================================================
  // ⚙️ DEFINICIÓN DE COLUMNAS (MEMOIZED)
  // ========================================================================
  const columns = useMemo<DataTableColumn<LoteDto>[]>(() => [
    {
      id: 'lote',
      label: 'Lote / ID',
      minWidth: 200,
      render: (lote) => (
        <Box>
          <Typography fontWeight={700} variant="body2" color="text.primary">{lote.nombre_lote}</Typography>
          <Typography variant="caption" color="text.secondary">ID: {lote.id}</Typography>
        </Box>
      )
    },
    {
      id: 'proyecto',
      label: 'Proyecto',
      minWidth: 150,
      render: (lote) => (
        lote.id_proyecto ? (
          <Chip 
            label={proyectos.find(p => p.id === lote.id_proyecto)?.nombre_proyecto || `Proy. ${lote.id_proyecto}`} 
            size="small" variant="outlined" color="primary" sx={{ fontWeight: 600, border: '1px solid' }}
          />
        ) : (
          <Chip label="Huérfano" size="small" color="warning" icon={<Warning sx={{ fontSize: '14px !important' }} />} variant="outlined" />
        )
      )
    },
    {
      id: 'precio',
      label: 'Precio Base',
      render: (lote) => (
        <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace', color: 'primary.main' }}>
          ${Number(lote.precio_base).toLocaleString('es-AR')}
        </Typography>
      )
    },
    {
      id: 'estado',
      label: 'Estado Subasta',
      render: (lote) => (
        <Chip 
          label={lote.estado_subasta.toUpperCase()} 
          color={getStatusColor(lote.estado_subasta)} 
          size="small" 
          variant={lote.estado_subasta === 'pendiente' ? 'outlined' : 'filled'}
          sx={{ fontWeight: 700 }}
        />
      )
    },
    {
      id: 'visibilidad',
      label: 'Visibilidad',
      align: 'center',
      render: (lote) => {
        // 🔥 IMPLEMENTACIÓN IGUAL A PROYECTOS (ICONO + TEXTO)
        const isProcessingThis = toggleActiveMutation.isPending && confirmDialog.data?.id === lote.id;

        return (
          <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
            {isProcessingThis ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
                <Tooltip title={lote.activo ? 'Ocultar Lote' : 'Hacer Visible'}>
                    <Switch
                        checked={lote.activo}
                        onChange={() => handleToggleActive(lote)}
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
                 {lote.activo ? <CheckCircle fontSize="inherit" color="success" sx={{ fontSize: 14 }} /> : <Block fontSize="inherit" color="disabled" sx={{ fontSize: 14 }} />}
                 <Typography 
                   variant="caption" 
                   color={lote.activo ? 'success.main' : 'text.disabled'}
                   fontWeight={600}
                   sx={{ minWidth: 50 }}
                 >
                   {lote.activo ? 'Visible' : 'Oculto'}
                 </Typography>
               </Box>
            )}
          </Stack>
        );
      }
    },
    {
      id: 'ganador',
      label: 'Ganador',
      render: (lote) => (
        lote.id_ganador ? (
          <Stack direction="row" alignItems="center" spacing={1}>
            <Chip 
              icon={<Person sx={{ fontSize: '14px !important' }} />} 
              label={`Usuario ${lote.id_ganador}`} 
              size="small" color="success" variant="outlined"
            />
            {lote.intentos_fallidos_pago > 0 && (
              <Tooltip title={`${lote.intentos_fallidos_pago} intentos de pago fallidos`}>
                <Warning fontSize="small" color="error" />
              </Tooltip>
            )}
          </Stack>
        ) : <Typography variant="caption" color="text.disabled">-</Typography>
      )
    },
    {
      id: 'subasta',
      label: 'Subasta',
      align: 'right',
      render: (lote) => (
        <Stack direction="row" justifyContent="flex-end">
          {lote.estado_subasta === 'pendiente' && lote.id_proyecto && (
            <Tooltip title="Iniciar Subasta">
              <IconButton 
                size="small"
                onClick={() => handleStartAuction(lote)}
                disabled={toggleActiveMutation.isPending || startAuction.isPending || endAuction.isPending}
                sx={{ color: 'success.main', '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.1) } }}
              >
                <PlayCircleFilled />
              </IconButton>
            </Tooltip>
          )}
          {lote.estado_subasta === 'activa' && (
            <Tooltip title="Finalizar Subasta">
              <IconButton 
                size="small"
                onClick={() => handleEndAuction(lote)}
                disabled={toggleActiveMutation.isPending || startAuction.isPending || endAuction.isPending}
                sx={{ color: 'error.main', '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) } }}
              >
                <StopCircle />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      )
    },
    {
      id: 'acciones',
      label: 'Acciones',
      align: 'right',
      render: (lote) => (
        <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
          <Tooltip title="Gestionar Imágenes">
            <IconButton 
              onClick={() => handleManageImages(lote)} 
              size="small" 
              disabled={toggleActiveMutation.isPending}
              sx={{ color: 'primary.main', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) } }}
            >
              <Collections fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Editar Lote">
            <IconButton 
              size="small" 
              onClick={() => handleOpenEdit(lote)}
              disabled={toggleActiveMutation.isPending}
              sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ], [proyectos, theme, toggleActiveMutation.isPending, startAuction.isPending, endAuction.isPending, confirmDialog.data]);

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      <PageHeader
        title="Gestión de Lotes"
        subtitle="Inventario, asignación de proyectos y control de subastas."
      />

      {/* Grid de KPIs */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, 
        gap: 2, mb: 4 
      }}>
        <StatCard title="Total Lotes" value={stats.total} icon={<Inventory />} color="primary" loading={loadingLotes} />
        <StatCard title="En Subasta" value={stats.enSubasta} icon={<Gavel />} color="success" loading={loadingLotes} />
        <StatCard title="Finalizados" value={stats.finalizados} icon={<CheckCircle />} color="info" loading={loadingLotes} />
        <StatCard title="Huérfanos" value={stats.huerfanos} icon={<AssignmentLate />} color="warning" loading={loadingLotes} />
      </Box>

      {/* Barra de Filtros */}
      <Paper 
        elevation={0} 
        sx={{ 
            p: 2, mb: 3, borderRadius: 2, 
            border: '1px solid', borderColor: 'divider', 
            bgcolor: alpha(theme.palette.background.paper, 0.6)
        }} 
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField 
            placeholder="Buscar por nombre o ID..." size="small" sx={{ flexGrow: 1 }}
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{ 
                startAdornment: <InputAdornment position="start"><Search color="action"/></InputAdornment>,
                sx: { borderRadius: 2 }
            }}
          />
          <TextField
            select label="Filtrar por Proyecto" size="small" sx={{ minWidth: 250 }}
            value={filterProject} onChange={(e) => setFilterProject(e.target.value)}
            disabled={loadingProyectos}
            InputProps={{ sx: { borderRadius: 2 } }}
          >
            <MenuItem value="all">Todos los Lotes</MenuItem>
            <MenuItem value="huerfano" sx={{ color: 'warning.main' }}>⚠️ Sin Proyecto</MenuItem>
            <Divider />
            {proyectos.map(p => (
              <MenuItem key={p.id} value={p.id}>{p.nombre_proyecto}</MenuItem>
            ))}
          </TextField>
          <Button 
            variant="contained" startIcon={<Add />} color="primary"
            onClick={handleOpenCreate}
            sx={{ borderRadius: 2, fontWeight: 700, boxShadow: theme.shadows[2] }}
          >
            Nuevo Lote
          </Button>
        </Stack>
      </Paper>

      <QueryHandler isLoading={loadingLotes} error={error as Error}>
        <DataTable
          columns={columns}
          data={filteredLotes}
          getRowKey={(row) => row.id}
          getRowSx={(lote) => {
            const isHighlighted = highlightedId === lote.id;
            return {
              opacity: lote.activo ? 1 : 0.6,
              transition: 'background-color 0.8s ease, opacity 0.3s ease',
              bgcolor: isHighlighted 
                ? alpha(theme.palette.success.main, 0.15)
                : (lote.activo ? 'inherit' : alpha(theme.palette.action.hover, 0.5)),
              '&:hover': {
                bgcolor: isHighlighted 
                  ? alpha(theme.palette.success.main, 0.2)
                  : alpha(theme.palette.action.hover, 0.8)
              }
            };
          }}
          emptyMessage="No se encontraron lotes con los filtros actuales."
          pagination={true}
          defaultRowsPerPage={10}
        />
      </QueryHandler>

      {/* MODALES */}
      <CreateEditLoteModal
        open={createEditModal.isOpen}
        onClose={handleCloseModals}
        onSubmit={async (data, id) => { await saveMutation.mutateAsync({ dto: data, id }); }}
        loteToEdit={selectedLote}
        isLoading={saveMutation.isPending}
      />

      {selectedLote && (
        <ManageLoteImagesModal
          open={imagesModal.isOpen}
          onClose={handleCloseModals}
          lote={selectedLote}
        />
      )}

      {/* Modal de Confirmación */}
      <ConfirmDialog 
        controller={confirmDialog}
        onConfirm={handleConfirmAction}
        isLoading={toggleActiveMutation.isPending || startAuction.isPending || endAuction.isPending}
      />

      {/* Snackbar Global */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          variant="filled"
          sx={{ boxShadow: theme.shadows[4] }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
};

export default InventarioLotes;