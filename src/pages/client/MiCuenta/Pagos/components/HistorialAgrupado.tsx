import React, { useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails, 
  List, 
  ListItem, 
  ListItemText, 
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
  CheckCircle
} from '@mui/icons-material';
import type { SuscripcionDto } from '../../../../../types/dto/suscripcion.dto';
import type { PagoDto } from '../../../../../types/dto/pago.dto';


interface HistorialPagosAgrupadoProps {
  pagos: PagoDto[];
  suscripciones: SuscripcionDto[];
}

// Interfaz interna para organizar la vista
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

  // 2. Estado Vacío (Empty State consistente)
  if (grupos.length === 0) {
    return (
      <Paper 
        variant="outlined" 
        sx={{ 
          p: 6, 
          textAlign: 'center', 
          bgcolor: 'background.default', 
          borderStyle: 'dashed',
          borderColor: theme.palette.divider,
          borderRadius: 3
        }}
      >
        <Box 
            sx={{ 
                width: 80, height: 80, mx: 'auto', mb: 2, borderRadius: '50%',
                bgcolor: alpha(theme.palette.text.secondary, 0.1),
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
        >
            <ReceiptLong sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.5 }} />
        </Box>
        <Typography variant="h6" color="text.secondary">
          No tienes historial de pagos completados.
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
        const themeColor = grupo.tipo === 'inversionista' ? theme.palette.secondary : theme.palette.primary;

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
              overflow: 'hidden',
              transition: 'border-color 0.2s',
              '&:hover': {
                 borderColor: themeColor.main
              }
            }}
          >
            {/* === CABECERA === */}
            <AccordionSummary 
                expandIcon={<ExpandMore />} 
                sx={{ 
                    px: 3, py: 1,
                    '& .MuiAccordionSummary-content': { margin: '12px 0' } 
                }}
            >
              <Box display="flex" alignItems="center" width="100%" gap={2}>
                
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
                  <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2} color="text.primary">
                    {grupo.nombreProyecto}
                  </Typography>
                  
                  <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                    <Chip 
                        label={grupo.tipo === 'inversionista' ? "CAPITAL DIRECTO" : "PLAN MENSUAL"} 
                        size="small" 
                        variant="outlined"
                        sx={{ 
                            fontSize: '0.65rem', height: 20, fontWeight: 700, 
                            color: themeColor.main, borderColor: alpha(themeColor.main, 0.3),
                            bgcolor: alpha(themeColor.main, 0.05)
                        }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CheckCircle fontSize="inherit" color="success" sx={{ fontSize: 14 }} />
                        {pagosRealizados} {pagosRealizados === 1 ? 'pago realizado' : 'pagos realizados'}
                    </Typography>
                  </Stack>
                </Box>

                {/* Barra de Progreso (Solo Ahorristas) */}
                {grupo.tipo === 'ahorrista' && grupo.totalCuotas > 0 && (
                  <Box width="30%" mr={2} display={{ xs: 'none', md: 'block' }}>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption" fontWeight="bold" color="primary.main">
                          {isCompleted ? 'Plan Completado' : 'Avance del Plan'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {pagosRealizados} / {grupo.totalCuotas}
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
              </Box>
            </AccordionSummary>
            
            {/* === LISTA DE PAGOS === */}
            <AccordionDetails sx={{ bgcolor: alpha(theme.palette.action.hover, 0.5), p: 0 }}>
              <List disablePadding>
                {grupo.pagos
                  .sort((a, b) => a.mes - b.mes) // Ordenar cronológicamente por cuota
                  .map((pago, index) => (
                  <React.Fragment key={pago.id}>
                    {index > 0 && <Divider component="li" variant="inset" sx={{ ml: 9 }} />}
                    
                    <ListItem sx={{ py: 1.5, px: 3, '&:hover': { bgcolor: 'background.paper' } }}>
                      <Box mr={2.5} display="flex" alignItems="center">
                         <Avatar 
                            sx={{ 
                                width: 32, height: 32, 
                                bgcolor: 'background.paper', 
                                border: `1px solid ${theme.palette.divider}`,
                                color: 'text.secondary'
                            }}
                         >
                            <CalendarMonth fontSize="small" sx={{ fontSize: 16 }} />
                         </Avatar>
                      </Box>

                      <ListItemText 
                        primary={
                          <Typography variant="body2" fontWeight={600} color="text.primary">
                            {grupo.tipo === 'inversionista' 
                              ? `Aporte de Capital Registrado`  
                              : `Cuota Mensual #${pago.mes} de ${grupo.totalCuotas}`
                            }
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                             {pago.fecha_pago 
                                ? `Acreditado el ${new Date(pago.fecha_pago).toLocaleDateString()}` 
                                : `Fecha registro: ${new Date(pago.fecha_vencimiento).toLocaleDateString()}`
                             }
                          </Typography>
                        }
                      />
                      
                      <Box textAlign="right">
                        <Typography variant="body2" fontWeight={700} color="text.primary">
                             ${Number(pago.monto).toLocaleString('es-AR')}
                        </Typography>
                        <Chip 
                            label="Pagado" 
                            size="small" 
                            color="success" 
                            variant="filled" // Para mejor contraste en la lista
                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600, mt: 0.5 }} 
                        />
                      </Box>
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
};