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
  Undo,
  ViewList,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import {
  alpha,
  Avatar,
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

import type { ProyectoDto } from '@/core/types/dto/proyecto.dto';
import { useAdminProyectos } from '../../hooks/proyecto/useAdminProyectos';
import { env } from '@/core/config/env'; // 👈 1. Importamos la configuración global

import {
  AdminPageHeader, ConfirmDialog, DataTable, FilterBar,
  FilterSearch, FilterSelect, MetricsGrid, PageContainer, QueryHandler,
  StatCard, ViewModeToggle, type DataTableColumn, type ViewMode
} from '@/shared';
import ConfigCuotasModal from './modals/ConfigCuotasModal';
import CreateProyectoModal from './modals/CreateProyectoModal';
import DetalleProyectoModal from './modals/DetalleProyectoModal';
import EditProyectoModal from './modals/EditProyectoModal';
import ManageImagesModal from './modals/ManageImagesModal';

// ============================================================================
// COMPONENTE: VISTA DE CARDS (Grid)
// ============================================================================
const ProjectCard = memo<{
  proyecto: ProyectoDto;
  onAction: (proyecto: ProyectoDto, action: any, e?: React.MouseEvent) => void;
  onRevert: (proyecto: ProyectoDto) => void;
  onToggle: (proyecto: ProyectoDto) => void;
  isToggling: boolean;
}>(({ proyecto, onAction, onToggle, onRevert, isToggling }) => {
  const theme = useTheme();
  const isMensual = proyecto.tipo_inversion === 'mensual';
  const isBajoMinimo = proyecto.suscripciones_actuales < (proyecto.suscripciones_minimas || 0);
  const isObjetivoAlcanzado = proyecto.suscripciones_actuales >= (proyecto.obj_suscripciones || 1);
  const canStart = isMensual && proyecto.estado_proyecto === 'En Espera';
  const hasLotes = proyecto.lotes && proyecto.lotes.length > 0;
  const isReadyToStart = canStart && (!proyecto.pack_de_lotes || hasLotes);
  const canRevert = isMensual && proyecto.estado_proyecto === 'En proceso' && !isObjetivoAlcanzado;
  // Usa directamente el campo que ya viene en el proyecto
  const cuotaAMostrar = proyecto.valor_cuota_referencia;

  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: isBajoMinimo ? 'error.light' : proyecto.activo ? 'divider' : alpha(theme.palette.divider, 0.3),
        borderRadius: 3,
        transition: 'all 0.3s ease',
        opacity: proyecto.activo ? 1 : 0.6,
        '&:hover': {
          boxShadow: proyecto.activo ? theme.shadows[4] : 'none',
          borderColor: isBajoMinimo ? 'error.main' : 'primary.main',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Stack direction="row" spacing={2} alignItems="center" flex={1}>
            <Avatar
              variant="rounded"
              sx={{
                bgcolor: alpha(isBajoMinimo ? theme.palette.error.main : theme.palette.primary.main, 0.1),
                color: isBajoMinimo ? 'error.main' : 'primary.main',
                width: 48, height: 48,
              }}
            >
              <ApartmentIcon />
            </Avatar>
            <Box flex={1} minWidth={0}>
              <Typography variant="h6" fontWeight={700} noWrap>{proyecto.nombre_proyecto}</Typography>
              <Stack direction="row" spacing={1} mt={0.3}>
                <Chip
                  label={isMensual ? 'Plan Ahorro' : 'Inversión'}
                  size="small"
                  color={isMensual ? 'primary' : 'secondary'}
                  variant="outlined"
                  sx={{ fontWeight: 700, fontSize: '0.6rem', height: 18 }}
                />
                <Typography variant="caption" color="text.secondary">ID: {proyecto.id}</Typography>
              </Stack>
            </Box>
          </Stack>
          <Switch checked={proyecto.activo} onChange={() => onToggle(proyecto)} size="small" color="success" disabled={isToggling} />
        </Stack>

        <Stack direction="row" spacing={1} mb={2} flexWrap="wrap" useFlexGap>
          {/* 👈 2. Aplicamos env.defaultLocale */}
          <Chip label={`${proyecto.moneda} ${Number(proyecto.monto_inversion).toLocaleString(env.defaultLocale)}`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
          {isMensual && proyecto.plazo_inversion && (
            <Chip label={`${proyecto.plazo_inversion} meses`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
          )}
          {isMensual && cuotaAMostrar && (
            <Chip
           
              label={`Cuota: ${proyecto.moneda} ${Number(cuotaAMostrar).toLocaleString(env.defaultLocale, { minimumFractionDigits: 2 })}`}
              size="small"
              color="success"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          )}
        </Stack>

        {isMensual && (
          <Box mb={2}>
            <Stack direction="row" justifyContent="space-between" mb={0.5}>
              <Typography variant="caption" fontWeight={700} color={isBajoMinimo ? 'error.main' : isObjetivoAlcanzado ? 'success.main' : 'text.primary'}>
                {proyecto.suscripciones_actuales} / {proyecto.obj_suscripciones} Susc.
              </Typography>
              {isBajoMinimo && <Typography variant="caption" color="error.main" fontWeight={800}>⚠️ RIESGO</Typography>}
              {isObjetivoAlcanzado && !isBajoMinimo && <Typography variant="caption" color="success.main" fontWeight={900}>🎉 ¡OBJETIVO!</Typography>}
            </Stack>
            <LinearProgress
              variant="determinate"
              value={Math.min((proyecto.suscripciones_actuales / (proyecto.obj_suscripciones || 1)) * 100, 100)}
              sx={{
                height: 6, borderRadius: 3,
                bgcolor: alpha(isBajoMinimo ? theme.palette.error.main : theme.palette.primary.main, 0.1),
                '& .MuiLinearProgress-bar': { bgcolor: isBajoMinimo ? 'error.main' : isObjetivoAlcanzado ? 'success.main' : 'primary.main' },
              }}
            />
          </Box>
        )}

        {!isMensual && (
          <Typography variant="caption" color="text.secondary">
            {(proyecto.lotes?.length ?? 0) > 0
              ? `${proyecto.lotes!.filter(l => l.activo).length} lotes activos / ${proyecto.lotes!.length} total`
              : 'Sin lotes asignados'}
          </Typography>
        )}
      </CardContent>

      <Divider />

      <CardActions sx={{ px: 2, py: 1.5, justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Imágenes"><IconButton onClick={(e) => onAction(proyecto, 'images', e)} size="small" color="primary"><ImageIcon fontSize="small" /></IconButton></Tooltip>
          {isMensual && (
            <Tooltip title="Cuotas"><IconButton onClick={(e) => onAction(proyecto, 'cuotas', e)} size="small"><MonetizationOnIcon fontSize="small" /></IconButton></Tooltip>
          )}
          <Tooltip title="Editar"><IconButton onClick={(e) => onAction(proyecto, 'edit', e)} size="small"><Edit fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Lotes"><IconButton onClick={(e) => onAction(proyecto, 'lotes', e)} size="small" color="info"><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
        </Stack>
        <Stack direction="row" spacing={1}>
          {canStart && (
            <Tooltip title={isReadyToStart ? 'Iniciar Cobros' : 'Faltan asignar lotes'}>
              <span>
                <IconButton onClick={() => onAction(proyecto, 'start')} size="small" sx={{ color: isReadyToStart ? 'success.main' : 'text.disabled' }} disabled={!isReadyToStart}>
                  <PlayArrow fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}
          {canRevert && (
            <Tooltip title="Revertir a En Espera">
              <IconButton onClick={() => onRevert(proyecto)} size="small" sx={{ color: 'warning.main' }}><Undo fontSize="small" /></IconButton>
            </Tooltip>
          )}
        </Stack>
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

  const stats = useMemo(() => {
    const data = logic.filteredProyectos;
    const total = data.length;
    const activos = data.filter(p => p.activo).length;
    const mensuales = data.filter(p => p.tipo_inversion === 'mensual').length;
    const volumen = data.reduce((acc, p) => acc + (Number(p.monto_inversion || 0) * (p.suscripciones_actuales || 0)), 0);
    return { total, activos, mensuales, volumen };
  }, [logic.filteredProyectos]);

  const columns = useMemo<DataTableColumn<ProyectoDto>[]>(() => {
    const hoy = new Date();
    return [
      {
        id: 'proyecto',
        label: 'Proyecto',
        minWidth: 200,
        sortable: true,
        cardPrimary: true,
        render: (p) => (
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 34, height: 34, flexShrink: 0 }}>
              <ApartmentIcon fontSize="small" />
            </Avatar>
            <Box minWidth={0}>
              <Typography variant="body2" fontWeight={700} noWrap>{p.nombre_proyecto}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap>ID: {p.id}</Typography>
            </Box>
          </Stack>
        ),
      },
      {
        id: 'tipo_inversion',
        label: 'Tipo',
        align: 'center',
        sortable: true,
        hideOnMobile: true,
        render: (p) => (
          <Chip
            label={p.tipo_inversion === 'mensual' ? 'Plan Ahorro' : 'Inversión'}
            size="small"
            color={p.tipo_inversion === 'mensual' ? 'primary' : 'secondary'}
            variant="outlined"
            sx={{ fontWeight: 700, fontSize: '0.65rem', ...(p.tipo_inversion !== 'mensual' && { borderColor: 'text.secondary', color: 'text.secondary' }) }}
          />
        ),
      },
      {
        id: 'monto_inversion',
        label: 'Inversión',
        sortable: true,
        render: (p) => {
          const cuota = p.valor_cuota_referencia;
          return (
            <Stack spacing={0.2}>
              <Typography variant="body2" fontWeight={600}>
                {/* 👈 4. Aplicamos env.defaultLocale */}
                {p.moneda} {Number(p.monto_inversion).toLocaleString(env.defaultLocale)}
              </Typography>
              {p.tipo_inversion === 'mensual' && cuota && (
                <Typography variant="caption" color="success.main" fontWeight={700}>
                  {/* 👈 5. Aplicamos env.defaultLocale */}
                  {`Cuota: ${p.moneda} ${Number(cuota).toLocaleString(env.defaultLocale, { minimumFractionDigits: 2 })}`}
                </Typography>
              )}
            </Stack>
          );
        }
      },
      {
        id: 'suscripciones_actuales',
        label: 'Suscripciones',
        align: 'center',
        sortable: true,
        hideOnMobile: true,
        render: (p) => {
          if (p.tipo_inversion !== 'mensual') {
            const totalLotes = p.lotes?.length ?? 0;
            const lotesActivos = p.lotes?.filter(l => l.activo).length ?? 0;
            return (
              <Stack alignItems="center" spacing={0.3}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  {totalLotes > 0 ? `${lotesActivos} / ${totalLotes} lotes` : 'Sin lotes'}
                </Typography>
                {p.pack_de_lotes && (
                  <Chip label="Pack" size="small" color="info" variant="outlined" sx={{ fontSize: '0.6rem', height: 16 }} />
                )}
              </Stack>
            );
          }
          const isBajoMinimo = p.suscripciones_actuales < (p.suscripciones_minimas || 0);
          const isObjetivoAlcanzado = p.suscripciones_actuales >= (p.obj_suscripciones || 1);
          let color = theme.palette.warning.main;
          if (isBajoMinimo) color = theme.palette.error.main;
          if (isObjetivoAlcanzado) color = theme.palette.success.main;
          return (
            <Tooltip title={isBajoMinimo ? `Faltan ${p.suscripciones_minimas - p.suscripciones_actuales} para el mínimo` : isObjetivoAlcanzado ? '¡Objetivo logrado!' : `Meta: ${p.obj_suscripciones}`}>
              <Stack alignItems="center" spacing={0.4}>
                <Typography variant="body2" fontWeight={700} color={color}>{p.suscripciones_actuales} / {p.obj_suscripciones}</Typography>
                <Box sx={{ width: 60 }}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min((p.suscripciones_actuales / (p.obj_suscripciones || 1)) * 100, 100)}
                    sx={{ height: 4, borderRadius: 2, bgcolor: alpha(color, 0.1), '& .MuiLinearProgress-bar': { bgcolor: color } }}
                  />
                </Box>
              </Stack>
            </Tooltip>
          );
        },
      },
      {
        id: 'estado_proyecto',
        label: 'Estado',
        sortable: true,
        render: (p) => {
          const isPrelanzamiento = new Date(p.fecha_inicio) > hoy && p.estado_proyecto === 'En Espera';
          if (isPrelanzamiento) return <Chip label="PRÓXIMO" size="small" color="info" sx={{ fontWeight: 700, fontSize: '0.65rem' }} />;
          const colors: any = { 'En Espera': 'warning', 'En proceso': 'info', 'Finalizado': 'success' };
          return <Chip label={p.estado_proyecto.toUpperCase()} size="small" color={colors[p.estado_proyecto] || 'default'} sx={{ fontWeight: 700, fontSize: '0.65rem' }} />;
        },
      },
      {
        id: 'acciones',
        label: '',
        align: 'right',
        render: (p) => {
          const isMensual = p.tipo_inversion === 'mensual';
          const canStart = isMensual && p.estado_proyecto === 'En Espera';
          const isObjetivoAlcanzado = p.suscripciones_actuales >= (p.obj_suscripciones || 1);
          const hasLotes = p.lotes && p.lotes.length > 0;
          const isReadyToStart = canStart && (!p.pack_de_lotes || hasLotes);
          const canRevert = isMensual && p.estado_proyecto === 'En proceso' && !isObjetivoAlcanzado;
          return (
            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
              <Tooltip title="Imágenes">
                <IconButton onClick={(e) => { e.stopPropagation(); logic.handleAction(p, 'images', e); }} size="small" color="primary">
                  <ImageIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              {isMensual && (
                <Tooltip title="Cuotas">
                  <IconButton onClick={(e) => { e.stopPropagation(); logic.handleAction(p, 'cuotas', e); }} size="small">
                    <MonetizationOnIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {canStart && (
                <Tooltip title={!isReadyToStart ? 'Faltan lotes' : 'Iniciar Cobros'}>
                  <span>
                    <IconButton
                      onClick={(e) => { e.stopPropagation(); logic.modales.confirmDialog.confirm('start_project_process', p); }}
                      size="small"
                      disabled={!isReadyToStart}
                      sx={{ color: isReadyToStart ? 'success.main' : 'text.disabled' }}
                    >
                      <PlayArrow fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
              {canRevert && (
                <Tooltip title="Revertir">
                  <IconButton onClick={(e) => { e.stopPropagation(); logic.modales.confirmDialog.confirm('revert_project_process', p); }} size="small" sx={{ color: 'warning.main' }}>
                    <Undo fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Editar">
                <IconButton onClick={(e) => { e.stopPropagation(); logic.handleAction(p, 'edit', e); }} size="small">
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Lotes">
                <IconButton onClick={(e) => { e.stopPropagation(); logic.handleAction(p, 'lotes', e); }} size="small" color="info">
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          );
        },
      },
    ];
  }, [logic, theme]);

  return (
    <PageContainer maxWidth="xl" sx={{ py: { xs: 2, md: 3 } }}>
      <AdminPageHeader
        title="Gestión de Proyectos"
        subtitle="Catálogo de activos y estado de suscripciones."
        action={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={logic.modales.create.open}
            sx={{ fontWeight: 800, px: 3, py: 1.2, borderRadius: 2 }}
          >
            Nuevo Proyecto
          </Button>
        }
      />

      <MetricsGrid columns={{ xs: 2, sm: 2, lg: 4 }}>
        <StatCard title="Proyectos" value={stats.total} icon={<Layers />} color="primary" loading={logic.isLoading} />
        <StatCard title="Visibles" value={stats.activos} icon={<CheckCircle />} color="success" loading={logic.isLoading} />
        <StatCard title="Ahorro" value={stats.mensuales} icon={<MonetizationOnIcon />} color="info" loading={logic.isLoading} />
        {/* 👈 6. Aplicamos env.defaultLocale */}
        <StatCard title="Volumen" value={`$${stats.volumen.toLocaleString(env.defaultLocale)}`} icon={<TrendingUp />} color="warning" loading={logic.isLoading} />
      </MetricsGrid>

      <FilterBar sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 2, alignItems: { xs: 'stretch', lg: 'center' }, width: '100%' }}>
          <Box sx={{ flex: 1 }}>
            <FilterSearch placeholder="Buscar proyectos..." value={logic.searchTerm} onSearch={logic.setSearchTerm} fullWidth />
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <FilterSelect label="Tipo" value={logic.filterTipo} onChange={(e) => logic.setFilterTipo(e.target.value as any)} sx={{ minWidth: 140 }}>
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="directo">Inversión</MenuItem>
              <MenuItem value="mensual">Ahorro</MenuItem>
            </FilterSelect>
            <FilterSelect label="Estado" value={logic.filterEstado} onChange={(e) => logic.setFilterEstado(e.target.value)} sx={{ minWidth: 140 }}>
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="En Espera">En Espera</MenuItem>
              <MenuItem value="En proceso">En Proceso</MenuItem>
              <MenuItem value="Finalizado">Finalizado</MenuItem>
            </FilterSelect>
            <ViewModeToggle value={viewMode} onChange={setViewMode} options={[{ value: 'table', label: 'Tabla', icon: <ViewList /> }, { value: 'grid', label: 'Cards', icon: <GridView /> }]} />
          </Box>
        </Box>
      </FilterBar>

      <QueryHandler isLoading={logic.isLoading} error={logic.error as Error}>
        {viewMode === 'grid' ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)', xl: 'repeat(4, 1fr)' }, gap: { xs: 2, md: 3 } }}>
            {logic.filteredProyectos.map(p => (
              <ProjectCard
                key={p.id}
                proyecto={p}
                onAction={logic.handleAction}
                onRevert={(p) => logic.modales.confirmDialog.confirm('revert_project_process', p)}
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
            pagination
            defaultRowsPerPage={env.defaultPageSize} // 👈 7. Aplicamos defaultPageSize
            cardTitleColumn="proyecto"
            loading={logic.isLoading}
          />
        )}
      </QueryHandler>

      <CreateProyectoModal {...logic.modales.create.modalProps} onSubmit={logic.handleCreateSubmit} />
      {logic.selectedProject && (
        <>
          <ConfigCuotasModal open={logic.modales.cuotas.isOpen} onClose={logic.modales.cuotas.close} proyecto={logic.selectedProject} />
          <EditProyectoModal open={logic.modales.edit.isOpen} onClose={logic.modales.edit.close} proyecto={logic.selectedProject} onSubmit={logic.handleUpdateSubmit} isLoading={logic.isUpdating} />
          <DetalleProyectoModal open={logic.modales.lotes.isOpen} onClose={logic.modales.lotes.close} proyecto={logic.selectedProject} />
          <ManageImagesModal open={logic.modales.images.isOpen} onClose={logic.modales.images.close} proyecto={logic.selectedProject} />
        </>
      )}
      <ConfirmDialog controller={logic.modales.confirmDialog} onConfirm={logic.handleConfirmAction} isLoading={logic.isStarting || logic.isToggling || logic.isReverting} />
    </PageContainer>
  );
};

export default AdminProyectos;