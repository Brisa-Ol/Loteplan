import React, { useState } from 'react';
import { 
  Typography, Paper, Stack, Button, Box, Chip,
  Tabs, Tab, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Skeleton, alpha, useTheme,
  IconButton, Tooltip, Divider, Card
} from '@mui/material';
import { 
  Cancel as CancelIcon, Visibility as VisibilityIcon,
  Token as TokenIcon, EventRepeat as MesesIcon,
  History as HistoryIcon, MonetizationOn, CheckCircle,
  EventBusy, PlayCircleFilled, ErrorOutline,
  Visibility
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';

// --- SERVICIOS Y TIPOS ---
import SuscripcionService from '../../../Services/suscripcion.service';
import type { SuscripcionDto } from '../../../types/dto/suscripcion.dto';

// --- COMPONENTES Y HOOKS ---
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog/ConfirmDialog';

const MisSuscripciones: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const confirmDialog = useConfirmDialog();

  // --- ESTADOS ---
  const [tabValue, setTabValue] = useState(0); 

  // --- QUERIES ---
  const { data, isLoading, refetch, isError } = useQuery({
    queryKey: ['misSuscripcionesFull'],
    queryFn: async () => {
      const [resActivas, resCanceladas] = await Promise.all([
        SuscripcionService.getMisSuscripciones(),
        SuscripcionService.getMisCanceladas()
      ]);
      return {
        activas: resActivas.data,
        canceladas: resCanceladas.data
      };
    }
  });

  const suscripciones = data?.activas || [];
  const canceladas = data?.canceladas || [];

  // --- MUTACIÓN CANCELAR ---
  const cancelMutation = useMutation({
    mutationFn: async (id: number) => await SuscripcionService.cancelar(id),
    onSuccess: async () => {
      await refetch(); 
      confirmDialog.close(); 
    },
    onError: (err: any) => {
      const mensaje = err.response?.data?.message || "Error al cancelar.";
      alert(`❌ Error: ${mensaje}`);
    }
  });

  // Handlers
  const handleOpenCancelDialog = (suscripcion: SuscripcionDto) => {
    confirmDialog.confirm('cancel_subscription', suscripcion);
  };

  const handleConfirmCancel = () => {
    if (confirmDialog.data) cancelMutation.mutate(confirmDialog.data.id);
  };

  // Helpers
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

  const formatDate = (dateString: string) => 
    new Date(dateString).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // Stats
  const stats = {
    activas: suscripciones.length,
    canceladas: canceladas.length,
    totalPagado: suscripciones.reduce((acc, s) => acc + Number(s.monto_total_pagado || 0), 0)
  };

  return (
    <PageContainer maxWidth="lg">
      <PageHeader 
        title="Mis Suscripciones" 
        subtitle='Gestiona tus pagos recurrentes y visualiza tu historial.'
      />

      {/* --- KPI SECTION (Adaptado al Theme) --- */}
      <Box display="flex" justifyContent="center" mb={4} width="100%">
        <Card 
          elevation={0} // El theme ya aplica sombra por defecto en MuiCard
          sx={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 4, 
            px: 4, 
            py: 2,
            width: 'fit-content',
            // Forzamos fondo blanco para contraste sobre el gris de fondo
            bgcolor: 'background.default', 
            border: `1px solid ${theme.palette.secondary.dark}`
          }}
        >
          {/* Activas */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ p: 1, borderRadius: '50%', bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main', display: 'flex' }}>
              <PlayCircleFilled fontSize="small" />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>ACTIVAS</Typography>
              <Typography variant="h6" fontWeight={800} color="text.primary">{stats.activas}</Typography>
            </Box>
          </Stack>

          <Divider orientation="vertical" flexItem sx={{ mx: 1, borderColor: 'secondary.dark', display: { xs: 'none', sm: 'block'} }} />

          {/* Pagado */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ p: 1, borderRadius: '50%', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex' }}>
              <MonetizationOn fontSize="small" />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>PAGADO</Typography>
              <Typography variant="h6" fontWeight={800} color="text.primary">{formatCurrency(stats.totalPagado)}</Typography>
            </Box>
          </Stack>

          <Divider orientation="vertical" flexItem sx={{ mx: 1, borderColor: 'secondary.dark', display: { xs: 'none', sm: 'block'} }} />

          {/* Historial */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ p: 1, borderRadius: '50%', bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.main', display: 'flex' }}>
              <EventBusy fontSize="small" />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>BAJAS</Typography>
              <Typography variant="h6" fontWeight={800} color="text.primary">{stats.canceladas}</Typography>
            </Box>
          </Stack>
        </Card>
      </Box>

      {/* --- PESTAÑAS --- */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} textColor="primary" indicatorColor="primary">
          <Tab label="Suscripciones Activas" icon={<CheckCircle />} iconPosition="start" />
          <Tab label="Historial de Bajas" icon={<HistoryIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* --- CONTENIDO --- */}
      {isLoading ? (
        <Stack spacing={2}>
           {[1,2,3].map(n => <Skeleton key={n} variant="rectangular" height={80} sx={{ borderRadius: 2 }} />)}
        </Stack>
      ) : isError ? (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: alpha(theme.palette.error.main, 0.05) }}>
          <ErrorOutline color="error" sx={{ fontSize: 40, mb: 1 }} />
          <Typography color="error">Error al cargar datos.</Typography>
        </Paper>
      ) : (
        <>
{/* === TABLA ACTIVAS === */}
          <div role="tabpanel" hidden={tabValue !== 0}>
            {tabValue === 0 && (
              <TableContainer 
                component={Paper} 
                elevation={0} 
                sx={{ 
                  bgcolor: 'background.default',
                  border: `1px solid ${theme.palette.secondary.dark}`
                }}
              >
                <Table>
                  <TableHead sx={{ bgcolor: 'secondary.light' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Proyecto</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Tokens</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Progreso</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Total Pagado</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Estado</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: 'text.secondary' }}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {suscripciones.length > 0 ? suscripciones.map((susc) => {
                       const nombre = susc.proyectoAsociado?.nombre_proyecto || `Proyecto #${susc.id_proyecto}`;

                       return (
                        <TableRow key={susc.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                          {/* Proyecto */}
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight={700} color="text.primary">
                                {nombre}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID: {susc.id}
                              </Typography>
                            </Box>
                          </TableCell>
                          
                          {/* Tokens */}
                          <TableCell>
                            <Chip 
                              icon={<TokenIcon sx={{ fontSize: '14px !important' }} />} 
                              label={susc.tokens_disponibles ?? 0} 
                              size="small" 
                              variant="outlined" 
                              sx={{ 
                                borderColor: theme.palette.info.main, 
                                color: theme.palette.info.main,
                                bgcolor: alpha(theme.palette.info.main, 0.05)
                              }} 
                            />
                          </TableCell>

                          {/* Progreso */}
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1}>
                               <MesesIcon fontSize="small" color="action" />
                               <Typography variant="body2">{susc.meses_a_pagar} pendientes</Typography>
                            </Stack>
                          </TableCell>

                          {/* Pagado */}
                          <TableCell>
                            <Typography variant="body2" fontWeight={700} color="primary.main">
                              {formatCurrency(Number(susc.monto_total_pagado))}
                            </Typography>
                            {Number(susc.saldo_a_favor) > 0 && (
                              <Typography variant="caption" display="block" color="success.main" fontWeight={600}>
                                +{formatCurrency(Number(susc.saldo_a_favor))} favor
                              </Typography>
                            )}
                          </TableCell>

                          {/* Estado */}
                          <TableCell>
                            <Chip 
                              label="Activa" 
                              color="success" 
                              size="small" 
                              variant="outlined" 
                            />
                          </TableCell>

                          {/* ✅ COLUMNA DE ACCIONES ACTUALIZADA */}
                          <TableCell align="right">
                            <Stack direction="row" justifyContent="flex-end" spacing={1}>
                              
                              {/* 1. Botón Ver (Igual que en Inversiones) */}
                              <Tooltip title="Ver detalle del proyecto">
                                <Button
                                  variant="outlined"
                                  color="primary"
                                  size="small"
                                  startIcon={<Visibility fontSize="small" />}
                                  onClick={() => navigate(`/proyectos/${susc.id_proyecto}`)}
                                  sx={{ fontWeight: 600 }}
                                >
                                  Ver
                                </Button>
                              </Tooltip>

                              {/* 2. Botón Cancelar (Formato Botón, Outlined Error) */}
                              <Tooltip title="Dar de baja suscripción">
                                <Button
                                  variant="outlined" // Outlined para que sea limpio pero claro
                                  color="error"
                                  size="small"
                                  startIcon={<CancelIcon fontSize="small" />}
                                  onClick={() => handleOpenCancelDialog(susc)}
                                  sx={{ fontWeight: 600 }}
                                >
                                  Cancelar
                                </Button>
                              </Tooltip>
                              
                            </Stack>
                          </TableCell>
                        </TableRow>
                       );
                    }) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                          <Typography color="text.secondary">No tienes suscripciones activas.</Typography>
                          <Button 
                            variant="outlined"
                            size="small" 
                            sx={{ mt: 2 }} 
                            onClick={() => navigate('/client/Proyectos/RoleSelection')}
                          >
                             Explorar Proyectos
                          </Button>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </div>

          {/* === TABLA CANCELADAS === */}
          <div role="tabpanel" hidden={tabValue !== 1}>
            {tabValue === 1 && (
              <TableContainer 
                component={Paper} 
                elevation={0} 
                sx={{ 
                  bgcolor: 'background.default',
                  border: `1px solid ${theme.palette.secondary.dark}`
                }}
              >
                <Table>
                  <TableHead sx={{ bgcolor: 'secondary.light' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Proyecto</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Fecha Baja</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Meses Pagados</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Liquidado Total</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {canceladas.length > 0 ? canceladas.map((cancelada) => {
                       const nombre = cancelada.proyecto?.nombre_proyecto || `Proyecto #${cancelada.id_proyecto}`;
                       
                       return (
                        <TableRow key={cancelada.id} hover sx={{ opacity: 0.7 }}>
                          <TableCell>
                             <Typography variant="body2" fontWeight={600} color="text.secondary">
                               {nombre}
                             </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{formatDate(cancelada.fecha_cancelacion)}</Typography>
                          </TableCell>
                          <TableCell>
                             <Typography variant="body2">{cancelada.meses_pagados} meses</Typography>
                          </TableCell>
                          <TableCell>
                             <Typography variant="body2" fontWeight={600}>
                               {formatCurrency(Number(cancelada.monto_pagado_total))}
                             </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label="Cancelada" 
                              size="small" 
                              variant="outlined" 
                              sx={{ 
                                borderColor: theme.palette.text.disabled, 
                                color: theme.palette.text.disabled 
                              }} 
                            />
                          </TableCell>
                        </TableRow>
                       );
                    }) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                          <Typography color="text.secondary">No tienes historial de cancelaciones.</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </div>
        </>
      )}

      {/* MODAL CONFIRMACIÓN */}
      <ConfirmDialog 
        controller={confirmDialog}
        onConfirm={handleConfirmCancel}
        isLoading={cancelMutation.isPending}
      />
    </PageContainer>
  );
};

export default MisSuscripciones;