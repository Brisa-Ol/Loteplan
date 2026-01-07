import React, { useMemo, useState } from 'react';
import { 
  Box, Typography, Paper, Card, CardContent, CardActions, 
  Button, Chip, Stack, Avatar, Alert, LinearProgress,
  useTheme, Tabs, Tab, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, IconButton, Tooltip, CircularProgress,
  alpha
} from '@mui/material';
import { 
  Gavel, Timer, StopCircle, ReceiptLong, 
  MonetizationOn, Warning, Person, Email,
  ContentCopy, ErrorOutline, Image as ImageIcon,
  Block
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Componentes Comunes
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';
import { DataTable, type DataTableColumn } from '../../../components/common/DataTable/DataTable';


// Servicios y Tipos
import type { LoteDto } from '../../../types/dto/lote.dto';
import type { PujaDto } from '../../../types/dto/puja.dto';
import PujaService from '../../../services/puja.service';
import LoteService from '../../../services/lote.service';
import imagenService from '../../../services/imagen.service';

// Hooks
import { useModal } from '../../../hooks/useModal';
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import { useSnackbar } from '../../../context/SnackbarContext';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog/ConfirmDialog';

// =============================================================================
// SUB-COMPONENTES
// =============================================================================

const StatCard: React.FC<{ 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  color: string; 
  loading?: boolean;
}> = ({ title, value, icon, color, loading }) => {
  const theme = useTheme();
  const paletteColor = (theme.palette as any)[color] || theme.palette.primary;

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, 
        flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 2,
        transition: 'all 0.2s ease',
        '&:hover': { borderColor: paletteColor.main, transform: 'translateY(-2px)' }
      }}
    >
      <Box sx={{ bgcolor: alpha(paletteColor.main, 0.1), color: paletteColor.main, p: 1.5, borderRadius: '50%', display: 'flex' }}>
        {icon}
      </Box>
      <Box sx={{ width: '100%' }}>
        {loading ? (
            <LinearProgress color="inherit" sx={{ width: '60%', mb: 1 }} />
        ) : (
            <Typography variant="h5" fontWeight="bold" color="text.primary">{value}</Typography>
        )}
        <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>
            {title}
        </Typography>
      </Box>
    </Paper>
  );
};

// ✅ MODAL CORREGIDO: Recibe montoGanador como prop externa
const ContactarGanadorModal: React.FC<{
  open: boolean;
  onClose: () => void;
  lote: LoteDto | null;
  montoGanador: number; // Nueva prop
}> = ({ open, onClose, lote, montoGanador }) => {
  const theme = useTheme();
  const [mensajePersonalizado, setMensajePersonalizado] = useState('');

  if (!lote) return null;

  // Usamos el monto pasado por prop (que viene de la Puja) o el precio base como fallback
  const mensajeBase = `Hola Usuario #${lote.id_ganador},\n\nFelicitaciones por ganar la subasta del lote "${lote.nombre_lote}".\n\nMonto a pagar: $${montoGanador.toLocaleString()}\nPlazo de pago: 90 días desde la finalización.\n\nPor favor, contacta con administración para coordinar el pago.`;

  const handleCopiar = () => {
    navigator.clipboard.writeText(mensajePersonalizado || mensajeBase);
    alert('📋 Mensaje copiado al portapapeles');
  };

  return (
    <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, boxShadow: theme.shadows[10] } }}
    >
      <DialogTitle sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), pb: 2 }}>
        Contactar Ganador - Lote #{lote.id}
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Stack spacing={2}>
          <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
            <Typography variant="body2" fontWeight={700}>
              Usuario #{lote.id_ganador}
            </Typography>
            <Typography variant="caption">
              Lote: {lote.nombre_lote} | Intentos Fallidos: {lote.intentos_fallidos_pago}/3
            </Typography>
          </Alert>

          <TextField
            label="Mensaje personalizado"
            multiline rows={6} fullWidth
            value={mensajePersonalizado}
            onChange={(e) => setMensajePersonalizado(e.target.value)}
            placeholder={mensajeBase}
            helperText="Deja vacío para usar el mensaje predeterminado"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />

          <Button variant="outlined" startIcon={<ContentCopy />} onClick={handleCopiar} fullWidth sx={{ borderRadius: 2 }}>
            Copiar Mensaje
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

