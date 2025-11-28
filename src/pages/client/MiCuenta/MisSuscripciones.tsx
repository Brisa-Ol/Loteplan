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

// --- MOCKS Y TIPOS (Para que funcione la Demo) ---
// En tu proyecto real, esto viene de tus imports:
// import SuscripcionService from '../../../Services/suscripcion.service';
// import { PageContainer } from '../../../components/common';
// import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';

interface SuscripcionDto {
  id: number;
  id_proyecto: number;
  tokens_disponibles: number;
  meses_a_pagar: number;
  saldo_a_favor: number;
  estado: 'activa' | 'cancelada' | 'finalizada';
  proyectoAsociado: {
    nombre_proyecto: string;
  };
}

// Simulación del Servicio
const MockSuscripcionService = {
  getMisSuscripciones: async () => {
    await new Promise(r => setTimeout(r, 800)); // Delay
    return {
      data: [
        {
          id: 101,
          id_proyecto: 5,
          tokens_disponibles: 1250,
          meses_a_pagar: 12,
          saldo_a_favor: 0,
          estado: 'activa',
          proyectoAsociado: { nombre_proyecto: 'Residencial Altos del Valle' }
        },
        {
          id: 102,
          id_proyecto: 8,
          tokens_disponibles: 500,
          meses_a_pagar: 24,
          saldo_a_favor: 150.50,
          estado: 'activa',
          proyectoAsociado: { nombre_proyecto: 'Torre Centrum - Depto 402' }
        }
      ] as SuscripcionDto[]
    };
  },
  cancelar: async (id: number) => {
    await new Promise(r => setTimeout(r, 1000)); // Delay
    return { data: { mensaje: 'Cancelado correctamente' } };
  }
};

// Componente Wrapper Simulado
const PageContainer: React.FC<{maxWidth: string, children: React.ReactNode}> = ({children}) => (
  <Box sx={{ p: 3, maxWidth: '900px', margin: '0 auto' }}>{children}</Box>
);

const QueryHandler: React.FC<any> = ({isLoading, error, children}) => {
  if (isLoading) return <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error.message}</Alert>;
  return <>{children}</>;
};

// --- COMPONENTE PRINCIPAL ---

const MisSuscripciones: React.FC = () => {
  // Simulación de navegación
  const navigate = (path: string) => console.log(`Navegando a: ${path}`);

  // Estados locales (simulando React Query)
  const [suscripciones, setSuscripciones] = useState<SuscripcionDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  // Estados para el Modal de Confirmación (Mejor UX)
  const [openConfirm, setOpenConfirm] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // 1. Cargar Datos (Simulando useQuery)
  const fetchSuscripciones = async () => {
    setIsLoading(true);
    try {
      // AQUÍ USARÍAS: await SuscripcionService.getMisSuscripciones();
      const res = await MockSuscripcionService.getMisSuscripciones();
      setSuscripciones(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuscripciones();
  }, []);

  // 2. Manejar Cancelación (Simulando useMutation)
  const handleConfirmCancel = async () => {
    if (!selectedId) return;
    
    setIsCancelling(true);
    try {
      // AQUÍ USARÍAS: await SuscripcionService.cancelar(selectedId);
      await MockSuscripcionService.cancelar(selectedId);
      
      // Actualizar UI
      alert('Suscripción cancelada exitosamente.');
      setSuscripciones(prev => prev.filter(s => s.id !== selectedId));
      setOpenConfirm(false);
    } catch (err: any) {
      alert("No se pudo cancelar la suscripción.");
    } finally {
      setIsCancelling(false);
    }
  };

  // Abrir modal
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

      <QueryHandler isLoading={isLoading} error={null}>
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
                  
                  {/* Info Principal */}
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
                        label={`${susc.tokens_disponibles} Tokens`} 
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
                      {Number(susc.saldo_a_favor) > 0 && (
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

      {/* --- DIÁLOGO DE CONFIRMACIÓN (Mejor UX para Cliente) --- */}
      <Dialog
        open={openConfirm}
        onClose={() => !isCancelling && setOpenConfirm(false)}
        maxWidth="xs"
      >
        <DialogTitle fontWeight="bold">¿Cancelar suscripción?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Si cancelas ahora, perderás tu progreso de inversión en este proyecto y los beneficios acumulados. 
            <br /><br />
            <strong>Esta acción no se puede deshacer.</strong>
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button 
            onClick={() => setOpenConfirm(false)} 
            disabled={isCancelling}
            color="inherit"
          >
            Mantener Suscripción
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