import React, { useMemo, useState } from 'react';
import { 
  Box, Typography, Paper, Card, CardContent, CardActions, 
  Button, Chip, Stack, Avatar, Alert, LinearProgress,
  useTheme, Tabs, Tab, IconButton, Tooltip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';
import { 
  Gavel, Timer, StopCircle, ReceiptLong, 
  MonetizationOn, Warning, Person, Email,
  CheckCircle, ContentCopy, WhatsApp
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';

import type { LoteDto } from '../../../types/dto/lote.dto';
import LoteService from '../../../Services/lote.service';
import imagenService from '../../../Services/imagen.service';

const KpiCard: React.FC<{ 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  color: 'success' | 'info' | 'warning' 
}> = ({ title, value, icon, color }) => (
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

// ✅ NUEVO: Modal de contacto al ganador
const ContactarGanadorModal: React.FC<{
  open: boolean;
  onClose: () => void;
  lote: LoteDto | null;
}> = ({ open, onClose, lote }) => {
  const [mensajePersonalizado, setMensajePersonalizado] = useState('');

  if (!lote) return null;

  const mensajeBase = `Hola Usuario #${lote.id_ganador},\n\nFelicitaciones por ganar la subasta del lote "${lote.nombre_lote}".\n\nMonto a pagar: $${Number(lote.precio_base).toLocaleString()}\nPlazo de pago: 90 días desde la finalización.\n\nPor favor, contacta con administración para coordinar el pago.`;

  const handleCopiar = () => {
    navigator.clipboard.writeText(mensajePersonalizado || mensajeBase);
    alert('📋 Mensaje copiado al portapapeles');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Contactar Ganador - Lote #{lote.id}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <Alert severity="info">
            <Typography variant="body2" fontWeight={600}>
              Usuario #{lote.id_ganador}
            </Typography>
            <Typography variant="caption">
              Lote: {lote.nombre_lote} | Monto: ${Number(lote.precio_base).toLocaleString()}
            </Typography>
          </Alert>

          <TextField
            label="Mensaje personalizado (opcional)"
            multiline
            rows={6}
            fullWidth
            value={mensajePersonalizado}
            onChange={(e) => setMensajePersonalizado(e.target.value)}
            placeholder={mensajeBase}
            helperText="Deja vacío para usar el mensaje predeterminado"
          />

          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<ContentCopy />}
              onClick={handleCopiar}
              fullWidth
            >
              Copiar Mensaje
            </Button>
            <Button
              variant="outlined"
              startIcon={<Email />}
              fullWidth
              onClick={() => alert('🚧 Integración con email pendiente')}
            >
              Enviar Email
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

const AdminSubastas: React.FC = () => {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [contactarModalOpen, setContactarModalOpen] = useState(false);
  const [loteSeleccionado, setLoteSeleccionado] = useState<LoteDto | null>(null);

  const { data: lotes = [], isLoading, error } = useQuery<LoteDto[]>({
    queryKey: ['adminLotes'],
    queryFn: async () => (await LoteService.findAllAdmin()).data,
    refetchInterval: 10000,
  });

  const { activos, pendientesPago, dineroEnJuego, lotesRiesgo } = useMemo(() => {
    const _activos = lotes.filter(l => l.estado_subasta === 'activa');
    const _pendientes = lotes.filter(l => 
      l.estado_subasta === 'finalizada' && 
      l.id_ganador && 
      (l.intentos_fallidos_pago || 0) < 3
    );
    
    // ✅ NUEVO: Identificar lotes en riesgo crítico (2 intentos fallidos)
    const _riesgo = _pendientes.filter(l => (l.intentos_fallidos_pago || 0) >= 2);
    
    const _dinero = _activos.reduce((acc, curr) => acc + Number(curr.precio_base), 0);

    return { 
      activos: _activos, 
      pendientesPago: _pendientes, 
      dineroEnJuego: _dinero,
      lotesRiesgo: _riesgo.length
    };
  }, [lotes]);

  const endAuctionMutation = useMutation({
    mutationFn: (id: number) => LoteService.endAuction(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      const msg = (res.data as any).mensaje || 'Subasta finalizada.';
      alert(`🏁 ${msg}`);
    },
    onError: (err: any) => {
      alert(`❌ Error al finalizar: ${err.message || 'Error desconocido'}`);
    }
  });

  const getLoteImage = (lote: LoteDto) => 
    lote.imagenes?.[0] ? imagenService.resolveImageUrl(lote.imagenes[0].url) : undefined;

  const handleContactar = (lote: LoteDto) => {
    setLoteSeleccionado(lote);
    setContactarModalOpen(true);
  };

  // ✅ NUEVO: Calcular días restantes de pago
  const calcularDiasRestantes = (lote: LoteDto): number => {
    if (!lote.fecha_fin) return 90;
    const fechaFin = new Date(lote.fecha_fin);
    const fechaLimite = new Date(fechaFin.getTime() + 90 * 24 * 60 * 60 * 1000);
    const ahora = new Date();
    const diff = fechaLimite.getTime() - ahora.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <PageContainer maxWidth="xl">
      
      <Box mb={4}>
        <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 700 }}>
          Sala de Control de Subastas
        </Typography>
        <Typography color="text.secondary">
          Monitoreo en tiempo real de lotes activos y gestión de adjudicaciones.
        </Typography>
      </Box>

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

      {/* ✅ NUEVO: Alerta de lotes en riesgo crítico */}
      {lotesRiesgo > 0 && (
        <Alert severity="error" sx={{ mb: 3 }} icon={<Warning />}>
          <strong>⚠️ ATENCIÓN:</strong> Hay {lotesRiesgo} lote{lotesRiesgo > 1 ? 's' : ''} con 2 o más intentos fallidos de pago. Próximo al reingreso automático.
        </Alert>
      )}

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
        
        {/* VISTA 1: MONITOR EN VIVO */}
        {tabValue === 0 && (
          <Box>
            {activos.length === 0 ? (
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
                          <Typography variant="body2" color="text.secondary">ID: {lote.id}</Typography>
                        </Box>
                      </Stack>
                      
                      <Box sx={{ bgcolor: 'success.light', color: 'success.dark', p: 2, borderRadius: 2, mb: 2, textAlign: 'center' }}>
                        <Typography variant="caption" fontWeight={700} sx={{ opacity: 0.8, letterSpacing: 1 }}>PRECIO BASE</Typography>
                        <Typography variant="h3" fontWeight={700} sx={{ color: 'success.dark' }}>
                          ${Number(lote.precio_base).toLocaleString()}
                        </Typography>
                      </Box>

                      <Stack direction="row" justifyContent="space-between" sx={{ px: 1 }}>
                        <Box textAlign="center">
                          <Typography variant="caption" color="text.secondary">OFERTAS</Typography>
                          <Typography fontWeight={700}>--</Typography>
                        </Box>
                        <Box textAlign="center">
                          <Typography variant="caption" color="text.secondary">TIEMPO</Typography>
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

        {/* VISTA 2: GESTIÓN DE COBROS (MEJORADA) */}
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
                const diasRestantes = calcularDiasRestantes(lote);
                const esRiesgoCritico = intentos >= 2;
                
                return (
                  <Paper 
                    key={lote.id} 
                    elevation={esRiesgoCritico ? 3 : 0} 
                    sx={{ 
                      p: 2, 
                      border: '2px solid', 
                      borderColor: esRiesgoCritico ? 'error.main' : 'divider', 
                      borderRadius: 2,
                      bgcolor: esRiesgoCritico ? 'error.lighter' : 'background.paper'
                    }}
                  >
                    <Stack direction={{ xs: 'column', md: 'row' }} alignItems="center" spacing={3}>
                      
                      {/* Imagen + Info Básica */}
                      <Stack direction="row" spacing={2} flex={1} alignItems="center">
                        <Avatar 
                          src={getLoteImage(lote)} 
                          sx={{ width: 60, height: 60, borderRadius: 2 }} 
                          variant="rounded"
                        >
                          <Gavel />
                        </Avatar>
                        <Box>
                          <Typography fontWeight={700}>{lote.nombre_lote}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Finalizó: {new Date(lote.fecha_fin || '').toLocaleDateString()}
                          </Typography>
                          {esRiesgoCritico && (
                            <Chip 
                              label="⚠️ RIESGO CRÍTICO" 
                              size="small" 
                              color="error" 
                              sx={{ mt: 0.5 }}
                            />
                          )}
                        </Box>
                      </Stack>

                      {/* Ganador */}
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
                         <Typography variant="caption" color="text.secondary">
                           {diasRestantes} días restantes
                         </Typography>
                      </Box>

                      {/* Barra de Riesgo */}
                      <Box width={180}>
                        <Stack spacing={0.5}>
                          <Stack direction="row" justifyContent="space-between">
                             <Typography variant="caption" fontWeight={700}>
                               {intentos === 0 ? 'Sin intentos fallidos' : 'Riesgo de Impago'}
                             </Typography>
                             <Typography variant="caption" color={esRiesgoCritico ? 'error.main' : 'text.secondary'}>
                               {intentos}/3
                             </Typography>
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
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="Contactar vía mensaje interno">
                          <Button 
                            variant={esRiesgoCritico ? 'contained' : 'outlined'} 
                            size="small"
                            color={esRiesgoCritico ? 'error' : 'primary'}
                            startIcon={<Email />}
                            onClick={() => handleContactar(lote)}
                          >
                            Contactar
                          </Button>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </Paper>
                );
              })}

              {pendientesPago.length === 0 && (
                 <Box textAlign="center" py={5} color="text.secondary">
                    <CheckCircle sx={{ fontSize: 40, color: 'success.light', mb: 1 }} />
                    <Typography>No hay cobros pendientes. ¡Todos los pagos están al día!</Typography>
                 </Box>
              )}
            </Box>
          </Box>
        )}

      </QueryHandler>

      {/* Modal de Contacto */}
      <ContactarGanadorModal
        open={contactarModalOpen}
        onClose={() => {
          setContactarModalOpen(false);
          setLoteSeleccionado(null);
        }}
        lote={loteSeleccionado}
      />
    </PageContainer>
  );
};

export default AdminSubastas;