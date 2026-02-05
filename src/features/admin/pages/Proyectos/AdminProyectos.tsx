import {
  Add,
  Apartment as ApartmentIcon,
  CheckCircle,
  Edit,
  GridView,
  Image as ImageIcon,
  Layers,
  MonetizationOn as MonetizationOnIcon,
  PlayArrow,
  TrendingUp,
  ViewList,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import {
  alpha, Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Divider,
  IconButton,
  LinearProgress,
  MenuItem,
  Stack,
  Switch,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';
import React, { memo, useMemo, useState } from 'react';

// Componentes Compartidos
import { AdminPageHeader } from '@/shared/components/admin/Adminpageheader';
import AlertBanner from '@/shared/components/admin/Alertbanner';
import MetricsGrid from '@/shared/components/admin/Metricsgrid';
import { ViewModeToggle, type ViewMode } from '@/shared/components/admin/Viewmodetoggle';
import { DataTable, type DataTableColumn } from '@/shared/components/data-grid/DataTable/DataTable';
import { QueryHandler } from '@/shared/components/data-grid/QueryHandler/QueryHandler';
import { StatCard } from '@/shared/components/domain/cards/StatCard/StatCard';
import { ConfirmDialog } from '@/shared/components/domain/modals/ConfirmDialog/ConfirmDialog';
import { FilterBar, FilterSearch, FilterSelect } from '@/shared/components/forms/filters/FilterBar';
import { PageContainer } from '@/shared/components/layout/containers/PageContainer/PageContainer';

// Modales
import ConfigCuotasModal from './components/modals/ConfigCuotasModal';
import CreateProyectoModal from './components/modals/CreateProyectoModal';
import EditProyectoModal from './components/modals/EditProyectoModal';
import ManageImagesModal from './components/modals/ManageImagesModal';
import ProjectLotesModal from './components/modals/ProjectLotesModal';

import type { ProyectoDto } from '@/core/types/dto/proyecto.dto';
import { useAdminProyectos, type TipoInversionFilter } from '../../hooks/useAdminProyectos';

// ============================================================================
// COMPONENTE: VISTA DE CARDS (MEMOIZADO)
// ============================================================================
const ProjectCard = memo<{
  proyecto: ProyectoDto;
  onAction: (proyecto: ProyectoDto, action: any, e?: React.MouseEvent) => void;
  onToggle: (proyecto: ProyectoDto) => void;
  isToggling: boolean;
}>(({ proyecto, onAction, onToggle, isToggling }) => {
  const theme = useTheme();
  const isMensual = proyecto.tipo_inversion === 'mensual';
  const canStart = isMensual && proyecto.estado_proyecto === 'En Espera';

  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: proyecto.activo ? 'divider' : alpha(theme.palette.divider, 0.3),
        borderRadius: 3,
        transition: 'all 0.3s ease',
        opacity: proyecto.activo ? 1 : 0.6,
        '&:hover': {
          boxShadow: proyecto.activo ? theme.shadows[4] : 'none',
          borderColor: proyecto.activo ? 'primary.main' : 'divider',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Stack direction="row" spacing={2} alignItems="center" flex={1}>
            <Avatar
              variant="rounded"
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: 'primary.main',
                width: 48,
                height: 48,
              }}
            >
              <ApartmentIcon />
            </Avatar>
            <Box flex={1} minWidth={0}>
              <Typography variant="h6" fontWeight={700} noWrap>
                {proyecto.nombre_proyecto}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ID: {proyecto.id}
              </Typography>
            </Box>
          </Stack>

          <Switch
            checked={proyecto.activo}
            onChange={() => onToggle(proyecto)}
            size="small"
            color="success"
            disabled={isToggling}
          />
        </Stack>

        {/* Tipo e Inversión */}
        <Stack direction="row" spacing={1} mb={2}>
          <Chip
            label={isMensual ? 'Ahorro' : 'Directo'}
            size="small"
            color={isMensual ? 'primary' : 'default'}
            sx={{ fontWeight: 700 }}
          />
          <Chip
            label={`${proyecto.moneda} ${Number(proyecto.monto_inversion).toLocaleString()}`}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        </Stack>

        {/* Estado del Proyecto */}
        {isMensual && (
          <Box mb={2}>
            <Stack direction="row" justifyContent="space-between" mb={0.5}>
              <Typography variant="caption" fontWeight={600}>
                {proyecto.estado_proyecto}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Avance
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={65} // Mock - implementar cálculo real
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
              }}
            />
          </Box>
        )}
      </CardContent>

      <Divider />

      {/* Acciones */}
      <CardActions sx={{ px: 2, py: 1.5, justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Imágenes">
            <IconButton
              onClick={(e) => onAction(proyecto, 'images', e)}
              size="small"
              color="primary"
            >
              <ImageIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {isMensual && (
            <Tooltip title="Ver/Editar Cuotas">
              <IconButton onClick={(e) => onAction(proyecto, 'cuotas', e)} size="small">
                <MonetizationOnIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Editar">
            <IconButton onClick={(e) => onAction(proyecto, 'edit', e)} size="small">
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Lotes">
            <IconButton onClick={(e) => onAction(proyecto, 'lotes', e)} size="small" color="info">
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        {canStart && (
          <Tooltip title="Iniciar Cobros">
            <IconButton
              onClick={() => onAction(proyecto, 'start')}
              size="small"
              sx={{ color: 'success.main' }}
            >
              <PlayArrow fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </CardActions>
    </Card>
  );
});

ProjectCard.displayName = 'ProjectCard';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
const AdminProyectos: React.FC = () => {
  const theme = useTheme();
  const logic = useAdminProyectos();
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // --------------------------------------------------------------------------
  // CÁLCULO DE KPIS (derivado de filteredProyectos) - ✨ OPTIMIZADO
  // --------------------------------------------------------------------------
  const stats = useMemo(() => {
    const data = logic.filteredProyectos;
    const total = data.length;
    const activos = data.filter(p => p.activo).length;
    const mensuales = data.filter(p => p.tipo_inversion === 'mensual').length;
    const volumen = data.reduce((acc, p) => acc + Number(p.monto_inversion || 0), 0);

    return { total, activos, mensuales, volumen };
  }, [logic.filteredProyectos]);

  // --------------------------------------------------------------------------
  // COLUMNAS - ✨ OPTIMIZADO con callbacks memoizados
  // --------------------------------------------------------------------------
  const columns = useMemo<DataTableColumn<ProyectoDto>[]>(
    () => [
      {
        id: 'proyecto',
        label: 'Proyecto',
        minWidth: 200,
        render: (p) => (
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              variant="rounded"
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: 'primary.main',
                width: 36,
                height: 36,
              }}
            >
              <ApartmentIcon fontSize="small" />
            </Avatar>
            <Box minWidth={0}>
              <Typography variant="body2" fontWeight={700} noWrap>
                {p.nombre_proyecto}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ID: {p.id}
              </Typography>
            </Box>
          </Stack>
        ),
      },
      {
        id: 'tipo',
        label: 'Tipo',
        render: (p) => (
          <Chip
            label={p.tipo_inversion === 'mensual' ? 'Ahorro' : 'Directo'}
            size="small"
            color={p.tipo_inversion === 'mensual' ? 'primary' : 'default'}
            sx={{ fontWeight: 700, fontSize: '0.7rem' }}
          />
        ),
      },
      {
        id: 'finanzas',
        label: 'Inversión',
        render: (p) => (
          <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
            {p.moneda} {Number(p.monto_inversion).toLocaleString()}
          </Typography>
        ),
      },
      {
        id: 'estado',
        label: 'Estado',
        render: (p) => {
          if (p.tipo_inversion !== 'mensual') return <Typography variant="caption">-</Typography>;

          const statusColors: Record<string, string> = {
            'En Espera': theme.palette.warning.main,
            'En Proceso': theme.palette.info.main,
            'Completado': theme.palette.success.main,
          };

          return (
            <Chip
              label={p.estado_proyecto}
              size="small"
              sx={{
                bgcolor: alpha(statusColors[p.estado_proyecto] || theme.palette.grey[500], 0.1),
                color: statusColors[p.estado_proyecto] || theme.palette.text.secondary,
                fontWeight: 700,
                fontSize: '0.65rem',
              }}
            />
          );
        },
      },
      {
        id: 'visibilidad',
        label: 'Visibilidad',
        align: 'center',
        render: (p) => (
          <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
            <Switch
              checked={p.activo}
              onChange={(e) => {
                e.stopPropagation();
                logic.modales.confirmDialog.confirm('toggle_project_visibility', p);
              }}
              size="small"
              color="success"
              disabled={logic.isToggling}
            />
            <Typography
              variant="caption"
              fontWeight={600}
              color={p.activo ? 'success.main' : 'text.disabled'}
            >
              {p.activo ? 'Visible' : 'Oculto'}
            </Typography>
          </Stack>
        ),
      },
      {
        id: 'acciones',
        label: 'Acciones',
        align: 'right',
        render: (p) => (
          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
            <Tooltip title="Imágenes">
              <IconButton onClick={(e) => logic.handleAction(p, 'images', e)} size="small" color="primary">
                <ImageIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {p.tipo_inversion === 'mensual' && (
              <Tooltip title="Ver/Editar Cuotas">
                <IconButton onClick={(e) => logic.handleAction(p, 'cuotas', e)} size="small">
                  <MonetizationOnIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {p.tipo_inversion === 'mensual' && p.estado_proyecto === 'En Espera' && (
              <Tooltip title="Iniciar Cobros">
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    logic.modales.confirmDialog.confirm('start_project_process', p);
                  }}
                  size="small"
                  sx={{ color: 'success.main' }}
                >
                  <PlayArrow fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="Editar">
              <IconButton onClick={(e) => logic.handleAction(p, 'edit', e)} size="small">
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Lotes">
              <IconButton onClick={(e) => logic.handleAction(p, 'lotes', e)} size="small" color="info">
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    [logic, theme]
  );

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      {/* 1. HEADER ESTANDARIZADO */}
      <AdminPageHeader
        title="Gestión de Proyectos"
        subtitle="Administra el catálogo de inversiones y estados"
        action={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={logic.modales.create.open}
            sx={{ whiteSpace: 'nowrap', fontWeight: 700 }}
          >
            Nuevo Proyecto
          </Button>
        }
      />

      {/* 2. ERRORES */}
      {logic.error && (
        <AlertBanner
          severity="error"
          title="Error de Carga"
          message={(logic.error as Error).message || 'No se pudieron cargar los proyectos.'}
        />
      )}

      {/* 3. KPIS GRID */}
      <MetricsGrid columns={{ xs: 1, sm: 2, lg: 4 }}>
        <StatCard
          title="Total Proyectos"
          value={stats.total}
          icon={<Layers />}
          color="primary"
          loading={logic.isLoading}
          subtitle="Registrados en el sistema"
        />
        <StatCard
          title="Activos / Visibles"
          value={stats.activos}
          icon={<CheckCircle />}
          color="success"
          loading={logic.isLoading}
          subtitle="Publicados para clientes"
        />
        <StatCard
          title="Planes de Ahorro"
          value={stats.mensuales}
          icon={<MonetizationOnIcon />}
          color="info"
          loading={logic.isLoading}
          subtitle="Tipo inversión mensual"
        />
        <StatCard
          title="Volumen Total"
          value={`$${stats.volumen.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`}
          icon={<TrendingUp />}
          color="warning"
          loading={logic.isLoading}
          subtitle="Capital acumulado"
        />
      </MetricsGrid>

      {/* 4. FILTROS Y TOGGLE DE VISTA */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', md: 'center' }}
        mb={3}
        spacing={2}
      >
        <FilterBar sx={{ flex: 1 }}>
          <FilterSearch
            placeholder="Buscar por nombre..."
            value={logic.searchTerm}
            onSearch={logic.setSearchTerm}
            sx={{ flexGrow: 1 }}
          />

          <FilterSelect
            label="Tipo de Inversión"
            value={logic.filterTipo}
            onChange={(e) => logic.setFilterTipo(e.target.value as TipoInversionFilter)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="directo">Directo</MenuItem>
            <MenuItem value="mensual">Ahorro</MenuItem>
          </FilterSelect>
        </FilterBar>

        <ViewModeToggle
          value={viewMode}
          onChange={(newMode) => setViewMode(newMode)}
          options={[
            { value: 'table', label: 'Tabla', icon: <ViewList fontSize="small" /> },
            { value: 'grid', label: 'Cards', icon: <GridView fontSize="small" /> },
          ]}
        />
      </Stack>

      {/* 5. CONTENIDO SEGÚN VISTA */}
      <QueryHandler isLoading={logic.isLoading} error={logic.error as Error}>
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
            {logic.filteredProyectos.map((proyecto) => (
              <ProjectCard
                key={proyecto.id}
                proyecto={proyecto}
                onAction={logic.handleAction}
                onToggle={(p) => logic.modales.confirmDialog.confirm('toggle_project_visibility', p)}
                isToggling={logic.isToggling}
              />
            ))}
          </Box>
        ) : (
          <DataTable
            columns={columns}
            data={logic.filteredProyectos}
            getRowKey={(p) => p.id}
            isRowActive={(p) => p.activo}
            highlightedRowId={logic.highlightedId}
            pagination={true}
            defaultRowsPerPage={10}
            emptyMessage="No se encontraron proyectos."
          />
        )}
      </QueryHandler>

      {/* 6. MODALES */}
      <CreateProyectoModal {...logic.modales.create.modalProps} onSubmit={logic.handleCreateSubmit} />

      {logic.selectedProject && (
        <>
          <ConfigCuotasModal
            open={logic.modales.cuotas.isOpen}
            onClose={logic.modales.cuotas.close}
            proyecto={logic.selectedProject}
          />

          <EditProyectoModal
            open={logic.modales.edit.isOpen}
            onClose={logic.modales.edit.close}
            proyecto={logic.selectedProject}
            onSubmit={logic.handleUpdateSubmit}
            isLoading={logic.isUpdating}
          />

          <ProjectLotesModal
            open={logic.modales.lotes.isOpen}
            onClose={logic.modales.lotes.close}
            proyecto={logic.selectedProject}
          />

          <ManageImagesModal
            open={logic.modales.images.isOpen}
            onClose={logic.modales.images.close}
            proyecto={logic.selectedProject}
          />
        </>
      )}

      <ConfirmDialog
        controller={logic.modales.confirmDialog}
        onConfirm={logic.handleConfirmAction}
        isLoading={logic.isStarting || logic.isToggling}
      />
    </PageContainer>
  );
};

export default AdminProyectos;