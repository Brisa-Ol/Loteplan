import React, { useState, useEffect } from 'react';
import { 
  Typography, Paper, Stack, Button, Alert, Box, Chip,
  Tabs, Tab
} from '@mui/material';
import { 
  Cancel as CancelIcon, Visibility as VisibilityIcon,
  CreditScore as TokenIcon, EventRepeat as MesesIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';

// --- SERVICIOS Y TIPOS ---
import SuscripcionService from '../../../Services/suscripcion.service';
import type { SuscripcionDto, SuscripcionCanceladaDto } from '../../../types/dto/suscripcion.dto';

// --- COMPONENTES Y HOOKS ---
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import { useConfirmDialog } from '../../../hooks/useConfirmDialog'; // 👈 Hook nuevo
import { ConfirmDialog } from '../../../components/common/ConfirmDialog/ConfirmDialog'; // 👈 Componente genérico (asumiendo que lo creaste)

const MisSuscripciones: React.FC = () => {
  const navigate = useNavigate();
  
  // 1. Hook unificado de confirmación
  const confirmDialog = useConfirmDialog();

  // --- ESTADOS ---
  const [tabValue, setTabValue] = useState(0); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  // Datos
  const [suscripciones, setSuscripciones] = useState<SuscripcionDto[]>([]);
  const [canceladas, setCanceladas] = useState<SuscripcionCanceladaDto[]>([]);
  
  // --- CARGA DE DATOS ---
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
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

  // --- MUTACIÓN DE CANCELACIÓN ---
  const cancelMutation = useMutation({
    mutationFn: async (id: number) => await SuscripcionService.cancelar(id),
    onSuccess: async () => {
      await fetchData(); // Recargar datos
      confirmDialog.close(); // Cerrar modal con el hook
    },
    onError: (err: any) => {
      const mensajeError = err.response?.data?.message || err.response?.data?.error || "Hubo un error al intentar cancelar.";
      alert(`❌ No se pudo cancelar: ${mensajeError}`);
    }
  });

  // Handler simplificado
  const handleOpenCancelDialog = (suscripcion: SuscripcionDto) => {
    // Pasamos la suscripción completa como 'data' para usarla en la lógica
    confirmDialog.confirm('cancel_subscription', suscripcion);
  };

  // Handler de confirmación final
  const handleConfirmCancel = () => {
    // confirmDialog.data tiene la suscripción que pasamos antes
    if (confirmDialog.data) {
      cancelMutation.mutate(confirmDialog.data.id);
    }
  };

  return (
    <PageContainer maxWidth="md">
      <PageHeader 
        title="Mis Suscripciones" 
        subtitle='Gestiona tus inversiones activas y revisa tu historial de bajas.'
      />

      {/* PESTAÑAS */}
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
                      p: 3, borderRadius: 3, borderLeft: '6px solid', borderLeftColor: 'primary.main',
                      transition: '0.2s', '&:hover': { boxShadow: 3 }
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
                      
                      {/* Info Principal */}
                      <Box>
                        <Typography variant="h6" fontWeight="bold" color="text.primary">
                          {susc.proyectoAsociado?.nombre_proyecto || `Proyecto #${susc.id_proyecto}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                          ID Suscripción: {susc.id}
                        </Typography>

                        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                          <Chip icon={<TokenIcon />} label={`${susc.tokens_disponibles ?? 0} Tokens`} size="small" color="secondary" sx={{ fontWeight: 600 }} />
                          <Chip icon={<MesesIcon />} label={`${susc.meses_a_pagar} Meses Restantes`} size="small" variant="outlined" />
                          {Number(susc.saldo_a_favor) > 0 && (
                            <Chip label={`Saldo a favor: $${Number(susc.saldo_a_favor).toLocaleString()}`} size="small" color="success" variant="outlined" sx={{ fontWeight: 'bold' }} />
                          )}
                        </Stack>
                      </Box>

                      {/* Botones */}
                      <Stack direction={{ xs: 'row', sm: 'column', md: 'row' }} spacing={1}>
                        <Button variant="outlined" startIcon={<VisibilityIcon />} onClick={() => navigate(`/proyectos/${susc.id_proyecto}`)}>
                          Ver Proyecto
                        </Button>
                        <Button variant="text" color="error" startIcon={<CancelIcon />} onClick={() => handleOpenCancelDialog(susc)}>
                          Cancelar
                        </Button>
                      </Stack>

                    </Box>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Alert severity="info" variant="outlined" sx={{ mt: 2 }}>No tienes suscripciones activas.</Alert>
            )
          )}
        </div>

        {/* --- TAB 1: HISTORIAL CANCELADAS --- */}
        <div role="tabpanel" hidden={tabValue !== 1}>
          {tabValue === 1 && (
            canceladas.length > 0 ? (
              <Stack spacing={2}>
                {canceladas.map((cancelada) => (
                  <Paper key={cancelada.id} elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider' }}>
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
                        <Typography variant="caption" display="block" color="text.secondary">Total Liquidado</Typography>
                        <Typography variant="body2" fontWeight="bold" sx={{ fontFamily: 'monospace' }}>
                          ${Number(cancelada.monto_pagado_total).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Alert severity="info" variant="outlined" sx={{ mt: 2 }}>No tienes suscripciones canceladas.</Alert>
            )
          )}
        </div>

      </QueryHandler>

      {/* --- MODAL DE CONFIRMACIÓN GENÉRICO --- */}
      <ConfirmDialog 
        controller={confirmDialog}
        onConfirm={handleConfirmCancel}
        isLoading={cancelMutation.isPending}
      />

    </PageContainer>
  );
};

export default MisSuscripciones;