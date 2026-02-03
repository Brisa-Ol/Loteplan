import React, { useState, useEffect, useMemo } from 'react';
import { 
  TextField, Typography, Alert, Box, Stack, Divider, InputAdornment, useTheme, alpha, CircularProgress, Chip 
} from '@mui/material';
import { Gavel, MonetizationOn, Token, TrendingUp, VerifiedUser } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { LoteDto } from '@/core/types/dto/lote.dto';
import type { CreatePujaDto } from '@/core/types/dto/puja.dto';
import PujaService from '@/core/api/services/puja.service';
import BaseModal from '@/shared/components/domain/modals/BaseModal/BaseModal';
import { useVerificarSuscripcion } from '@/features/client/hooks/useVerificarSuscripcion';
import { useCurrencyFormatter } from '@/features/client/hooks/useCurrencyFormatter';



interface LoteConPuja extends LoteDto {
    ultima_puja?: { 
        monto: string | number; 
        id_usuario?: number; 
    }; 
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
  const queryClient = useQueryClient();
  
  // ✅ Inicialización del formateador
  const formatCurrency = useCurrencyFormatter();
  
  const [monto, setMonto] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const lote = loteProp as LoteConPuja | null;

  const { tokensDisponibles, tieneTokens, isLoading: loadingTokens } = useVerificarSuscripcion(lote?.id_proyecto ?? undefined);

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
        monto_puja: Number(monto)
      };
      await PujaService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lotesProyecto'] }); 
      queryClient.invalidateQueries({ queryKey: ['lote', lote?.id?.toString()] });
      queryClient.invalidateQueries({ queryKey: ['misPujas'] });
      queryClient.invalidateQueries({ queryKey: ['activePujas'] });
      queryClient.invalidateQueries({ queryKey: ['check-suscripcion'] }); 
      
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

  // === 🧮 LÓGICA DE PRECIOS ===
  const { precioBase, precioActualMercado, precioMinimoRequerido, esPrimerPuja } = useMemo(() => {
      if (!lote) return { precioBase: 0, precioActualMercado: 0, precioMinimoRequerido: 0, esPrimerPuja: true };

      const base = parseFloat(lote.precio_base.toString());
      let actual = 0;
      if (lote.ultima_puja?.monto) {
          actual = parseFloat(lote.ultima_puja.monto.toString());
      } else if (lote.monto_ganador_lote) {
          actual = parseFloat(lote.monto_ganador_lote.toString());
      }

      const hayPujas = actual > 0;
      // Mínimo incremento de 0.01 o precio base si no hay pujas
      let minimo = hayPujas ? actual + 0.01 : base;

      return {
          precioBase: base,
          precioActualMercado: actual,
          precioMinimoRequerido: minimo,
          esPrimerPuja: !hayPujas
      };
  }, [lote]);

  // 🗑️ Se eliminó la función manual formatMoney

  const handleSubmit = () => {
    if (!monto || !esMontoValido) return;
    mutation.mutate();
  };

  if (!lote) return null;

  const montoNumerico = parseFloat(monto);
  const esMontoValido = monto !== '' && !isNaN(montoNumerico) && montoNumerico >= precioMinimoRequerido;
  const puedeConfirmar = esMontoValido && !mutation.isPending && (soyGanador || tieneTokens);

  return (
    <BaseModal
        open={open}
        onClose={handleReset}
        title={soyGanador ? 'Defender mi Posición' : 'Realizar Oferta'}
        subtitle={`Lote: ${lote.nombre_lote}`}
        icon={soyGanador ? <VerifiedUser /> : <Gavel />}
        headerColor={soyGanador ? 'success' : 'primary'}
        maxWidth="xs"
        confirmText={soyGanador ? 'Actualizar Puja' : 'Confirmar Oferta'}
        confirmButtonColor={soyGanador ? 'success' : 'primary'}
        confirmButtonIcon={mutation.isPending ? <CircularProgress size={20} color="inherit"/> : undefined}
        onConfirm={handleSubmit}
        isLoading={mutation.isPending}
        disableConfirm={!puedeConfirmar}
    >
      <Stack spacing={3}>
          
          {/* 📊 PANEL DE PRECIOS */}
          <Box 
            p={2} 
            bgcolor={soyGanador ? alpha(theme.palette.success.main, 0.05) : alpha(theme.palette.background.paper, 0.5)} 
            borderRadius={2} 
            border="1px solid" 
            borderColor={soyGanador ? 'success.main' : 'divider'}
          >
            <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">Precio Base</Typography>
                    {/* ✅ Uso del hook para Precio Base */}
                    <Typography variant="body2" fontWeight={500} color="text.secondary">
                        {formatCurrency(precioBase)}
                    </Typography>
                </Stack>

                <Divider sx={{ borderStyle: 'dashed' }} />

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.primary" display="flex" alignItems="center" gap={0.5} fontWeight={600}>
                        {soyGanador 
                            ? <><VerifiedUser fontSize="inherit" color="success"/> Tu Puja Actual</> 
                            : (esPrimerPuja ? <><MonetizationOn fontSize="inherit"/> Sin Ofertas</> : <><TrendingUp fontSize="inherit" color="warning"/> Oferta Más Alta</>)
                        }
                    </Typography>
                    {/* ✅ Uso del hook para Oferta Actual */}
                    <Typography variant="h6" color={soyGanador ? "success.main" : (esPrimerPuja ? "text.primary" : "warning.main")} fontWeight={800}>
                        {esPrimerPuja ? '--' : formatCurrency(precioActualMercado)}
                    </Typography>
                </Stack>
            </Stack>

            {soyGanador && (
               <Typography variant="caption" color="success.main" display="block" mt={1} fontWeight={500} textAlign="center">
                 ¡Vas ganando! Puedes subir tu oferta para asegurar el lote.
               </Typography>
            )}
          </Box>

          {/* ⌨️ INPUT DE OFERTA */}
          <TextField
            autoFocus
            fullWidth
            label={soyGanador ? "Mejorar mi oferta" : "Tu oferta"}
          
            placeholder={`Mínimo ${formatCurrency(precioMinimoRequerido)}`}
            type="number"
            autoComplete='off'
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
                    /* ✅ Formateo en Mensaje de Error */
                    ? `La oferta debe ser mayor o igual a ${formatCurrency(precioMinimoRequerido)}` 
                    : 'Ingresa el monto que estás dispuesto a pagar.')
            }
            sx={{ 
                '& .MuiOutlinedInput-root': { borderRadius: 2 },
                '& input[type=number]': { MozAppearance: 'textfield' }
            }}
          />

          {/* ✅ ℹ️ AVISO DE TOKENS */}
          {soyGanador ? (
            <Alert severity="info" icon={<Token fontSize="inherit" />} variant="outlined" sx={{ borderRadius: 2 }}>
                <Typography variant="caption" display="block" lineHeight={1.3}>
                  Actualizar tu propia puja ganadora es <strong>gratis</strong> (no consume tokens extra).
                </Typography>
            </Alert>
          ) : (
            <Alert 
              severity={tieneTokens ? "warning" : "error"} 
              icon={loadingTokens ? <CircularProgress size={16}/> : <Token fontSize="inherit" />} 
              variant="outlined" 
              sx={{ borderRadius: 2 }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" width="100%">
                <Box>
                  <Typography variant="body2" fontWeight={600} color={tieneTokens ? "inherit" : "error"}>
                    {tieneTokens ? "Se consumirá 1 Token" : "Sin tokens disponibles"}
                  </Typography>
                  <Typography variant="caption" display="block" lineHeight={1.3}>
                    {tieneTokens 
                      ? "Esta oferta utilizará un token de tu suscripción." 
                      : "Ya estás participando en otra subasta de este proyecto."}
                  </Typography>
                </Box>
                <Chip 
                  label={`${tokensDisponibles} disp.`} 
                  color={tieneTokens ? "primary" : "error"} 
                  size="small" 
                  sx={{ fontWeight: 'bold' }}
                />
              </Stack>
            </Alert>
          )}

      </Stack>
    </BaseModal>
  );
};

export default PujarModal;