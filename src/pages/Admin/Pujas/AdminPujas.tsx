// src/pages/Admin/Subastas/SalaControlPujas.tsx

import React, { useMemo, useState } from 'react';
import { 
  Box, Typography, Paper, Card, CardContent, CardActions, 
  Button, Chip, Stack, Avatar, Alert, LinearProgress,
  useTheme, Tabs, Tab, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, IconButton, Tooltip, CircularProgress,
  alpha, Divider
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

// =============================================================================
// SUB-COMPONENTES (Tarjetas y Modales)
// =============================================================================

// --- STAT CARD ESTANDARIZADA ---
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
        p: 2, 
        border: '1px solid', 
        borderColor: 'divider', 
        borderRadius: 2, 
        flex: 1, 
        minWidth: 0, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        transition: 'all 0.2s ease',
        '&:hover': {
            borderColor: paletteColor.main,
            transform: 'translateY(-2px)'
        }
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

// --- MODAL DE CONTACTO ---
const ContactarGanadorModal: React.FC<{
  open: boolean;
  onClose: () => void;
  lote: LoteDto | null;
}> = ({ open, onClose, lote }) => {
  const theme = useTheme();
  const [mensajePersonalizado, setMensajePersonalizado] = useState('');

  if (!lote) return null;

  const mensajeBase = `Hola Usuario #${lote.id_ganador},\n\nFelicitaciones por ganar la subasta del lote "${lote.nombre_lote}".\n\nMonto a pagar: $${Number(lote.precio_base).toLocaleString()}\nPlazo de pago: 90 días desde la finalización.\n\nPor favor, contacta con administración para coordinar el pago.`;

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
  
  const [tabValue, setTabValue] = useState(0);
  
  // Hooks de UI
  const contactarModal = useModal();
  const [loteSeleccionado, setLoteSeleccionado] = useState<LoteDto | null>(null);

  // --- QUERIES ---
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

  // --- ANALYTICS ---
  const analytics = useMemo(() => {
    const activos = lotes.filter(l => l.estado_subasta === 'activa');
    const pendientesPago = lotes.filter(l => 
      l.estado_subasta === 'finalizada' && l.id_ganador && (l.intentos_fallidos_pago || 0) < 3
    );
    const lotesEnRiesgo = lotes.filter(l => (l.intentos_fallidos_pago || 0) > 0);
    const dineroEnJuego = activos.reduce((acc, curr) => acc + Number(curr.precio_base), 0);
    const pujasActivas = pujas.filter(p => p.estado_puja === 'activa');

    return { activos, pendientesPago, lotesEnRiesgo, dineroEnJuego, totalPujas: pujasActivas.length };
  }, [lotes, pujas]);

  // --- MUTATIONS ---
  const endAuctionMutation = useMutation({
    mutationFn: (id: number) => LoteService.endAuction(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      alert(`🏁 ${res.data.mensaje}`);
    },
    onError: (err: any) => alert(`❌ Error: ${err.message}`)
  });

  const forceDefaultMutation = useMutation({
    mutationFn: async (lote: LoteDto) => {
      if (!lote.id_puja_mas_alta) throw new Error("No se encontró la puja ganadora asociada.");
      return await PujaService.updateAdmin(lote.id_puja_mas_alta, {
        estado_puja: 'ganadora_incumplimiento'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      queryClient.invalidateQueries({ queryKey: ['adminPujas'] });
      alert("✅ Puja marcada como incumplida. El token se gestionará según políticas.");
    },
    onError: (err: any) => alert(`Error al declarar incumplimiento: ${err.message}`)
  });

  // --- HELPERS ---
  const getLoteImage = (lote: LoteDto) => 
    lote.imagenes?.[0] ? imagenService.resolveImageUrl(lote.imagenes[0].url) : undefined;

  const getPujasDelLote = (loteId: number) => 
    pujas.filter(p => p.id_lote === loteId && p.estado_puja === 'activa');

  // Handlers
  const handleContactar = (lote: LoteDto) => {
    setLoteSeleccionado(lote);
    contactarModal.open();
  };

  const handleCerrarModal = () => {
    contactarModal.close();
    setLoteSeleccionado(null);
  };

  // ========================================================================
  // ⚙️ COLUMNAS: GESTIÓN DE COBROS (TAB 1)
  // ========================================================================
  const columnsCobros: DataTableColumn<LoteDto>[] = useMemo(() => [
    {
      id: 'lote', label: 'Lote / ID', minWidth: 200,
      render: (lote) => (
        <Stack direction="row" spacing={2} alignItems="center">
            <Avatar 
                src={getLoteImage(lote)} 
                variant="rounded" 
                sx={{ width: 40, height: 40, bgcolor: alpha(theme.palette.primary.main, 0.1) }}
            >
                <ImageIcon color="primary" />
            </Avatar>
            <Box>
                <Typography fontWeight={700} variant="body2">{lote.nombre_lote}</Typography>
                <Typography variant="caption" color="text.secondary">ID: {lote.id}</Typography>
            </Box>
        </Stack>
      )
    },
    {
      id: 'ganador', label: 'Ganador',
      render: (lote) => (
        <Stack direction="row" alignItems="center" spacing={1}>
            <Avatar sx={{ width: 24, height: 24, fontSize: 12, bgcolor: alpha(theme.palette.primary.main, 0.2), color: 'primary.main' }}>
                <Person fontSize="inherit"/>
            </Avatar>
            <Typography variant="body2" fontWeight={500}>Usuario #{lote.id_ganador}</Typography>
        </Stack>
      )
    },
    {
      id: 'estado', label: 'Estado',
      render: () => <Chip label="Pendiente Pago" color="warning" size="small" variant="outlined" sx={{ fontWeight: 600 }} />
    },
    {
      id: 'acciones', label: 'Acciones', align: 'right',
      render: (lote) => (
        <Button 
            variant="contained" color="primary" size="small" startIcon={<Email />} 
            onClick={() => handleContactar(lote)}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
        >
            Contactar
        </Button>
      )
    }
  ], [theme]);

  // ========================================================================
  // ⚙️ COLUMNAS: MONITOREO IMPAGOS (TAB 2)
  // ========================================================================
  const columnsImpagos: DataTableColumn<LoteDto>[] = useMemo(() => [
    {
      id: 'lote', label: 'Lote / ID', minWidth: 200,
      render: (lote) => (
        <Box>
            <Typography fontWeight={700} variant="body2">{lote.nombre_lote}</Typography>
            <Typography variant="caption" color="text.secondary">ID: {lote.id}</Typography>
        </Box>
      )
    },
    {
      id: 'intentos', label: 'Estado Intentos', minWidth: 180,
      render: (lote) => {
        const intentos = lote.intentos_fallidos_pago || 0;
        const isCritical = intentos >= 3;
        return (
            <Stack spacing={0.5} width={150}>
                <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" fontWeight={700} color={isCritical ? 'error.main' : 'warning.dark'}>
                        {intentos}/3
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Intentos</Typography>
                </Stack>
                <LinearProgress 
                    variant="determinate" value={(intentos / 3) * 100} 
                    color={isCritical ? 'error' : 'warning'} 
                    sx={{ height: 6, borderRadius: 3, bgcolor: alpha(theme.palette.grey[400], 0.3) }}
                />
            </Stack>
        );
      }
    },
    {
      id: 'ganador', label: 'Último Ganador',
      render: (lote) => {
        const isCritical = (lote.intentos_fallidos_pago || 0) >= 3;
        return (
            <Chip 
                icon={<Person sx={{ fontSize: '14px !important' }} />} 
                label={`Usuario #${lote.id_ganador}`} 
                variant="outlined" size="small"
                color={isCritical ? 'error' : 'default'} 
                sx={{ fontWeight: 500 }}
            />
        );
      }
    },
    {
      id: 'acciones', label: 'Acciones', align: 'right', minWidth: 120,
      render: (lote) => {
        const isCritical = (lote.intentos_fallidos_pago || 0) >= 3;
        const isProcessing = forceDefaultMutation.isPending && forceDefaultMutation.variables?.id === lote.id;

        return (
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
                <Tooltip title="Contactar Ganador">
                    <IconButton 
                        size="small"
                        sx={{ 
                            color: isCritical ? 'error.main' : 'warning.main',
                            bgcolor: isCritical ? alpha(theme.palette.error.main, 0.1) : alpha(theme.palette.warning.main, 0.1),
                            '&:hover': { bgcolor: isCritical ? alpha(theme.palette.error.main, 0.2) : alpha(theme.palette.warning.main, 0.2) }
                        }}
                        onClick={() => handleContactar(lote)}
                    >
                        <Email fontSize="small" />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Ejecutar Incumplimiento Manual">
                    <IconButton 
                        size="small"
                        color="error"
                        disabled={forceDefaultMutation.isPending}
                        onClick={() => {
                            if (window.confirm(`⚠️ ACCIÓN DESTRUCTIVA\n\n¿Estás seguro de declarar INCUMPLIMIENTO para el Lote ${lote.id}?\n\n- La puja ganadora se anulará.\n- Se gestionará el token del usuario.\n- El lote quedará libre o pasará al siguiente.`)) {
                                forceDefaultMutation.mutate(lote);
                            }
                        }}
                        sx={{ 
                            bgcolor: alpha(theme.palette.error.main, 0.1), 
                            '&:hover': { bgcolor: theme.palette.error.main, color: 'white' } 
                        }}
                    >
                        {isProcessing ? <CircularProgress size={20} color="inherit" /> : <Block fontSize="small" />}
                    </IconButton>
                </Tooltip>
            </Stack>
        );
      }
    }
  ], [theme, forceDefaultMutation.isPending]);

  return (
    <PageContainer maxWidth="xl">

      <PageHeader
        title="Sala de Control de Subastas"
        subtitle="Gestión en tiempo real de subastas, cobros y monitoreo de impagos."
      />

      {/* KPIs */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 4 }}>
        <StatCard title="En Vivo" value={analytics.activos.length} icon={<Gavel />} color="success" loading={loadingLotes} />
        <StatCard title="Cobros Pendientes" value={analytics.pendientesPago.length} icon={<ReceiptLong />} color="info" loading={loadingLotes} />
        <StatCard title="Capital Activo" value={`$${analytics.dineroEnJuego.toLocaleString()}`} icon={<MonetizationOn />} color="warning" loading={loadingLotes} />
        <StatCard title="En Riesgo/Impago" value={analytics.lotesEnRiesgo.length} icon={<ErrorOutline />} color="error" loading={loadingLotes} />
      </Box>

      {/* Tabs */}
      <Paper 
        elevation={0} 
        sx={{ 
            mb: 3, 
            borderRadius: 2, 
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: alpha(theme.palette.background.paper, 0.6),
            p: 0.5
        }} 
      >
        <Tabs 
            value={tabValue} 
            onChange={(_, v) => setTabValue(v)} 
            indicatorColor="primary" 
            textColor="primary" 
            variant="standard"
            sx={{
                '& .MuiTab-root': {
                    minHeight: 48,
                    borderRadius: 1.5,
                    mx: 0.5,
                    textTransform: 'none',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                    '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                }
            }}
        >
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
                    <Typography color="text.secondary" fontWeight={500}>No hay subastas activas en este momento.</Typography>
                </Paper>
            )}
            {analytics.activos.map(lote => {
              const pujasLote = getPujasDelLote(lote.id);
              const maxPuja = pujasLote.length > 0 ? Math.max(...pujasLote.map(p => Number(p.monto_puja))) : Number(lote.precio_base);
              
              return (
                <Card key={lote.id} sx={{ border: `1px solid ${theme.palette.success.main}`, position: 'relative', borderRadius: 2, boxShadow: theme.shadows[3] }}>
                  <Chip 
                    label="EN VIVO" 
                    color="success" 
                    size="small"
                    sx={{ position: 'absolute', top: 10, right: 10, fontWeight: 'bold' }} 
                  />
                  <CardContent>
                    <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                      <Avatar 
                        src={getLoteImage(lote)} 
                        variant="rounded" 
                        sx={{ width: 60, height: 60, bgcolor: alpha(theme.palette.success.main, 0.1) }}
                      >
                        <Gavel color="success"/>
                      </Avatar>
                      <Box>
                        <Typography fontWeight={700} variant="h6" lineHeight={1.2}>{lote.nombre_lote}</Typography>
                        <Typography variant="body2" color="text.secondary">ID: {lote.id}</Typography>
                      </Box>
                    </Stack>
                    <Box 
                        textAlign="center" 
                        bgcolor={alpha(theme.palette.success.main, 0.08)} 
                        color="success.dark" 
                        p={2} borderRadius={2} 
                        border="1px solid" 
                        borderColor={alpha(theme.palette.success.main, 0.2)}
                    >
                      <Typography variant="caption" fontWeight={800} letterSpacing={1}>OFERTA ACTUAL</Typography>
                      <Typography variant="h4" fontWeight={700}>${maxPuja.toLocaleString()}</Typography>
                    </Box>
                  </CardContent>
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button 
                        fullWidth 
                        variant="contained" 
                        color="error" 
                        startIcon={<StopCircle />} 
                        onClick={() => {
                            if(confirm('¿Finalizar subasta?')) endAuctionMutation.mutate(lote.id);
                        }}
                        sx={{ borderRadius: 2, fontWeight: 700 }}
                    >
                      Finalizar Subasta
                    </Button>
                  </CardActions>
                </Card>
              );
            })}
          </Box>
        )}

        {/* --- TAB 1: GESTIÓN DE COBROS --- */}
        {tabValue === 1 && (
          <DataTable
            columns={columnsCobros}
            data={analytics.pendientesPago}
            getRowKey={(row) => row.id}
            emptyMessage="No hay cobros pendientes."
            pagination={true}
            defaultRowsPerPage={5}
          />
        )}

        {/* --- TAB 2: MONITOREO IMPAGOS --- */}
        {tabValue === 2 && (
          <DataTable
            columns={columnsImpagos}
            data={analytics.lotesEnRiesgo}
            getRowKey={(row) => row.id}
            emptyMessage="No hay lotes con registros de impagos o fallos recientes."
            pagination={true}
            defaultRowsPerPage={5}
          />
        )}

      </QueryHandler>

      {/* Modales */}
      <ContactarGanadorModal 
        open={contactarModal.isOpen} 
        onClose={handleCerrarModal} 
        lote={loteSeleccionado} 
      />
    </PageContainer>
  );
};

export default AdminPujas;