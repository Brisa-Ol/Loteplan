// src/pages/MiCuenta/MisSuscripciones.tsx

import React, { useState, useEffect } from 'react';
import { 
  Typography, Paper, Stack, Button, CircularProgress, Alert, Box, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText,
  Tabs, Tab, Divider
} from '@mui/material';
import { 
  Cancel as CancelIcon, 
  Visibility as VisibilityIcon,
  CreditScore as TokenIcon,
  EventRepeat as MesesIcon,
  History as HistoryIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// --- SERVICIOS Y TIPOS ---
import SuscripcionService from '../../../Services/suscripcion.service';
import type { SuscripcionDto, SuscripcionCanceladaDto } from '../../../types/dto/suscripcion.dto';

// --- COMPONENTES COMUNES ---
import { PageContainer, PageHeader } from '../../../components/common'; 
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';

const MisSuscripciones: React.FC = () => {
  const navigate = useNavigate();

  // --- ESTADOS ---
  const [tabValue, setTabValue] = useState(0); // 0: Activas, 1: Historial
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  // Datos
  const [suscripciones, setSuscripciones] = useState<SuscripcionDto[]>([]);
  const [canceladas, setCanceladas] = useState<SuscripcionCanceladaDto[]>([]);
  
  // Estados para cancelar (Modal)
  const [isCancelling, setIsCancelling] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  // Guardamos el objeto completo para mostrar info detallada en el modal
  const [subscriptionToCancel, setSubscriptionToCancel] = useState<SuscripcionDto | null>(null);

  // --- CARGA DE DATOS ---
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Cargamos ambas listas en paralelo
      const [resActivas, resCanceladas] = await Promise.all([
        SuscripcionService.getMisSuscripciones(),
        SuscripcionService.getMisCanceladas()
      ]);

      setSuscripciones(resActivas.data);
      setCanceladas(resCanceladas.data);
    } catch (e) {
      console.error("Error al cargar suscripciones:", e);
      setError(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- LÓGICA DE CANCELACIÓN ---
  
  // 1. Abrir Modal
  const handleOpenCancelDialog = (suscripcion: SuscripcionDto) => {
    setSubscriptionToCancel(suscripcion);
    setOpenConfirm(true);
  };

  // 2. Cerrar Modal
  const handleCloseDialog = () => {
    if (!isCancelling) {
      setOpenConfirm(false);
      setSubscriptionToCancel(null);
    }
  };

  // 3. Confirmar Cancelación
  const handleConfirmCancel = async () => {
    if (!subscriptionToCancel) return;
    
    setIsCancelling(true);
    try {
      await SuscripcionService.cancelar(subscriptionToCancel.id);
      
      // Éxito: Recargamos los datos para actualizar ambas listas
      // (La activa desaparece, la cancelada aparece en el historial)
      await fetchData(); 
      
      setOpenConfirm(false);
      setSubscriptionToCancel(null);
      // Aquí podrías poner un toast de éxito si tienes un sistema de notificaciones
    } catch (err: any) {
      console.error("Error al cancelar:", err);
      // Mejora: Mostrar el mensaje específico del backend
      const mensajeError = err.response?.data?.message || err.response?.data?.error || "Hubo un error al intentar cancelar.";
      alert(`❌ No se pudo cancelar: ${mensajeError}`);
    } finally {
      setIsCancelling(false);
    }
  };

  // --- RENDERIZADO ---

  return (
    <PageContainer maxWidth="md">
      <PageHeader 
        title="Mis Suscripciones" 
        subtitle='Gestiona tus inversiones activas y revisa tu historial de bajas.'
      />

      {/* PESTAÑAS DE NAVEGACIÓN */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} aria-label="pestañas suscripciones">
          <Tab label={`Activas (${suscripciones.length})`} />
          <Tab label="Historial Canceladas" icon={<HistoryIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      <QueryHandler isLoading={isLoading} error={error}>
        
        {/* --- TAB 0: SUSCRIPCIONES ACTIVAS --- */}
        <div role="tabpanel" hidden={tabValue !== 0}>
          {tabValue === 0 && (
            suscripciones.length > 0 ? (
              <Stack spacing={2}>
                {suscripciones.map((susc) => (
                  <Paper 
                    key={susc.id} 
                    elevation={0}
                    variant="outlined"
                    sx={{ 
                      p: 3, 
                      borderRadius: 3,
                      borderLeft: '6px solid',
                      borderLeftColor: 'primary.main',
                      transition: '0.2s',
                      '&:hover': { boxShadow: 3 }
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
                      
                      {/* Información Principal */}
                      <Box>
                        <Typography variant="h6" fontWeight="bold" color="text.primary">
                          {susc.proyectoAsociado?.nombre_proyecto || `Proyecto #${susc.id_proyecto}`}
                        </Typography>
                        
                        <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                          ID Suscripción: {susc.id}
                        </Typography>

                        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                          <Chip 
                            icon={<TokenIcon />} 
                            label={`${susc.tokens_disponibles ?? 0} Tokens`} 
                            size="small" 
                            color="secondary" 
                            sx={{ fontWeight: 600 }}
                          />
                          <Chip 
                            icon={<MesesIcon />} 
                            label={`${susc.meses_a_pagar} Meses Restantes`} 
                            size="small" 
                            variant="outlined" 
                          />
                          {/* Saldo a favor (Feedback visual importante) */}
                          {Number(susc.saldo_a_favor) > 0 && (
                            <Chip 
                              label={`Saldo a favor: $${Number(susc.saldo_a_favor).toLocaleString()}`} 
                              size="small" 
                              color="success" 
                              variant="outlined" 
                              sx={{ fontWeight: 'bold', borderColor: 'success.main', color: 'success.dark' }}
                            />
                          )}
                        </Stack>
                      </Box>

                      {/* Botones de Acción */}
                      <Stack direction={{ xs: 'row', sm: 'column', md: 'row' }} spacing={1} alignItems="stretch">
                        <Button 
                          variant="outlined" 
                          startIcon={<VisibilityIcon />}
                          onClick={() => navigate(`/proyectos/${susc.id_proyecto}`)}
                        >
                          Ver Proyecto
                        </Button>

                        <Button 
                          variant="text" 
                          color="error" 
                          startIcon={<CancelIcon />}
                          onClick={() => handleOpenCancelDialog(susc)}
                        >
                          Cancelar
                        </Button>
                      </Stack>

                    </Box>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Alert severity="info" variant="outlined" sx={{ mt: 2 }}>
                No tienes suscripciones activas en este momento.
              </Alert>
            )
          )}
        </div>

        {/* --- TAB 1: HISTORIAL CANCELADAS --- */}
        <div role="tabpanel" hidden={tabValue !== 1}>
          {tabValue === 1 && (
            canceladas.length > 0 ? (
              <Stack spacing={2}>
                {canceladas.map((cancelada) => (
                  <Paper 
                    key={cancelada.id} 
                    elevation={0}
                    sx={{ 
                      p: 2, 
                      borderRadius: 2,
                      bgcolor: 'grey.50', // Fondo gris para denotar inactividad
                      border: '1px solid',
                      borderColor: 'divider',
                      opacity: 0.9
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold" color="text.secondary">
                          {cancelada.proyecto?.nombre_proyecto || `Proyecto #${cancelada.id_proyecto}`}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <CancelIcon sx={{ fontSize: 16, color: 'error.main' }} />
                          <Typography variant="caption" color="error.main" fontWeight="bold">
                            Cancelada el {new Date(cancelada.fecha_cancelacion).toLocaleDateString()}
                          </Typography>
                        </Stack>
                      </Box>

                      <Box textAlign="right">
                        <Typography variant="caption" display="block" color="text.secondary">
                          Total Liquidado
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" sx={{ fontFamily: 'monospace' }}>
                          ${Number(cancelada.monto_pagado_total).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Alert severity="info" variant="outlined" sx={{ mt: 2 }}>
                No tienes suscripciones canceladas en tu historial.
              </Alert>
            )
          )}
        </div>

      </QueryHandler>

      {/* --- DIÁLOGO DE CONFIRMACIÓN MEJORADO --- */}
      <Dialog
        open={openConfirm}
        onClose={handleCloseDialog}
        maxWidth="xs"
      >
        <DialogTitle fontWeight="bold" display="flex" alignItems="center" gap={1}>
          <WarningIcon color="warning" /> ¿Cancelar Suscripción?
        </DialogTitle>
        
        <DialogContent>
          <DialogContentText component="div">
            Estás a punto de cancelar tu suscripción a:
            <Typography variant="subtitle1" fontWeight="bold" color="primary.main" my={1}>
              {subscriptionToCancel?.proyectoAsociado?.nombre_proyecto || 'Proyecto'}
            </Typography>
            
            Se detendrán los cobros futuros y perderás tu progreso de antigüedad.
            
            {/* 💡 MEJORA: Feedback visual de saldo/deuda */}
            {subscriptionToCancel && Number(subscriptionToCancel.saldo_a_favor) > 0 && (
              <Alert severity="warning" sx={{ mt: 2, fontSize: '0.85rem' }}>
                Atención: Tienes un saldo a favor de <strong>${Number(subscriptionToCancel.saldo_a_favor).toLocaleString()}</strong>.
                Este monto quedará sujeto a auditoría para su devolución según los términos del contrato.
              </Alert>
            )}

            <Box mt={2} fontSize="0.9rem">
              <strong>¿Estás seguro de que deseas continuar?</strong>
            </Box>
          </DialogContentText>
        </DialogContent>
        
        <DialogActions sx={{ p: 2.5 }}>
          <Button 
            onClick={handleCloseDialog} 
            disabled={isCancelling}
            color="inherit"
          >
            Volver
          </Button>
          <Button 
            onClick={handleConfirmCancel} 
            color="error" 
            variant="contained" 
            disabled={isCancelling}
            autoFocus
          >
            {isCancelling ? <CircularProgress size={24} color="inherit" /> : 'Sí, Cancelar Definitivamente'}
          </Button>
        </DialogActions>
      </Dialog>

    </PageContainer>
  );
};

export default MisSuscripciones;