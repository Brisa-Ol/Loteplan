import {
  Add, Apartment as ApartmentIcon, CheckCircle, Edit, GridView, Image as ImageIcon,
  Layers, MonetizationOn as MonetizationOnIcon, PlayArrow, TrendingUp, Undo,
  ViewList, Visibility as VisibilityIcon
} from '@mui/icons-material';
import {
  alpha, Avatar, Box, Button, Card, CardActions,
  CardContent,
  Chip, Divider,
  IconButton, LinearProgress, MenuItem, Stack, Switch,
  Tooltip,
  Typography, useTheme
} from '@mui/material';
import React, { memo, useMemo, useState } from 'react';

import { AdminPageHeader } from '@/shared/components/admin/Adminpageheader';
import MetricsGrid from '@/shared/components/admin/Metricsgrid';
import { ViewModeToggle, type ViewMode } from '@/shared/components/admin/Viewmodetoggle';
import { DataTable, type DataTableColumn } from '@/shared/components/data-grid/DataTable/DataTable';
import { QueryHandler } from '@/shared/components/data-grid/QueryHandler/QueryHandler';
import { StatCard } from '@/shared/components/domain/cards/StatCard/StatCard';
import { ConfirmDialog } from '@/shared/components/domain/modals/ConfirmDialog/ConfirmDialog';
import { FilterBar, FilterSearch, FilterSelect } from '@/shared/components/forms/filters/FilterBar';
import { PageContainer } from '@/shared/components/layout/containers/PageContainer/PageContainer';

import type { ProyectoDto } from '@/core/types/dto/proyecto.dto';
import { useAdminProyectos } from '../../hooks/proyecto/useAdminProyectos';

import ConfigCuotasModal from './modals/ConfigCuotasModal';
import CreateProyectoModal from './modals/CreateProyectoModal';
import EditProyectoModal from './modals/EditProyectoModal';
import ManageImagesModal from './modals/ManageImagesModal';
import ProjectLotesModal from './modals/ProjectLotesModal';

