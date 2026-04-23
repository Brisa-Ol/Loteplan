// src/features/admin/pages/Cobranzas/AdminLotePagos.tsx

import {
  AttachMoney,
  Block,
  CancelScheduleSend,
  Dashboard as DashboardIcon,
  ErrorOutline,
  History as HistoryIcon,
  Image as ImageIcon,
  ListAlt as ListIcon,
  MailOutline,
  Person,
  Timeline,
  TrendingUp,
  WarningAmber
} from '@mui/icons-material';
import {
  Avatar, Box,
  Button,
  Card, CardContent, Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton, // <-- Importados
  MenuItem,
  Paper, Stack, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow,
  Tabs, Tooltip, Typography, alpha, useTheme
} from '@mui/material';
import React, { useMemo, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis, YAxis
} from 'recharts';

import imagenService from '@/core/api/services/imagen.service';
import { env } from '@/core/config/env';
import type { LoteDto } from '@/core/types/lote.dto';
import type { PujaDto } from '@/core/types/puja.dto';

import { FilterBar, FilterSearch, FilterSelect } from '@/shared';
import { AdminPageHeader } from '@/shared/components/admin/Adminpageheader';
import { DataTable, type DataTableColumn } from '@/shared/components/data-grid/DataTable';
import { QueryHandler } from '@/shared/components/data-grid/QueryHandler';
import { StatCard, StatusBadge } from '@/shared/components/domain/cards/StatCard';
import { ConfirmDialog } from '@/shared/components/domain/modals/ConfirmDialog';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { useAdminLotePagos } from '../../hooks/lotes/useAdminLotePagos';

