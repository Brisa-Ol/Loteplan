import React, { useState, useEffect } from 'react';
import { 
  Typography, Paper, Stack, Button, CircularProgress, Alert, Box, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText
} from '@mui/material';
import { 
  Cancel as CancelIcon, 
  Visibility as VisibilityIcon,
  CreditScore as TokenIcon,
  EventRepeat as MesesIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// --- IMPORTS DE SERVICIOS Y TIPOS ---
import SuscripcionService from '../../../Services/suscripcion.service';
// Ajusta la ruta "../../../" según dónde esté guardado este componente en tu proyecto
import type { SuscripcionDto } from '../../../types/dto/suscripcion.dto'; 

// --- IMPORTS DE COMPONENTES COMUNES ---
import { PageContainer } from '../../../components/common'; 
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';

const MisSuscripciones: React.FC = () => {
  const navigate = useNavigate();

  // Estados
  const [suscripciones, setSuscripciones] = useState<SuscripcionDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  
  // Estados para cancelar (Modal)
  const [isCancelling, setIsCancelling] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // 1. Cargar Datos Reales
  const fetchSuscripciones = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await SuscripcionService.getMisSuscripciones();
      // Axios devuelve la data dentro de .data
      setSuscripciones(response.data); 
    } catch (e) {
      console.error("Error al obtener suscripciones:", e);
      setError(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuscripciones();
  }, []);

  // 2. Manejar Cancelación
  const handleConfirmCancel = async () => {
    if (!selectedId) return;
    
    setIsCancelling(true);
    try {
      await SuscripcionService.cancelar(selectedId);
      
      // Actualizar estado local eliminando la suscripción cancelada
      setSuscripciones(prev => prev.filter(s => s.id !== selectedId));
      setOpenConfirm(false);
      
      // Opcional: Podrías añadir un toast/snackbar aquí
      // toast.success("Suscripción cancelada correctamente");
    } catch (err: any) {
      console.error("Error al cancelar:", err);
      alert("Hubo un error al intentar cancelar la suscripción.");
    } finally {
      setIsCancelling(false);
    }
  };

  // Abrir modal de confirmación
  const handleOpenCancelDialog = (id: number) => {
    setSelectedId(id);
    setOpenConfirm(true);
  };

  return (
    <PageContainer maxWidth="md">
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" color="text.primary">
          Mis Suscripciones
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gestiona tus inversiones activas y pagos recurrentes.
        </Typography>
      </Box>

      <QueryHandler isLoading={isLoading} error={error}>
        {suscripciones.length > 0 ? (
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
                      {/* Asegúrate que tu DTO traiga 'proyectoAsociado'. Si no, ajusta esta línea */}
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
                      {/* Verificación segura de saldo */}
                      {susc.saldo_a_favor !== undefined && Number(susc.saldo_a_favor) > 0 && (
                        <Chip 
                          label={`Saldo a favor: $${Number(susc.saldo_a_favor).toLocaleString()}`} 
                          size="small" 
                          color="success" 
                          variant="outlined" 
                          sx={{ borderColor: 'success.main', color: 'success.dark', fontWeight: 'bold' }}
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
                      onClick={() => handleOpenCancelDialog(susc.id)}
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
        )}
      </QueryHandler>

      {/* --- DIÁLOGO DE CONFIRMACIÓN --- */}
      <Dialog
        open={openConfirm}
        onClose={() => !isCancelling && setOpenConfirm(false)}
        maxWidth="xs"
      >
        <DialogTitle fontWeight="bold">¿Cancelar suscripción?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Si cancelas ahora, se detendrán los cobros futuros.
            <br /><br />
            <strong>¿Estás seguro de que deseas continuar?</strong>
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button 
            onClick={() => setOpenConfirm(false)} 
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
            {isCancelling ? <CircularProgress size={24} color="inherit" /> : 'Sí, Cancelar'}
          </Button>
        </DialogActions>
      </Dialog>

    </PageContainer>
  );
};

export default MisSuscripciones;