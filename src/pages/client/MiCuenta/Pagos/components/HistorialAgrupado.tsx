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
  Stack 
} from '@mui/material';
import { 
  ExpandMore, 
  Savings, 
  TrendingUp, 
  CalendarMonth,
  ReceiptLong
} from '@mui/icons-material';
import type { PagoDto } from '../../../../../types/dto/pago.dto';
import type { SuscripcionDto } from '../../../../../types/dto/suscripcion.dto';



interface HistorialPagosAgrupadoProps {
  pagos: PagoDto[];
  suscripciones: SuscripcionDto[];
}

// Interfaz interna para organizar la vista
interface GroupedSubscription {
  suscripcionId: number;
  nombreProyecto: string;
  tipo: 'ahorrista' | 'inversionista';
  totalCuotas: number; // Viene de proyecto.plazo_inversion
  pagos: PagoDto[];
}

export const HistorialPagosAgrupado: React.FC<HistorialPagosAgrupadoProps> = ({ 
  pagos, 
  suscripciones 
}) => {

  // 1. Lógica de Agrupamiento
  const grupos = useMemo(() => {
    const map = new Map<number, GroupedSubscription>();

    pagos.forEach(pago => {
      // Si el pago no tiene suscripción enlazada, lo saltamos (o podrías agruparlo en "Otros")
      if (!pago.id_suscripcion) return;

      if (!map.has(pago.id_suscripcion)) {
        // Buscamos la suscripción y el proyecto asociado
        const sub = suscripciones.find(s => s.id === pago.id_suscripcion);
        const proyecto = sub?.proyectoAsociado;

        // Lógica para diferenciar Ahorrista (Mensual) vs Inversionista (Directo)
        // Basado en tu ProyectoDto: tipo_inversion: 'directo' | 'mensual'
        const esInversionDirecta = proyecto?.tipo_inversion === 'directo';
        
        // Total de cuotas del plan (plazo_inversion)
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

  // 2. Estado Vacío
  if (grupos.length === 0) {
    return (
      <Box textAlign="center" py={6} bgcolor="background.paper" borderRadius={2} border="1px dashed #ccc">
        <ReceiptLong sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
        <Typography color="text.secondary" variant="h6">
          No tienes historial de pagos completados.
        </Typography>
      </Box>
    );
  }

  // 3. Renderizado
  return (
    <Box>
      {grupos.map((grupo) => {
        const pagosRealizados = grupo.pagos.length;
        
        // Calculamos porcentaje solo si es Ahorrista y hay un plazo definido
        const porcentaje = (grupo.tipo === 'ahorrista' && grupo.totalCuotas > 0)
          ? Math.min((pagosRealizados / grupo.totalCuotas) * 100, 100)
          : 0;

        return (
          <Accordion 
            key={grupo.suscripcionId} 
            defaultExpanded={false}
            sx={{ 
              mb: 2, 
              borderRadius: '12px !important', 
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 'none', 
              '&:before': { display: 'none' },
              overflow: 'hidden'
            }}
          >
            {/* === CABECERA === */}
            <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 2, py: 1 }}>
              <Box display="flex" alignItems="center" width="100%" gap={2}>
                
                {/* Icono: Alcancía (Ahorro) o Gráfico (Inversión) */}
                <Avatar 
                  sx={{ 
                    bgcolor: grupo.tipo === 'inversionista' ? 'secondary.main' : 'primary.main',
                    width: 44, height: 44
                  }}
                >
                  {grupo.tipo === 'inversionista' ? <TrendingUp /> : <Savings />}
                </Avatar>
                
                {/* Info Principal */}
                <Box flexGrow={1}>
                  <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
                    {grupo.nombreProyecto}
                  </Typography>
                  
                  <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                    <Chip 
                        label={grupo.tipo === 'inversionista' ? "CAPITAL DIRECTO" : "PLAN MENSUAL"} 
                        size="small" 
                        color={grupo.tipo === 'inversionista' ? "secondary" : "primary"} 
                        variant="outlined"
                        sx={{ fontSize: '0.65rem', height: 20, fontWeight: 700, border: 'none', bgcolor: 'action.hover' }}
                    />
                    <Typography variant="caption" color="text.secondary">
                        {pagosRealizados} {pagosRealizados === 1 ? 'pago' : 'pagos'}
                    </Typography>
                  </Stack>
                </Box>

                {/* Barra de Progreso (Solo Ahorristas) */}
                {grupo.tipo === 'ahorrista' && grupo.totalCuotas > 0 && (
                  <Box width="30%" mr={1} display={{ xs: 'none', md: 'block' }}>
                     <Box display="flex" justifyContent="space-between" mb={0.5}>
                       <Typography variant="caption" fontWeight="bold" color="primary.main">
                         Avance del Plan
                       </Typography>
                       <Typography variant="caption" color="text.secondary">
                         {pagosRealizados} / {grupo.totalCuotas}
                       </Typography>
                     </Box>
                     <LinearProgress 
                        variant="determinate" 
                        value={porcentaje} 
                        sx={{ height: 6, borderRadius: 4, bgcolor: 'grey.200' }}
                     />
                  </Box>
                )}
              </Box>
            </AccordionSummary>
            
            {/* === LISTA DE PAGOS === */}
            <AccordionDetails sx={{ bgcolor: '#fafafa', p: 0 }}>
              <List disablePadding>
                {grupo.pagos
                  .sort((a, b) => a.mes - b.mes) // Ordenar por cuota (1, 2, 3...)
                  .map((pago, index) => (
                  <React.Fragment key={pago.id}>
                    {index > 0 && <Divider component="li" />}
                    
                    <ListItem sx={{ py: 1.5, px: 3 }}>
                      <Box mr={2} color="text.disabled" display="flex" alignItems="center">
                        <CalendarMonth fontSize="small" />
                      </Box>

                      <ListItemText 
                        primary={
                          <Typography variant="body2" fontWeight={600}>
                            {grupo.tipo === 'inversionista' 
                              ? `Aporte de Capital Registrado`  
                              : `Cuota Mensual #${pago.mes} de ${grupo.totalCuotas}` // AQUÍ ESTÁ EL "1 de 15"
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
                        {/* Podemos mostrar "ARS" o "USD" dependiendo del proyecto si pasamos el dato */}
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