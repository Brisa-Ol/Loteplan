
import { env } from '@/core/config/env';
import type { PagoDto } from '@/core/types/dto/pago.dto';
import {
  CheckCircle,
  ExpandMore,
  ReceiptLong,
  Savings, TrendingUp
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  alpha,
  Avatar,
  Box,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
  useTheme
} from '@mui/material';
import React, { useMemo } from 'react';

interface HistorialPagosAgrupadoProps {
  pagos: PagoDto[];
}

interface GroupedSubscription {
  suscripcionId: number;
  nombreProyecto: string;
  tipo: 'ahorrista' | 'inversionista';
  totalCuotasProyecto: number;
  mesesRestantesPorGenerar: number;
  pagos: PagoDto[];
}

export const HistorialPagosAgrupado: React.FC<HistorialPagosAgrupadoProps> = ({
  pagos
}) => {
  const theme = useTheme();

  const grupos = useMemo(() => {
    const map = new Map<number, GroupedSubscription>();

    pagos.forEach(pago => {
      const subId = pago.id_suscripcion;
      if (!subId) return;

      if (!map.has(subId)) {
        const infoSuscripcion = pago.suscripcion;
        const proyecto = infoSuscripcion?.proyectoAsociado;

        map.set(subId, {
          suscripcionId: subId,
          nombreProyecto: proyecto?.nombre_proyecto || "Proyecto General",
          totalCuotasProyecto: proyecto?.plazo_inversion || 0,
          mesesRestantesPorGenerar: infoSuscripcion?.meses_a_pagar || 0,
          tipo: (pago.monto > 5000) ? 'inversionista' : 'ahorrista',
          pagos: []
        });
      }

      map.get(subId)?.pagos.push(pago);
    });

    return Array.from(map.values());
  }, [pagos]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(env.defaultLocale, {
      style: 'currency', currency: env.defaultCurrency, maximumFractionDigits: 0
    }).format(amount);

  if (grupos.length === 0) {
    return (
      <Paper elevation={0} sx={{ p: 6, textAlign: 'center', border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
        <ReceiptLong sx={{ fontSize: 40, color: 'text.disabled', mb: 2 }} />
        <Typography variant="subtitle1" fontWeight={600}>Sin historial de pagos</Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {grupos.map((grupo) => {
        const themeColor = grupo.tipo === 'inversionista' ? theme.palette.info : theme.palette.primary;

        return (
          <Accordion
            key={grupo.suscripcionId}
            elevation={0}
            sx={{
              mb: 2, borderRadius: '12px !important', border: `1px solid ${theme.palette.divider}`,
              '&:before': { display: 'none' },
              '&:hover': { borderColor: themeColor.main }
            }}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                <Avatar variant="rounded" sx={{ bgcolor: alpha(themeColor.main, 0.1), color: themeColor.main }}>
                  {grupo.tipo === 'inversionista' ? <TrendingUp /> : <Savings />}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2" fontWeight={800}>
                    {grupo.nombreProyecto}
                  </Typography>
                  <Stack direction="row" spacing={1} mt={0.5} alignItems="center">
                    <Chip label={grupo.tipo.toUpperCase()} size="small" sx={{ height: 20, fontSize: '0.6rem', fontWeight: 700 }} />

                    {/* ✅ Solo mostramos las cuotas pendientes para no sobrecargar la vista */}
                    {grupo.mesesRestantesPorGenerar > 0 && (
                      <Typography variant="caption" sx={{ color: 'info.main', fontWeight: 700 }}>
                        {grupo.mesesRestantesPorGenerar} cuotas por pagar
                      </Typography>
                    )}
                  </Stack>
                </Box>
              </Stack>
            </AccordionSummary>

            <AccordionDetails sx={{ p: 0 }}>
              <Divider />
              <Stack divider={<Divider />}>
                {grupo.pagos.sort((a, b) => b.mes - a.mes).map((pago) => (
                  <Box key={pago.id} sx={{ p: 2, px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <CheckCircle color="success" sx={{ fontSize: 18 }} />
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          Cuota {pago.mes} de {grupo.totalCuotasProyecto || '--'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          Pagado el {pago.fecha_pago ? new Date(pago.fecha_pago).toLocaleDateString() : 'Fecha no registrada'}
                        </Typography>
                      </Box>
                    </Stack>
                    <Box textAlign="right">
                      <Typography variant="body2" fontWeight={800}>
                        {formatCurrency(pago.monto)}
                      </Typography>
                      {pago.estado_pago === 'cubierto_por_puja' && (
                        <Chip label="Saldado con Puja" size="small" color="secondary" variant="outlined" sx={{ height: 16, fontSize: '0.55rem' }} />
                      )}
                    </Box>
                  </Box>
                ))}
              </Stack>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
};