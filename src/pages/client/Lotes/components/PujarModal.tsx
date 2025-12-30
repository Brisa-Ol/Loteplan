import React, { useState, useEffect } from 'react';
import { 
  TextField, Typography, Alert, Box, Stack, Divider, InputAdornment, useTheme, alpha 
} from '@mui/material';
import { Gavel, MonetizationOn, Token, TrendingUp, VerifiedUser } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import PujaService from '../../../../Services/puja.service';
import type { LoteDto } from '../../../../types/dto/lote.dto';
import { BaseModal } from '../../../../components/common/BaseModal/BaseModal';

// Interfaz local para el DTO extendido
interface LoteConPuja extends LoteDto {
    ultima_puja?: { monto: number; id_usuario: number; }; 
}

interface Props {
  open: boolean;
  onClose: () => void;
  lote: LoteDto | null;
  soyGanador?: boolean;
}

export const PujarModal: React.FC<Props> = ({ open, onClose, lote: loteProp, soyGanador = false }) => {
  const theme = useTheme();
  const [monto, setMonto] = useState('');
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  
  const lote = loteProp as LoteConPuja | null;

  useEffect(() => {
    if (open) {
      setMonto('');
      setError(null);
    }
  }, [open, lote]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!lote) return;
      await PujaService.create({
        id_lote: lote.id,
        monto_puja: Number(monto)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lotesProyecto'] }); 
      queryClient.invalidateQueries({ queryKey: ['lote'] });
      queryClient.invalidateQueries({ queryKey: ['misPujas'] });
      
      const msg = soyGanador ? '¡Has actualizado tu puja exitosamente!' : '¡Oferta realizada con éxito!';
      // Idealmente reemplazar esto por un Toast/Snackbar global
      alert(msg); 
      handleReset();
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Error al realizar la puja. Verifica tus tokens.');
    }
  });

  const handleReset = () => {
      setMonto('');
      setError(null);
      onClose();
  };

  if (!lote) return null;

  // Cálculos de precio
  const ultimaPujaMonto = lote.ultima_puja?.monto ? Number(lote.ultima_puja.monto) : 0;
  const precioBase = Number(lote.precio_base);
  const precioActual = ultimaPujaMonto > precioBase ? ultimaPujaMonto : precioBase;
  const hayPujasPrevias = ultimaPujaMonto > precioBase;

  const formatMoney = (amount: number) => 
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(amount);

  const handleSubmit = () => {
    if (!monto) return;
    mutation.mutate();
  };

  // Validaciones para el botón
  const montoNumerico = Number(monto);
  const esMontoValido = monto && montoNumerico > precioActual;

  return (
    <BaseModal
        open={open}
        onClose={handleReset}
        title={soyGanador ? 'Actualizar Oferta' : 'Realizar Oferta'}
        subtitle={lote.nombre_lote}
        icon={soyGanador ? <VerifiedUser /> : <Gavel />}
        headerColor={soyGanador ? 'success' : 'primary'}
        maxWidth="xs"
        confirmText={soyGanador ? 'Actualizar Puja' : 'Confirmar Oferta'}
        confirmButtonColor={soyGanador ? 'success' : 'primary'}
        onConfirm={handleSubmit}
        isLoading={mutation.isPending}
        disableConfirm={!esMontoValido || mutation.isPending}
    >
      <Stack spacing={3}>
          
          {/* Información del Lote y Precio a Vencer */}
          <Box 
            p={2} 
            bgcolor={soyGanador ? alpha(theme.palette.success.main, 0.05) : (hayPujasPrevias ? alpha(theme.palette.warning.main, 0.05) : alpha(theme.palette.grey[500], 0.05))} 
            borderRadius={2} 
            border="1px solid" 
            borderColor={soyGanador ? 'success.main' : 'divider'}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" gap={0.5} fontWeight={600}>
                {soyGanador ? <VerifiedUser fontSize="inherit" color="success"/> : (hayPujasPrevias ? <TrendingUp fontSize="inherit"/> : <MonetizationOn fontSize="inherit"/>)}
                {soyGanador ? 'Tu Puja Actual:' : (hayPujasPrevias ? 'Puja Más Alta:' : 'Precio Base:')}
              </Typography>
              <Typography variant="h6" color={soyGanador ? "success.main" : (hayPujasPrevias ? "warning.main" : "primary.main")} fontWeight={800}>
                {formatMoney(precioActual)}
              </Typography>
            </Stack>

            {soyGanador && (
               <Typography variant="caption" color="success.main" display="block" mt={1} fontWeight={500}>
                 ¡Vas ganando! Sube tu oferta para proteger tu posición.
               </Typography>
            )}
          </Box>

          {/* Input de Oferta */}
          <TextField
            autoFocus
            fullWidth
            label="Tu Nueva Oferta"
            placeholder={`Mayor a ${formatMoney(precioActual)}`}
            type="number"
            value={monto}
            onChange={(e) => {
              setMonto(e.target.value);
              setError(null);
            }}
            disabled={mutation.isPending}
            InputProps={{
              startAdornment: <InputAdornment position="start"><MonetizationOn color="action" /></InputAdornment>,
            }}
            error={!!error || (monto !== '' && !esMontoValido)}
            helperText={error || (monto !== '' && !esMontoValido ? `Debe superar ${formatMoney(precioActual)}` : '')}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />

          <Divider />

          {/* Aviso de Token Inteligente */}
          {soyGanador ? (
            <Alert severity="info" icon={<Token fontSize="inherit" />} sx={{ alignItems: 'center', borderRadius: 2 }}>
                <Typography variant="caption" display="block">
                  Al actualizar tu propia puja ganadora, <strong>no se consumen tokens adicionales</strong>.
                </Typography>
            </Alert>
          ) : (
            <Alert severity="warning" icon={<Token fontSize="inherit" />} sx={{ alignItems: 'center', borderRadius: 2 }}>
                <Typography variant="caption" display="block">
                  Esta acción consumirá <strong>1 Token de Subasta</strong> si es tu primera participación en este lote.
                </Typography>
            </Alert>
          )}

      </Stack>
    </BaseModal>
  );
};