import {
  Add, AssignmentLate, CheckCircle, Collections, Edit, Gavel,
  GridView, Inventory, Search, StopCircle, ViewList, Warning
} from '@mui/icons-material';
import {
  Avatar, Box, Button, Card, CardContent, Chip, CircularProgress,
  Divider, IconButton, InputAdornment, MenuItem, Stack, Switch,
  TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography, alpha, useTheme
} from '@mui/material';
import React, { useMemo } from 'react';

import { DataTable, type DataTableColumn } from '@/shared/components/data-grid/DataTable/DataTable';
import { QueryHandler } from '@/shared/components/data-grid/QueryHandler/QueryHandler';
import { StatCard } from '@/shared/components/domain/cards/StatCard/StatCard';
import { ConfirmDialog } from '@/shared/components/domain/modals/ConfirmDialog/ConfirmDialog';
import { FilterBar, FilterSelect } from '@/shared/components/forms/filters/FilterBar';
import { PageContainer } from '@/shared/components/layout/containers/PageContainer/PageContainer';

import AuctionControlModal from './modals/AuctionControlModal';
import CreateLoteModal from './modals/CreateLoteModal';
import EditLoteModal from './modals/EditLoteModal';
import ManageLoteImagesModal from './modals/ManageLoteImagesModal';

import imagenService from '@/core/api/services/imagen.service';
import type { LoteDto } from '@/core/types/dto/lote.dto';
import { useAdminLotes } from '../../hooks/lotes/useAdminLotes';


// ============================================================================
// COMPONENTE: CARD DE LOTE (Memoizado)
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
}> = React.memo(({ lote, proyecto, onEdit, onImages, onAuction, onToggle, isToggling, canSubastar }) => {
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
});

