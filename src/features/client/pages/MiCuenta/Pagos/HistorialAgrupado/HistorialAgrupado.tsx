
import { env } from '@/core/config/env';
import type { PagoDto } from '@/core/types/pago.dto';
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
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';
import React, { useMemo } from 'react';
import styles from './HistorialAgrupado.module.css';

interface HistorialPagosAgrupadoProps {
  pagos: PagoDto[];
}

interface GroupedSubscription {
  suscripcionId: number|string;
  nombreProyecto: string;
  tipo: 'ahorrista' | 'inversionista';
  totalCuotasProyecto: number;
  mesesRestantesPorGenerar: number;
  pagos: PagoDto[];
}

//funciones Thomy

const getEstadoPagoIcon = (estado: PagoDto['estado_pago']) => {
	switch (estado) {
		case 'pagado':
			return (
				<Tooltip title="Pago realizado">
					<CheckCircle color="success" sx={{ fontSize: 18 }} />
				</Tooltip>
			);

		case 'forzado':
			return (
				<Tooltip title="Pago forzado manualmente">
					<CheckCircle color="warning" sx={{ fontSize: 18 }} />
				</Tooltip>
			);

		case 'cubierto_por_puja':
			return (
				<Tooltip title="Cubierto por puja">
					<CheckCircle color="secondary" sx={{ fontSize: 18 }} />
				</Tooltip>
			);

		case 'pendiente':
			return (
				<Tooltip title="Pago pendiente">
					<CheckCircle sx={{ fontSize: 18, color: 'text.disabled' }} />
				</Tooltip>
			);

		case 'vencido':
			return (
				<Tooltip title="Pago vencido">
					<CheckCircle color="error" sx={{ fontSize: 18 }} />
				</Tooltip>
			);

		case 'cancelado':
			return (
				<Tooltip title="Pago cancelado">
					<CheckCircle color="error" sx={{ fontSize: 18 }} />
				</Tooltip>
			);

		default:
			return (
				<Tooltip title="Estado desconocido">
					<CheckCircle sx={{ fontSize: 18, color: 'text.disabled' }} />
				</Tooltip>
			);
	}
};

//fin funciones Thomy

export const HistorialPagosAgrupado: React.FC<HistorialPagosAgrupadoProps> = ({
  pagos
}) => {
  const theme = useTheme();

  const grupos = useMemo(() => {
  const map = new Map<string | number, GroupedSubscription>();

  pagos.forEach(pago => {
    const key = pago.id_suscripcion
      ? `sub-${pago.id_suscripcion}`
      : `proj-${pago.id_proyecto}`;

    if (!map.has(key)) {
      const infoSuscripcion = pago.suscripcion;
      const proyecto = infoSuscripcion?.proyectoAsociado;

      map.set(key, {
        suscripcionId: key,
        nombreProyecto:
          proyecto?.nombre_proyecto ||
          `Proyecto #${pago.id_proyecto}`,
        totalCuotasProyecto: proyecto?.plazo_inversion || 0,
        mesesRestantesPorGenerar: infoSuscripcion?.meses_a_pagar || 0,
        tipo: pago.suscripcion ? 'ahorrista' : 'inversionista',
        pagos: []
      });
    }

    map.get(key)?.pagos.push(pago);
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
        if (grupo.tipo === `inversionista`){
          return
        }
        const themeColor = theme.palette.primary; //grupo.tipo === 'inversionista' ? theme.palette.info :
        const cancelada = grupo.pagos[0].suscripcion?.activo === false;
        console.log("Grupo:", grupo); // Debug: Ver estructura del grupo
        console.log(`Cancelada?: ${cancelada}`)

        return (
          <Accordion
            key={grupo.suscripcionId}
            elevation={0}
            sx={{
              mb: 2, borderRadius: '12px !important', border: `1px solid ${cancelada ? theme.palette.error.light : theme.palette.divider}`,
              '&:before': { display: 'none' },
              '&:hover': {  borderColor: cancelada ? theme.palette.error.main : themeColor.main }
            }}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                <Avatar variant="rounded" sx={{ bgcolor: alpha(themeColor.main, 0.1), color: themeColor.main }}>
                  {<Savings />}{/* grupo.tipo === 'inversionista' ? <TrendingUp /> :  */}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography className={styles.cancelledBadge} variant="subtitle2" display={'flex'} justifyContent={'space-between'} fontWeight={800}>
                    {grupo.nombreProyecto}
                  {/* ✅ Badge de suscripción cancelada */}
                    {cancelada && (
                      <Chip
                        label="SUBSCRIPCION CANCELADA"
                        size="small"
                        color="error"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem', fontWeight: 800 }}
                        
                      />
                    )}
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
                      {getEstadoPagoIcon(pago.estado_pago)}
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          Cuota {pago.mes} de {grupo.totalCuotasProyecto || '--'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {pago.estado_pago === 'pagado' || pago.estado_pago === 'forzado' || pago.estado_pago === 'cubierto_por_puja'
                            ? `Pagado el ${pago.fecha_pago ? new Date(pago.fecha_pago).toLocaleDateString() : 'Fecha no registrada'}`
                            : `Vence el ${new Date(pago.fecha_vencimiento).toLocaleDateString()}`
                          }
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