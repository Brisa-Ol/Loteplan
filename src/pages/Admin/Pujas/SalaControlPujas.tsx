// src/pages/Admin/Lotes/SalaControlPujas.tsx
import React, { useMemo, useState } from 'react';
import { 
  Box, Typography, Paper, Card, CardContent, CardActions, 
  Button, Chip, Stack, Avatar, Alert, LinearProgress,
  useTheme, Tabs, Tab, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, IconButton
} from '@mui/material';
import { 
  Gavel, Timer, StopCircle, ReceiptLong, 
  MonetizationOn, Warning, Person, Email,
  CheckCircle, ContentCopy, TrendingUp,
  ErrorOutline
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';

import type { LoteDto } from '../../../types/dto/lote.dto';
import type { PujaDto } from '../../../types/dto/puja.dto';
import LoteService from '../../../Services/lote.service';
import PujaService from '../../../Services/puja.service';
import imagenService from '../../../Services/imagen.service';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';

// --- SUB-COMPONENTES ---

const KpiCard: React.FC<{ 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  color: 'success' | 'info' | 'warning' | 'error' 
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
              Lote: {lote.nombre_lote} | Intentos Fallidos: {lote.intentos_fallidos_pago}/3
            </Typography>
          </Alert>

          <TextField
            label="Mensaje personalizado"
            multiline
            rows={6}
            fullWidth
            value={mensajePersonalizado}
            onChange={(e) => setMensajePersonalizado(e.target.value)}
            placeholder={mensajeBase}
            helperText="Deja vacío para usar el mensaje predeterminado"
          />

          <Button
            variant="outlined"
            startIcon={<ContentCopy />}
            onClick={handleCopiar}
            fullWidth
          >
            Copiar Mensaje
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

// --- PANTALLA PRINCIPAL ---

const SalaControlPujas: React.FC = () => {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [contactarModalOpen, setContactarModalOpen] = useState(false);
  const [loteSeleccionado, setLoteSeleccionado] = useState<LoteDto | null>(null);

  // Queries
  const { data: lotes = [], isLoading: loadingLotes, error: errorLotes } = useQuery<LoteDto[]>({
    queryKey: ['adminLotes'],
    queryFn: async () => (await LoteService.findAllAdmin()).data,
    refetchInterval: 10000, 
  });

  const { data: pujas = [], isLoading: loadingPujas } = useQuery<PujaDto[]>({
    queryKey: ['adminPujas'],
    queryFn: async () => (await PujaService.findAll()).data,
    refetchInterval: 15000,
  });

  // Analytics & Filtering
  const analytics = useMemo(() => {
    const activos = lotes.filter(l => l.estado_subasta === 'activa');
    
    // Pendientes: Finalizados, con ganador, intentos < 3 (aún viables)
    const pendientesPago = lotes.filter(l => 
      l.estado_subasta === 'finalizada' && 
      l.id_ganador && 
      (l.intentos_fallidos_pago || 0) < 3
    );
    
    // Impagos/Riesgo: Lotes con al menos 1 fallo registrado (Monitoreo de riesgo)
    const lotesEnRiesgo = lotes.filter(l => (l.intentos_fallidos_pago || 0) > 0);

    const dineroEnJuego = activos.reduce((acc, curr) => acc + Number(curr.precio_base), 0);
    const pujasActivas = pujas.filter(p => p.estado_puja === 'activa');

    return { 
      activos, 
      pendientesPago, 
      lotesEnRiesgo,
      dineroEnJuego,
      totalPujas: pujasActivas.length,
    };
  }, [lotes, pujas]);

  // Mutations
  const endAuctionMutation = useMutation({
    mutationFn: (id: number) => LoteService.endAuction(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      alert(`🏁 ${res.data.mensaje}`);
    },
    onError: (err: any) => alert(`❌ Error: ${err.message}`)
  });

  // Helpers
  const getLoteImage = (lote: LoteDto) => 
    lote.imagenes?.[0] ? imagenService.resolveImageUrl(lote.imagenes[0].url) : undefined;

  const getPujasDelLote = (loteId: number) => 
    pujas.filter(p => p.id_lote === loteId && p.estado_puja === 'activa');

  return (
    <PageContainer maxWidth="xl">

<PageHeader
              title=" Sala de Control de Subastas"
              subtitle=" Gestión en tiempo real de subastas, cobros y monitoreo de impagos."
            />
      {/* KPIs */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={4}>
        <KpiCard title="En Vivo" value={analytics.activos.length} icon={<Gavel />} color="success" />
        <KpiCard title="Cobros Pendientes" value={analytics.pendientesPago.length} icon={<ReceiptLong />} color="info" />
        <KpiCard title="Capital Activo" value={`$${analytics.dineroEnJuego.toLocaleString()}`} icon={<MonetizationOn />} color="warning" />
        <KpiCard title="En Riesgo/Impago" value={analytics.lotesEnRiesgo.length} icon={<ErrorOutline />} color="error" />
      </Stack>

      {/* Tabs */}
      <Paper elevation={0} sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} indicatorColor="primary" textColor="primary">
          <Tab icon={<Timer />} label="EN VIVO" iconPosition="start" />
          <Tab icon={<ReceiptLong />} label="Gestión de Cobros" iconPosition="start" />
          <Tab icon={<Warning />} label={`Monitoreo Impagos (${analytics.lotesEnRiesgo.length})`} iconPosition="start" />
        </Tabs>
      </Paper>

      <QueryHandler isLoading={loadingLotes || loadingPujas} error={errorLotes as Error}>
        
        {/* --- TAB 1: EN VIVO --- */}
        {tabValue === 0 && (
          <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(3, 1fr)' }} gap={3}>
            {analytics.activos.length === 0 && <Typography p={4} color="text.secondary">No hay subastas activas.</Typography>}
            {analytics.activos.map(lote => {
              const pujasLote = getPujasDelLote(lote.id);
              const maxPuja = pujasLote.length > 0 ? Math.max(...pujasLote.map(p => Number(p.monto_puja))) : Number(lote.precio_base);
              
              return (
                <Card key={lote.id} sx={{ border: '2px solid', borderColor: 'success.main', position: 'relative' }}>
                  <Chip label="EN VIVO" color="success" sx={{ position: 'absolute', top: 10, right: 10, fontWeight: 'bold' }} />
                  <CardContent>
                    <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                      <Avatar src={getLoteImage(lote)} variant="rounded" sx={{ width: 60, height: 60 }}><Gavel/></Avatar>
                      <Box>
                        <Typography fontWeight={700}>{lote.nombre_lote}</Typography>
                        <Typography variant="body2" color="text.secondary">ID: {lote.id}</Typography>
                      </Box>
                    </Stack>
                    <Box textAlign="center" bgcolor="success.light" color="success.dark" p={2} borderRadius={2}>
                      <Typography variant="caption" fontWeight={700}>OFERTA ACTUAL</Typography>
                      <Typography variant="h4" fontWeight={700}>${maxPuja.toLocaleString()}</Typography>
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button fullWidth variant="outlined" color="error" startIcon={<StopCircle />} onClick={() => {
                        if(confirm('¿Finalizar subasta?')) endAuctionMutation.mutate(lote.id);
                    }}>
                      Finalizar
                    </Button>
                  </CardActions>
                </Card>
              );
            })}
          </Box>
        )}

        {/* --- TAB 2: GESTIÓN DE COBROS --- */}
        {tabValue === 1 && (
          <Stack spacing={2}>
            {analytics.pendientesPago.length === 0 && <Typography p={4} color="text.secondary">No hay cobros pendientes.</Typography>}
            {analytics.pendientesPago.map(lote => (
              <Paper key={lote.id} variant="outlined" sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar src={getLoteImage(lote)} variant="rounded"><ReceiptLong /></Avatar>
                  <Box flex={1}>
                    <Typography fontWeight={700}>{lote.nombre_lote}</Typography>
                    <Typography variant="body2">Ganador: Usuario #{lote.id_ganador}</Typography>
                  </Box>
                  <Chip label="Pendiente Pago" color="warning" />
                  <Button variant="outlined" startIcon={<Email />} onClick={() => {
                    setLoteSeleccionado(lote);
                    setContactarModalOpen(true);
                  }}>Contactar</Button>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}

        {/* --- TAB 3: MONITOREO DE IMPAGOS (VISUALIZACIÓN) --- */}
        {tabValue === 2 && (
          <Stack spacing={2}>
            {analytics.lotesEnRiesgo.length === 0 && (
              <Alert severity="success">No hay lotes con registros de impagos o fallos recientes.</Alert>
            )}
            
            {analytics.lotesEnRiesgo.map(lote => {
              const intentos = lote.intentos_fallidos_pago;
              const isCritical = intentos >= 3;

              return (
                <Paper key={lote.id} variant="outlined" sx={{ p: 2, borderColor: isCritical ? 'error.main' : 'warning.main', bgcolor: isCritical ? 'error.50' : 'background.paper' }}>
                  <Stack direction={{ xs: 'column', md: 'row' }} alignItems="center" spacing={3}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">LOTE #{lote.id}</Typography>
                      <Typography fontWeight={700} variant="h6">{lote.nombre_lote}</Typography>
                    </Box>

                    <Box flex={1}>
                      <Typography variant="body2" fontWeight={600} gutterBottom>
                        Estado de Intentos de Pago
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <LinearProgress 
                          variant="determinate" 
                          value={(intentos / 3) * 100} 
                          color={isCritical ? 'error' : 'warning'}
                          sx={{ flex: 1, height: 10, borderRadius: 5 }}
                        />
                        <Typography fontWeight={700} color={isCritical ? 'error.main' : 'warning.dark'}>
                          {intentos}/3
                        </Typography>
                      </Stack>
                    </Box>

                    <Box textAlign="right">
                      <Typography variant="caption" display="block">Último Ganador (Fallido)</Typography>
                      <Chip 
                        icon={<Person />} 
                        label={`Usuario #${lote.id_ganador}`} 
                        variant="outlined" 
                        color={isCritical ? 'error' : 'default'} 
                      />
                    </Box>

                    {/* Solo permitimos contactar, ya que "Procesar Impago" es automático en el back */}
                    <Button 
                      variant="contained" 
                      color={isCritical ? 'error' : 'warning'}
                      startIcon={<Email />}
                      onClick={() => {
                        setLoteSeleccionado(lote);
                        setContactarModalOpen(true);
                      }}
                    >
                      Contactar
                    </Button>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        )}

      </QueryHandler>

      <ContactarGanadorModal 
        open={contactarModalOpen} 
        onClose={() => setContactarModalOpen(false)} 
        lote={loteSeleccionado} 
      />
    </PageContainer>
  );
};

export default SalaControlPujas;