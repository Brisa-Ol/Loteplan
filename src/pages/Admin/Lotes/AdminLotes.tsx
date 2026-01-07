import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  Box, Typography, Button, Paper, Chip, IconButton, Stack, Tooltip, 
  TextField, MenuItem, Divider, InputAdornment, LinearProgress, Switch, 
  CircularProgress, alpha, useTheme
} from '@mui/material';
import { 
  Add, Edit, Warning, Collections, Search, Inventory, 
  Gavel, AssignmentLate, CheckCircle, Person, Block,
  StopCircle
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Tipos e Interfaces
import type { CreateLoteDto, LoteDto, UpdateLoteDto } from '../../../types/dto/lote.dto';

// Componentes Comunes
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';
import { DataTable, type DataTableColumn } from '../../../components/common/DataTable/DataTable';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog/ConfirmDialog';

// Modales y Servicios
import ManageLoteImagesModal from './modals/ManageLoteImagesModal';
import CreateLoteModal from './modals/CreateLoteModal';
import EditLoteModal from './modals/EditLoteModal';
import AuctionControlModal from './modals/AuctionControlModal';
import ProyectoService from '../../../services/proyecto.service';
import LoteService from '../../../services/lote.service';

// Hooks
import { useModal } from '../../../hooks/useModal';
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import { useSnackbar } from '../../../context/SnackbarContext';

// --- KPI CARD ---
const StatCard: React.FC<{ 
  title: string; 
  value: number; 
  icon: React.ReactNode; 
  color: string; 
  loading?: boolean;
}> = ({ title, value, icon, color, loading }) => {
  const theme = useTheme();
  const paletteColor = (theme.palette as any)[color] || theme.palette.primary;

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 2, display: 'flex', alignItems: 'center', gap: 2, 
        borderRadius: 2, border: '1px solid', borderColor: 'divider',
        flex: 1, minWidth: 0, transition: 'all 0.2s ease',
        '&:hover': { borderColor: paletteColor.main, transform: 'translateY(-2px)' }
      }}
    >
      <Box sx={{ bgcolor: alpha(paletteColor.main, 0.1), color: paletteColor.main, p: 1.5, borderRadius: '50%', display: 'flex' }}>
        {icon}
      </Box>
      <Box sx={{ width: '100%' }}>
        {loading ? (
          <LinearProgress color="inherit" sx={{ width: '60%', mb: 1 }} />
        ) : (
          <Typography variant="h5" fontWeight="bold">{value}</Typography>
        )}
        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
          {title}
        </Typography>
      </Box>
    </Paper>
  );
};

