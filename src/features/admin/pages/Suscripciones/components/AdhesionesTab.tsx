// src/features/admin/pages/Suscripciones/components/AdhesionesTab.tsx

import type { AdhesionDto, PagoAdhesionDto } from '@/core/types/adhesion.dto';
import { 
  useAdminAdhesiones, 
  type AdhesionEstadoFilter, 
  type AdhesionPlanFilter 
} from '@/features/admin/hooks/finanzas/useAdminAdhesiones';
import {
  ConfirmDialog,
  FilterBar,
  FilterSearch,
  FilterSelect,
  QueryHandler,
  StatCard,
} from '@/shared';
import {
  AccountBalance,
  Cancel,
  CheckCircle,
  ExpandLess,
  ExpandMore,
  HourglassEmpty,
  MoneyOff,
  PriorityHigh,
  Schedule,
  Warning,
} from '@mui/icons-material';
import {
  alpha,
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useState, useMemo } from 'react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ESTADO_ADHESION_CONFIG: Record<string, { label: string; color: 'default' | 'info' | 'warning' | 'success' | 'error' }> = {
  pendiente:   { label: 'Pendiente',   color: 'info' },
  en_curso:    { label: 'En Curso',    color: 'warning' },
  completada:  { label: 'Completada',  color: 'success' },
  cancelada:   { label: 'Cancelada',   color: 'default' },
};

const ESTADO_CUOTA_CONFIG: Record<string, { label: string; color: 'default' | 'info' | 'warning' | 'success' | 'error' }> = {
  pendiente:  { label: 'Pendiente',  color: 'info' },
  pagado:     { label: 'Pagado',     color: 'success' },
  vencido:    { label: 'Vencido',    color: 'error' },
  cancelado:  { label: 'Cancelado',  color: 'default' },
  forzado:    { label: 'Forzado',    color: 'warning' },
};

