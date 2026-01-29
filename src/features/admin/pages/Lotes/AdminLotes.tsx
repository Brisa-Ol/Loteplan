import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

// Componentes de arquitectura
import { DataTable, type DataTableColumn } from '../../../../shared/components/data-grid/DataTable/DataTable';
import { PageContainer } from '../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { PageHeader } from '../../../../shared/components/layout/headers/PageHeader';
import { QueryHandler } from '../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import { StatCard } from '../../../../shared/components/domain/cards/StatCard/StatCard';
import { FilterBar, FilterSelect } from '../../../../shared/components/forms/filters/FilterBar';
import { ConfirmDialog } from '../../../../shared/components/domain/modals/ConfirmDialog/ConfirmDialog';

// Modales de negocio
import AuctionControlModal from './modals/AuctionControlModal';
import CreateLoteModal from './modals/CreateLoteModal';
import EditLoteModal from './modals/EditLoteModal';
import ManageLoteImagesModal from './modals/ManageLoteImagesModal';

// Hooks de utilidad
import { useConfirmDialog } from '../../../../shared/hooks/useConfirmDialog';
import { useModal } from '../../../../shared/hooks/useModal';
import useSnackbar from '../../../../shared/hooks/useSnackbar';
import { useSortedData } from '../../hooks/useSortedData';

// Servicios y Tipado
import type { CreateLoteDto, LoteDto, UpdateLoteDto } from '../../../../core/types/dto/lote.dto';
import ProyectoService from '../../../../core/api/services/proyecto.service';
import LoteService from '../../../../core/api/services/lote.service';