// ============================================================================
// HELPERS
// ============================================================================
const checkIsPaid = (lote: LoteDto) => lote.pujaMasAlta?.estado_puja === 'ganadora_pagada';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const AdminLotePagos: React.FC = () => {
  const logic = useAdminLotePagos();
  const theme = useTheme();
  const [tabIndex, setTabIndex] = useState(0);

  // ============================================================================
  // ESTADOS PARA FILTROS
  // ============================================================================
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // ============================================================================
  // LÓGICA DE FILTRADO
  // ============================================================================
  const filteredLotes = useMemo(() => {
    if (!logic.lotesPendientesTotal) return [];

    return logic.lotesPendientesTotal.filter((l) => {
      const pujaPrincipal = logic.pujasPorLote?.[l.id]?.[0];

      // 1. FILTRO POR TEXTO (Buscador blindado contra nulos)
      const term = (typeof searchTerm === 'string' ? searchTerm : '').toLowerCase();
      const loteName = (l.nombre_lote || '').toLowerCase();
      const ganador = l.ganador || pujaPrincipal?.usuario;
      const userName = ganador ? `${ganador.nombre} ${ganador.apellido}`.toLowerCase() : '';
      const userAlias = (ganador?.nombre_usuario || '').toLowerCase();

      const matchesSearch = !term || loteName.includes(term) || userName.includes(term) || userAlias.includes(term);

      // 2. FILTRO POR ESTADO (Simplificado: Pagado vs No Pagado)
      let matchesStatus = true;
      if (filterStatus !== 'all') {
        // Usamos tu propia función checkIsPaid o verificamos directamente la puja
        const isPagado = checkIsPaid(l) || pujaPrincipal?.estado_puja === 'ganadora_pagada';

        if (filterStatus === 'pagado') {
          matchesStatus = isPagado;
        } else if (filterStatus === 'no_pagado') {
          matchesStatus = !isPagado; // Si no está pagado, es mora, pendiente, incumplimiento, etc.
        }
      }

      return matchesSearch && matchesStatus;
    });
  }, [logic.lotesPendientesTotal, logic.pujasPorLote, searchTerm, filterStatus]);


  const columnsCobros = useMemo<DataTableColumn<LoteDto>[]>(() => [
    {
      id: 'lote',
      label: 'Referencia',
      minWidth: 200,
      render: (l) => (
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            src={l.imagenes?.[0] ? imagenService.resolveImageUrl(l.imagenes[0].url) : undefined}
            variant="rounded"
            sx={{ width: 36, height: 36, border: `1px solid ${theme.palette.divider}` }}
          >
            <ImageIcon sx={{ fontSize: 18 }} />
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={700}>{l.nombre_lote}</Typography>
            <Typography variant="caption" color="text.disabled">ID: {l.id}</Typography>
          </Box>
        </Stack>
      )
    },
    {
      id: 'ganador',
      label: 'Deudor adjudicado',
      minWidth: 260,
      render: (l) => {
        const g = l.ganador;
        const alias = g?.nombre_usuario ? `@${g.nombre_usuario}` : g ? `${g.nombre} ${g.apellido}` : `ID #${l.id_ganador}`;

        return (
          <Stack spacing={0.5}>
            <Typography variant="body2" fontWeight={800} color="text.primary">{alias}</Typography>
            <Stack spacing={0.2}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 600 }}>
                <Person sx={{ fontSize: 12 }} /> {g ? `${g.nombre} ${g.apellido}` : 'Adjudicado'}
              </Typography>
              {g?.email && (
                <Typography variant="caption" color="text.disabled" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <MailOutline sx={{ fontSize: 12, mr: 0.5 }} /> {g.email}
                </Typography>
              )}
            </Stack>
          </Stack>
        );
      }
    },
    {
      id: 'plazo',
      label: 'Vencimiento',
      render: (l) => {
        if (checkIsPaid(l)) return <Typography variant="caption" fontWeight={900} color="success.main">PAGO RECIBIDO</Typography>;

        if (!l.fecha_fin) return '-';
        const fechaLimite = new Date(new Date(l.fecha_fin).getTime() + (90 * 24 * 60 * 60 * 1000));
        const hoy = new Date();
        const dias = Math.ceil((fechaLimite.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        return (
          <Box>
            <Typography variant="body2" fontWeight={700}>{fechaLimite.toLocaleDateString(env.defaultLocale)}</Typography>
            <Typography variant="caption" color={dias < 10 ? 'error.main' : 'success.main'} sx={{ fontWeight: 800 }}>
              {dias > 0 ? `${dias} días` : 'VENCIDO'}
            </Typography>
          </Box>
        );
      }
    },
    {
      id: 'estado',
      label: 'Situación',
      render: (l) => {
        if (checkIsPaid(l)) return <StatusBadge status="completed" customLabel="PAGADO" />;

        const intentos = l.intentos_fallidos_pago || 0;
        if (intentos >= 3) return <StatusBadge status="failed" customLabel="SANCIONABLE" />;
        if (intentos > 0) return <StatusBadge status="warning" customLabel={`${intentos}/3 FALLOS`} />;
        return (
          <Chip
            label="Pendiente"
            size="small"
            sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main', fontWeight: 800, borderRadius: 1 }}
          />
        );
      }
    },
    {
      id: 'monto',
      label: 'Monto Final',
      align: 'right',
      render: (l) => (
        <Box textAlign="right">
          <Typography variant="body2" fontWeight={900} sx={{ fontFamily: 'monospace', color: checkIsPaid(l) ? 'success.main' : 'primary.dark' }}>
            ${Number(l.monto_ganador_lote || l.precio_base).toLocaleString(env.defaultLocale)}
          </Typography>
        </Box>
      )
    },
    {
      id: 'acciones',
      label: '',
      align: 'right',
      render: (l) => {
        const isPaid = checkIsPaid(l);
        // ✅ VARIABLES DECLARADAS CORRECTAMENTE
        const pujaGanadora = logic.pujasPorLote[l.id]?.[0];
        const solicitaCancelacion = pujaGanadora?.solicitud_cancelacion;

        return (
          <Stack direction="row" spacing={1} justifyContent="flex-end">

            {/* NUEVO: Alerta de cancelación */}
            {solicitaCancelacion && !isPaid && (
              <Tooltip title="Evaluar solicitud de baja">
                <IconButton
                  size="small"
                  sx={{ color: 'warning.main', bgcolor: alpha(theme.palette.warning.main, 0.1) }}
                  onClick={() => logic.handleOpenCancelModal(pujaGanadora, l)}
                >
                  <WarningAmber fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {isPaid ? (
              <Tooltip title="Ver detalles de pago">
                <IconButton size="small" sx={{ color: 'success.main', bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                  <HistoryIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title={l.intentos_fallidos_pago >= 3 ? 'Liberar Lote' : 'Añadir Fallo'}>
                <IconButton
                  size="small"
                  sx={{ color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.05) }}
                  onClick={() => logic.handleForceFinish?.(l)}
                >
                  {l.intentos_fallidos_pago >= 3 ? <Block fontSize="small" /> : <CancelScheduleSend fontSize="small" />}
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        );
      }
    }
  ], [theme, logic]);

  return (
    <PageContainer maxWidth="xl" sx={{ py: 4, bgcolor: 'background.default' }}>
      <AdminPageHeader
        title="Pagos y seguimiento de subastas"
        subtitle="Seguimiento de adjudicaciones, riesgo de cartera y plazos de pago."
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 5 }}>
        <StatCard title="Lotes en Mora" value={logic.analytics.totalPendientes} icon={<Timeline />} color="warning" loading={logic.isLoading} />
        <StatCard title="Riesgo Crítico" value={logic.analytics.cantidadCritica} icon={<ErrorOutline />} color="error" loading={logic.isLoading} />
        <StatCard
          title="Capital en Riesgo"
          value={`$${logic.analytics.capitalEnRiesgo.toLocaleString(env.defaultLocale, { notation: 'compact' })}`}
          icon={<AttachMoney />}
          color="info"
          loading={logic.isLoading}
        />
      </Box>

      <Stack direction="row" justifyContent="space-between" mb={4}>
        <Paper elevation={0} sx={{ p: 0.5, bgcolor: 'secondary.main', borderRadius: 2 }}>
          <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)}>
            <Tab label="Dashboard" icon={<DashboardIcon sx={{ fontSize: 18 }} />} iconPosition="start" sx={{ fontWeight: 700 }} />
            <Tab label="Cobros y Seguimiento" icon={<ListIcon sx={{ fontSize: 18 }} />} iconPosition="start" sx={{ fontWeight: 700 }} />
          </Tabs>
        </Paper>
      </Stack>

      <QueryHandler isLoading={logic.isLoading} error={logic.error as Error}>
        {tabIndex === 0 ? (
          <Box>
            <Box sx={{ height: 320, mb: 5 }}>
              <RiskDistributionChart data={logic.analytics.chartData} theme={theme} />
            </Box>
            <Box sx={{ mb: 5 }}>
              <Top3PostoresTable lotes={logic.lotesPendientesTotal} pujasPorLote={logic.pujasPorLote} theme={theme} />
            </Box>
          </Box>
        ) : (
          <Box>
            {/* ============================================================================ */}
            {/* BARRA DE FILTROS RESPONSIVE */}
            {/* ============================================================================ */}
            <FilterBar sx={{ mb: 3, p: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 2, alignItems: { xs: 'stretch', lg: 'center' }, width: '100%' }}>

                {/* Buscador */}
                <Box sx={{ flex: 1, minWidth: { xs: '100%', lg: 300 } }}>
                  <FilterSearch
                    placeholder="Buscar por Lote o Adjudicado..."
                    value={searchTerm}

                    onChange={(e: any) => {
                      const val = typeof e === 'string' ? e : e?.target?.value ?? '';
                      setSearchTerm(val);
                    }}
                  />
                </Box>
                {/* Selector de Estado */}
                <Box sx={{ display: 'flex', gap: 1.5, width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'center', lg: 'flex-end' } }}>
                  <FilterSelect
                    label="Estado del Pago"
                    value={filterStatus}
                    onChange={(e: any) => setFilterStatus(e.target.value)}
                    sx={{ flex: 1, minWidth: 240 }}
                  >
                    <MenuItem value="all">
                      <strong>Todos los Estados</strong>
                    </MenuItem>
                    <MenuItem value="pagado">Pagado</MenuItem>
                    <MenuItem value="no_pagado">No Pagado</MenuItem>
                  </FilterSelect>
                </Box>

              </Box>
            </FilterBar>

            {/* TABLA USANDO LOS DATOS FILTRADOS */}
            <DataTable
              columns={columnsCobros}
              data={filteredLotes} // <-- Usamos el array filtrado aquí
              getRowKey={row => row.id}
              showInactiveToggle={false}
              pagination
            />
          </Box>
        )}
      </QueryHandler>
      <ConfirmDialog controller={logic.modales.confirm} onConfirm={logic.handleConfirmAction} isLoading={logic.isMutating} />

      {/* ✅ NUEVO MODAL: LECTURA Y APROBACIÓN DE BAJA */}
      {logic.modales?.cancelRequest && (
        <Dialog open={logic.modales.cancelRequest.isOpen} onClose={logic.handleCloseCancelModal} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ color: 'warning.main', display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningAmber /> Solicitud de Baja de Puja
          </DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2" mb={2}>
              El usuario <strong>{logic.modales.cancelRequest.data?.usuario?.nombre} {logic.modales.cancelRequest.data?.usuario?.apellido}</strong> ha solicitado cancelar su adjudicación para el lote <strong>{logic.modales.cancelRequest.lote?.nombre_lote}</strong>.
            </Typography>

            <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.warning.main, 0.05), borderColor: 'warning.light' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                MOTIVO INDICADO POR EL USUARIO:
              </Typography>
              <Typography variant="body1" sx={{ mt: 1, fontStyle: 'italic', fontWeight: 500, color: 'text.primary' }}>
                "{logic.modales.cancelRequest.data?.motivo || 'No especificó ningún motivo.'}"
              </Typography>
            </Paper>

            <Typography variant="body2" color="error.main" sx={{ mt: 2, fontWeight: 600 }}>
              Al aprobar esta baja, se cancelará la puja actual y el lote avanzará automáticamente al siguiente postor.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={logic.handleCloseCancelModal} color="inherit" disabled={logic.isMutating}>
              Cerrar
            </Button>
            <Button
              onClick={() => logic.aprobarCancelacion(logic.modales.cancelRequest.data?.id)}
              color="warning"
              variant="contained"
              disabled={logic.isMutating}
            >
              Aprobar Baja
            </Button>
          </DialogActions>
        </Dialog>
      )}

    </PageContainer>
  );
};

