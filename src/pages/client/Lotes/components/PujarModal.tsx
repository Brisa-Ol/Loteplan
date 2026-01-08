import React, { useState, useEffect } from 'react';
import { 
  TextField, Typography, Alert, Box, Stack, Divider, InputAdornment, useTheme, alpha 
} from '@mui/material';
import { Gavel, MonetizationOn, Token, TrendingUp, VerifiedUser } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import PujaService from '../../../../services/puja.service';
import type { LoteDto } from '../../../../types/dto/lote.dto';
import type { CreatePujaDto } from '../../../../types/dto/puja.dto';
import { BaseModal } from '../../../../components/common/BaseModal/BaseModal';

// ✅ CORRECCIÓN DE INTERFAZ:
// No redefinimos 'monto_ganador_lote' porque ya existe en LoteDto como 'string | null'.
// Solo agregamos 'ultima_puja' que suele venir de un include o query separada.
interface LoteConPuja extends LoteDto {
    ultima_puja?: { monto: number | string; id_usuario: number; }; 
}

interface Props {
  open: boolean;
  onClose: () => void;
  lote: LoteDto | null;
  soyGanador?: boolean;
  onSuccess?: () => void;
}

export const PujarModal: React.FC<Props> = ({ open, onClose, lote: loteProp, soyGanador = false, onSuccess }) => {
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
      
      const payload: CreatePujaDto = {
        id_lote: lote.id,
        monto_puja: Number(monto) // Convertimos el string del input a number para el DTO de envío
      };

      await PujaService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lotesProyecto'] }); 
      queryClient.invalidateQueries({ queryKey: ['lote', lote?.id?.toString()] });
      queryClient.invalidateQueries({ queryKey: ['misPujas'] });
      
      const msg = soyGanador ? '¡Has actualizado tu puja exitosamente!' : '¡Oferta realizada con éxito!';
      alert(msg); 
      
      if (onSuccess) onSuccess();
      handleReset();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message || 'Error al realizar la puja.';
      setError(msg);
    }
  });

  const handleReset = () => {
      setMonto('');
      setError(null);
      onClose();
  };

  if (!lote) return null;

  // === CÁLCULOS DE PRECIO Y REGLAS DE NEGOCIO ===
  
  // 1. Conversión Explícita de Tipos (String -> Number)
  // Como tu DTO define estos campos como 'string', debemos convertirlos para comparaciones matemáticas.
  
  const precioBase = Number(lote.precio_base); // Viene como string del DTO
  const montoGanadorLote = lote.monto_ganador_lote ? Number(lote.monto_ganador_lote) : 0; // Viene como string | null
  const montoUltimaPuja = lote.ultima_puja?.monto ? Number(lote.ultima_puja.monto) : 0; // Puede venir number o string
  
  // 2. Determinar el "Precio de Mercado" actual
  const precioMercado = Math.max(montoUltimaPuja, montoGanadorLote);

  // 3. Determinar precio a vencer
  const hayPujasPrevias = precioMercado > 0;
  const precioA_Vencer = hayPujasPrevias ? precioMercado : precioBase;

  // Helper de formateo visual
  const formatMoney = (amount: number) => 
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(amount);

  const handleSubmit = () => {
    if (!monto) return;
    mutation.mutate();
  };

  const montoNumerico = Number(monto);
  
  // === VALIDACIÓN ===
  const esMontoValido = 
    monto !== '' && 
    !isNaN(montoNumerico) && 
    (hayPujasPrevias ? montoNumerico > precioA_Vencer : montoNumerico >= precioBase);

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
          
          {/* Panel de Información de Precios */}
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
                {formatMoney(precioA_Vencer)}
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
            placeholder={hayPujasPrevias ? `Mayor a ${formatMoney(precioA_Vencer)}` : `Mínimo ${formatMoney(precioBase)}`}
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
            helperText={
                error || 
                (monto !== '' && !esMontoValido 
                    ? `Debe ${hayPujasPrevias ? 'superar' : 'ser al menos'} ${formatMoney(precioA_Vencer)}` 
                    : '')
            }
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

export default PujarModal;