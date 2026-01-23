import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Add,
  AssignmentLate, CheckCircle,
  Collections,
  Edit,
  Gavel,
  Inventory,
  Person,
  Search,
  StopCircle,
  Warning
} from '@mui/icons-material';
import {
  Box,
  Button, Chip,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
  alpha, useTheme
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';

import { DataTable, type DataTableColumn } from '../../../../shared/components/data-grid/DataTable/DataTable';
import { PageContainer } from '../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { PageHeader } from '../../../../shared/components/layout/headers/PageHeader';
import { QueryHandler } from '../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import { StatCard } from '../../../../shared/components/domain/cards/StatCard/StatCard';

import AuctionControlModal from './modals/AuctionControlModal';
import CreateLoteModal from './modals/CreateLoteModal';
import EditLoteModal from './modals/EditLoteModal';
import ManageLoteImagesModal from './modals/ManageLoteImagesModal';

import { useConfirmDialog } from '../../../../shared/hooks/useConfirmDialog';
import { useModal } from '../../../../shared/hooks/useModal';
import useSnackbar from '../../../../shared/hooks/useSnackbar';

import type { CreateLoteDto, LoteDto, UpdateLoteDto } from '../../../../core/types/dto/lote.dto';
import ProyectoService from '../../../../core/api/services/proyecto.service';
import LoteService from '../../../../core/api/services/lote.service';
import { FilterBar, FilterSelect } from '../../../../shared/components/forms/filters/FilterBar/FilterBar';
import { ConfirmDialog } from '../../../../shared/components/domain/modals/ConfirmDialog/ConfirmDialog';
import { useSortedData } from '../../hooks/useSortedData';

const AdminLotes: React.FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useSnackbar();

  const [searchParams, setSearchParams] = useSearchParams();
  const proyectoParam = searchParams.get('proyecto');

  // Hooks de UI
  const createModal = useModal();
  const editModal = useModal();
  const imagesModal = useModal();
  const auctionModal = useModal();
  const confirmDialog = useConfirmDialog();

  // Estados locales
  const [selectedLote, setSelectedLote] = useState<LoteDto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState<string>(proyectoParam || 'all');

  // URL Sync Effect
  useEffect(() => {
    if (filterProject === 'all') {
      if (searchParams.get('proyecto')) {
         searchParams.delete('proyecto');
         setSearchParams(searchParams);
      }
    } else if (filterProject !== 'huerfano') {
      if (searchParams.get('proyecto') !== filterProject) {
         setSearchParams({ proyecto: filterProject });
      }
    }
  }, [filterProject, searchParams, setSearchParams]);

  // --- QUERIES ---
  const { data: lotesRaw = [], isLoading: loadingLotes, error } = useQuery({
    queryKey: ['adminLotes'],
    queryFn: async () => (await LoteService.findAllAdmin()).data,
  });

  const { data: proyectos = [] } = useQuery({
    queryKey: ['adminProyectosSelect'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data,
  });

  // ✨ 1. USO DEL HOOK UX (Ordenamiento + Highlight)
  // Renombramos 'lotesRaw' arriba para usar 'sortedLotes' aquí
  const { sortedData: sortedLotes, highlightedId, triggerHighlight } = useSortedData(lotesRaw);

  // --- KPIS (Calculados sobre data cruda, no importa el orden) ---
  const stats = useMemo(() => ({
    total: lotesRaw.length,
    enSubasta: lotesRaw.filter(l => l.estado_subasta === 'activa').length,
    finalizados: lotesRaw.filter(l => l.estado_subasta === 'finalizada').length,
    huerfanos: lotesRaw.filter(l => !l.id_proyecto).length
  }), [lotesRaw]);

  // --- FILTRADO (Se aplica SOBRE los datos ya ordenados) ---
  const filteredLotes = useMemo(() => {
    return sortedLotes.filter(lote => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = lote.nombre_lote.toLowerCase().includes(term) || lote.id.toString().includes(term);
      
      let matchesProject = true;
      if (filterProject === 'huerfano') matchesProject = !lote.id_proyecto;
      else if (filterProject !== 'all') matchesProject = lote.id_proyecto === Number(filterProject);
      
      return matchesSearch && matchesProject;
    });
  }, [sortedLotes, searchTerm, filterProject]);

  // --- MUTACIONES ---

  const handleCloseAllModals = useCallback(() => {
    createModal.close();
    editModal.close();
    imagesModal.close();
    auctionModal.close();
    setTimeout(() => setSelectedLote(null), 300);
  }, [createModal, editModal, imagesModal, auctionModal]);

  const saveMutation = useMutation({
    mutationFn: async (payload: { dto: CreateLoteDto | UpdateLoteDto; id?: number }) => {
      if (payload.id) return await LoteService.update(payload.id, payload.dto as UpdateLoteDto);
      return await LoteService.create(payload.dto as CreateLoteDto);
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      handleCloseAllModals();
      
      // ✨ 2. ACTIVAR HIGHLIGHT
      // Si es update, usamos el ID enviado. Si es create, usamos el ID que devuelve el backend.
      const targetId = variables.id || response.data.id;
      if (targetId) triggerHighlight(targetId);

      showSuccess(variables.id ? 'Lote actualizado' : 'Lote creado exitosamente');
    },
    onError: (err: any) => showError(err.response?.data?.error || 'Error al guardar')
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, activo }: { id: number; activo: boolean }) => await LoteService.update(id, { activo }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      confirmDialog.close();
      
      // ✨ Highlight también al cambiar estado
      triggerHighlight(variables.id);
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
      triggerHighlight(id);
      showSuccess('✅ Subasta iniciada');
    },
    onError: (error: any) => showError('Error al iniciar subasta') // Simplificado por brevedad
  });

  const endAuction = useMutation({
    mutationFn: (id: number) => LoteService.endAuction(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      auctionModal.close();
      triggerHighlight(id);
      showSuccess('✅ Subasta finalizada');
    },
    onError: (error: any) => showError('Error al finalizar subasta')
  });

  // --- COLUMNS ---
  const getStatusColor = (estado: string) => {
    if (estado === 'activa') return 'success';
    if (estado === 'finalizada') return 'info';
    return 'default';
  };

  const columns = useMemo<DataTableColumn<LoteDto>[]>(() => [
    { id: 'lote', label: 'Lote / ID', minWidth: 200, render: (l) => (
      // ✨ 3. VISUALIZACIÓN DESHABILITADOS
      // Usamos opacidad para indicar inactividad sin moverlos de lugar
      <Box sx={{ opacity: l.activo ? 1 : 0.6 }}> 
        <Typography fontWeight={700} variant="body2">{l.nombre_lote}</Typography>
        <Typography variant="caption" color="text.secondary">ID: {l.id}</Typography>
      </Box>
    )},
    { id: 'proyecto', label: 'Proyecto', minWidth: 150, render: (l) => (
      <Box sx={{ opacity: l.activo ? 1 : 0.6 }}>
        {l.id_proyecto 
            ? <Chip label={proyectos.find(p => p.id === l.id_proyecto)?.nombre_proyecto || `Proy. ${l.id_proyecto}`} size="small" variant="outlined" color="primary" /> 
            : <Chip label="Huérfano" size="small" color="warning" icon={<Warning sx={{ fontSize: 14 }} />} variant="outlined" />
        }
      </Box>
    )},
    { id: 'precio', label: 'Precio Base', render: (l) => (
        <Typography variant="body2" fontWeight={700} color={l.activo ? "primary.main" : "text.disabled"}>
            ${Number(l.precio_base).toLocaleString('es-AR')}
        </Typography> 
    )},
    { id: 'estado', label: 'Estado', render: (l) => (
        <Chip 
            label={l.estado_subasta.toUpperCase()} 
            color={!l.activo ? 'default' : getStatusColor(l.estado_subasta) as any} 
            size="small" 
            variant={l.estado_subasta === 'pendiente' ? 'outlined' : 'filled'} 
            sx={{ fontWeight: 700, opacity: l.activo ? 1 : 0.7 }} 
        /> 
    )},
    { id: 'visibilidad', label: 'Visibilidad', align: 'center', render: (l) => (
      <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
        {toggleActiveMutation.isPending && confirmDialog.data?.id === l.id 
            ? <CircularProgress size={20} /> 
            : <Switch checked={l.activo} onChange={() => handleToggleActive(l)} size="small" color="success" />
        }
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
                disabled={!l.activo} // Deshabilitar control si el lote está oculto
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
  ], [proyectos, theme, toggleActiveMutation.isPending, confirmDialog.data]);

  // Handlers simples
  const handleToggleActive = useCallback((lote: LoteDto) => confirmDialog.confirm('toggle_lote_visibility', lote), [confirmDialog]);
  const handleOpenCreate = useCallback(() => { setSelectedLote(null); createModal.open(); }, [createModal]);
  const handleOpenEdit = useCallback((lote: LoteDto) => { setSelectedLote(lote); editModal.open(); }, [editModal]);
  const handleManageImages = useCallback((lote: LoteDto) => { setSelectedLote(lote); imagesModal.open(); }, [imagesModal]);
  const handleAuctionClick = useCallback((lote: LoteDto) => { setSelectedLote(lote); auctionModal.open(); }, [auctionModal]);
  
  const handleConfirmAction = () => {
    if (!confirmDialog.data) return;
    const { id, activo } = confirmDialog.data;
    if (confirmDialog.action === 'toggle_lote_visibility') {
        toggleActiveMutation.mutate({ id, activo: !activo });
    }
  };

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      <PageHeader title="Gestión de Lotes" subtitle="Inventario, asignación de proyectos y control de subastas." />

      {/* STAT CARDS (Sin cambios) */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 4 }}>
        <StatCard title="Total Lotes" value={stats.total} icon={<Inventory />} color="primary" loading={loadingLotes} subtitle="Inventario global" />
        <StatCard title="En Subasta" value={stats.enSubasta} icon={<Gavel />} color="success" loading={loadingLotes} subtitle="Pujas activas hoy" />
        <StatCard title="Finalizados" value={stats.finalizados} icon={<CheckCircle />} color="info" loading={loadingLotes} subtitle="Histórico de cierres" />
        <StatCard title="Huérfanos" value={stats.huerfanos} icon={<AssignmentLate />} color="warning" loading={loadingLotes} subtitle="Sin proyecto asignado" />
      </Box>

      <FilterBar>
        <TextField 
          placeholder="Buscar por nombre o ID..." size="small" sx={{ flexGrow: 1 }} 
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
          InputProps={{ startAdornment: <InputAdornment position="start"><Search color="action"/></InputAdornment> }} 
        />
        <FilterSelect label="Filtrar Proyecto" value={filterProject} onChange={(e) => setFilterProject(e.target.value)} sx={{ minWidth: 250 }}>
          <MenuItem value="all">Todos los Lotes</MenuItem>
          <MenuItem value="huerfano">⚠️ Sin Proyecto</MenuItem>
          <Divider />
          {proyectos.map(p => <MenuItem key={p.id} value={p.id}>{p.nombre_proyecto}</MenuItem>)}
        </FilterSelect>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate} sx={{ whiteSpace: 'nowrap' }}>Nuevo Lote</Button>
      </FilterBar>

      <QueryHandler isLoading={loadingLotes} error={error as Error}>
        <DataTable 
            columns={columns} 
            data={filteredLotes} // Usamos la lista filtrada (que ya viene ordenada del hook)
            getRowKey={(row) => row.id} 
            
            // ✨ 4. Props de UX
            isRowActive={(lote) => lote.activo} 
            highlightedRowId={highlightedId} 
            
            emptyMessage="No se encontraron lotes." 
            pagination={true} 
            defaultRowsPerPage={10} 
        />
      </QueryHandler>

      {/* MODALES */}
      <CreateLoteModal {...createModal.modalProps} onSubmit={async (data) => { await saveMutation.mutateAsync({ dto: data }); }} isLoading={saveMutation.isPending} />
      <EditLoteModal {...editModal.modalProps} lote={selectedLote} onSubmit={async (id, data) => { await saveMutation.mutateAsync({ dto: data, id }); }} isLoading={saveMutation.isPending} />
      {selectedLote && <ManageLoteImagesModal {...imagesModal.modalProps} lote={selectedLote} />}
      {selectedLote && <AuctionControlModal open={auctionModal.isOpen} onClose={auctionModal.close} lote={selectedLote} isLoading={startAuction.isPending || endAuction.isPending} onStart={(id, d) => startAuction.mutate(id)} onEnd={(id) => endAuction.mutate(id)} />}
      
      <ConfirmDialog controller={confirmDialog} onConfirm={handleConfirmAction} isLoading={toggleActiveMutation.isPending} />
    </PageContainer>
  );
};

export default AdminLotes;