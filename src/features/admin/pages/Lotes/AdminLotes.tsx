import {
  Add, AssignmentLate, CheckCircle, Collections, Edit, Gavel,
  Inventory, Person, Search, StopCircle, Warning, Refresh,
  FileDownload, GridView, ViewList
} from '@mui/icons-material';
import {
  Box, Button, Chip, CircularProgress, Divider, IconButton, InputAdornment,
  MenuItem, Stack, Switch, TextField, Tooltip, Typography, alpha, useTheme,
  ToggleButtonGroup, ToggleButton, Card, CardContent, Avatar, LinearProgress
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { DataTable, type DataTableColumn } from '@/shared/components/data-grid/DataTable/DataTable';
import { ConfirmDialog } from '@/shared/components/domain/modals/ConfirmDialog/ConfirmDialog';
import { StatCard } from '@/shared/components/domain/cards/StatCard/StatCard';
import { FilterBar, FilterSelect } from '@/shared/components/forms/filters/FilterBar';
import { PageContainer } from '@/shared/components/layout/containers/PageContainer/PageContainer';
import { QueryHandler } from '@/shared/components/data-grid/QueryHandler/QueryHandler';

import AuctionControlModal from './modals/AuctionControlModal';
import CreateLoteModal from './modals/CreateLoteModal';
import EditLoteModal from './modals/EditLoteModal';
import ManageLoteImagesModal from './modals/ManageLoteImagesModal';

import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import { useModal } from '@/shared/hooks/useModal';
import useSnackbar from '@/shared/hooks/useSnackbar';
import { useSortedData } from '../../hooks/useSortedData';

import type { CreateLoteDto, LoteDto, UpdateLoteDto } from '@/core/types/dto/lote.dto';
import LoteService from '@/core/api/services/lote.service';
import ProyectoService from '@/core/api/services/proyecto.service';
import imagenService from '@/core/api/services/imagen.service';

// ============================================================================
// COMPONENTE: CARD DE LOTE (Vista alternativa)
// ============================================================================
const LoteCard: React.FC<{
  lote: LoteDto;
  proyecto: any;
  onEdit: () => void;
  onImages: () => void;
  onAuction: () => void;
  onToggle: () => void;
  isToggling: boolean;
  canSubastar: boolean;
}> = ({ lote, proyecto, onEdit, onImages, onAuction, onToggle, isToggling, canSubastar }) => {
  const theme = useTheme();
  const isInversionista = proyecto?.tipo_inversion === 'directo';

  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: lote.activo ? 'divider' : alpha(theme.palette.divider, 0.3),
        borderRadius: 3,
        transition: 'all 0.3s ease',
        opacity: lote.activo ? 1 : 0.6,
        '&:hover': {
          boxShadow: lote.activo ? theme.shadows[4] : 'none',
          borderColor: lote.activo ? 'primary.main' : 'divider',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Stack direction="row" spacing={2} flex={1}>
            <Avatar
              src={lote.imagenes?.[0] ? imagenService.resolveImageUrl(lote.imagenes[0].url) : undefined}
              variant="rounded"
              sx={{ width: 56, height: 56, bgcolor: alpha(theme.palette.primary.main, 0.1) }}
            >
              <Inventory sx={{ color: theme.palette.primary.main }} />
            </Avatar>
            <Box flex={1} minWidth={0}>
              <Typography variant="h5" noWrap>
                {lote.nombre_lote}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ID: {lote.id}
              </Typography>
            </Box>
          </Stack>
          <Switch
            checked={lote.activo}
            onChange={onToggle}
            size="small"
            color="success"
            disabled={isToggling}
          />
        </Stack>

        <Stack spacing={1.5} mb={2}>
          {lote.id_proyecto ? (
            <>
              <Chip
                label={proyecto?.nombre_proyecto || `Proyecto ${lote.id_proyecto}`}
                size="small"
                variant="outlined"
                color="primary"
              />
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  color: isInversionista ? 'info.main' : 'warning.main',
                  px: 1,
                }}
              >
                {isInversionista ? '💼 INVERSIONISTA' : '🔨 SUBASTABLE'}
              </Typography>
            </>
          ) : (
            <Chip
              label="Sin Proyecto"
              size="small"
              color="warning"
              icon={<Warning sx={{ fontSize: 14 }} />}
              variant="outlined"
            />
          )}

          <Typography variant="h6" color="primary.main" sx={{ fontFamily: 'monospace' }}>
            ${Number(lote.precio_base).toLocaleString('es-AR')}
          </Typography>

          <Chip
            label={lote.estado_subasta.toUpperCase()}
            size="small"
            color={
              lote.estado_subasta === 'activa'
                ? 'success'
                : lote.estado_subasta === 'finalizada'
                  ? 'info'
                  : 'warning'
            }
            variant={lote.estado_subasta === 'pendiente' ? 'outlined' : 'filled'}
          />
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Stack direction="row" spacing={0.5} justifyContent="space-between">
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Imágenes">
              <IconButton onClick={onImages} size="small" color="primary">
                <Collections fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Editar">
              <IconButton onClick={onEdit} size="small">
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>

          <Tooltip title={canSubastar ? 'Gestionar Subasta' : 'No subastable (Inversión Directa)'}>
            <span>
              <IconButton
                onClick={onAuction}
                size="small"
                disabled={!lote.activo || !canSubastar}
                sx={{
                  color: !canSubastar
                    ? 'text.disabled'
                    : lote.estado_subasta === 'activa'
                      ? 'error.main'
                      : 'success.main',
                  bgcolor: canSubastar
                    ? alpha(
                        lote.estado_subasta === 'activa'
                          ? theme.palette.error.main
                          : theme.palette.success.main,
                        0.08
                      )
                    : 'transparent',
                }}
              >
                {lote.estado_subasta === 'activa' ? (
                  <StopCircle fontSize="small" />
                ) : (
                  <Gavel fontSize="small" />
                )}
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
const AdminLotes: React.FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useSnackbar();

  const [searchParams, setSearchParams] = useSearchParams();
  const proyectoParam = searchParams.get('proyecto');

  const createModal = useModal();
  const editModal = useModal();
  const imagesModal = useModal();
  const auctionModal = useModal();
  const confirmDialog = useConfirmDialog();

  const [selectedLote, setSelectedLote] = useState<LoteDto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState<string>(proyectoParam || 'all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (filterProject === 'all' || filterProject === 'huerfano') {
      params.delete('proyecto');
    } else {
      params.set('proyecto', filterProject);
    }
    setSearchParams(params, { replace: true });
  }, [filterProject, searchParams, setSearchParams]);

  const { data: lotesRaw = [], isLoading: loadingLotes, error } = useQuery({
    queryKey: ['adminLotes'],
    queryFn: async () => (await LoteService.findAllAdmin()).data,
  });

  const { data: proyectos = [] } = useQuery({
    queryKey: ['adminProyectosSelect'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data,
  });

  const { sortedData: sortedLotes, highlightedId, triggerHighlight } = useSortedData(lotesRaw);

  const stats = useMemo(
    () => ({
      total: lotesRaw.length,
      enSubasta: lotesRaw.filter((l) => l.estado_subasta === 'activa').length,
      finalizados: lotesRaw.filter((l) => l.estado_subasta === 'finalizada').length,
      huerfanos: lotesRaw.filter((l) => !l.id_proyecto).length,
    }),
    [lotesRaw]
  );

  const checkIsSubastable = useCallback(
    (lote: LoteDto) => {
      if (!lote.id_proyecto) return { allowed: false, reason: 'Sin proyecto asignado' };
      const proyecto = proyectos.find((p) => p.id === lote.id_proyecto);
      if (proyecto?.tipo_inversion === 'directo') {
        return { allowed: false, reason: 'Proyecto de Inversión Directa (No Subastable)' };
      }
      return { allowed: true, reason: '' };
    },
    [proyectos]
  );

  const filteredLotes = useMemo(() => {
    return sortedLotes.filter((lote) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        lote.nombre_lote.toLowerCase().includes(term) || lote.id.toString().includes(term);

      let matchesProject = true;
      if (filterProject === 'huerfano') matchesProject = !lote.id_proyecto;
      else if (filterProject !== 'all') matchesProject = lote.id_proyecto === Number(filterProject);

      return matchesSearch && matchesProject;
    });
  }, [sortedLotes, searchTerm, filterProject]);

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
    onError: (err: any) => showError(err.response?.data?.error || 'Error al guardar'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, activo }: { id: number; activo: boolean }) =>
      await LoteService.update(id, { activo }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      confirmDialog.close();
      triggerHighlight(variables.id);
      showSuccess(variables.activo ? 'Lote visible' : 'Lote ocultado');
    },
    onError: (err: any) => {
      showError(err.response?.data?.error || 'Error al cambiar estado');
      confirmDialog.close();
    },
  });

  const startAuction = useMutation({
    mutationFn: (id: number) => LoteService.startAuction(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      auctionModal.close();
      triggerHighlight(id);
      showSuccess('✅ Subasta iniciada');
    },
    onError: () => showError('Error al iniciar subasta'),
  });

  const endAuction = useMutation({
    mutationFn: (id: number) => LoteService.endAuction(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      auctionModal.close();
      triggerHighlight(id);
      showSuccess('✅ Subasta finalizada');
    },
    onError: () => showError('Error al finalizar subasta'),
  });

  const columns = useMemo<DataTableColumn<LoteDto>[]>(
    () => [
      {
        id: 'lote',
        label: 'Lote / ID',
        minWidth: 180,
        render: (l) => (
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar
              src={l.imagenes?.[0] ? imagenService.resolveImageUrl(l.imagenes[0].url) : undefined}
              variant="rounded"
              sx={{ width: 40, height: 40, bgcolor: alpha(theme.palette.primary.main, 0.1) }}
            >
              <Inventory sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
            </Avatar>
            <Box minWidth={0}>
              <Typography variant="body2" noWrap>
                {l.nombre_lote}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ID: {l.id}
              </Typography>
            </Box>
          </Stack>
        ),
      },
      {
        id: 'proyecto',
        label: 'Proyecto',
        minWidth: 220,
        render: (l) => {
          const proyecto = proyectos.find((p) => p.id === l.id_proyecto);
          const isInversionista = proyecto?.tipo_inversion === 'directo';

          return (
            <Box>
              {l.id_proyecto ? (
                <Stack spacing={0.5}>
                  <Chip
                    label={proyecto?.nombre_proyecto || `Proy. ${l.id_proyecto}`}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      color: isInversionista ? 'info.main' : 'warning.main',
                      px: 1,
                    }}
                  >
                    {isInversionista ? '💼 INVERSIONISTA' : '🔨 SUBASTABLE'}
                  </Typography>
                </Stack>
              ) : (
                <Chip
                  label="Sin Proyecto"
                  size="small"
                  color="warning"
                  icon={<Warning sx={{ fontSize: 14 }} />}
                  variant="outlined"
                />
              )}
            </Box>
          );
        },
      },
      {
        id: 'precio',
        label: 'Precio Base',
        render: (l) => (
          <Typography variant="body2" color="primary.main" sx={{ fontFamily: 'monospace' }}>
            ${Number(l.precio_base).toLocaleString('es-AR')}
          </Typography>
        ),
      },
      {
        id: 'estado',
        label: 'Estado',
        render: (l) => {
          const colors: Record<string, any> = {
            activa: 'success',
            finalizada: 'info',
            pendiente: 'warning',
          };
          return (
            <Chip
              label={l.estado_subasta.toUpperCase()}
              color={colors[l.estado_subasta] || 'default'}
              size="small"
              variant={l.estado_subasta === 'pendiente' ? 'outlined' : 'filled'}
              sx={{ fontSize: '0.65rem' }}
            />
          );
        },
      },
      {
        id: 'visibilidad',
        label: 'Visibilidad',
        align: 'center',
        render: (l) => (
          <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
            {toggleActiveMutation.isPending && confirmDialog.data?.id === l.id ? (
              <CircularProgress size={20} />
            ) : (
              <Switch
                checked={l.activo}
                onChange={() => handleToggleActive(l)}
                size="small"
                color="success"
              />
            )}
          </Stack>
        ),
      },
      {
        id: 'acciones',
        label: 'Acciones',
        align: 'right',
        render: (l) => {
          const validation = checkIsSubastable(l);

          return (
            <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
              <Tooltip title={validation.allowed ? 'Gestionar Subasta' : validation.reason}>
                <span>
                  <IconButton
                    size="small"
                    onClick={() => handleAuctionClick(l)}
                    disabled={!l.activo || !validation.allowed}
                    sx={{
                      color: !validation.allowed
                        ? 'text.disabled'
                        : l.estado_subasta === 'activa'
                          ? 'error.main'
                          : 'success.main',
                      bgcolor: validation.allowed
                        ? alpha(
                            l.estado_subasta === 'activa'
                              ? theme.palette.error.main
                              : theme.palette.success.main,
                            0.08
                          )
                        : 'transparent',
                    }}
                  >
                    {l.estado_subasta === 'activa' ? (
                      <StopCircle fontSize="small" />
                    ) : (
                      <Gavel fontSize="small" />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Imágenes">
                <IconButton onClick={() => handleManageImages(l)} size="small" color="primary">
                  <Collections fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Editar">
                <IconButton size="small" onClick={() => handleOpenEdit(l)}>
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          );
        },
      },
    ],
    [proyectos, theme, toggleActiveMutation.isPending, confirmDialog.data, checkIsSubastable]
  );

  const handleToggleActive = useCallback(
    (lote: LoteDto) => confirmDialog.confirm('toggle_lote_visibility', lote),
    [confirmDialog]
  );
  const handleOpenCreate = useCallback(() => {
    setSelectedLote(null);
    createModal.open();
  }, [createModal]);
  const handleOpenEdit = useCallback(
    (lote: LoteDto) => {
      setSelectedLote(lote);
      editModal.open();
    },
    [editModal]
  );
  const handleManageImages = useCallback(
    (lote: LoteDto) => {
      setSelectedLote(lote);
      imagesModal.open();
    },
    [imagesModal]
  );
  const handleAuctionClick = useCallback(
    (lote: LoteDto) => {
      setSelectedLote(lote);
      auctionModal.open();
    },
    [auctionModal]
  );

  const handleConfirmAction = () => {
    if (confirmDialog.action === 'toggle_lote_visibility' && confirmDialog.data) {
      toggleActiveMutation.mutate({
        id: confirmDialog.data.id,
        activo: !confirmDialog.data.activo,
      });
    }
  };

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      {/* CABECERA */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        mb={4}
        spacing={2}
      >
        <Box>
          <Typography variant="h1">
            Gestión de Lotes
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Inventario, asignación de proyectos y control administrativo
          </Typography>
        </Box>

        <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate}>
          Nuevo Lote
        </Button>
      </Stack>

      {/* KPI Stats */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 4,
        }}
      >
        <StatCard
          title="Total Lotes"
          value={stats.total}
          icon={<Inventory />}
          color="primary"
          loading={loadingLotes}
          subtitle="Inventario global"
        />
        <StatCard
          title="En Subasta"
          value={stats.enSubasta}
          icon={<Gavel />}
          color="success"
          loading={loadingLotes}
          subtitle="Pujas activas hoy"
        />
        <StatCard
          title="Finalizados"
          value={stats.finalizados}
          icon={<CheckCircle />}
          color="info"
          loading={loadingLotes}
          subtitle="Histórico de cierres"
        />
        <StatCard
          title="Sin Proyecto"
          value={stats.huerfanos}
          icon={<AssignmentLate />}
          color="warning"
          loading={loadingLotes}
          subtitle="Requieren asignación"
        />
      </Box>

      {/* FILTROS Y SELECTOR DE VISTA */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', md: 'center' }}
        mb={3}
        spacing={2}
      >
        <FilterBar sx={{ flex: 1 }}>
          <TextField
            placeholder="Buscar por nombre o ID..."
            size="small"
            sx={{ flexGrow: 1 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="action" />
                </InputAdornment>
              ),
            }}
          />
          <FilterSelect
            label="Filtrar Proyecto"
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            sx={{ minWidth: 250 }}
          >
            <MenuItem value="all">Todos los Lotes</MenuItem>
            <MenuItem value="huerfano">⚠️ Sin Proyecto</MenuItem>
            <Divider />
            {proyectos.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.nombre_proyecto}
              </MenuItem>
            ))}
          </FilterSelect>
        </FilterBar>

        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, newMode) => newMode && setViewMode(newMode)}
          size="small"
          sx={{
            bgcolor: alpha(theme.palette.background.paper, 0.8),
            '& .MuiToggleButton-root': {
              px: 2,
              textTransform: 'none',
              borderRadius: 1.5,
            },
          }}
        >
          <ToggleButton value="table">
            <ViewList fontSize="small" sx={{ mr: 0.5 }} /> Tabla
          </ToggleButton>
          <ToggleButton value="grid">
            <GridView fontSize="small" sx={{ mr: 0.5 }} /> Cards
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {/* CONTENIDO SEGÚN VISTA */}
      <QueryHandler isLoading={loadingLotes} error={error as Error}>
        {viewMode === 'grid' ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)',
              },
              gap: 3,
            }}
          >
            {filteredLotes.map((lote) => {
              const proyecto = proyectos.find((p) => p.id === lote.id_proyecto);
              const validation = checkIsSubastable(lote);

              return (
                <LoteCard
                  key={lote.id}
                  lote={lote}
                  proyecto={proyecto}
                  onEdit={() => handleOpenEdit(lote)}
                  onImages={() => handleManageImages(lote)}
                  onAuction={() => handleAuctionClick(lote)}
                  onToggle={() => handleToggleActive(lote)}
                  isToggling={toggleActiveMutation.isPending && confirmDialog.data?.id === lote.id}
                  canSubastar={validation.allowed}
                />
              );
            })}
          </Box>
        ) : (
          <DataTable
            columns={columns}
            data={filteredLotes}
            getRowKey={(row) => row.id}
            isRowActive={(lote) => lote.activo}
            highlightedRowId={highlightedId}
            showInactiveToggle={true}
            inactiveLabel="Ocultos"
            emptyMessage="No se encontraron lotes registrados."
            pagination={true}
            defaultRowsPerPage={10}
          />
        )}
      </QueryHandler>

      {/* MODALES */}
      <CreateLoteModal
        {...createModal.modalProps}
        onSubmit={async (data) => {
          await saveMutation.mutateAsync({ dto: data });
        }}
        isLoading={saveMutation.isPending}
      />
      <EditLoteModal
        {...editModal.modalProps}
        lote={selectedLote}
        onSubmit={async (id, data) => {
          await saveMutation.mutateAsync({ dto: data, id });
        }}
        isLoading={saveMutation.isPending}
      />
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
      <ConfirmDialog
        controller={confirmDialog}
        onConfirm={handleConfirmAction}
        isLoading={toggleActiveMutation.isPending}
      />
    </PageContainer>
  );
};

export default AdminLotes;