LoteCard.displayName = 'LoteCard';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
const AdminLotes: React.FC = () => {
  const logic = useAdminLotes();

  // --- Columnas de Tabla (Memoizado) ---
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
              sx={{ width: 40, height: 40, bgcolor: alpha(logic.theme.palette.primary.main, 0.1) }}
            >
              <Inventory sx={{ color: logic.theme.palette.primary.main, fontSize: 20 }} />
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
          const proyecto = logic.proyectos.find((p) => p.id === l.id_proyecto);
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
            {logic.isToggling && logic.modales.confirm.data?.id === l.id ? (
              <CircularProgress size={20} />
            ) : (
              <Switch
                checked={l.activo}
                onChange={() => logic.handleToggleActive(l)}
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
          const validation = logic.checkIsSubastable(l);

          return (
            <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
              <Tooltip title={validation.allowed ? 'Gestionar Subasta' : validation.reason}>
                <span>
                  <IconButton
                    size="small"
                    onClick={() => logic.handleAuctionClick(l)}
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
                            ? logic.theme.palette.error.main
                            : logic.theme.palette.success.main,
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
                <IconButton onClick={() => logic.handleManageImages(l)} size="small" color="primary">
                  <Collections fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Editar">
                <IconButton size="small" onClick={() => logic.handleOpenEdit(l)}>
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          );
        },
      },
    ],
    [logic.proyectos, logic.theme, logic.isToggling, logic.modales.confirm.data, logic.checkIsSubastable, logic.handleToggleActive, logic.handleAuctionClick, logic.handleManageImages, logic.handleOpenEdit]
  );

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
          <Typography variant="h1">Gestión de Lotes</Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Inventario, asignación de proyectos y control administrativo
          </Typography>
        </Box>

        <Button variant="contained" startIcon={<Add />} onClick={logic.handleOpenCreate}>
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
          value={logic.stats.total}
          icon={<Inventory />}
          color="primary"
          loading={logic.loadingLotes}
          subtitle="Inventario global"
        />
        <StatCard
          title="En Subasta"
          value={logic.stats.enSubasta}
          icon={<Gavel />}
          color="success"
          loading={logic.loadingLotes}
          subtitle="Pujas activas hoy"
        />
        <StatCard
          title="Finalizados"
          value={logic.stats.finalizados}
          icon={<CheckCircle />}
          color="info"
          loading={logic.loadingLotes}
          subtitle="Histórico de cierres"
        />
        <StatCard
          title="Sin Proyecto"
          value={logic.stats.huerfanos}
          icon={<AssignmentLate />}
          color="warning"
          loading={logic.loadingLotes}
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
            value={logic.searchTerm}
            onChange={(e) => logic.setSearchTerm(e.target.value)}
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
            value={logic.filterProject}
            onChange={(e) => logic.setFilterProject(e.target.value)}
            sx={{ minWidth: 250 }}
          >
            <MenuItem value="all">Todos los Lotes</MenuItem>
            <MenuItem value="huerfano">⚠️ Sin Proyecto</MenuItem>
            <Divider />
            {logic.proyectos.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.nombre_proyecto}
              </MenuItem>
            ))}
          </FilterSelect>
        </FilterBar>

        <ToggleButtonGroup
          value={logic.viewMode}
          exclusive
          onChange={(_, newMode) => newMode && logic.setViewMode(newMode)}
          size="small"
          sx={{
            bgcolor: alpha(logic.theme.palette.background.paper, 0.8),
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
      <QueryHandler isLoading={logic.loadingLotes} error={logic.error as Error}>
        {logic.viewMode === 'grid' ? (
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
            {logic.filteredLotes.map((lote) => {
              const proyecto = logic.proyectos.find((p) => p.id === lote.id_proyecto);
              const validation = logic.checkIsSubastable(lote);

              return (
                <LoteCard
                  key={lote.id}
                  lote={lote}
                  proyecto={proyecto}
                  onEdit={() => logic.handleOpenEdit(lote)}
                  onImages={() => logic.handleManageImages(lote)}
                  onAuction={() => logic.handleAuctionClick(lote)}
                  onToggle={() => logic.handleToggleActive(lote)}
                  isToggling={logic.isToggling && logic.modales.confirm.data?.id === lote.id}
                  canSubastar={validation.allowed}
                />
              );
            })}
          </Box>
        ) : (
          <DataTable
            columns={columns}
            data={logic.filteredLotes}
            getRowKey={(row) => row.id}
            isRowActive={(lote) => lote.activo}
            highlightedRowId={logic.highlightedId}
            // 🔥 CORRECCIÓN: false para respetar filtros externos
            showInactiveToggle={false}
            inactiveLabel="Ocultos"
            emptyMessage="No se encontraron lotes registrados."
            pagination={true}
            defaultRowsPerPage={10}
          />
        )}
      </QueryHandler>

      {/* MODALES */}
      <CreateLoteModal
        {...logic.modales.create.modalProps}
        onSubmit={async (data) => {
          await logic.saveLote({ dto: data });
        }}
        isLoading={logic.isSaving}
      />

      <EditLoteModal
        {...logic.modales.edit.modalProps}
        lote={logic.selectedLote}
        onSubmit={async (id, data) => {
          await logic.saveLote({ dto: data, id });
        }}
        isLoading={logic.isSaving}
      />

      {logic.selectedLote && (
        <ManageLoteImagesModal
          {...logic.modales.images.modalProps}
          lote={logic.selectedLote}
        />
      )}

      {logic.selectedLote && (
        <AuctionControlModal
          open={logic.modales.auction.isOpen}
          onClose={logic.modales.auction.close}
          lote={logic.selectedLote}
          isLoading={logic.isAuctionLoading}
          onStart={(id) => logic.startAuctionFn(id)}
          onEnd={(id) => logic.endAuctionFn(id)}
        />
      )}

      <ConfirmDialog
        controller={logic.modales.confirm}
        onConfirm={logic.handleConfirmAction}
        isLoading={logic.isToggling}
      />
    </PageContainer>
  );
};

export default AdminLotes;