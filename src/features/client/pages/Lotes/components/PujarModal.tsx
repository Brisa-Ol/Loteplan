import React, { useState, useEffect, useMemo } from 'react';
import { 
  TextField, Typography, Alert, Box, Stack, Divider, InputAdornment, useTheme, alpha, CircularProgress 
} from '@mui/material';
import { Gavel, MonetizationOn, Token, TrendingUp, VerifiedUser } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { LoteDto } from '@/core/types/dto/lote.dto';
import type { CreatePujaDto } from '@/core/types/dto/puja.dto';
import PujaService from '@/core/api/services/puja.service';
import BaseModal from '@/shared/components/domain/modals/BaseModal/BaseModal';

// Extendemos para soportar datos anidados que el backend pueda enviar (ej: includes)
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
  
  const [monto, setMonto] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const lote = loteProp as LoteConPuja | null;

  // Reset al abrir
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
        monto_puja: Number(monto) // Convertimos a número para el DTO
      };

      await PujaService.create(payload);
    },
    onSuccess: () => {
      // Invalidar queries clave para refrescar la UI inmediatamente
      queryClient.invalidateQueries({ queryKey: ['lotesProyecto'] }); 
      queryClient.invalidateQueries({ queryKey: ['lote', lote?.id?.toString()] });
      queryClient.invalidateQueries({ queryKey: ['misPujas'] });
      queryClient.invalidateQueries({ queryKey: ['activePujas'] });
      
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

  // === 🧮 LÓGICA DE PRECIOS Y VALIDACIÓN ===
  
  const { precioBase, precioActualMercado, precioMinimoRequerido, esPrimerPuja } = useMemo(() => {
      if (!lote) return { precioBase: 0, precioActualMercado: 0, precioMinimoRequerido: 0, esPrimerPuja: true };

      // 1. Parseo seguro de Decimales (vienen como string del backend usualmente)
      const base = parseFloat(lote.precio_base.toString());
      
      // 2. Determinar la puja más alta actual
      // Prioridad: 
      // A. 'ultima_puja.monto' (si el backend hace include)
      // B. 'monto_ganador_lote' (si el backend actualiza la columna en Lote)
      // C. 0 (Nadie ha pujado)
      let actual = 0;
      if (lote.ultima_puja?.monto) {
          actual = parseFloat(lote.ultima_puja.monto.toString());
      } else if (lote.monto_ganador_lote) {
          actual = parseFloat(lote.monto_ganador_lote.toString());
      }

      const hayPujas = actual > 0;

      // 3. Regla del Backend:
      // - Si hay puja previa: Nueva > Actual
      // - Si NO hay puja previa: Nueva >= Base
      // Nota: Para simplificar UX, en subastas activas solemos pedir > Actual.
      // Pero si nadie ha pujado, debe ser >= Base.
      
      let minimo = 0;
      if (hayPujas) {
          // Si ya hay pujas, debo superar estrictamente la actual.
          // En la UI, sugerimos al menos un incremento mínimo (ej: +1 centavo o +100 pesos), 
          // pero la validación estricta es > actual.
          minimo = actual + 0.01; 
      } else {
          minimo = base;
      }

      return {
          precioBase: base,
          precioActualMercado: actual,
          precioMinimoRequerido: minimo,
          esPrimerPuja: !hayPujas
      };
  }, [lote]);

  const formatMoney = (amount: number) => 
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(amount);

  const handleSubmit = () => {
    if (!monto || !esMontoValido) return;
    mutation.mutate();
  };

  if (!lote) return null;

  const montoNumerico = parseFloat(monto);
  
  // Validación estricta contra NaN y reglas de negocio
  const esMontoValido = 
    monto !== '' && 
    !isNaN(montoNumerico) && 
    montoNumerico >= precioMinimoRequerido;

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
        disableConfirm={!esMontoValido || mutation.isPending}
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
                {/* Fila 1: Precio Base (Referencia) */}
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">Precio Base</Typography>
                    <Typography variant="body2" fontWeight={500} color="text.secondary">{formatMoney(precioBase)}</Typography>
                </Stack>

                <Divider sx={{ borderStyle: 'dashed' }} />

                {/* Fila 2: Situación Actual */}
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.primary" display="flex" alignItems="center" gap={0.5} fontWeight={600}>
                        {soyGanador 
                            ? <><VerifiedUser fontSize="inherit" color="success"/> Tu Puja Actual</> 
                            : (esPrimerPuja ? <><MonetizationOn fontSize="inherit"/> Sin Ofertas</> : <><TrendingUp fontSize="inherit" color="warning"/> Oferta Más Alta</>)
                        }
                    </Typography>
                    <Typography variant="h6" color={soyGanador ? "success.main" : (esPrimerPuja ? "text.primary" : "warning.main")} fontWeight={800}>
                        {esPrimerPuja ? '--' : formatMoney(precioActualMercado)}
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
            // Placeholder dinámico según reglas
            placeholder={`Mínimo ${formatMoney(precioMinimoRequerido)}`}
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
                    ? `La oferta debe ser mayor o igual a ${formatMoney(precioMinimoRequerido)}` 
                    : 'Ingresa el monto que estás dispuesto a pagar.')
            }
            sx={{ 
                '& .MuiOutlinedInput-root': { borderRadius: 2 },
                '& input[type=number]': { MozAppearance: 'textfield' } // Quita flechas en Firefox
            }}
          />

          {/* ℹ️ AVISO DE TOKENS */}
          {soyGanador ? (
            <Alert severity="info" icon={<Token fontSize="inherit" />} variant="outlined" sx={{ borderRadius: 2 }}>
                <Typography variant="caption" display="block" lineHeight={1.3}>
                  Actualizar tu propia puja ganadora es <strong>gratis</strong> (no consume tokens extra).
                </Typography>
            </Alert>
          ) : (
            <Alert severity="warning" icon={<Token fontSize="inherit" />} variant="outlined" sx={{ borderRadius: 2 }}>
                <Typography variant="caption" display="block" lineHeight={1.3}>
                  Al confirmar, se consumirá <strong>1 Token de Subasta</strong> de tu suscripción.
                </Typography>
            </Alert>
          )}

      </Stack>
    </BaseModal>
  );
};

export default PujarModal;