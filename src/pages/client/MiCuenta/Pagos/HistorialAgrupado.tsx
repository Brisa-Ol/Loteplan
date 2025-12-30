// src/pages/User/Pagos/components/HistorialAgrupado.tsx

import React, { useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails, 
  Divider, 
  LinearProgress, 
  Avatar, 
  Chip, 
  Stack,
  useTheme,
  alpha,
  Paper
} from '@mui/material';
import { 
  ExpandMore, 
  Savings, 
  TrendingUp, 
  CalendarMonth,
  ReceiptLong,
  CheckCircle,
  AccountBalanceWallet
} from '@mui/icons-material';
import type { PagoDto } from '../../../../types/dto/pago.dto';
import type { SuscripcionDto } from '../../../../types/dto/suscripcion.dto';


interface HistorialPagosAgrupadoProps {
  pagos: PagoDto[];
  suscripciones: SuscripcionDto[];
}

interface GroupedSubscription {
  suscripcionId: number;
  nombreProyecto: string;
  tipo: 'ahorrista' | 'inversionista';
  totalCuotas: number; 
  pagos: PagoDto[];
}

export const HistorialPagosAgrupado: React.FC<HistorialPagosAgrupadoProps> = ({ 
  pagos, 
  suscripciones 
}) => {
  const theme = useTheme();

  // 1. Lógica de Agrupamiento
  const grupos = useMemo(() => {
    const map = new Map<number, GroupedSubscription>();

    pagos.forEach(pago => {
      if (!pago.id_suscripcion) return;

      if (!map.has(pago.id_suscripcion)) {
        const sub = suscripciones.find(s => s.id === pago.id_suscripcion);
        const proyecto = sub?.proyectoAsociado;

        // Lógica de tipo
        const esInversionDirecta = proyecto?.tipo_inversion === 'directo';
        const totalCuotasPlan = proyecto?.plazo_inversion || 0;

        map.set(pago.id_suscripcion, {
          suscripcionId: pago.id_suscripcion,
          nombreProyecto: proyecto?.nombre_proyecto || `Proyecto #${pago.id_proyecto}`,
          tipo: esInversionDirecta ? 'inversionista' : 'ahorrista',
          totalCuotas: totalCuotasPlan, 
          pagos: []
        });
      }

      map.get(pago.id_suscripcion)?.pagos.push(pago);
    });

    return Array.from(map.values());
  }, [pagos, suscripciones]);

  // Helper de moneda
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount);

  // 2. Estado Vacío
  if (grupos.length === 0) {
    return (
      <Paper 
        elevation={0}
        sx={{ 
          p: 6, 
          textAlign: 'center', 
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 3,
          bgcolor: 'background.paper'
        }}
      >
        <Box 
            sx={{ 
                width: 60, height: 60, mx: 'auto', mb: 2, borderRadius: '50%',
                bgcolor: alpha(theme.palette.text.secondary, 0.1),
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
        >
            <ReceiptLong sx={{ fontSize: 30, color: 'text.secondary' }} />
        </Box>
        <Typography variant="subtitle1" fontWeight={600} color="text.primary" gutterBottom>
          Sin historial disponible
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Tus pagos completados aparecerán agrupados aquí.
        </Typography>
      </Paper>
    );
  }

  // 3. Renderizado
  return (
    <Box>
      {grupos.map((grupo) => {
        const pagosRealizados = grupo.pagos.length;
        
        // Calculamos porcentaje
        const porcentaje = (grupo.tipo === 'ahorrista' && grupo.totalCuotas > 0)
          ? Math.min((pagosRealizados / grupo.totalCuotas) * 100, 100)
          : 0;
        
        const isCompleted = porcentaje === 100;
        const themeColor = grupo.tipo === 'inversionista' ? theme.palette.info : theme.palette.primary;

        return (
          <Accordion 
            key={grupo.suscripcionId} 
            defaultExpanded={false}
            elevation={0}
            sx={{ 
              mb: 2, 
              borderRadius: '12px !important', 
              border: `1px solid ${theme.palette.divider}`,
              '&:before': { display: 'none' },
              transition: 'all 0.2s',
              '&:hover': {
                 borderColor: themeColor.main,
                 bgcolor: alpha(themeColor.main, 0.02)
              }
            }}
          >
            {/* === CABECERA === */}
            <AccordionSummary 
                expandIcon={<ExpandMore />} 
                sx={{ px: 2, '& .MuiAccordionSummary-content': { my: 1.5 } }}
            >
              <Stack direction="row" spacing={2} alignItems="center" width="100%">
                
                {/* Icono */}
                <Avatar 
                  variant="rounded"
                  sx={{ 
                    bgcolor: alpha(themeColor.main, 0.1),
                    color: themeColor.main,
                    width: 48, height: 48,
                    borderRadius: 2
                  }}
                >
                  {grupo.tipo === 'inversionista' ? <TrendingUp /> : <Savings />}
                </Avatar>
                
                {/* Info Principal */}
                <Box flexGrow={1}>
                  <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                    {grupo.nombreProyecto}
                  </Typography>
                  
                  <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                    <Chip 
                        label={grupo.tipo === 'inversionista' ? "CAPITAL" : "AHORRO"} 
                        size="small" 
                        variant="outlined"
                        color={grupo.tipo === 'inversionista' ? 'info' : 'primary'}
                        sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, borderRadius: 1 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CheckCircle fontSize="inherit" color="success" sx={{ fontSize: 14 }} />
                        {pagosRealizados} pagos
                    </Typography>
                  </Stack>
                </Box>

                {/* Barra de Progreso (Solo Ahorristas) - Oculta en móviles muy pequeños */}
                {grupo.tipo === 'ahorrista' && grupo.totalCuotas > 0 && (
                  <Box width="120px" display={{ xs: 'none', sm: 'block' }} mr={1}>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption" fontWeight="bold" color="primary.main">
                          {isCompleted ? '100%' : `${porcentaje.toFixed(0)}%`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {pagosRealizados}/{grupo.totalCuotas}
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={porcentaje} 
                        sx={{ 
                            height: 6, 
                            borderRadius: 4, 
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            '& .MuiLinearProgress-bar': {
                                borderRadius: 4,
                                bgcolor: isCompleted ? theme.palette.success.main : theme.palette.primary.main
                            }
                        }}
                      />
                  </Box>
                )}
              </Stack>
            </AccordionSummary>
            
            {/* === DETALLE TIPO TABLA (SIN GRID) === */}
            <AccordionDetails sx={{ p: 0, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
              <Divider />
              
              {/* Header de "Tabla" interna */}
              <Box 
                display={{ xs: 'none', sm: 'flex' }} 
                width="100%" 
                px={3} py={1} 
                bgcolor={alpha(theme.palette.action.active, 0.03)}
                alignItems="center"
              >
                 <Box width="45%">
                    <Typography variant="caption" fontWeight="bold" color="text.secondary">DETALLE</Typography>
                 </Box>
                 <Box width="30%">
                    <Typography variant="caption" fontWeight="bold" color="text.secondary">FECHA ACREDITACIÓN</Typography>
                 </Box>
                 <Box width="25%" textAlign="right">
                    <Typography variant="caption" fontWeight="bold" color="text.secondary">MONTO</Typography>
                 </Box>
              </Box>
              <Divider sx={{ display: { xs: 'none', sm: 'block' } }}/>

              <Stack divider={<Divider />}>
                {grupo.pagos
                  .sort((a, b) => a.mes - b.mes)
                  .map((pago) => (
                  <Box 
                    key={pago.id} 
                    sx={{ 
                        p: 2, 
                        px: 3, 
                        '&:hover': { bgcolor: 'background.paper' },
                        transition: 'background-color 0.2s'
                    }}
                  >
                    <Box 
                        display="flex" 
                        flexDirection={{ xs: 'column', sm: 'row' }} 
                        width="100%" 
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                        gap={{ xs: 1, sm: 0 }}
                    >
                        
                        {/* Columna 1: Detalle */}
                        <Box width={{ xs: '100%', sm: '45%' }}>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Avatar 
                                    sx={{ 
                                        width: 28, height: 28, 
                                        bgcolor: 'background.paper', 
                                        border: `1px solid ${theme.palette.divider}`,
                                        color: 'text.secondary'
                                    }}
                                >
                                    <ReceiptLong sx={{ fontSize: 16 }} />
                                </Avatar>
                                <Box>
                                    <Typography variant="body2" fontWeight={600} color="text.primary">
                                        {grupo.tipo === 'inversionista' 
                                            ? `Aporte de Capital`  
                                            : `Cuota Mensual #${pago.mes}`
                                        }
                                    </Typography>
                                    {/* En móvil mostramos fecha aquí abajo */}
                                    <Typography variant="caption" color="text.secondary" display={{ sm: 'none' }}>
                                        {pago.fecha_pago 
                                            ? new Date(pago.fecha_pago).toLocaleDateString() 
                                            : 'Fecha desconocida'
                                        }
                                    </Typography>
                                </Box>
                            </Stack>
                        </Box>

                        {/* Columna 2: Fecha (Solo Desktop) */}
                        <Box width="30%" display={{ xs: 'none', sm: 'block' }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <CalendarMonth sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                    {pago.fecha_pago 
                                        ? new Date(pago.fecha_pago).toLocaleDateString() 
                                        : new Date(pago.fecha_vencimiento).toLocaleDateString()
                                    }
                                </Typography>
                            </Stack>
                        </Box>

                        {/* Columna 3: Monto y Estado */}
                        <Box width={{ xs: '100%', sm: '25%' }}>
                            <Stack 
                                direction="row" 
                                justifyContent={{ xs: 'space-between', sm: 'flex-end' }} 
                                alignItems="center" 
                                width="100%"
                                spacing={1}
                            >
                                {/* Etiqueta visible solo en móvil */}
                                <Typography variant="caption" color="text.secondary" display={{ sm: 'none' }}>
                                    Monto pagado:
                                </Typography>

                                <Box textAlign="right">
                                    <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ fontFamily: 'monospace' }}>
                                        {formatCurrency(Number(pago.monto))}
                                    </Typography>
                                    {pago.estado_pago === 'cubierto_por_puja' ? (
                                        <Chip 
                                            label="Por Puja" 
                                            size="small" 
                                            color="info" 
                                            variant="outlined" 
                                            icon={<AccountBalanceWallet sx={{ fontSize: '12px !important' }} />}
                                            sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600, mt: 0.5, border: 'none', bgcolor: alpha(theme.palette.info.main, 0.1) }} 
                                        />
                                    ) : (
                                        <Chip 
                                            label="Pagado" 
                                            size="small" 
                                            color="success" 
                                            variant="filled" 
                                            sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600, mt: 0.5 }} 
                                        />
                                    )}
                                </Box>
                            </Stack>
                        </Box>

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