const AdminPujas: React.FC = () => {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const { showSuccess, showError } = useSnackbar();
  
  const [tabValue, setTabValue] = useState(0);
  
  // Hooks de UI
  const contactarModal = useModal();
  const confirmDialog = useConfirmDialog();
  
  const [loteSeleccionado, setLoteSeleccionado] = useState<LoteDto | null>(null);
  const [montoSeleccionado, setMontoSeleccionado] = useState<number>(0);

  // --- QUERIES ---
  const { data: lotes = [], isLoading: loadingLotes, error: errorLotes } = useQuery<LoteDto[]>({
    queryKey: ['adminLotes'],
    queryFn: async () => (await LoteService.findAllAdmin()).data,
    refetchInterval: 10000, 
  });

  const { data: pujas = [], isLoading: loadingPujas } = useQuery<PujaDto[]>({
    queryKey: ['adminPujas'],
    queryFn: async () => (await PujaService.getAllAdmin()).data,
    refetchInterval: 15000,
  });

  // --- ANALYTICS ---
  const analytics = useMemo(() => {
    const activos = lotes.filter(l => l.estado_subasta === 'activa');
    const pendientesPago = lotes.filter(l => 
      l.estado_subasta === 'finalizada' && l.id_ganador && (l.intentos_fallidos_pago || 0) < 3
    );
    const lotesEnRiesgo = lotes.filter(l => (l.intentos_fallidos_pago || 0) > 0);
    
    // Cálculo de dinero en juego buscando la puja más alta real
    const dineroEnJuego = activos.reduce((acc, lote) => {
        const pujaMasAlta = pujas
            .filter(p => p.id_lote === lote.id)
            .sort((a, b) => Number(b.monto_puja) - Number(a.monto_puja))[0];
        
        return acc + (pujaMasAlta ? Number(pujaMasAlta.monto_puja) : Number(lote.precio_base));
    }, 0);

    const totalPujasActivas = pujas.filter(p => p.estado_puja === 'activa').length;

    return { activos, pendientesPago, lotesEnRiesgo, dineroEnJuego, totalPujas: totalPujasActivas };
  }, [lotes, pujas]);

  // --- MUTATIONS ---
  const endAuctionMutation = useMutation({
    mutationFn: (id: number) => LoteService.endAuction(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      queryClient.invalidateQueries({ queryKey: ['adminPujas'] });
      showSuccess(`🏁 ${res.data.mensaje || 'Subasta finalizada correctamente'}`);
      confirmDialog.close();
    },
    onError: (err: any) => {
        showError(`❌ Error: ${err.response?.data?.error || err.message}`);
        confirmDialog.close();
    }
  });

  const forceFinishMutation = useMutation({
      mutationFn: (idLote: number) => PujaService.manageAuctionEnd(idLote),
      onSuccess: () => {
          showSuccess("Gestión de finalización ejecutada manualmente.");
          queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      },
      onError: (err: any) => showError(`Error: ${err.response?.data?.error}`)
  });

  // --- HELPERS ---
  const getLoteImage = (lote: LoteDto) => 
    lote.imagenes?.[0] ? imagenService.resolveImageUrl(lote.imagenes[0].url) : undefined;

  const getPujasDelLote = (loteId: number) => 
    pujas.filter(p => p.id_lote === loteId && p.estado_puja === 'activa');

  // --- HANDLERS ---
  
  // ✅ Handler Corregido: Busca el monto real en las pujas
  const handleContactar = (lote: LoteDto) => {
    // Buscar la puja ganadora (o más alta) para este lote en la lista de pujas
    const pujaGanadora = pujas
        .filter(p => p.id_lote === lote.id)
        .sort((a, b) => Number(b.monto_puja) - Number(a.monto_puja))[0];

    const monto = pujaGanadora ? Number(pujaGanadora.monto_puja) : Number(lote.precio_base);

    setLoteSeleccionado(lote);
    setMontoSeleccionado(monto);
    contactarModal.open();
  };

  const handleCerrarModal = () => {
    contactarModal.close();
    setLoteSeleccionado(null);
    setMontoSeleccionado(0);
  };

  const handleFinalizarSubasta = (lote: LoteDto) => {
      if (lote.estado_subasta !== 'activa') {
          showError("Esta subasta ya no está activa.");
          return;
      }
      confirmDialog.confirm('end_auction', lote);
  };

  const handleConfirmAction = () => {
      if (confirmDialog.action === 'end_auction' && confirmDialog.data) {
          endAuctionMutation.mutate(confirmDialog.data.id);
      }
  };

  // ... (COLUMNAS y RENDER - El resto del archivo se mantiene igual)

  const columnsCobros: DataTableColumn<LoteDto>[] = useMemo(() => [
    { id: 'lote', label: 'Lote / ID', minWidth: 200, render: (l) => (
        <Stack direction="row" spacing={2} alignItems="center">
            <Avatar src={getLoteImage(l)} variant="rounded" sx={{ width: 40, height: 40, bgcolor: alpha(theme.palette.primary.main, 0.1) }}><ImageIcon color="primary" /></Avatar>
            <Box><Typography fontWeight={700} variant="body2">{l.nombre_lote}</Typography><Typography variant="caption">ID: {l.id}</Typography></Box>
        </Stack>
    )},
    { id: 'ganador', label: 'Ganador', render: (l) => (
        <Stack direction="row" alignItems="center" spacing={1}>
            <Avatar sx={{ width: 24, height: 24, fontSize: 12, bgcolor: alpha(theme.palette.primary.main, 0.2), color: 'primary.main' }}><Person fontSize="inherit"/></Avatar>
            <Typography variant="body2" fontWeight={500}>Usuario #{l.id_ganador}</Typography>
        </Stack>
    )},
    { id: 'estado', label: 'Estado', render: () => <Chip label="Pendiente Pago" color="warning" size="small" variant="outlined" sx={{ fontWeight: 600 }} /> },
    { id: 'acciones', label: 'Acciones', align: 'right', render: (l) => (
        <Button variant="contained" color="primary" size="small" startIcon={<Email />} onClick={() => handleContactar(l)} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>Contactar</Button>
    )}
  ], [theme, pujas]); // Añadimos pujas a dependencias por si acaso, aunque handleContactar lo usa por closure

  const columnsImpagos: DataTableColumn<LoteDto>[] = useMemo(() => [
    { id: 'lote', label: 'Lote', minWidth: 200, render: (l) => <Typography fontWeight={700}>{l.nombre_lote}</Typography> },
    { id: 'intentos', label: 'Intentos Fallidos', minWidth: 150, render: (l) => {
        const intentos = l.intentos_fallidos_pago || 0;
        const isCritical = intentos >= 3;
        return (
            <Stack spacing={0.5} width={120}>
                <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" fontWeight={700} color={isCritical ? 'error.main' : 'warning.dark'}>{intentos}/3</Typography>
                    <Typography variant="caption" color="text.secondary">Intentos</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={(intentos / 3) * 100} color={isCritical ? 'error' : 'warning'} sx={{ height: 6, borderRadius: 3, bgcolor: alpha(theme.palette.grey[400], 0.3) }} />
            </Stack>
        );
    }},
    { id: 'acciones', label: 'Acciones', align: 'right', render: (l) => (
        <Tooltip title="Forzar Finalización de Gestión"><IconButton color="error" onClick={() => forceFinishMutation.mutate(l.id)}><Block /></IconButton></Tooltip>
    )}
  ], [forceFinishMutation]);

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>

      <PageHeader title="Sala de Control de Subastas" subtitle="Gestión en tiempo real de subastas, cobros y monitoreo de impagos." />

      {/* KPIs */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 4 }}>
        <StatCard title="En Vivo" value={analytics.activos.length} icon={<Gavel />} color="success" loading={loadingLotes} />
        <StatCard title="Cobros Pendientes" value={analytics.pendientesPago.length} icon={<ReceiptLong />} color="info" loading={loadingLotes} />
        <StatCard title="Capital en Juego" value={`$${analytics.dineroEnJuego.toLocaleString()}`} icon={<MonetizationOn />} color="warning" loading={loadingLotes} />
        <StatCard title="En Riesgo/Impago" value={analytics.lotesEnRiesgo.length} icon={<ErrorOutline />} color="error" loading={loadingLotes} />
      </Box>

      {/* Tabs */}
      <Paper elevation={0} sx={{ mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.background.paper, 0.6), p: 0.5 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} indicatorColor="primary" textColor="primary" variant="standard" sx={{ '& .MuiTab-root': { minHeight: 48, borderRadius: 1.5, mx: 0.5, textTransform: 'none', fontWeight: 600 } }}>
          <Tab icon={<Timer />} label="EN VIVO" iconPosition="start" />
          <Tab icon={<ReceiptLong />} label="Gestión de Cobros" iconPosition="start" />
          <Tab icon={<Warning />} label={`Monitoreo Impagos (${analytics.lotesEnRiesgo.length})`} iconPosition="start" />
        </Tabs>
      </Paper>

      <QueryHandler isLoading={loadingLotes || loadingPujas} error={errorLotes as Error}>
        
        {/* --- TAB 0: EN VIVO --- */}
        {tabValue === 0 && (
          <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(3, 1fr)' }} gap={3}>
            {analytics.activos.length === 0 && (
                <Paper sx={{ p: 4, gridColumn: '1 / -1', textAlign: 'center', borderRadius: 2, border: '1px dashed', borderColor: 'divider' }} elevation={0}>
                    <Typography color="text.secondary">No hay subastas activas.</Typography>
                </Paper>
            )}
            {analytics.activos.map(lote => {
              const pujasLote = getPujasDelLote(lote.id);
              const maxPuja = pujasLote.length > 0 ? Math.max(...pujasLote.map(p => Number(p.monto_puja))) : Number(lote.precio_base);
              
              return (
                <Card key={lote.id} sx={{ border: `1px solid ${theme.palette.success.main}`, position: 'relative', borderRadius: 2, boxShadow: theme.shadows[3] }}>
                  <Chip label="EN VIVO" color="success" size="small" sx={{ position: 'absolute', top: 10, right: 10, fontWeight: 'bold' }} />
                  <CardContent>
                    <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                      <Avatar src={getLoteImage(lote)} variant="rounded" sx={{ width: 60, height: 60, bgcolor: alpha(theme.palette.success.main, 0.1) }}><Gavel color="success"/></Avatar>
                      <Box>
                        <Typography fontWeight={700} variant="h6" lineHeight={1.2}>{lote.nombre_lote}</Typography>
                        <Typography variant="body2" color="text.secondary">ID: {lote.id}</Typography>
                      </Box>
                    </Stack>
                    <Box textAlign="center" bgcolor={alpha(theme.palette.success.main, 0.08)} color="success.dark" p={2} borderRadius={2} border="1px solid" borderColor={alpha(theme.palette.success.main, 0.2)}>
                      <Typography variant="caption" fontWeight={800} letterSpacing={1}>OFERTA ACTUAL</Typography>
                      <Typography variant="h4" fontWeight={700}>${maxPuja.toLocaleString()}</Typography>
                    </Box>
                  </CardContent>
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button fullWidth variant="contained" color="error" startIcon={<StopCircle />} onClick={() => handleFinalizarSubasta(lote)} sx={{ borderRadius: 2, fontWeight: 700 }}>Finalizar Subasta</Button>
                  </CardActions>
                </Card>
              );
            })}
          </Box>
        )}

        {/* --- TAB 1: GESTIÓN DE COBROS --- */}
        {tabValue === 1 && (
          <DataTable columns={columnsCobros} data={analytics.pendientesPago} getRowKey={(row) => row.id} emptyMessage="No hay cobros pendientes." pagination={true} defaultRowsPerPage={5} />
        )}

        {/* --- TAB 2: MONITOREO IMPAGOS --- */}
        {tabValue === 2 && (
          <DataTable columns={columnsImpagos} data={analytics.lotesEnRiesgo} getRowKey={(row) => row.id} emptyMessage="No hay lotes en riesgo." pagination={true} defaultRowsPerPage={5} />
        )}

      </QueryHandler>

      {/* Modal de Contacto Correctamente Conectado */}
      <ContactarGanadorModal 
        open={contactarModal.isOpen} 
        onClose={handleCerrarModal} 
        lote={loteSeleccionado} 
        montoGanador={montoSeleccionado} 
      />
      
      <ConfirmDialog controller={confirmDialog} onConfirm={handleConfirmAction} isLoading={endAuctionMutation.isPending} />

    </PageContainer>
  );
};

export default AdminPujas;