// ============================================================================
// GRÁFICO 
// ============================================================================

const RiskDistributionChart = React.memo<{ data: any[]; theme: any }>(({ data, theme }) => {
  const orangePalette = [theme.palette.primary.light, theme.palette.primary.main, theme.palette.primary.dark];
  return (
    <Card variant="outlined" sx={{ height: '100%', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h6" color="text.primary" fontWeight={700}>Distribución de Riesgo</Typography>
            <Typography variant="caption" color="text.secondary">Nivel de mora actual</Typography>
          </Box>
          <Chip icon={<TrendingUp />} label="Actualizado" size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
        </Stack>
        <Box flex={1} minHeight={220}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.secondary.dark} strokeOpacity={0.8} />
              <XAxis dataKey="name" axisLine={false} tick={{ fontSize: 11, fill: theme.palette.text.secondary, fontWeight: 600 }} />
              <YAxis axisLine={false} tick={{ fontSize: 11, fill: theme.palette.text.secondary }} allowDecimals={false} />
              <RechartsTooltip cursor={{ fill: alpha(theme.palette.primary.main, 0.05) }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={45}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={orangePalette[index % orangePalette.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
});

// ============================================================================
// TABLA TOP 3 POSTORES (CON PAGINACIÓN)
// ============================================================================

const Top3PostoresTable = React.memo<{
  lotes: LoteDto[];
  pujasPorLote: Record<number, PujaDto[]>;
  theme: any
}>(({ lotes, pujasPorLote, theme }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const visibleLotes = useMemo(() => {
    return lotes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [lotes, page, rowsPerPage]);

  return (
    <Card variant="outlined" sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" color="text.primary" fontWeight={700}>Top 3 Postores</Typography>
            <Typography variant="caption" color="text.secondary">Información de contacto en caso de incumplimiento del ganador principal</Typography>
          </Box>
          <Chip icon={<Person />} label="Directorio de Contacto" size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
        </Box>

        <TableContainer sx={{ maxHeight: 500 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, bgcolor: 'background.paper', zIndex: 2 }}>
                  Lote / Proyecto
                </TableCell>
                <TableCell sx={{ fontWeight: 800, bgcolor: 'background.paper', color: 'success.main', borderBottom: `2px solid ${theme.palette.success.main}`, zIndex: 2 }}>
                  1º Puesto (Adjudicado)
                </TableCell>
                <TableCell sx={{ fontWeight: 800, bgcolor: 'background.paper', color: 'warning.main', borderBottom: `2px solid ${theme.palette.warning.main}`, zIndex: 2 }}>
                  2º Puesto (Reserva 1)
                </TableCell>
                <TableCell sx={{ fontWeight: 800, bgcolor: 'background.paper', color: 'info.main', borderBottom: `2px solid ${theme.palette.info.main}`, zIndex: 2 }}>
                  3º Puesto (Reserva 2)
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {lotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    <Typography variant="caption" color="text.secondary">No hay lotes en mora para mostrar</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                visibleLotes.map((lote) => {
                  const pujas = pujasPorLote[lote.id] || [];
                  const top3 = [pujas[0], pujas[1], pujas[2]];
                  const nombreProyecto = lote.proyecto?.nombre_proyecto || (pujas[0] as any)?.lote?.proyectoLote?.nombre_proyecto;

                  return (
                    <TableRow key={lote.id} hover>
                      <TableCell sx={{ borderRight: '1px solid', borderColor: 'divider', verticalAlign: 'top', pt: 1.5, minWidth: 180 }}>
                        <Typography variant="body2" fontWeight={800}>{lote.nombre_lote}</Typography>
                        <Typography variant="caption" color="text.disabled" display="block">ID: {lote.id}</Typography>
                        {nombreProyecto && (
                          <Chip
                            label={nombreProyecto}
                            size="small"
                            variant="outlined"
                            sx={{ mt: 1, fontSize: '0.65rem', height: 20, fontWeight: 700, bgcolor: alpha(theme.palette.primary.main, 0.05) }}
                          />
                        )}
                      </TableCell>

                      {top3.map((puja, index) => {
                        // SOLUCIÓN: Creamos una key combinada que SIEMPRE será única en todo el DOM
                        const cellKey = `cell-${lote.id}-${puja?.id || `empty-${index}`}`;

                        if (!puja || !puja.usuario) {
                          return (
                            <TableCell key={cellKey} sx={{ borderRight: index !== 2 ? '1px solid' : 'none', borderColor: 'divider', bgcolor: alpha(theme.palette.action.disabledBackground, 0.02) }}>
                              <Typography variant="caption" color="text.disabled" fontStyle="italic">Sin postor</Typography>
                            </TableCell>
                          );
                        }

                        const u = puja.usuario;
                        const estadoColor = puja.estado_puja.includes('ganadora') ? 'warning' : 'default';

                        return (
                          <TableCell key={cellKey} sx={{ borderRight: index !== 2 ? '1px solid' : 'none', borderColor: 'divider' }}>
                            <Box display="flex" flexDirection="column" gap={0.5} py={0.5}>
                              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                                <Typography variant="body2" fontWeight={700} color="text.primary" noWrap sx={{ maxWidth: 120 }}>
                                  {u.nombre} {u.apellido}
                                </Typography>
                                <Chip
                                  label={puja.estado_puja.replace('_', ' ').toUpperCase()}
                                  size="small"
                                  color={estadoColor as any}
                                  sx={{ fontSize: '0.55rem', height: 16, fontWeight: 800 }}
                                />
                              </Stack>
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <MailOutline sx={{ fontSize: 12, color: 'text.secondary' }} />
                                <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 150 }}>
                                  {u.email}
                                </Typography>
                              </Box>
                              <Stack direction="row" justifyContent="space-between" alignItems="center" mt={0.5} sx={{ borderTop: '1px dashed', borderColor: 'divider', pt: 0.5 }}>
                                <Typography variant="caption" fontWeight={800} color="primary.main">
                                  ${Number(puja.monto_puja).toLocaleString('es-AR')}
                                </Typography>
                                <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>
                                  {new Date(puja.fecha_puja).toLocaleDateString()}
                                </Typography>
                              </Stack>
                            </Box>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={lotes.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          sx={{ borderTop: '1px solid', borderColor: 'divider' }}
        />
      </CardContent>
    </Card>
  );
});

export default AdminLotePagos;