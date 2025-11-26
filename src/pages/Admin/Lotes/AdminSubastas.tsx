import React, { useMemo, useState } from 'react';
import { 
  Box, Typography, Paper, Card, CardContent, CardActions, 
  Button, Chip, Stack, Avatar, Alert, LinearProgress,
  useTheme, Tabs, Tab
} from '@mui/material';
import { 
  Gavel, Timer, StopCircle, ReceiptLong, 
  MonetizationOn, Warning, Person, ErrorOutline,
  CheckCircle
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Componentes Comunes
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';

// Servicios
import type { LoteDto } from '../../../types/dto/lote.dto';
import LoteService from '../../../Services/lote.service';
import imagenService from '../../../Services/imagen.service';

// --- KPI CARD (Estilo Unificado) ---
const KpiCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: 'success' | 'info' | 'warning' }> = ({ title, value, icon, color }) => (
  <Card sx={{ flex: 1, border: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
      <Box sx={{ bgcolor: `${color}.light`, color: `${color}.main`, p: 1.5, borderRadius: '50%', display: 'flex' }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="h4" fontWeight={700}>{value}</Typography>
        <Typography variant="body2" color="text.secondary" fontWeight={600}>{title}</Typography>
      </Box>
    </CardContent>
  </Card>
);

const AdminSubastas: React.FC = () => {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0); // 0: En Vivo, 1: Cobros Pendientes

  // 1. Cargar datos (Refresco rápido para monitoreo real)
  const { data: lotes = [], isLoading, error } = useQuery<LoteDto[]>({
    queryKey: ['adminLotes'],
    queryFn: async () => (await LoteService.findAllAdmin()).data,
    refetchInterval: 10000, // Actualizar cada 10 segundos
  });

  // 2. Filtrar SOLO lo que nos interesa: Activos y Recién Finalizados (Impagos)
  const { activos, pendientesPago, dineroEnJuego } = useMemo(() => {
    const _activos = lotes.filter(l => l.estado_subasta === 'activa');
    const _pendientes = lotes.filter(l => 
      l.estado_subasta === 'finalizada' && 
      l.id_ganador && 
      (l.intentos_fallidos_pago || 0) < 3 // Aún gestionables
    );
    
    // Suma del precio base de lo que está activo (KPI de dinero potencial)
    const _dinero = _activos.reduce((acc, curr) => acc + Number(curr.precio_base), 0);

    return { activos: _activos, pendientesPago: _pendientes, dineroEnJuego: _dinero };
  }, [lotes]);

  // 3. Mutación: Finalizar (Botón de emergencia)
  const endAuctionMutation = useMutation({
    mutationFn: (id: number) => LoteService.endAuction(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      const msg = (res.data as any).mensaje || 'Subasta finalizada.';
      alert(`🏁 ${msg}`);
    }
  });

  // Helper imagen
  const getLoteImage = (lote: LoteDto) => lote.imagenes?.[0] ? imagenService.resolveImageUrl(lote.imagenes[0].url) : undefined;

  return (
    <PageContainer maxWidth="xl">
      
      {/* HEADER SIMPLE */}
      <Box mb={4}>
        <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 700 }}>
          Sala de Control de Subastas
        </Typography>
        <Typography color="text.secondary">
          Monitoreo en tiempo real de lotes activos y gestión de adjudicaciones.
        </Typography>
      </Box>

      {/* KPI STRIP (Stack en lugar de Grid) */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={4}>
        <KpiCard 
          title="Subastas En Vivo" 
          value={activos.length} 
          icon={<Gavel fontSize="large" />} 
          color="success" 
        />
        <KpiCard 
          title="Capital en Juego (Base)" 
          value={`$${dineroEnJuego.toLocaleString()}`} 
          icon={<MonetizationOn fontSize="large" />} 
          color="info" 
        />
        <KpiCard 
          title="Pendientes de Pago" 
          value={pendientesPago.length} 
          icon={<ReceiptLong fontSize="large" />} 
          color="warning" 
        />
      </Stack>

      {/* TABS PARA SEPARAR VIVO DE GESTIÓN */}
      <Paper elevation={0} sx={{ mb: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={(_, v) => setTabValue(v)}
          indicatorColor="primary"
          textColor="primary"
          sx={{ '& .Mui-selected': { color: `${theme.palette.primary.main} !important`, fontWeight: 700 } }}
        >
          <Tab icon={<Timer />} label={`EN VIVO (${activos.length})`} iconPosition="start" />
          <Tab icon={<ReceiptLong />} label={`Gestión de Cobros (${pendientesPago.length})`} iconPosition="start" />
        </Tabs>
      </Paper>

      <QueryHandler isLoading={isLoading} error={error as Error}>
        
        {/* --- VISTA 1: MONITOR EN VIVO --- */}
        {tabValue === 0 && (
          <Box>
            {activos.length === 0 ? (
              // Empty State
              <Box 
                sx={{ 
                  textAlign: 'center', 
                  py: 8, 
                  bgcolor: 'background.default', 
                  borderRadius: 2, 
                  border: '2px dashed',
                  borderColor: 'text.disabled'
                }}
              >
                <Timer sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" fontWeight={600}>
                  No hay subastas activas en este momento.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Inicia una subasta desde la pantalla "Gestión de Lotes".
                </Typography>
              </Box>
            ) : (
              // Grid Nativo CSS
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, 
                gap: 3 
              }}>
                {activos.map(lote => (
                  <Card key={lote.id} sx={{ 
                    border: '2px solid', 
                    borderColor: 'success.main', 
                    position: 'relative', 
                    bgcolor: 'background.default',
                    overflow: 'visible',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
                  }}>
                    {/* Badge Animado */}
                    <Chip 
                      label="EN VIVO" 
                      sx={{ 
                        bgcolor: 'success.main', 
                        color: 'white', 
                        position: 'absolute', 
                        top: -12, 
                        right: 20, 
                        fontWeight: 700,
                        boxShadow: 3,
                        animation: 'pulse 2s infinite',
                        '@keyframes pulse': {
                          '0%': { boxShadow: '0 0 0 0 rgba(76, 175, 80, 0.7)' },
                          '70%': { boxShadow: '0 0 0 10px rgba(76, 175, 80, 0)' },
                          '100%': { boxShadow: '0 0 0 0 rgba(76, 175, 80, 0)' },
                        }
                      }} 
                      icon={<Gavel style={{ color: 'white' }} />}
                    />

                    <CardContent>
                      <Stack direction="row" spacing={2} mb={3} alignItems="center">
                        <Avatar 
                          src={getLoteImage(lote)} 
                          sx={{ width: 70, height: 70, borderRadius: 2, boxShadow: 2 }} 
                          variant="rounded"
                        >
                          <Gavel />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" fontWeight={700} noWrap title={lote.nombre_lote}>
                            {lote.nombre_lote}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">ID Lote: {lote.id}</Typography>
                        </Box>
                      </Stack>
                      
                      <Box sx={{ bgcolor: 'success.light', color: 'success.dark', p: 2, borderRadius: 2, mb: 2, textAlign: 'center' }}>
                        <Typography variant="caption" fontWeight={700} sx={{ opacity: 0.8, letterSpacing: 1 }}>PRECIO BASE</Typography>
                        <Typography variant="h3" fontWeight={700} sx={{ color: 'success.dark' }}>
                          ${Number(lote.precio_base).toLocaleString()}
                        </Typography>
                      </Box>

                      {/* Info Placeholder (Idealmente esto vendría de Websockets) */}
                      <Stack direction="row" justifyContent="space-between" sx={{ px: 1 }}>
                        <Box textAlign="center">
                          <Typography variant="caption" color="text.secondary">OFERTAS</Typography>
                          <Typography fontWeight={700}>--</Typography>
                        </Box>
                        <Box textAlign="center">
                          <Typography variant="caption" color="text.secondary">TIEMPO RESTANTE</Typography>
                          <Typography fontWeight={700} color="error.main">--:--</Typography>
                        </Box>
                      </Stack>
                    </CardContent>

                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button 
                        fullWidth 
                        variant="outlined" 
                        color="error" 
                        startIcon={<StopCircle />}
                        onClick={() => {
                          if(confirm(`⚠️ ¿Estás seguro de finalizar manualmente la subasta de "${lote.nombre_lote}"?`)) {
                            endAuctionMutation.mutate(lote.id);
                          }
                        }}
                        sx={{ borderWidth: 2, '&:hover': { borderWidth: 2 } }}
                      >
                        Finalizar Ahora
                      </Button>
                    </CardActions>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* --- VISTA 2: GESTIÓN DE COBROS (Post-Subasta Inmediato) --- */}
        {tabValue === 1 && (
          <Box>
            {pendientesPago.length > 0 && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                Hay <strong>{pendientesPago.length} lotes adjudicados</strong> pendientes de pago. Contacta a los ganadores.
              </Alert>
            )}
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {pendientesPago.map(lote => {
                const intentos = lote.intentos_fallidos_pago || 0;
                return (
                  <Paper key={lote.id} elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} alignItems="center" spacing={3}>
                      {/* Info Lote */}
                      <Box flex={1}>
                        <Typography fontWeight={700}>{lote.nombre_lote}</Typography>
                        <Typography variant="caption" color="text.secondary">Finalizó: {new Date(lote.fecha_fin || '').toLocaleDateString()}</Typography>
                      </Box>

                      {/* Info Ganador */}
                      <Box flex={1}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Person color="action" />
                          <Box>
                            <Typography variant="body2" fontWeight={600}>Usuario #{lote.id_ganador}</Typography>
                            <Typography variant="caption" color="text.secondary">Ganador</Typography>
                          </Box>
                        </Stack>
                      </Box>

                      {/* Monto */}
                      <Box flex={1}>
                         <Typography variant="h6" fontWeight={700} color="primary.main">
                            ${Number(lote.precio_base).toLocaleString()}
                         </Typography>
                         <Typography variant="caption" color="text.secondary">A cobrar</Typography>
                      </Box>

                      {/* Estado Intentos */}
                      <Box width={150}>
                        <Stack spacing={0.5}>
                          <Stack direction="row" justifyContent="space-between">
                             <Typography variant="caption" fontWeight={700}>Riesgo de Impago</Typography>
                             <Typography variant="caption" color="error.main">{intentos}/3</Typography>
                          </Stack>
                          <LinearProgress 
                            variant="determinate" 
                            value={(intentos / 3) * 100} 
                            color={intentos === 0 ? 'success' : intentos === 1 ? 'warning' : 'error'}
                            sx={{ height: 8, borderRadius: 4, bgcolor: 'grey.200' }}
                          />
                        </Stack>
                      </Box>

                      {/* Acciones */}
                      <Box>
                        <Button variant="outlined" size="small">Contactar</Button>
                      </Box>
                    </Stack>
                  </Paper>
                );
              })}

              {pendientesPago.length === 0 && (
                 <Box textAlign="center" py={5} color="text.secondary">
                    <CheckCircle sx={{ fontSize: 40, color: 'success.light', mb: 1 }} />
                    <Typography>No hay cobros pendientes.</Typography>
                 </Box>
              )}
            </Box>
          </Box>
        )}

      </QueryHandler>
    </PageContainer>
  );
};

export default AdminSubastas;