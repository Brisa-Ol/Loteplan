import React, { useMemo } from 'react';
import {
  Block, CancelScheduleSend, EmojiEvents, ErrorOutline, FilterList, Gavel,
  Image as ImageIcon, MonetizationOn, NotificationsActive, Person, ReceiptLong,
  StopCircle, Timer, TrendingUp, Warning
} from '@mui/icons-material';
import {
  alpha, Avatar, Box, Button, Card, CardActions, CardContent, Chip, Collapse,
  IconButton, LinearProgress, Paper, Stack, Tab, Tabs, TextField, Tooltip,
  Typography, useTheme
} from '@mui/material';



import { DataTable, type DataTableColumn } from '../../../../shared/components/data-grid/DataTable/DataTable';
import { PageContainer } from '../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { PageHeader } from '../../../../shared/components/layout/headers/PageHeader/PageHeader';
import { QueryHandler } from '../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import { StatCard } from '../../../../shared/components/domain/cards/StatCard/StatCard';

import ContactarGanadorModal from './components/ContactarGanadorModal';
import DetallePujaModal from './components/DetallePujaModal';


import { useAdminPujas } from '../../hooks/useAdminPujas';
import imagenService from '../../../../core/api/services/imagen.service';
import type { PujaDto } from '../../../../core/types/dto/puja.dto';
import type { LoteDto } from '../../../../core/types/dto/lote.dto';
import { ConfirmDialog } from '../../../../shared/components/domain/modals/ConfirmDialog/ConfirmDialog';

// --- SUB-COMPONENTES ---
const getDiasRestantes = (fechaVencimiento?: string) => {
  if (!fechaVencimiento) return 0;
  const hoy = new Date();
  const vencimiento = new Date(fechaVencimiento);
  const diffTime = vencimiento.getTime() - hoy.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
};

