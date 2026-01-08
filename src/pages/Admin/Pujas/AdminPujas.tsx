import React, { useMemo, useState } from 'react';
import { 
  Box, Typography, Paper, Card, CardContent, CardActions, 
  Button, Chip, Stack, Avatar, LinearProgress,
  useTheme, Tabs, Tab, TextField, IconButton, Tooltip,
  alpha, Collapse
} from '@mui/material';
import { 
  Gavel, Timer, StopCircle, ReceiptLong, 
  MonetizationOn, Warning, ErrorOutline, Image as ImageIcon,
  Block, TrendingUp, FilterList, NotificationsActive, EmojiEvents,
  Person, CancelScheduleSend
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Componentes Comunes
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';
import { DataTable, type DataTableColumn } from '../../../components/common/DataTable/DataTable';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog/ConfirmDialog';

// Servicios
import PujaService from '../../../services/puja.service';
import LoteService from '../../../services/lote.service';
import UsuarioService from '../../../services/usuario.service';
import imagenService from '../../../services/imagen.service';

// Tipos
import type { LoteDto } from '../../../types/dto/lote.dto';
import type { PujaDto } from '../../../types/dto/puja.dto';
import type { UsuarioDto } from '../../../types/dto/usuario.dto';

// Hooks y Modales
import { useModal } from '../../../hooks/useModal';
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import { useSnackbar } from '../../../context/SnackbarContext';
import DetallePujaModal from './components/DetallePujaModal';
import ContactarGanadorModal from './components/ContactarGanadorModal';

// =============================================================================
// SUB-COMPONENTES Y HELPERS
// =============================================================================

const getDiasRestantes = (fechaVencimiento?: string) => {
  if (!fechaVencimiento) return 0;
  const hoy = new Date();
  const vencimiento = new Date(fechaVencimiento);
  const diffTime = vencimiento.getTime() - hoy.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
};

// Componente Top 3 Ranking
const Top3Ranking: React.FC<{ 
  pujas: PujaDto[]; 
  getUserName: (id: number) => string;
}> = ({ pujas, getUserName }) => {
  const top3 = pujas.slice(0, 3);
  const theme = useTheme();

  return (
    <Box sx={{ mt: 2, bgcolor: alpha(theme.palette.background.paper, 0.5), borderRadius: 2, p: 1 }}>
      <Typography variant="caption" fontWeight={700} color="text.secondary" mb={1} display="block">
        TOP 3 OFERTAS
      </Typography>
      <Stack spacing={1}>
        {top3.map((puja, index) => {
          const isWinner = index === 0;
          return (
            <Stack key={puja.id} direction="row" alignItems="center" justifyContent="space-between" 
              sx={{ 
                p: 0.5, px: 1, borderRadius: 1, 
                bgcolor: isWinner ? alpha(theme.palette.success.main, 0.1) : 'transparent',
                borderLeft: isWinner ? `3px solid ${theme.palette.success.main}` : '3px solid transparent'
              }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                {isWinner ? <EmojiEvents fontSize="small" color="success" /> : <Typography variant="caption" fontWeight={700} width={20} align="center">#{index + 1}</Typography>}
                <Typography variant="body2" fontWeight={isWinner ? 700 : 400}>
                   {getUserName(puja.id_usuario)}
                </Typography>
              </Stack>
              <Typography variant="body2" fontWeight={700}>${Number(puja.monto_puja).toLocaleString()}</Typography>
            </Stack>
          );
        })}
        {top3.length === 0 && <Typography variant="caption" color="text.secondary" align="center">Aún no hay ofertas.</Typography>}
      </Stack>
    </Box>
  );
};

const StatCard: React.FC<{ 
  title: string; value: string | number; icon: React.ReactNode; color: string; loading?: boolean; 
}> = ({ title, value, icon, color, loading }) => {
  const theme = useTheme();
  const paletteColor = (theme.palette as any)[color] || theme.palette.primary;
  return (
    <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box sx={{ bgcolor: alpha(paletteColor.main, 0.1), color: paletteColor.main, p: 1.5, borderRadius: '50%', display: 'flex' }}>{icon}</Box>
      <Box sx={{ width: '100%' }}>
        {loading ? <LinearProgress color="inherit" sx={{ width: '60%', mb: 1 }} /> : <Typography variant="h5" fontWeight="bold">{value}</Typography>}
        <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>{title}</Typography>
      </Box>
    </Paper>
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
  const [filtrosVisible, setFiltrosVisible] = useState(false);
  
  const [filterLoteNombre, setFilterLoteNombre] = useState('');
  const [filterUserId, setFilterUserId] = useState('');

  // Modales
  const contactarModal = useModal();
  const detallePujaModal = useModal();
  const confirmDialog = useConfirmDialog();
  
  const [loteSeleccionado, setLoteSeleccionado] = useState<LoteDto | null>(null);
  const [pujaSeleccionada, setPujaSeleccionada] = useState<PujaDto | null>(null);
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
    refetchInterval: tabValue === 0 ? 5000 : 15000,
  });

  const { data: usuarios = [] } = useQuery<UsuarioDto[]>({
    queryKey: ['adminUsuarios'],
    queryFn: async () => (await UsuarioService.findAllAdmins()).data,
    staleTime: 1000 * 60 * 5, 
  });

  const getUserName = (id: number) => {
    const user = usuarios.find(u => u.id === id);
    if (user) return user.nombre_usuario || `${user.nombre} ${user.apellido}`;
    return `User #${id}`;
  };

  // --- ANALYTICS ---
  const filteredLotes = useMemo(() => {
    let result = lotes;
    if (filterLoteNombre) {
      result = result.filter(l => l.nombre_lote.toLowerCase().includes(filterLoteNombre.toLowerCase()));
    }
    return result;
  }, [lotes, filterLoteNombre]);

  const pujasPorLote = useMemo(() => {
    const map: Record<number, PujaDto[]> = {};
    pujas.forEach(p => {
      if (filterUserId && p.id_usuario.toString() !== filterUserId) return;
      if (!map[p.id_lote]) map[p.id_lote] = [];
      map[p.id_lote].push(p);
    });
    Object.keys(map).forEach(key => {
      map[Number(key)].sort((a, b) => Number(b.monto_puja) - Number(a.monto_puja));
    });
    return map;
  }, [pujas, filterUserId]);

  const analytics = useMemo(() => {
    const activos = filteredLotes.filter(l => l.estado_subasta === 'activa');
    const pendientesPago = filteredLotes.filter(l => {
        const matchesUser = filterUserId ? l.id_ganador?.toString() === filterUserId : true;
        return l.estado_subasta === 'finalizada' && l.id_ganador && (l.intentos_fallidos_pago || 0) < 3 && matchesUser;
    });
    const lotesEnRiesgo = filteredLotes.filter(l => (l.intentos_fallidos_pago || 0) > 0);
    const dineroEnJuego = activos.reduce((acc, lote) => {
        const topPuja = pujasPorLote[lote.id]?.[0];
        return acc + (topPuja ? Number(topPuja.monto_puja) : Number(lote.precio_base));
    }, 0);
    const totalPujasActivas = pujas.filter(p => p.estado_puja === 'activa').length;

    return { activos, pendientesPago, lotesEnRiesgo, dineroEnJuego, totalPujas: totalPujasActivas };
  }, [filteredLotes, pujasPorLote, pujas, filterUserId]);

  // --- MUTATIONS ---
  const endAuctionMutation = useMutation({
    mutationFn: (id: number) => LoteService.endAuction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      queryClient.invalidateQueries({ queryKey: ['adminPujas'] });
      showSuccess('Subasta finalizada correctamente');
      confirmDialog.close();
    },
    onError: () => { showError('Error al finalizar'); confirmDialog.close(); }
  });

  const enviarRecordatorioMutation = useMutation({
    mutationFn: async (loteId: number) => new Promise(resolve => setTimeout(resolve, 800)),
    onSuccess: () => showSuccess('📧 Recordatorio enviado'),
  });

  const forceFinishMutation = useMutation({
      mutationFn: ({ idLote, idGanador }: { idLote: number, idGanador: number | null }) => 
          PujaService.manageAuctionEnd(idLote, idGanador),
      onSuccess: () => {
          showSuccess("Gestión ejecutada manualmente.");
          queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      },
      onError: (err: any) => showError(`Error: ${err.response?.data?.error || 'Datos inválidos'}`)
  });

  // 🔴 NUEVA MUTACIÓN: Cancelación Anticipada
  const cancelarGanadoraMutation = useMutation({
    mutationFn: async ({ id, motivo }: { id: number; motivo: string }) => {
      return await PujaService.cancelarGanadoraAnticipada(id, motivo);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      queryClient.invalidateQueries({ queryKey: ['adminPujas'] });
      // Usamos message del backend, fallback a mensaje, fallback a string genérico
      const msg = res.data.message || (res.data as any).mensaje || 'Adjudicación anulada y token devuelto.';
      showSuccess(`✅ ${msg}`);
      confirmDialog.close();
    },
    onError: (err: any) => {
        showError(err.response?.data?.message || 'Error al cancelar adjudicación');
        confirmDialog.close();
    }
  });

  // --- HANDLERS ---
  const handleContactar = (lote: LoteDto) => {
    const pujaGanadora = pujas.find(p => p.id_lote === lote.id && (p.estado_puja === 'ganadora_pendiente' || p.estado_puja === 'ganadora_pagada'));
    const monto = pujaGanadora ? Number(pujaGanadora.monto_puja) : Number(lote.precio_base);
    setLoteSeleccionado(lote);
    setMontoSeleccionado(monto);
    contactarModal.open();
  };

  const handleFinalizarSubasta = (lote: LoteDto) => {
      confirmDialog.confirm('end_auction', lote);
  };
  
  // 🔴 HANDLER NUEVO: Cancelación manual usando el nuevo DIALOGO (no prompt)
  const handleCancelarAdjudicacion = (lote: LoteDto) => {
    const puja = pujas.find(p => p.id_lote === lote.id && p.estado_puja === 'ganadora_pendiente');
    if (!puja) return showError('No se encontró la puja ganadora pendiente.');

    // Llamamos al confirm pasando la pujaId en data para usarla luego
    confirmDialog.confirm('cancel_ganadora_anticipada', { 
        ...lote, 
        pujaId: puja.id,
        id_ganador: lote.id_ganador // Para el mensaje descriptivo
    });
  };

  // ✅ CONFIRM ACTION: Ahora maneja el input value
  const handleConfirmAction = (inputValue?: string) => {
      // 1. Finalizar Subasta
      if (confirmDialog.action === 'end_auction' && confirmDialog.data) {
          endAuctionMutation.mutate(confirmDialog.data.id);
      }
      // 2. Forzar Fin Gestión
      if (confirmDialog.action === 'force_confirm_transaction' && confirmDialog.data) {
          // Lógica anterior si existe...
      }
      
      // 🔴 3. Cancelación Anticipada (Con Input)
      if (confirmDialog.action === 'cancel_ganadora_anticipada' && confirmDialog.data) {
          if (!inputValue) return;
          cancelarGanadoraMutation.mutate({ 
              id: confirmDialog.data.pujaId, 
              motivo: inputValue 
          });
      }
  };

  // --- COLUMNAS ---
  const columnsCobros: DataTableColumn<LoteDto>[] = useMemo(() => [
    { id: 'lote', label: 'Lote / ID', minWidth: 200, render: (l) => (
        <Stack direction="row" spacing={2} alignItems="center">
            <Avatar src={imagenService.resolveImageUrl(l.imagenes?.[0]?.url || '')} variant="rounded"><ImageIcon /></Avatar>
            <Box><Typography fontWeight={700} variant="body2">{l.nombre_lote}</Typography><Typography variant="caption">ID: {l.id}</Typography></Box>
        </Stack>
    )},
    { id: 'ganador', label: 'Ganador', minWidth: 150, render: (l) => (
        <Stack direction="row" alignItems="center" spacing={1}>
            <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}><Person fontSize="inherit"/></Avatar>
            <Typography variant="body2" fontWeight={500}>
                {l.id_ganador ? getUserName(l.id_ganador) : '-'}
            </Typography>
        </Stack>
    )},
    { id: 'vencimiento', label: 'Plazo de Pago', minWidth: 180, render: (l) => {
        const pujaGanadora = pujas.find(p => p.id_lote === l.id && p.estado_puja === 'ganadora_pendiente');
        const dias = getDiasRestantes(pujaGanadora?.fecha_vencimiento_pago || new Date(new Date().setDate(new Date().getDate() + 90)).toISOString());
        const color = dias < 7 ? 'error' : dias < 30 ? 'warning' : 'success';
        return (
            <Stack width="100%">
                <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" fontWeight={700} color={`${color}.main`}>{dias} días restantes</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={(dias / 90) * 100} color={color} sx={{ height: 6, borderRadius: 3 }} />
            </Stack>
        );
    }},
    { id: 'monto', label: 'Monto', render: (l) => {
        const pujaGanadora = pujas.find(p => p.id_lote === l.id && p.estado_puja === 'ganadora_pendiente');
        const monto = pujaGanadora?.monto_puja || l.precio_base;
        return <Typography fontWeight={700}>${Number(monto).toLocaleString()}</Typography>
    }},
    { id: 'acciones', label: 'Acciones', align: 'right', render: (l) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Tooltip title="Enviar Recordatorio">
                <IconButton size="small" color="primary" onClick={() => enviarRecordatorioMutation.mutate(l.id)}>
                    <NotificationsActive />
                </IconButton>
            </Tooltip>
            
            {/* 🔴 BOTÓN DE ANULACIÓN CONECTADO */}
            <Tooltip title="Anular Adjudicación (Impago)">
                <IconButton 
                    size="small" 
                    color="error" 
                    onClick={() => handleCancelarAdjudicacion(l)}
                    disabled={cancelarGanadoraMutation.isPending}
                >
                    <CancelScheduleSend />
                </IconButton>
            </Tooltip>

            <Button variant="outlined" size="small" onClick={() => handleContactar(l)}>Contactar</Button>
        </Stack>
    )}
  ], [pujas, enviarRecordatorioMutation, usuarios, cancelarGanadoraMutation]);

  const columnsImpagos: DataTableColumn<LoteDto>[] = useMemo(() => [
    { id: 'lote', label: 'Lote', minWidth: 200, render: (l) => <Typography fontWeight={700}>{l.nombre_lote}</Typography> },
    { id: 'historial', label: 'Historial', minWidth: 250, render: (lote) => {
        const pujasIncumplidas = pujas.filter(p => p.id_lote === lote.id && p.estado_puja === 'ganadora_incumplimiento');
        return (
            <Stack spacing={0.5}>
                {pujasIncumplidas.length > 0 ? pujasIncumplidas.map((p, i) => (
                      <Typography key={p.id} variant="caption" color="error" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                         <ErrorOutline fontSize="inherit"/> Intento {i + 1}: {getUserName(p.id_usuario)} (${Number(p.monto_puja).toLocaleString()})
                    </Typography>
                )) : <Typography variant="caption" color="text.secondary">Sin historial</Typography>}
            </Stack>
        );
    }},
    { id: 'intentos', label: 'Estado', render: (l) => {
        const intentos = l.intentos_fallidos_pago || 0;
        return <Chip label={`${intentos}/3 Fallos`} color={intentos >= 3 ? 'error' : 'warning'} size="small" />;
    }},
    { id: 'acciones', label: 'Acciones', align: 'right', render: (l) => (
        <Tooltip title="Forzar Finalización">
            <IconButton 
                color="error" 
                onClick={() => forceFinishMutation.mutate({ 
                    idLote: l.id, 
                    idGanador: l.id_ganador 
                })}
            >
                <Block />
            </IconButton>
        </Tooltip>
    )}
  ], [pujas, forceFinishMutation, usuarios]);


  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      <PageHeader 
        title="Sala de Control de Subastas" 
        subtitle="Gestión en tiempo real de subastas, cobros y monitoreo." 
        action={
            <Button 
                startIcon={<FilterList />} 
                onClick={() => setFiltrosVisible(!filtrosVisible)} 
                variant={filtrosVisible ? "contained" : "outlined"}
                color="primary"
            >
                {filtrosVisible ? "Ocultar Filtros" : "Filtros"}
            </Button>
        }
      />

      {/* KPIs */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 4 }}>
        <StatCard title="En Vivo" value={analytics.activos.length} icon={<Gavel />} color="success" loading={loadingLotes} />
        <StatCard title="Cobros Pendientes" value={analytics.pendientesPago.length} icon={<ReceiptLong />} color="info" loading={loadingLotes} />
        <StatCard title="Capital en Juego" value={`$${analytics.dineroEnJuego.toLocaleString()}`} icon={<MonetizationOn />} color="warning" loading={loadingLotes} />
        <StatCard title="En Riesgo/Impago" value={analytics.lotesEnRiesgo.length} icon={<ErrorOutline />} color="error" loading={loadingLotes} />
      </Box>

      {/* FILTROS */}
      <Collapse in={filtrosVisible}>
        <Paper sx={{ mb: 3, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="subtitle2" gutterBottom fontWeight={700} color="text.secondary">Filtros de Búsqueda</Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField 
                    size="small" 
                    label="Buscar Lote" 
                    placeholder="Nombre del lote..." 
                    fullWidth 
                    value={filterLoteNombre}
                    onChange={(e) => setFilterLoteNombre(e.target.value)}
                />
                <TextField 
                    size="small" 
                    label="ID Usuario" 
                    placeholder="Ej: 10" 
                    value={filterUserId}
                    onChange={(e) => setFilterUserId(e.target.value)}
                />
                <Button variant="text" onClick={() => { setFilterLoteNombre(''); setFilterUserId(''); }}>
                    Limpiar
                </Button>
            </Stack>
        </Paper>
      </Collapse>

      {/* Tabs */}
      <Paper elevation={0} sx={{ mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.background.paper, 0.6), p: 0.5 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} indicatorColor="primary" textColor="primary" variant="standard">
          <Tab icon={<Timer />} label="EN VIVO" iconPosition="start" />
          <Tab icon={<ReceiptLong />} label="Gestión de Cobros" iconPosition="start" />
          <Tab icon={<Warning />} label={`Impagos (${analytics.lotesEnRiesgo.length})`} iconPosition="start" />
        </Tabs>
      </Paper>

      <QueryHandler isLoading={loadingLotes || loadingPujas} error={errorLotes as Error}>
        
        {/* --- TAB 0: EN VIVO --- */}
        {tabValue === 0 && (
          <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(3, 1fr)' }} gap={3}>
            {analytics.activos.length === 0 && (
                <Paper sx={{ p: 4, gridColumn: '1 / -1', textAlign: 'center' }} elevation={0}>
                    <Typography color="text.secondary">No hay subastas activas que coincidan con los filtros.</Typography>
                </Paper>
            )}
            {analytics.activos.map(lote => {
              const pujasLote = pujasPorLote[lote.id] || [];
              const maxPuja = pujasLote.length > 0 ? Number(pujasLote[0].monto_puja) : Number(lote.precio_base);
              const top3 = pujasLote.slice(0, 3);
              const history = pujasLote.slice(0, 10).reverse();

              return (
                <Card key={lote.id} sx={{ border: `1px solid ${theme.palette.success.main}`, position: 'relative', borderRadius: 2, boxShadow: theme.shadows[3] }}>
                  <Chip label="EN VIVO" color="success" size="small" sx={{ position: 'absolute', top: 10, right: 10, fontWeight: 'bold' }} />
                  <CardContent>
                    <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                      <Avatar src={imagenService.resolveImageUrl(lote.imagenes?.[0]?.url || '')} variant="rounded" sx={{ width: 60, height: 60 }}><Gavel color="success"/></Avatar>
                      <Box>
                        <Typography fontWeight={700} variant="h6" lineHeight={1.2}>{lote.nombre_lote}</Typography>
                        <Typography variant="body2" color="text.secondary">ID: {lote.id}</Typography>
                      </Box>
                    </Stack>
                    
                    <Box textAlign="center" bgcolor={alpha(theme.palette.success.main, 0.08)} color="success.dark" p={2} borderRadius={2} border="1px solid" borderColor={alpha(theme.palette.success.main, 0.2)}>
                      <Typography variant="caption" fontWeight={800} letterSpacing={1}>OFERTA ACTUAL</Typography>
                      <Typography variant="h4" fontWeight={700}>${maxPuja.toLocaleString()}</Typography>
                    </Box>

                    {/* TOP 3 RANKING */}
                    <Top3Ranking pujas={top3} getUserName={getUserName} />

                    {/* Gráfico Simple */}
                    {history.length > 1 && (
                        <Box mt={2}>
                             <Typography variant="caption" display="flex" alignItems="center" gap={0.5}><TrendingUp fontSize="inherit"/> Tendencia</Typography>
                             <Box sx={{ height: 30, display: 'flex', alignItems: 'flex-end', gap: 0.5, mt: 0.5 }}>
                                {history.map((p, i) => (
                                    <Box key={i} sx={{ flex: 1, bgcolor: theme.palette.success.light, height: `${(Number(p.monto_puja) / maxPuja) * 100}%`, opacity: 0.6 }} />
                                ))}
                             </Box>
                        </Box>
                    )}

                  </CardContent>
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button fullWidth variant="contained" color="error" startIcon={<StopCircle />} onClick={() => handleFinalizarSubasta(lote)}>Finalizar</Button>
                  </CardActions>
                </Card>
              );
            })}
          </Box>
        )}

        {/* --- TAB 1 y 2 (Tablas) --- */}
        {tabValue === 1 && <DataTable columns={columnsCobros} data={analytics.pendientesPago} getRowKey={(row) => row.id} emptyMessage="No hay cobros pendientes." pagination={true} />}
        {tabValue === 2 && <DataTable columns={columnsImpagos} data={analytics.lotesEnRiesgo} getRowKey={(row) => row.id} emptyMessage="No hay lotes en riesgo." pagination={true} />}

      </QueryHandler>

      {/* Modales */}
      <ContactarGanadorModal 
        open={contactarModal.isOpen} 
        onClose={() => { contactarModal.close(); setLoteSeleccionado(null); }} 
        lote={loteSeleccionado} 
        montoGanador={montoSeleccionado} 
      />

      <DetallePujaModal
        open={detallePujaModal.isOpen}
        onClose={() => { detallePujaModal.close(); setPujaSeleccionada(null); }}
        puja={pujaSeleccionada}
        userName={pujaSeleccionada ? getUserName(pujaSeleccionada.id_usuario) : undefined} 
        isHighest={pujaSeleccionada && pujasPorLote[pujaSeleccionada.id_lote]?.[0]?.id === pujaSeleccionada.id}
        rankingPosition={pujaSeleccionada ? (pujasPorLote[pujaSeleccionada.id_lote]?.findIndex(p => p.id === pujaSeleccionada.id) + 1) : undefined}
      />
      
      {/* ✅ Se pasa el handleConfirmAction que acepta el input */}
      <ConfirmDialog controller={confirmDialog} onConfirm={handleConfirmAction} isLoading={endAuctionMutation.isPending || cancelarGanadoraMutation.isPending} />

    </PageContainer>
  );
};

export default AdminPujas;