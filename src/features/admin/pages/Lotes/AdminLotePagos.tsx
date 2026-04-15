// src/features/admin/pages/Cobranzas/AdminLotePagos.tsx

import {
  AssignmentInd,
  AttachMoney, 
  Block, 
  CancelScheduleSend, 
  CheckCircle,
  Dashboard as DashboardIcon,
  ErrorOutline,
  History as HistoryIcon,
  Image as ImageIcon,
  ListAlt as ListIcon,
  MailOutline,
  Person, 
  Phone,
  Timeline,
  TrendingUp
} from '@mui/icons-material';
import {
  Avatar, Box, Card, CardContent, Chip,
  IconButton, Paper, Stack, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow,
  Tabs,
  Tooltip, Typography, alpha, useTheme
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
        return (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
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
            {/* PESTAÑA 0: DASHBOARD */}
            <Box sx={{ height: 320, mb: 5 }}>
              <RiskDistributionChart data={logic.analytics.chartData} theme={theme} />
            </Box>

            {/* Nueva tabla Top 3 debajo del gráfico */}
            <Box sx={{ mb: 5 }}>
              <Top3PostoresTable
                lotes={logic.lotesPendientesTotal}
                pujasPorLote={logic.pujasPorLote}
                theme={theme}
              />
            </Box>
          </Box>
        ) : (
          <>
            {/* PESTAÑA 1: COBROS Y SEGUIMIENTOS */}
            <DataTable
              columns={columnsCobros}
              data={logic.lotesPendientesTotal}
              getRowKey={row => row.id}
              showInactiveToggle={false}
              pagination
            />
          </>
        )}
      </QueryHandler>

      <ConfirmDialog controller={logic.modales.confirm} onConfirm={logic.handleConfirmAction} isLoading={logic.isMutating} />
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
  // Estados para la paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Cálculo de los lotes visibles
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
                        if (!puja || !puja.usuario) {
                          return (
                            <TableCell key={index} sx={{ borderRight: index !== 2 ? '1px solid' : 'none', borderColor: 'divider', bgcolor: alpha(theme.palette.action.disabledBackground, 0.02) }}>
                              <Typography variant="caption" color="text.disabled" fontStyle="italic">Sin postor</Typography>
                            </TableCell>
                          );
                        }

                        const u = puja.usuario;
                        const estadoColor = puja.estado_puja.includes('ganadora') ? 'warning' : 'default';

                        return (
                          <TableCell key={puja.id} sx={{ borderRight: index !== 2 ? '1px solid' : 'none', borderColor: 'divider' }}>
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

        {/* CONTROL DE PAGINACIÓN */}
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