const Top3Ranking: React.FC<{ pujas: PujaDto[]; getUserName: (id: number) => string }> = ({ pujas, getUserName }) => {
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

const AdminPujas: React.FC = () => {
  const theme = useTheme();
  const logic = useAdminPujas(); // Usamos el hook

  // --- COLUMNAS (Memoizadas dentro del componente visual para acceder a `logic`) ---
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
                {l.id_ganador ? logic.getUserName(l.id_ganador) : '-'}
            </Typography>
        </Stack>
    )},
    { id: 'vencimiento', label: 'Plazo de Pago', minWidth: 180, render: (l) => {
        const pujaGanadora = logic.pujasPorLote[l.id]?.find(p => p.estado_puja === 'ganadora_pendiente');
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
        const pujaGanadora = logic.pujasPorLote[l.id]?.find(p => p.estado_puja === 'ganadora_pendiente');
        const monto = pujaGanadora?.monto_puja || l.precio_base;
        return <Typography fontWeight={700}>${Number(monto).toLocaleString()}</Typography>
    }},
    { id: 'acciones', label: 'Acciones', align: 'right', render: (l) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Tooltip title="Enviar Recordatorio">
                <IconButton size="small" color="primary" onClick={() => logic.enviarRecordatorioMutation.mutate(l.id)}>
                    <NotificationsActive />
                </IconButton>
            </Tooltip>
            <Tooltip title="Anular Adjudicación (Impago)">
                <IconButton 
                    size="small" color="error" 
                    onClick={() => logic.handleCancelarAdjudicacion(l)}
                    disabled={logic.cancelarGanadoraMutation.isPending}
                >
                    <CancelScheduleSend />
                </IconButton>
            </Tooltip>
            <Button variant="outlined" size="small" onClick={() => logic.handleContactar(l)}>Contactar</Button>
        </Stack>
    )}
  ], [logic]);

  const columnsImpagos: DataTableColumn<LoteDto>[] = useMemo(() => [
    { id: 'lote', label: 'Lote', minWidth: 200, render: (l) => <Typography fontWeight={700}>{l.nombre_lote}</Typography> },
    { id: 'historial', label: 'Historial', minWidth: 250, render: (lote) => {
        const pujasIncumplidas = logic.pujas.filter(p => p.id_lote === lote.id && p.estado_puja === 'ganadora_incumplimiento');
        return (
            <Stack spacing={0.5}>
                {pujasIncumplidas.length > 0 ? pujasIncumplidas.map((p, i) => (
                      <Typography key={p.id} variant="caption" color="error" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <ErrorOutline fontSize="inherit"/> Intento {i + 1}: {logic.getUserName(p.id_usuario)} (${Number(p.monto_puja).toLocaleString()})
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
                onClick={() => logic.forceFinishMutation.mutate({ idLote: l.id, idGanador: l.id_ganador })}
            >
                <Block />
            </IconButton>
        </Tooltip>
    )}
  ], [logic]);

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      <PageHeader 
        title="Sala de Control de Subastas" 
        subtitle="Gestión en tiempo real de subastas, cobros y monitoreo." 
        action={
            <Button 
                startIcon={<FilterList />} 
                onClick={() => logic.setFiltrosVisible(!logic.filtrosVisible)} 
                variant={logic.filtrosVisible ? "contained" : "outlined"}
                color="primary"
            >
                {logic.filtrosVisible ? "Ocultar Filtros" : "Filtros"}
            </Button>
        }
      />

      {/* KPIs */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 4 }}>
        <StatCard title="En Vivo" value={logic.analytics.activos.length} icon={<Gavel />} color="success" loading={logic.loading} subtitle="Subastas activas" />
        <StatCard title="Cobros Pendientes" value={logic.analytics.pendientesPago.length} icon={<ReceiptLong />} color="info" loading={logic.loading} subtitle="Aguardando pago" />
        <StatCard title="Capital en Juego" value={`$${logic.analytics.dineroEnJuego.toLocaleString()}`} icon={<MonetizationOn />} color="warning" loading={logic.loading} subtitle="Volumen potencial" />
        <StatCard title="En Riesgo/Impago" value={logic.analytics.lotesEnRiesgo.length} icon={<ErrorOutline />} color="error" loading={logic.loading} subtitle="Requiere atención" />
      </Box>

      {/* FILTROS */}
      <Collapse in={logic.filtrosVisible}>
        <Paper sx={{ mb: 3, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="subtitle2" gutterBottom fontWeight={700} color="text.secondary">Filtros de Búsqueda</Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField size="small" label="Buscar Lote" placeholder="Nombre del lote..." fullWidth value={logic.filterLoteNombre} onChange={(e) => logic.setFilterLoteNombre(e.target.value)} />
                <TextField size="small" label="ID Usuario" placeholder="Ej: 10" value={logic.filterUserId} onChange={(e) => logic.setFilterUserId(e.target.value)} />
                <Button variant="text" onClick={() => { logic.setFilterLoteNombre(''); logic.setFilterUserId(''); }}>Limpiar</Button>
            </Stack>
        </Paper>
      </Collapse>

      {/* Tabs */}
      <Paper elevation={0} sx={{ mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.background.paper, 0.6), p: 0.5 }}>
        <Tabs value={logic.tabValue} onChange={(_, v) => logic.setTabValue(v)} indicatorColor="primary" textColor="primary" variant="standard">
          <Tab icon={<Timer />} label="EN VIVO" iconPosition="start" />
          <Tab icon={<ReceiptLong />} label="Gestión de Cobros" iconPosition="start" />
          <Tab icon={<Warning />} label={`Impagos (${logic.analytics.lotesEnRiesgo.length})`} iconPosition="start" />
        </Tabs>
      </Paper>

      <QueryHandler isLoading={logic.loading} error={logic.error as Error}>
        
        {/* TAB 0: EN VIVO */}
        {logic.tabValue === 0 && (
          <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(3, 1fr)' }} gap={3}>
            {logic.analytics.activos.length === 0 && (
                <Paper sx={{ p: 4, gridColumn: '1 / -1', textAlign: 'center' }} elevation={0}>
                    <Typography color="text.secondary">No hay subastas activas que coincidan con los filtros.</Typography>
                </Paper>
            )}
            {logic.analytics.activos.map(lote => {
              const pujasLote = logic.pujasPorLote[lote.id] || [];
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

                    <Top3Ranking pujas={top3} getUserName={logic.getUserName} />

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
                    <Button fullWidth variant="contained" color="error" startIcon={<StopCircle />} onClick={() => logic.handleFinalizarSubasta(lote)}>Finalizar</Button>
                  </CardActions>
                </Card>
              );
            })}
          </Box>
        )}

        {/* TAB 1 y 2 */}
        {logic.tabValue === 1 && <DataTable columns={columnsCobros} data={logic.analytics.pendientesPago} getRowKey={(row) => row.id} emptyMessage="No hay cobros pendientes." pagination={true} />}
        {logic.tabValue === 2 && <DataTable columns={columnsImpagos} data={logic.analytics.lotesEnRiesgo} getRowKey={(row) => row.id} emptyMessage="No hay lotes en riesgo." pagination={true} />}

      </QueryHandler>

      {/* Modales */}
      <ContactarGanadorModal 
        open={logic.modales.contactar.isOpen} 
        onClose={() => { logic.modales.contactar.close(); logic.setLoteSeleccionado(null); }} 
        lote={logic.loteSeleccionado} 
        montoGanador={logic.montoSeleccionado} 
      />

      <DetallePujaModal
        open={logic.modales.detallePuja.isOpen}
        onClose={() => { logic.modales.detallePuja.close(); logic.setPujaSeleccionada(null); }}
        puja={logic.pujaSeleccionada}
        userName={logic.pujaSeleccionada ? logic.getUserName(logic.pujaSeleccionada.id_usuario) : undefined} 
        isHighest={logic.pujaSeleccionada && logic.pujasPorLote[logic.pujaSeleccionada.id_lote]?.[0]?.id === logic.pujaSeleccionada.id}
        rankingPosition={logic.pujaSeleccionada ? (logic.pujasPorLote[logic.pujaSeleccionada.id_lote]?.findIndex(p => p.id === logic.pujaSeleccionada?.id) + 1) : undefined}
      />
      
      <ConfirmDialog 
        controller={logic.modales.confirmDialog} 
        onConfirm={logic.handleConfirmAction} 
        isLoading={logic.endAuctionMutation.isPending || logic.cancelarGanadoraMutation.isPending} 
      />

    </PageContainer>
  );
};

export default AdminPujas;