const formatCurrency = (value: string | number) =>
  `$${Number(value).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

const FILTER_ESTADO_OPTIONS: { value: AdhesionEstadoFilter; label: string }[] = [
  { value: 'todas',      label: 'Todos los estados' },
  { value: 'pendiente',  label: 'Pendiente' },
  { value: 'en_curso',   label: 'En Curso' },
  { value: 'completada', label: 'Completada' },
  { value: 'cancelada',  label: 'Cancelada' },
];

const FILTER_PLAN_OPTIONS: { value: AdhesionPlanFilter; label: string }[] = [
  { value: 'todos',     label: 'Todos los planes' },
  { value: 'contado',   label: 'Contado (1 Cuota)' },
  { value: '6_cuotas',  label: '6 Cuotas' },
  { value: '12_cuotas', label: '12 Cuotas' },
];

// ─── Sub: Cuotas expandibles ─────────────────────────────────────────────────

const CuotasDetalle: React.FC<{
  adhesion: AdhesionDto;
  onForzarPago: (adhesion: AdhesionDto, numeroCuota: number) => void;
  isMutating: boolean;
}> = ({ adhesion, onForzarPago, isMutating }) => {
  const theme = useTheme();
  const pagos = adhesion.pagos || [];

  const esPlanEnCuotas = ['6_cuotas', '12_cuotas'].includes(adhesion.plan_pago);

  return (
    <Box sx={{ px: 3, pb: 2, bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
      {esPlanEnCuotas && (
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1, mt: 1 }}>
          CUOTAS DE ADHESIÓN — Plan: {adhesion.plan_pago.replace('_', ' ')} · Total: {formatCurrency(adhesion.monto_total_adhesion)}
        </Typography>
      )}
      <Table size="small" sx={{ mt: esPlanEnCuotas ? 0 : 2 }}>
        <TableHead>
          <TableRow sx={{ '& th': { fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary', py: 0.5 } }}>
            <TableCell>Cuota</TableCell>
            <TableCell>Vencimiento</TableCell>
            <TableCell>Monto</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell align="right">Acción</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {pagos.map((pago) => {
            const estadoCfg = ESTADO_CUOTA_CONFIG[pago.estado] ?? { label: pago.estado, color: 'default' };
            const puedeForce = ['pendiente', 'vencido'].includes(pago.estado);
            return (
              <TableRow key={pago.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={700}>#{pago.numero_cuota}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {new Date(pago.fecha_vencimiento).toLocaleDateString('es-AR')}
                  </Typography>
                  {pago.fecha_pago && (
                    <Typography variant="caption" color="success.main" display="block">
                      Pagado: {new Date(pago.fecha_pago).toLocaleDateString('es-AR')}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>{formatCurrency(pago.monto)}</Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={estadoCfg.label}
                    color={estadoCfg.color}
                    size="small"
                    variant={pago.estado === 'vencido' ? 'filled' : 'outlined'}
                    sx={{ fontWeight: 600 }}
                  />
                </TableCell>
                <TableCell align="right">
                  {puedeForce && adhesion.estado !== 'cancelada' && (
                    <Tooltip title="Forzar pago (administrativo)">
                      <Button
                        size="small"
                        variant="outlined"
                        color="warning"
                        disabled={isMutating}
                        onClick={() => onForzarPago(adhesion, pago.numero_cuota)}
                        sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                      >
                        Forzar Pago
                      </Button>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
};

// ─── Sub: Fila expandible ────────────────────────────────────────────────────

const AdhesionRow: React.FC<{
  adhesion: AdhesionDto;
  onForzarPago: (adhesion: AdhesionDto, numeroCuota: number) => void;
  onCancelar: (adhesion: AdhesionDto) => void;
  isMutating: boolean;
}> = ({ adhesion, onForzarPago, onCancelar, isMutating }) => {
  const [expanded, setExpanded] = useState(false);
  const estadoCfg = ESTADO_ADHESION_CONFIG[adhesion.estado] ?? { label: adhesion.estado, color: 'default' };
  
  const pagos = adhesion.pagos || [];
  const tienePagos = pagos.length > 0;
  const cuotasVencidas = pagos.filter(p => p.estado === 'vencido').length;

  let textoFecha = '-';
  let colorFecha = 'text.primary';
  let fontWeightFecha = 400;

  if (adhesion.estado === 'completada') {
    textoFecha = adhesion.fecha_completada 
      ? `Completada: ${new Date(adhesion.fecha_completada).toLocaleDateString('es-AR')}`
      : 'Completada';
    colorFecha = 'success.main';
    fontWeightFecha = 700;
  } else if (adhesion.estado === 'cancelada') {
    textoFecha = '-';
    colorFecha = 'text.disabled';
  } else if (tienePagos) {
    const cuotaActual = pagos.find(p => ['pendiente', 'vencido'].includes(p.estado));
    if (cuotaActual) {
      const isVencido = cuotaActual.estado === 'vencido';
      textoFecha = `${isVencido ? 'Venció' : 'Vence'}: ${new Date(cuotaActual.fecha_vencimiento).toLocaleDateString('es-AR')}`;
      colorFecha = isVencido ? 'error.main' : 'text.primary';
      fontWeightFecha = isVencido ? 700 : 500;
    }
  }

  return (
    <>
      <TableRow
        hover
        sx={{ 
          cursor: tienePagos ? 'pointer' : 'default', 
          '& td': { borderBottom: expanded ? 'none' : undefined } 
        }}
        onClick={() => {
          if (tienePagos) setExpanded(v => !v);
        }}
      >
        <TableCell sx={{ width: 48 }}>
          {tienePagos && (
            <IconButton size="small">
              {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
            </IconButton>
          )}
        </TableCell>
        <TableCell>
          <Typography variant="body2" fontWeight={700}>#{adhesion.id}</Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2" fontWeight={600}>
            {adhesion.usuario?.nombre} {adhesion.usuario?.apellido}
          </Typography>
          <Typography variant="caption" color="text.secondary">{adhesion.usuario?.email}</Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">{adhesion.proyecto?.nombre_proyecto ?? `Proyecto #${adhesion.id_proyecto}`}</Typography>
        </TableCell>
        <TableCell>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Chip label={estadoCfg.label} color={estadoCfg.color} size="small" sx={{ fontWeight: 700 }} />
            {cuotasVencidas > 0 && (
              <Chip
                label={`${cuotasVencidas} venc.`}
                color="error"
                size="small"
                variant="filled"
                icon={<Warning sx={{ fontSize: '0.75rem !important' }} />}
              />
            )}
          </Stack>
        </TableCell>
        <TableCell>
          <Typography variant="body2">{adhesion.cuotas_pagadas} / {adhesion.cuotas_totales}</Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2" color={colorFecha} fontWeight={fontWeightFecha}>
            {textoFecha}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2" fontWeight={700}>{formatCurrency(adhesion.monto_total_adhesion)}</Typography>
        </TableCell>
        <TableCell align="right" onClick={e => e.stopPropagation()}>
          {!['completada', 'cancelada'].includes(adhesion.estado) && (
            <Tooltip title="Cancelar adhesión">
              <IconButton
                size="small"
                color="error"
                disabled={isMutating}
                onClick={() => onCancelar(adhesion)}
              >
                <Cancel fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell colSpan={9} sx={{ p: 0, border: 0 }}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <CuotasDetalle
              adhesion={adhesion}
              onForzarPago={onForzarPago}
              isMutating={isMutating}
            />
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

// ─── Sub: Panel de vencidas ───────────────────────────────────────────────────

const OverduePanel: React.FC<{ overdue: PagoAdhesionDto[]; loading: boolean }> = ({ overdue, loading }) => {
  const theme = useTheme();

  if (!loading && overdue.length === 0) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        border: `1px solid ${theme.palette.error.light}`,
        borderLeft: `4px solid ${theme.palette.error.main}`,
        borderRadius: 2,
        mb: 3,
        p: 2,
        bgcolor: alpha(theme.palette.error.main, 0.03),
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
        <PriorityHigh color="error" fontSize="small" />
        <Typography variant="subtitle2" fontWeight={700} color="error.main">
          {overdue.length} cuota{overdue.length !== 1 ? 's' : ''} de adhesión vencida{overdue.length !== 1 ? 's' : ''}
        </Typography>
      </Stack>
      <Stack spacing={1}>
        {overdue.slice(0, 5).map((p: any) => (
          <Stack key={p.id} direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2">
              <strong>{p.adhesion?.usuario?.nombre} {p.adhesion?.usuario?.apellido}</strong>
              {' — '}{p.adhesion?.proyecto?.nombre_proyecto}
              {' · '} Cuota #{p.numero_cuota}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" fontWeight={700} color="error.main">
                {formatCurrency(p.monto)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                venció {new Date(p.fecha_vencimiento).toLocaleDateString('es-AR')}
              </Typography>
            </Stack>
          </Stack>
        ))}
        {overdue.length > 5 && (
          <Typography variant="caption" color="text.secondary">
            + {overdue.length - 5} más...
          </Typography>
        )}
      </Stack>
    </Paper>
  );
};

// ─── Componente principal ────────────────────────────────────────────────────

const AdhesionesTab: React.FC = () => {
  const theme = useTheme();
  const logic = useAdminAdhesiones();

  // ✅ Estado y lógica para paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reiniciar a la página 1 cuando cambia la cantidad de filas
  };

  // ✅ Recortar los datos según la paginación actual
  const paginatedAdhesiones = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return logic.filteredAdhesiones.slice(startIndex, startIndex + rowsPerPage);
  }, [logic.filteredAdhesiones, page, rowsPerPage]);

  return (
    <Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        <StatCard title="Total Adhesiones" value={logic.metrics?.total_adhesiones ?? 0} icon={<AccountBalance />} color="primary" loading={logic.loadingMetrics} />
        <StatCard title="Completadas" value={logic.metrics?.estado_resumen.completadas ?? 0} icon={<CheckCircle />} color="success" loading={logic.loadingMetrics} />
        <StatCard title="En Curso / Pendientes" value={(logic.metrics?.estado_resumen.en_curso ?? 0) + (logic.metrics?.estado_resumen.pendientes ?? 0)} icon={<HourglassEmpty />} color="warning" loading={logic.loadingMetrics} />
        <StatCard title="Tasa de Cobranza" value={`${logic.metrics?.tasa_cobranza ?? '0'}%`} icon={<MoneyOff />} color="info" loading={logic.loadingMetrics} />
      </Box>

      <OverduePanel overdue={logic.overdue} loading={logic.loadingOverdue} />

      <FilterBar sx={{ mb: 3, p: 2 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2,
            alignItems: { xs: 'stretch', md: 'center' },
            width: '100%',
          }}
        >
          <Box sx={{ flex: 1 }}>
            <FilterSearch
              placeholder="Buscar por titular, email, proyecto o ID..."
              value={logic.searchTerm}
              onSearch={logic.setSearchTerm}
              fullWidth
            />
          </Box>
          <FilterSelect
            label="Plan de Pago"
            value={logic.filterPlan}
            onChange={(e: any) => logic.setFilterPlan(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            {FILTER_PLAN_OPTIONS.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </FilterSelect>
          <FilterSelect
            label="Estado"
            value={logic.filterEstado}
            onChange={(e: any) => logic.setFilterEstado(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            {FILTER_ESTADO_OPTIONS.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </FilterSelect>
        </Box>
      </FilterBar>

      <QueryHandler isLoading={logic.isLoading} error={logic.error as Error | null}>
        <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, overflow: 'hidden' }}>
          {logic.filteredAdhesiones.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Schedule sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography variant="h6" fontWeight={700} color="text.secondary">
                No hay adhesiones para mostrar
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                    <TableCell sx={{ width: 48 }} />
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>Titular</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>Proyecto</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>Estado</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>Cuotas</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>Vencimiento / Pago</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>Monto Total</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* ✅ Iteramos sobre el arreglo ya paginado */}
                  {paginatedAdhesiones.map((adhesion) => (
                    <AdhesionRow
                      key={adhesion.id}
                      adhesion={adhesion}
                      onForzarPago={logic.handleForzarPago}
                      onCancelar={logic.handleCancelar}
                      isMutating={logic.isMutating}
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* ✅ Componente de paginación acoplado al pie de la tabla */}
          {logic.filteredAdhesiones.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={logic.filteredAdhesiones.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count !== -1 ? count : `> ${to}`}`}
              sx={{
                borderTop: `1px solid ${theme.palette.divider}`,
                bgcolor: alpha(theme.palette.background.default, 0.5),
              }}
            />
          )}
        </Paper>
      </QueryHandler>

      <ConfirmDialog
        controller={logic.confirmDialog}
        onConfirm={logic.handleConfirmAction}
        isLoading={logic.isMutating}
      />
    </Box>
  );
};

export default AdhesionesTab;