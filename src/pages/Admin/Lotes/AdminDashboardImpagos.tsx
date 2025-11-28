import React, { useMemo } from 'react';
import {
  Box, Typography, Paper, Card, CardContent, 
  Stack, Chip, LinearProgress, Alert, Divider,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Avatar, IconButton, Tooltip
} from '@mui/material';
import { 
  Warning, ErrorOutline, CheckCircle, Person,
  RestartAlt, Info, Timeline, Gavel
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';

import type { LoteDto } from '../../../types/dto/lote.dto';
import LoteService from '../../../Services/lote.service';
import imagenService from '../../../Services/imagen.service';

// KPI Card
const MetricCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'success' | 'warning' | 'error' | 'info';
  description?: string;
}> = ({ title, value, icon, color, description }) => (
  <Card sx={{ border: '1px solid', borderColor: `${color}.main`, bgcolor: 'background.default' }}>
    <CardContent>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Box sx={{ 
          bgcolor: `${color}.light`, 
          color: `${color}.main`, 
          p: 1.5, 
          borderRadius: '50%',
          display: 'flex'
        }}>
          {icon}
        </Box>
        <Box flex={1}>
          <Typography variant="h3" fontWeight={700} color={`${color}.dark`}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary" fontWeight={600}>
            {title}
          </Typography>
          {description && (
            <Typography variant="caption" color="text.secondary">
              {description}
            </Typography>
          )}
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

// Helper para calcular días restantes
const calcularDiasRestantes = (lote: LoteDto): number => {
  if (!lote.fecha_fin) return 90;
  
  const fechaFin = new Date(lote.fecha_fin);
  const fechaLimite = new Date(fechaFin.getTime() + 90 * 24 * 60 * 60 * 1000);
  const ahora = new Date();
  const diff = fechaLimite.getTime() - ahora.getTime();
  
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const AdminDashboardImpagos: React.FC = () => {
  
  const { data: lotes = [], isLoading, error } = useQuery<LoteDto[]>({
    queryKey: ['adminLotes'],
    queryFn: async () => (await LoteService.findAllAdmin()).data,
    refetchInterval: 15000, // Actualizar cada 15 segundos
  });

  // Análisis de datos
  const analytics = useMemo(() => {
    const finalizados = lotes.filter(l => l.estado_subasta === 'finalizada' && l.id_ganador);
    
    const pendientesPago = finalizados.filter(l => (l.intentos_fallidos_pago || 0) > 0 && (l.intentos_fallidos_pago || 0) < 3);
    const riesgoCritico = pendientesPago.filter(l => (l.intentos_fallidos_pago || 0) >= 2);
    const primerIntento = pendientesPago.filter(l => (l.intentos_fallidos_pago || 0) === 1);
    
    // Lotes próximos a vencer (menos de 10 días)
    const proximosVencer = pendientesPago.filter(l => calcularDiasRestantes(l) <= 10);
    
    // Capital en riesgo
    const capitalEnRiesgo = riesgoCritico.reduce((acc, l) => acc + Number(l.precio_base), 0);
    
    return {
      totalFinalizados: finalizados.length,
      pendientesPago: pendientesPago.length,
      riesgoCritico: riesgoCritico.length,
      primerIntento: primerIntento.length,
      proximosVencer: proximosVencer.length,
      capitalEnRiesgo,
      detalles: pendientesPago.sort((a, b) => (b.intentos_fallidos_pago || 0) - (a.intentos_fallidos_pago || 0))
    };
  }, [lotes]);

  const getLoteImage = (lote: LoteDto) => 
    lote.imagenes?.[0] ? imagenService.resolveImageUrl(lote.imagenes[0].url) : undefined;

  return (
    <PageContainer maxWidth="xl">
      
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" color="primary.main">
          Monitor de Impagos y Reasignaciones
        </Typography>
        <Typography color="text.secondary">
          Sistema automático de seguimiento de pagos y reasignación de lotes (90 días / 3 intentos)
        </Typography>
      </Box>

      {/* Alerta de sistema */}
      <Alert severity="info" icon={<Info />} sx={{ mb: 3 }}>
        <Typography variant="body2" fontWeight={600}>
          🤖 Sistema Automático Activo
        </Typography>
        <Typography variant="caption">
          El sistema verifica diariamente los vencimientos y gestiona automáticamente:
          (1) Marca impagos, (2) Devuelve tokens, (3) Reasigna al siguiente postor, 
          (4) Tras 3 intentos fallidos → Reingreso automático.
        </Typography>
      </Alert>

      {/* KPIs */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
        gap: 2,
        mb: 4
      }}>
        <MetricCard
          title="Total Finalizados"
          value={analytics.totalFinalizados}
          icon={<CheckCircle fontSize="large" />}
          color="info"
          description="Subastas completadas"
        />
        <MetricCard
          title="Pendientes de Pago"
          value={analytics.pendientesPago}
          icon={<Timeline fontSize="large" />}
          color="warning"
          description="En proceso de cobro"
        />
        <MetricCard
          title="Riesgo Crítico"
          value={analytics.riesgoCritico}
          icon={<ErrorOutline fontSize="large" />}
          color="error"
          description="2+ intentos fallidos"
        />
        <MetricCard
          title="Capital en Riesgo"
          value={analytics.capitalEnRiesgo}
          icon={<Warning fontSize="large" />}
          color="error"
          description={`$${analytics.capitalEnRiesgo.toLocaleString()}`}
        />
      </Box>

      {/* Alertas críticas */}
      {analytics.riesgoCritico > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight={700}>
            ⚠️ ATENCIÓN: {analytics.riesgoCritico} lote{analytics.riesgoCritico > 1 ? 's' : ''} en riesgo crítico
          </Typography>
          <Typography variant="caption">
            Estos lotes están a 1 intento de reingreso automático. El sistema reasignará en las próximas 24-48h si no se paga.
          </Typography>
        </Alert>
      )}

      {analytics.proximosVencer > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight={700}>
            ⏰ {analytics.proximosVencer} lote{analytics.proximosVencer > 1 ? 's' : ''} con menos de 10 días de plazo
          </Typography>
          <Typography variant="caption">
            Considera contactar a los ganadores para recordar el vencimiento.
          </Typography>
        </Alert>
      )}

      {/* Tabla de detalles */}
      <Paper elevation={0} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ bgcolor: 'grey.50', p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight="bold">
            Detalle de Lotes con Impagos Activos
          </Typography>
        </Box>

        <QueryHandler isLoading={isLoading} error={error as Error}>
          {analytics.detalles.length === 0 ? (
            <Box textAlign="center" py={6}>
              <CheckCircle sx={{ fontSize: 60, color: 'success.light', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                ¡Excelente! No hay impagos activos
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Todos los lotes finalizados están pagados o están en el primer intento.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: 'grey.100' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Lote</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Ganador Actual</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Monto</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Intentos</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Días Restantes</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Próxima Acción</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analytics.detalles.map(lote => {
                    const intentos = lote.intentos_fallidos_pago || 0;
                    const dias = calcularDiasRestantes(lote);
                    const esRiesgoCritico = intentos >= 2;
                    
                    return (
                      <TableRow 
                        key={lote.id}
                        sx={{ 
                          bgcolor: esRiesgoCritico ? 'error.lighter' : 'transparent',
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                      >
                        <TableCell>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar 
                              src={getLoteImage(lote)} 
                              variant="rounded" 
                              sx={{ width: 50, height: 50 }}
                            >
                              <Gavel />
                            </Avatar>
                            <Box>
                              <Typography fontWeight={600}>{lote.nombre_lote}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID: {lote.id}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>

                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Person fontSize="small" color="action" />
                            <Typography variant="body2">
                              Usuario #{lote.id_ganador}
                            </Typography>
                          </Stack>
                        </TableCell>

                        <TableCell>
                          <Typography fontWeight={700} color="primary.main">
                            ${Number(lote.precio_base).toLocaleString()}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Stack spacing={0.5}>
                            <Typography 
                              variant="caption" 
                              fontWeight={700}
                              color={esRiesgoCritico ? 'error.main' : 'text.secondary'}
                            >
                              {intentos}/3 intentos
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={(intentos / 3) * 100}
                              color={intentos === 1 ? 'warning' : 'error'}
                              sx={{ height: 6, borderRadius: 3 }}
                            />
                          </Stack>
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={`${dias} días`}
                            size="small"
                            color={dias <= 10 ? 'error' : dias <= 30 ? 'warning' : 'success'}
                            sx={{ fontWeight: 700 }}
                          />
                        </TableCell>

                        <TableCell>
                          {esRiesgoCritico ? (
                            <Chip 
                              label="CRÍTICO" 
                              size="small" 
                              color="error" 
                              icon={<ErrorOutline />}
                            />
                          ) : (
                            <Chip 
                              label="En seguimiento" 
                              size="small" 
                              color="warning"
                            />
                          )}
                        </TableCell>

                        <TableCell>
                          <Tooltip 
                            title={
                              esRiesgoCritico 
                                ? "Si vence el plazo, el sistema automáticamente marcará incumplimiento, devolverá el token y reasignará al siguiente postor. Si no hay más postores, reingresará."
                                : "El sistema monitoreará el vencimiento y actuará automáticamente."
                            }
                          >
                            <IconButton size="small" color="info">
                              <Info fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </QueryHandler>
      </Paper>

      {/* Explicación del flujo automático */}
      <Paper sx={{ p: 3, mt: 4, bgcolor: 'grey.50' }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          🔄 Flujo Automático de Reasignación
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Stack spacing={2}>
          <Box>
            <Typography variant="body2" fontWeight={600} color="success.main">
              ✅ Paso 1: Finalización de Subasta
            </Typography>
            <Typography variant="caption" color="text.secondary">
              • Se asigna el ganador (puja más alta)<br />
              • Se establece plazo de 90 días<br />
              • intentos_fallidos_pago = 1
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" fontWeight={600} color="warning.main">
              ⏰ Paso 2: Vencimiento de Plazo (CRON Job)
            </Typography>
            <Typography variant="caption" color="text.secondary">
              • El sistema detecta vencimientos diarios<br />
              • Marca la puja como 'ganadora_incumplimiento'<br />
              • Devuelve el token al usuario<br />
              • Notifica el impago por email + mensaje interno
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" fontWeight={600} color="info.main">
              🔄 Paso 3: Reasignación Automática
            </Typography>
            <Typography variant="caption" color="text.secondary">
              • Busca el siguiente postor más alto<br />
              • Le asigna el lote con nuevo plazo de 90 días<br />
              • Incrementa intentos_fallidos_pago<br />
              • Envía notificación de reasignación
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" fontWeight={600} color="error.main">
              ♻️ Paso 4: Reingreso (3 intentos agotados)
            </Typography>
            <Typography variant="caption" color="text.secondary">
              • Si no hay más postores O se agotan los 3 intentos:<br />
              • Borra TODAS las pujas del lote<br />
              • Resetea el lote a estado 'pendiente'<br />
              • Envía mensaje al administrador<br />
              • El lote queda disponible para la próxima subasta anual
            </Typography>
          </Box>
        </Stack>
      </Paper>

    </PageContainer>
  );
};

export default AdminDashboardImpagos;