const AdminLotes: React.FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useSnackbar();

  const [searchParams, setSearchParams] = useSearchParams();
  const proyectoParam = searchParams.get('proyecto');

  // Hooks de interfaz
  const createModal = useModal();
  const editModal = useModal();
  const imagesModal = useModal();
  const auctionModal = useModal();
  const confirmDialog = useConfirmDialog();

  // Estados de control
  const [selectedLote, setSelectedLote] = useState<LoteDto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState<string>(proyectoParam || 'all');

  // Sincronización de URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (filterProject === 'all' || filterProject === 'huerfano') {
      params.delete('proyecto');
    } else {
      params.set('proyecto', filterProject);
    }
    setSearchParams(params, { replace: true });
  }, [filterProject]);

  // --- CONSULTAS ---
  const { data: lotesRaw = [], isLoading: loadingLotes, error } = useQuery({
    queryKey: ['adminLotes'],
    queryFn: async () => (await LoteService.findAllAdmin()).data,
  });

  const { data: proyectos = [] } = useQuery({
    queryKey: ['adminProyectosSelect'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data,
  });

  // UX: Ordenamiento automático y resaltado de cambios
  const { sortedData: sortedLotes, highlightedId, triggerHighlight } = useSortedData(lotesRaw);

  // --- MÉTRICAS ---
  const stats = useMemo(() => ({
    total: lotesRaw.length,
    enSubasta: lotesRaw.filter(l => l.estado_subasta === 'activa').length,
    finalizados: lotesRaw.filter(l => l.estado_subasta === 'finalizada').length,
    huerfanos: lotesRaw.filter(l => !l.id_proyecto).length
  }), [lotesRaw]);

  // --- VALIDACIÓN DE NEGOCIO ---
  const checkIsSubastable = useCallback((lote: LoteDto) => {
    if (!lote.id_proyecto) return { allowed: false, reason: 'Sin proyecto asignado' };
    const proyecto = proyectos.find(p => p.id === lote.id_proyecto);

    // BLOQUEO: Si es proyecto de inversión directa, no se permite subastar
    if (proyecto?.tipo_inversion === 'directo') {
      return { allowed: false, reason: 'Proyecto de Inversión Directa (No Subastable)' };
    }
    return { allowed: true, reason: '' };
  }, [proyectos]);

  // --- FILTRADO LOCAL ---
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

  // --- ACCIONES (MUTACIONES) ---
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
    onError: () => showError('Error al iniciar subasta')
  });

  const endAuction = useMutation({
    mutationFn: (id: number) => LoteService.endAuction(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      auctionModal.close();
      triggerHighlight(id);
      showSuccess('✅ Subasta finalizada');
    },
    onError: () => showError('Error al finalizar subasta')
  });

  // --- DEFINICIÓN DE COLUMNAS ---
  const columns = useMemo<DataTableColumn<LoteDto>[]>(() => [
    {
      id: 'lote', label: 'Lote / ID', minWidth: 180, render: (l) => (
        <Box>
          <Typography fontWeight={700} variant="body2">{l.nombre_lote}</Typography>
          <Typography variant="caption" color="text.secondary">ID: {l.id}</Typography>
        </Box>
      )
    },
    {
      id: 'proyecto', label: 'Proyecto', minWidth: 220, render: (l) => {
        const proyecto = proyectos.find(p => p.id === l.id_proyecto);
        const isInversionista = proyecto?.tipo_inversion === 'directo';

        return (
          <Box>
            {l.id_proyecto
              ? (
                <Stack spacing={0.5}>
                  <Chip
                    label={proyecto?.nombre_proyecto || `Proy. ${l.id_proyecto}`}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 800, color: isInversionista ? 'info.main' : 'warning.main', px: 1 }}>
                    {isInversionista ? '💼 INVERSIONISTA' : '🔨 SUBASTABLE'}
                  </Typography>
                </Stack>
              )
              : <Chip label="Huérfano" size="small" color="warning" icon={<Warning sx={{ fontSize: 14 }} />} variant="outlined" />
            }
          </Box>
        );
      }
    },
    {
      id: 'precio', label: 'Precio Base', render: (l) => (
        <Typography variant="body2" fontWeight={700} color="primary.main">
          ${Number(l.precio_base).toLocaleString('es-AR')}
        </Typography>
      )
    },
    {
      id: 'estado', label: 'Estado', render: (l) => {
        const colors: Record<string, any> = { activa: 'success', finalizada: 'info', pendiente: 'warning' };
        return (
          <Chip
            label={l.estado_subasta.toUpperCase()}
            color={colors[l.estado_subasta] || 'default'}
            size="small"
            variant={l.estado_subasta === 'pendiente' ? 'outlined' : 'filled'}
            sx={{ fontWeight: 700 }}
          />
        );
      }
    },
    {
      id: 'visibilidad', label: 'Visibilidad', align: 'center', render: (l) => (
        <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
          {toggleActiveMutation.isPending && confirmDialog.data?.id === l.id
            ? <CircularProgress size={20} />
            : <Switch checked={l.activo} onChange={() => handleToggleActive(l)} size="small" color="success" />
          }
        </Stack>
      )
    },
    {
      id: 'acciones', label: 'Acciones', align: 'right', render: (l) => {
        const validation = checkIsSubastable(l);

        return (
          <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
            <Tooltip title={validation.allowed ? "Gestionar Subasta" : validation.reason}>
              <span>
                <IconButton
                  size="small"
                  onClick={() => handleAuctionClick(l)}
                  disabled={!l.activo || !validation.allowed}
                  sx={{
                    color: !validation.allowed ? 'text.disabled' : (l.estado_subasta === 'activa' ? 'error.main' : 'success.main'),
                    bgcolor: validation.allowed ? alpha(l.estado_subasta === 'activa' ? theme.palette.error.main : theme.palette.success.main, 0.08) : 'transparent'
                  }}
                >
                  {l.estado_subasta === 'activa' ? <StopCircle fontSize="small" /> : <Gavel fontSize="small" />}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Imágenes"><IconButton onClick={() => handleManageImages(l)} size="small" color="primary"><Collections fontSize="small" /></IconButton></Tooltip>
            <Tooltip title="Editar"><IconButton size="small" onClick={() => handleOpenEdit(l)}><Edit fontSize="small" /></IconButton></Tooltip>
          </Stack>
        );
      }
    }
  ], [proyectos, theme, toggleActiveMutation.isPending, confirmDialog.data, checkIsSubastable]);

  // Handlers simples
  const handleToggleActive = useCallback((lote: LoteDto) => confirmDialog.confirm('toggle_lote_visibility', lote), [confirmDialog]);
  const handleOpenCreate = useCallback(() => { setSelectedLote(null); createModal.open(); }, [createModal]);
  const handleOpenEdit = useCallback((lote: LoteDto) => { setSelectedLote(lote); editModal.open(); }, [editModal]);
  const handleManageImages = useCallback((lote: LoteDto) => { setSelectedLote(lote); imagesModal.open(); }, [imagesModal]);
  const handleAuctionClick = useCallback((lote: LoteDto) => { setSelectedLote(lote); auctionModal.open(); }, [auctionModal]);

  const handleConfirmAction = () => {
    if (confirmDialog.action === 'toggle_lote_visibility' && confirmDialog.data) {
      toggleActiveMutation.mutate({ id: confirmDialog.data.id, activo: !confirmDialog.data.activo });
    }
  };

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      <PageHeader title="Gestión de Lotes" subtitle="Inventario, asignación de proyectos y control administrativo." />

      {/* KPI Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 4 }}>
        <StatCard title="Total Lotes" value={stats.total} icon={<Inventory />} color="primary" loading={loadingLotes} subtitle="Inventario global" />
        <StatCard title="En Subasta" value={stats.enSubasta} icon={<Gavel />} color="success" loading={loadingLotes} subtitle="Pujas activas hoy" />
        <StatCard title="Finalizados" value={stats.finalizados} icon={<CheckCircle />} color="info" loading={loadingLotes} subtitle="Histórico de cierres" />
        <StatCard title="Huérfanos" value={stats.huerfanos} icon={<AssignmentLate />} color="warning" loading={loadingLotes} subtitle="Sin proyecto asignado" />
      </Box>

      {/* Filtros y Acciones */}
      <FilterBar>
        <TextField
          placeholder="Buscar por nombre o ID..." size="small" sx={{ flexGrow: 1 }}
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment> }}
        />
        <FilterSelect label="Filtrar Proyecto" value={filterProject} onChange={(e) => setFilterProject(e.target.value)} sx={{ minWidth: 250 }}>
          <MenuItem value="all">Todos los Lotes</MenuItem>
          <MenuItem value="huerfano">⚠️ Sin Proyecto</MenuItem>
          <Divider />
          {proyectos.map(p => <MenuItem key={p.id} value={p.id}>{p.nombre_proyecto}</MenuItem>)}
        </FilterSelect>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate}>Nuevo Lote</Button>
      </FilterBar>

      {/* Tabla de Datos Principal */}
      <QueryHandler isLoading={loadingLotes} error={error as Error}>
        <DataTable
          columns={columns}
          data={filteredLotes}
          getRowKey={(row) => row.id}
          isRowActive={(lote) => lote.activo}
          highlightedRowId={highlightedId}
          showInactiveToggle={true}  // ✅ Nueva función del DataTable
          inactiveLabel="Oculto"     // ✅ Nueva función del DataTable
          emptyMessage="No se encontraron lotes registrados."
          pagination={true}
          defaultRowsPerPage={10}
        />
      </QueryHandler>

      {/* Modales de Gestión */}
      <CreateLoteModal {...createModal.modalProps} onSubmit={async (data) => { await saveMutation.mutateAsync({ dto: data }); }} isLoading={saveMutation.isPending} />
      <EditLoteModal {...editModal.modalProps} lote={selectedLote} onSubmit={async (id, data) => { await saveMutation.mutateAsync({ dto: data, id }); }} isLoading={saveMutation.isPending} />
      {selectedLote && <ManageLoteImagesModal {...imagesModal.modalProps} lote={selectedLote} />}
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
      <ConfirmDialog controller={confirmDialog} onConfirm={handleConfirmAction} isLoading={toggleActiveMutation.isPending} />
    </PageContainer>
  );
};

export default AdminLotes;