const AdminLotes: React.FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useSnackbar();

  // Hooks de Modales
  const createModal = useModal();
  const editModal = useModal();
  const imagesModal = useModal();
  const auctionModal = useModal();
  const confirmDialog = useConfirmDialog();

  // Estados
  const [selectedLote, setSelectedLote] = useState<LoteDto | null>(null);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState<string>('all');

  const initialStatusRef = useRef<Record<number, boolean>>({});

  // --- QUERIES ---
  const { data: lotes = [], isLoading: loadingLotes, error } = useQuery({
    queryKey: ['adminLotes'],
    queryFn: async () => (await LoteService.findAllAdmin()).data,
  });

  const { data: proyectos = [], isLoading: loadingProyectos } = useQuery({
    queryKey: ['adminProyectosSelect'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data,
  });

  useEffect(() => {
    if (lotes.length > 0) {
      lotes.forEach(l => {
        if (initialStatusRef.current[l.id] === undefined) initialStatusRef.current[l.id] = l.activo;
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
    return lotes.filter(lote => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = lote.nombre_lote.toLowerCase().includes(term) || lote.id.toString().includes(term);
      let matchesProject = true;
      if (filterProject === 'huerfano') matchesProject = !lote.id_proyecto;
      else if (filterProject !== 'all') matchesProject = lote.id_proyecto === Number(filterProject);
      return matchesSearch && matchesProject;
    });
  }, [lotes, searchTerm, filterProject]);

  // --- MUTACIONES ---

  const saveMutation = useMutation({
    mutationFn: async (payload: { dto: CreateLoteDto | UpdateLoteDto; id?: number }) => {
      if (payload.id) return await LoteService.update(payload.id, payload.dto as UpdateLoteDto);
      return await LoteService.create(payload.dto as CreateLoteDto);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      handleCloseAllModals();
      const newItem = (data as any).data;
      if (newItem?.id) {
        setHighlightedId(newItem.id);
        setTimeout(() => setHighlightedId(null), 2500);
      }
      showSuccess('Lote procesado correctamente');
    },
    onError: (err: any) => showError(err.response?.data?.error || 'Error al guardar')
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, activo }: { id: number; activo: boolean }) => await LoteService.update(id, { activo }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      confirmDialog.close();
      setHighlightedId(variables.id);
      setTimeout(() => setHighlightedId(null), 2500);
      showSuccess(variables.activo ? 'Lote visible' : 'Lote ocultado');
    },
    onError: (err: any) => {
        showError(err.response?.data?.error || 'Error al cambiar estado');
        confirmDialog.close();
    }
  });

  const startAuction = useMutation({
    mutationFn: (id: number) => LoteService.startAuction(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      auctionModal.close();
      setHighlightedId(id); 
      setTimeout(() => setHighlightedId(null), 2500);
      showSuccess('✅ Subasta iniciada correctamente');
    },
    onError: (error: any) => {
      const statusCode = error.response?.status;
      
      // Si es un error 500, verificar si la operación fue exitosa de todos modos
      if (statusCode === 500) {
        // No mostrar error inmediatamente, verificar primero el estado real
        queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
        
        // Verificar después de un momento si la subasta se activó
        setTimeout(() => {
          const updatedLotes = queryClient.getQueryData<LoteDto[]>(['adminLotes']);
          const updatedLote = updatedLotes?.find(l => l.id === selectedLote?.id);
          
          if (updatedLote?.estado_subasta === 'activa') {
            // La operación fue exitosa a pesar del error 500
            auctionModal.close();
            setHighlightedId(updatedLote.id);
            setTimeout(() => setHighlightedId(null), 2500);
            showSuccess('✅ Subasta iniciada correctamente');
          } else {
            // El error 500 fue real, mostrar error ahora
            showError('❌ Error del servidor al iniciar subasta. Intente nuevamente.');
          }
        }, 1200);
      } else {
        // Errores de validación (400, 404, etc) - mostrar mensaje específico
        const backendError = error.response?.data?.error || error.response?.data?.message;
        const msg = backendError || error.message || 'Error al iniciar subasta';
        showError(`❌ ${msg}`);
      }
    }
  });

  const endAuction = useMutation({
    mutationFn: (id: number) => LoteService.endAuction(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      auctionModal.close();
      setHighlightedId(id); 
      setTimeout(() => setHighlightedId(null), 2500);
      showSuccess('✅ Subasta finalizada correctamente');
    },
    onError: (error: any) => {
      const statusCode = error.response?.status;
      
      // Si es un error 500, verificar si la operación fue exitosa de todos modos
      if (statusCode === 500) {
        queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
        
        setTimeout(() => {
          const updatedLotes = queryClient.getQueryData<LoteDto[]>(['adminLotes']);
          const updatedLote = updatedLotes?.find(l => l.id === selectedLote?.id);
          
          if (updatedLote?.estado_subasta === 'finalizada') {
            auctionModal.close();
            setHighlightedId(updatedLote.id);
            setTimeout(() => setHighlightedId(null), 2500);
            showSuccess('✅ Subasta finalizada correctamente');
          } else {
            showError('❌ Error del servidor al finalizar subasta. Intente nuevamente.');
          }
        }, 1200);
      } else {
        const backendError = error.response?.data?.error || error.response?.data?.message;
        const msg = backendError || error.message || 'Error al finalizar subasta';
        showError(`❌ ${msg}`);
      }
    }
  });

  const getStatusColor = (estado: string): 'success' | 'info' | 'default' => {
    if (estado === 'activa') return 'success';
    if (estado === 'finalizada') return 'info';
    return 'default';
  };

  // --- HANDLERS ---
  
  const handleToggleActive = useCallback((lote: LoteDto) => 
    confirmDialog.confirm('toggle_lote_visibility', lote), [confirmDialog]
  );

  const handleOpenCreate = useCallback(() => {
    setSelectedLote(null);
    createModal.open();
  }, [createModal]);

  const handleOpenEdit = useCallback((lote: LoteDto) => {
    setSelectedLote(lote);
    editModal.open();
  }, [editModal]);

  const handleManageImages = useCallback((lote: LoteDto) => {
    setSelectedLote(lote);
    imagesModal.open();
  }, [imagesModal]);

  const handleAuctionClick = useCallback((lote: LoteDto) => {
    setSelectedLote(lote);
    auctionModal.open();
  }, [auctionModal]);

  const handleCloseAllModals = useCallback(() => {
    createModal.close();
    editModal.close();
    imagesModal.close();
    auctionModal.close();
    setTimeout(() => setSelectedLote(null), 300);
  }, [createModal, editModal, imagesModal, auctionModal]);

  const handleConfirmAction = () => {
    if (!confirmDialog.data) return;
    const { id, activo } = confirmDialog.data;
    if (confirmDialog.action === 'toggle_lote_visibility') {
        toggleActiveMutation.mutate({ id, activo: !activo });
    }
  };

  // --- COLUMNS ---
  const columns = useMemo<DataTableColumn<LoteDto>[]>(() => [
    { id: 'lote', label: 'Lote / ID', minWidth: 200, render: (l) => (
      <Box><Typography fontWeight={700} variant="body2">{l.nombre_lote}</Typography><Typography variant="caption" color="text.secondary">ID: {l.id}</Typography></Box>
    )},
    { id: 'proyecto', label: 'Proyecto', minWidth: 150, render: (l) => (
      l.id_proyecto ? <Chip label={proyectos.find(p => p.id === l.id_proyecto)?.nombre_proyecto || `Proy. ${l.id_proyecto}`} size="small" variant="outlined" color="primary" /> 
      : <Chip label="Huérfano" size="small" color="warning" icon={<Warning sx={{ fontSize: 14 }} />} variant="outlined" />
    )},
    { id: 'precio', label: 'Precio Base', render: (l) => <Typography variant="body2" fontWeight={700} color="primary.main">${Number(l.precio_base).toLocaleString('es-AR')}</Typography> },
    { id: 'estado', label: 'Estado', render: (l) => <Chip label={l.estado_subasta.toUpperCase()} color={getStatusColor(l.estado_subasta)} size="small" variant={l.estado_subasta === 'pendiente' ? 'outlined' : 'filled'} sx={{ fontWeight: 700 }} /> },
    { id: 'visibilidad', label: 'Visibilidad', align: 'center', render: (l) => (
      <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
        {toggleActiveMutation.isPending && confirmDialog.data?.id === l.id ? <CircularProgress size={20} /> : <Switch checked={l.activo} onChange={() => handleToggleActive(l)} size="small" color="success" />}
      </Stack>
    )},
    { id: 'ganador', label: 'Ganador', render: (l) => (
      l.id_ganador ? <Chip icon={<Person sx={{ fontSize: '14px !important' }} />} label={`Usuario ${l.id_ganador}`} size="small" color="success" variant="outlined" /> : <Typography variant="caption" color="text.disabled">-</Typography>
    )},
    { id: 'subasta', label: 'Control', align: 'right', render: (l) => (
      l.id_proyecto && (
        <Tooltip title="Gestionar Subasta">
            <IconButton 
                size="small" 
                onClick={() => handleAuctionClick(l)}
                sx={{ 
                    color: l.estado_subasta === 'activa' ? 'error.main' : 'success.main',
                    bgcolor: alpha(l.estado_subasta === 'activa' ? theme.palette.error.main : theme.palette.success.main, 0.1),
                    '&:hover': { bgcolor: alpha(l.estado_subasta === 'activa' ? theme.palette.error.main : theme.palette.success.main, 0.2) }
                }}
            >
                {l.estado_subasta === 'activa' ? <StopCircle /> : <Gavel />}
            </IconButton>
        </Tooltip>
      )
    )},
    { id: 'acciones', label: 'Acciones', align: 'right', render: (l) => (
      <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
        <Tooltip title="Imágenes"><IconButton onClick={() => handleManageImages(l)} size="small" color="primary"><Collections fontSize="small" /></IconButton></Tooltip>
        <Tooltip title="Editar"><IconButton size="small" onClick={() => handleOpenEdit(l)}><Edit fontSize="small" /></IconButton></Tooltip>
      </Stack>
    )}
  ], [proyectos, theme, toggleActiveMutation.isPending, confirmDialog.data, handleToggleActive, handleAuctionClick, handleManageImages, handleOpenEdit]);

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      <PageHeader title="Gestión de Lotes" subtitle="Inventario, asignación de proyectos y control de subastas." />

      {/* Grid de KPIs */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 4 }}>
        <StatCard title="Total Lotes" value={stats.total} icon={<Inventory />} color="primary" loading={loadingLotes} />
        <StatCard title="En Subasta" value={stats.enSubasta} icon={<Gavel />} color="success" loading={loadingLotes} />
        <StatCard title="Finalizados" value={stats.finalizados} icon={<CheckCircle />} color="info" loading={loadingLotes} />
        <StatCard title="Huérfanos" value={stats.huerfanos} icon={<AssignmentLate />} color="warning" loading={loadingLotes} />
      </Box>

      {/* Barra de Filtros */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.background.paper, 0.6) }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField 
            placeholder="Buscar por nombre o ID..." size="small" sx={{ flexGrow: 1 }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
            InputProps={{ startAdornment: <InputAdornment position="start"><Search color="action"/></InputAdornment> }} 
          />
          <TextField select label="Filtrar Proyecto" size="small" sx={{ minWidth: 250 }} value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
            <MenuItem value="all">Todos los Lotes</MenuItem>
            <MenuItem value="huerfano">⚠️ Sin Proyecto</MenuItem>
            <Divider />
            {proyectos.map(p => <MenuItem key={p.id} value={p.id}>{p.nombre_proyecto}</MenuItem>)}
          </TextField>
          <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate}>Nuevo Lote</Button>
        </Stack>
      </Paper>

      <QueryHandler isLoading={loadingLotes} error={error as Error}>
        <DataTable columns={columns} data={filteredLotes} getRowKey={(row) => row.id} isRowActive={(lote) => lote.activo} highlightedRowId={highlightedId} emptyMessage="No se encontraron lotes." pagination={true} defaultRowsPerPage={10} />
      </QueryHandler>

      {/* --- MODALES --- */}
      
      <CreateLoteModal 
        {...createModal.modalProps} 
        onSubmit={async (data) => { await saveMutation.mutateAsync({ dto: data }); }} 
        isLoading={saveMutation.isPending} 
      />

      <EditLoteModal 
        {...editModal.modalProps} 
        lote={selectedLote} 
        onSubmit={async (id, data) => { await saveMutation.mutateAsync({ dto: data, id }); }} 
        isLoading={saveMutation.isPending} 
      />

      {selectedLote && (
        <ManageLoteImagesModal 
          {...imagesModal.modalProps} 
          lote={selectedLote} 
        />
      )}

      {selectedLote && (
          <AuctionControlModal 
            open={auctionModal.isOpen}
            onClose={auctionModal.close}
            lote={selectedLote}
            isLoading={startAuction.isPending || endAuction.isPending}
            onStart={(id) => startAuction.mutate(id)}
            onEnd={(id) => endAuction.mutate(id)}
          />
      )}

      <ConfirmDialog 
        controller={confirmDialog} 
        onConfirm={handleConfirmAction} 
        isLoading={toggleActiveMutation.isPending} 
      />

    </PageContainer>
  );
};

export default AdminLotes;