// ============================================================================
// COMPONENTE: VISTA DE CARDS
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
  // 🆕 Detectar si llegó a la meta
  const isObjetivoAlcanzado = proyecto.suscripciones_actuales >= (proyecto.obj_suscripciones || 1);
  const canStart = isMensual && proyecto.estado_proyecto === 'En Espera';
  const hasLotes = proyecto.lotes && proyecto.lotes.length > 0;
  // Si el proyecto requiere lotes, verificamos que los tenga para habilitar el inicio
  const isReadyToStart = canStart && (!proyecto.pack_de_lotes || hasLotes);
  const canRevert = isMensual && proyecto.estado_proyecto === 'En proceso' && !isObjetivoAlcanzado;

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
      {/* ⚠️ ESTA ES LA PARTE QUE FALTABA EN TU CÓDIGO */}
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Stack direction="row" spacing={2} alignItems="center" flex={1}>
            <Avatar
              variant="rounded"
              sx={{
                bgcolor: alpha(isBajoMinimo ? theme.palette.error.main : theme.palette.primary.main, 0.1),
                color: isBajoMinimo ? 'error.main' : 'primary.main',
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
          <Switch checked={proyecto.activo} onChange={() => onToggle(proyecto)} size="small" color="success" disabled={isToggling} />
        </Stack>

        <Stack direction="row" spacing={1} mb={2}>
          <Chip label={isMensual ? 'Ahorro' : 'Directo'} size="small" color={isMensual ? 'primary' : 'default'} sx={{ fontWeight: 700 }} />
          <Chip label={`${proyecto.moneda} ${Number(proyecto.monto_inversion).toLocaleString()}`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
        </Stack>

        <Box mb={2}>
          <Stack direction="row" justifyContent="space-between" mb={0.5}>
            <Typography variant="caption" fontWeight={700} color={isBajoMinimo ? "error.main" : isObjetivoAlcanzado ? "success.main" : "text.primary"}>
              {proyecto.suscripciones_actuales} / {proyecto.obj_suscripciones} Susc.
            </Typography>
            {isBajoMinimo && (
              <Typography variant="caption" color="error.main" fontWeight={800}>
                ⚠️ RIESGO (MIN: {proyecto.suscripciones_minimas})
              </Typography>
            )}
            {/* 🆕 AVISO PARA EL ADMIN */}
            {isObjetivoAlcanzado && !isBajoMinimo && (
              <Typography variant="caption" color="success.main" fontWeight={900}>
                🎉 ¡OBJETIVO LOGRADO!
              </Typography>
            )}
          </Stack>
          <LinearProgress
            variant="determinate"
            value={Math.min((proyecto.suscripciones_actuales / (proyecto.obj_suscripciones || 1)) * 100, 100)}
            sx={{
              height: 6, borderRadius: 3,
              bgcolor: alpha(isBajoMinimo ? theme.palette.error.main : theme.palette.primary.main, 0.1),
              '& .MuiLinearProgress-bar': {
                bgcolor: isBajoMinimo ? 'error.main' : isObjetivoAlcanzado ? 'success.main' : 'primary.main'
              }
            }}
          />
        </Box>
      </CardContent>
      {/* FIN DE LA PARTE RESTAURADA */}

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
            <Tooltip title={isReadyToStart ? "Iniciar Cobros" : "Faltan asignar lotes para iniciar"}>
              <span> {/* Span necesario para Tooltip en botones deshabilitados */}
                <IconButton
                  onClick={() => onAction(proyecto, 'start')}
                  size="small"
                  sx={{ color: isReadyToStart ? 'success.main' : 'text.disabled' }}
                  disabled={!isReadyToStart}
                >
                  <PlayArrow fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}
          {canRevert && <Tooltip title="Pausar / Revertir a Espera"><IconButton onClick={() => onRevert(proyecto)} size="small" sx={{ color: 'warning.main' }}><Undo fontSize="small" /></IconButton></Tooltip>}
        </Stack>
      </CardActions>
    </Card>
  );
});

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

    const volumen = data.reduce((acc, p) =>
      acc + (Number(p.monto_inversion || 0) * (p.suscripciones_actuales || 0)), 0
    );

    return { total, activos, mensuales, volumen };
  }, [logic.filteredProyectos]);

  // Dentro de AdminProyectos.tsx
  const columns = useMemo<DataTableColumn<ProyectoDto>[]>(() => {
    const hoy = new Date();

    return [
      {
        id: 'proyecto',
        label: 'Proyecto',
        minWidth: 200,
        render: (p) => (
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 36, height: 36 }}>
              <ApartmentIcon fontSize="small" />
            </Avatar>
            <Box minWidth={0}>
              <Typography variant="body2" fontWeight={700} noWrap>{p.nombre_proyecto}</Typography>
              <Typography variant="caption" color="text.secondary">ID: {p.id}</Typography>
            </Box>
          </Stack>
        ),
      },
      {
        id: 'suscriptores',
        label: 'Suscriptores',
        align: 'center',
        render: (p) => {
          const isBajoMinimo = p.suscripciones_actuales < (p.suscripciones_minimas || 0);
          const isObjetivoAlcanzado = p.suscripciones_actuales >= (p.obj_suscripciones || 1);

          let color = theme.palette.warning.main;
          if (isBajoMinimo) color = theme.palette.error.main;
          if (isObjetivoAlcanzado) color = theme.palette.success.main;

          return (
            <Tooltip title={isBajoMinimo ? `Faltan ${p.suscripciones_minimas - p.suscripciones_actuales} para el mínimo` : isObjetivoAlcanzado ? '¡Objetivo logrado!' : `Meta: ${p.obj_suscripciones}`}>
              <Stack alignItems="center" spacing={0.5}>
                <Typography variant="body2" fontWeight={700} color={color}>
                  {p.suscripciones_actuales} / {p.obj_suscripciones}
                </Typography>
                <Box sx={{ width: '60px' }}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min((p.suscripciones_actuales / (p.obj_suscripciones || 1)) * 100, 100)}
                    sx={{ height: 4, borderRadius: 2, bgcolor: alpha(color, 0.1), '& .MuiLinearProgress-bar': { bgcolor: color } }}
                  />
                </Box>
                {isBajoMinimo && <Typography variant="caption" color="error.main" sx={{ fontSize: '0.6rem', fontWeight: 800 }}>RIESGO</Typography>}
                {isObjetivoAlcanzado && !isBajoMinimo && <Typography variant="caption" color="success.main" sx={{ fontSize: '0.6rem', fontWeight: 800 }}>LLENO</Typography>}
              </Stack>
            </Tooltip>
          );
        }
      },
      { id: 'finanzas', label: 'Inversión', render: (p) => <Typography variant="body2" fontWeight={600}>{p.moneda} {Number(p.monto_inversion).toLocaleString()}</Typography> },
      {
        id: 'estado', label: 'Estado', render: (p) => {
          const isPrelanzamiento = new Date(p.fecha_inicio) > hoy && p.estado_proyecto === 'En Espera';

          if (isPrelanzamiento) {
            return <Chip label="PRÓXIMAMENTE" size="small" color="info" sx={{ fontWeight: 700, fontSize: '0.65rem' }} />;
          }

          const colors: any = { 'En Espera': 'warning', 'En proceso': 'info', 'Finalizado': 'success' };
          return <Chip label={p.estado_proyecto.toUpperCase()} size="small" color={colors[p.estado_proyecto] || 'default'} sx={{ fontWeight: 700, fontSize: '0.65rem' }} />;
        }
      },
      {
        id: 'visibilidad', label: 'Visibilidad', align: 'center',
        render: (p) => (
          <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
            <Switch checked={p.activo} onChange={(e) => { e.stopPropagation(); logic.modales.confirmDialog.confirm('toggle_project_visibility', p); }} size="small" color="success" disabled={logic.isToggling} />
          </Stack>
        ),
      },
      {
        id: 'acciones', label: 'Acciones', align: 'right',
        render: (p) => {
          const isMensual = p.tipo_inversion === 'mensual';
          const canStart = isMensual && p.estado_proyecto === 'En Espera';
          const isObjetivoAlcanzado = p.suscripciones_actuales >= (p.obj_suscripciones || 1);

          // Validación de seguridad para arrancar
          const hasLotes = p.lotes && p.lotes.length > 0;
          const isReadyToStart = canStart && (!p.pack_de_lotes || hasLotes);
          const canRevert = isMensual && p.estado_proyecto === 'En proceso' && !isObjetivoAlcanzado;
          return (
            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
              <Tooltip title="Imágenes"><IconButton onClick={(e) => logic.handleAction(p, 'images', e)} size="small" color="primary"><ImageIcon fontSize="small" /></IconButton></Tooltip>
              {isMensual && <Tooltip title="Configurar Cuotas"><IconButton onClick={(e) => logic.handleAction(p, 'cuotas', e)} size="small"><MonetizationOnIcon fontSize="small" /></IconButton></Tooltip>}

              {/* BOTÓN DE INICIAR COBROS */}
              {canStart && (
                <Tooltip title={!isReadyToStart ? "Faltan lotes" : isObjetivoAlcanzado ? "¡Proyecto Lleno! Iniciar cobros" : "Iniciar Cobros (Aún hay cupos)"}>
                  <span>
                    <IconButton
                      onClick={(e) => { e.stopPropagation(); logic.modales.confirmDialog.confirm('start_project_process', p); }}
                      size="small"
                      sx={{
                        color: isReadyToStart ? 'success.main' : 'text.disabled',
                        // Si ya se llenó, el botón "pulsa" para llamar la atención del admin
                        ...(isObjetivoAlcanzado && isReadyToStart && {
                          animation: 'pulse 2s infinite',
                          '@keyframes pulse': {
                            '0%': { boxShadow: `0 0 0 0 ${alpha(theme.palette.success.main, 0.4)}` },
                            '70%': { boxShadow: `0 0 0 6px transparent` },
                            '100%': { boxShadow: `0 0 0 0 transparent` }
                          }
                        })
                      }}
                      disabled={!isReadyToStart}
                    >
                      <PlayArrow fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              )}

              {/* 🆕 Usamos la nueva variable canRevert */}
              {canRevert && (
                <Tooltip title="Pausar proyecto y Revertir a Espera">
                  <IconButton onClick={(e) => { e.stopPropagation(); logic.modales.confirmDialog.confirm('revert_project_process', p); }} size="small" sx={{ color: 'warning.main' }}>
                    <Undo fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Editar"><IconButton onClick={(e) => logic.handleAction(p, 'edit', e)} size="small"><Edit fontSize="small" /></IconButton></Tooltip>
              <Tooltip title="Lotes"><IconButton onClick={(e) => logic.handleAction(p, 'lotes', e)} size="small" color="info"><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
            </Stack>
          );
        }
      },
    ];
  }, [logic, theme]);

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      <AdminPageHeader title="Gestión de Proyectos" subtitle="Catálogo y suscripciones" action={<Button variant="contained" startIcon={<Add />} onClick={logic.modales.create.open}>Nuevo Proyecto</Button>} />

      <MetricsGrid columns={{ xs: 1, sm: 2, lg: 4 }}>
        <StatCard title="Total de Proyectos" value={stats.total} icon={<Layers />} color="primary" loading={logic.isLoading} />
        <StatCard title="Proyectos Visibles" value={stats.activos} icon={<CheckCircle />} color="success" loading={logic.isLoading} />
        <StatCard title="Ahorro" value={stats.mensuales} icon={<MonetizationOnIcon />} color="info" loading={logic.isLoading} />
        <StatCard title="Inversion" value={`$${stats.volumen.toLocaleString('es-AR')}`} icon={<TrendingUp />} color="warning" loading={logic.isLoading} />
      </MetricsGrid>

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} mb={3} alignItems="center">
        <FilterBar sx={{ flex: 1, gap: 2, display: 'flex', alignItems: 'center' }}>
          <FilterSearch placeholder="Buscar..." value={logic.searchTerm} onSearch={logic.setSearchTerm} sx={{ minWidth: 300 }} />

          <FilterSelect label="Inversión" value={logic.filterTipo} onChange={(e) => logic.setFilterTipo(e.target.value as any)}>
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="directo">Directo</MenuItem>
            <MenuItem value="mensual">Ahorro</MenuItem>
          </FilterSelect>
          <FilterSelect label="Estado" value={logic.filterEstado} onChange={(e) => logic.setFilterEstado(e.target.value)}>
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="En Espera">En Espera</MenuItem>
            <MenuItem value="En proceso">En Proceso</MenuItem>
          </FilterSelect>
        </FilterBar>
        <ViewModeToggle value={viewMode} onChange={setViewMode} options={[{ value: 'table', label: 'Tabla', icon: <ViewList /> }, { value: 'grid', label: 'Cards', icon: <GridView /> }]} />
      </Stack>

      <QueryHandler isLoading={logic.isLoading} error={logic.error as Error}>
        {viewMode === 'grid' ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 3 }}>
            {logic.filteredProyectos.map(p => (
              <ProjectCard key={p.id} proyecto={p} onAction={logic.handleAction} onRevert={(p) => logic.modales.confirmDialog.confirm('revert_project_process', p)} onToggle={(p) => logic.modales.confirmDialog.confirm('toggle_project_visibility', p)} isToggling={logic.isToggling} />
            ))}
          </Box>
        ) : (
          <DataTable columns={columns} data={logic.filteredProyectos} getRowKey={(p) => p.id} isRowActive={(p) => p.activo} highlightedRowId={logic.highlightedId} pagination />
        )}
      </QueryHandler>

      {/* MODALES */}
      <CreateProyectoModal {...logic.modales.create.modalProps} onSubmit={logic.handleCreateSubmit} />
      {logic.selectedProject && (
        <>
          <ConfigCuotasModal open={logic.modales.cuotas.isOpen} onClose={logic.modales.cuotas.close} proyecto={logic.selectedProject} />
          <EditProyectoModal open={logic.modales.edit.isOpen} onClose={logic.modales.edit.close} proyecto={logic.selectedProject} onSubmit={logic.handleUpdateSubmit} isLoading={logic.isUpdating} />
          <ProjectLotesModal open={logic.modales.lotes.isOpen} onClose={logic.modales.lotes.close} proyecto={logic.selectedProject} />
          <ManageImagesModal open={logic.modales.images.isOpen} onClose={logic.modales.images.close} proyecto={logic.selectedProject} />
        </>
      )}
      <ConfirmDialog controller={logic.modales.confirmDialog} onConfirm={logic.handleConfirmAction} isLoading={logic.isStarting || logic.isToggling || logic.isReverting} />
    </PageContainer>
  );
};

export default AdminProyectos;