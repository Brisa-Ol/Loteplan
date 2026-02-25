// src/features/client/pages/Lotes/components/modals/PujarModal.tsx

import { Add, Gavel, MonetizationOn, Token, VerifiedUser, Timer, TrendingUp } from '@mui/icons-material';
import { Alert, alpha, Box, Button, Chip, Divider, InputAdornment, Stack, TextField, Typography, useTheme, CircularProgress } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';

import PujaService from '@/core/api/services/puja.service';
import type { LoteDto } from '@/core/types/dto/lote.dto';
import { useCurrencyFormatter } from '@/features/client/hooks/useCurrencyFormatter';
import { useVerificarSuscripcion } from '@/features/client/hooks/useVerificarSuscripcion';
import BaseModal from '@/shared/components/domain/modals/BaseModal/BaseModal';
import useSnackbar from '@/shared/hooks/useSnackbar';

const INCREMENTO_PASO = 10000; // Ajustado a tus botones rápidos

interface Props {
  open: boolean;
  onClose: () => void;
  lote: LoteDto | null;
  soyGanador?: boolean;
  yaParticipa?: boolean;
  onSuccess?: () => void;
}

export const PujarModal: React.FC<Props> = ({ open, onClose, lote, soyGanador = false, yaParticipa = false, onSuccess }) => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const formatCurrency = useCurrencyFormatter();
  const { showSuccess, showError } = useSnackbar();

  const [monto, setMonto] = useState('');
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const { tokensDisponibles, tieneTokens } = useVerificarSuscripcion(lote?.id_proyecto ?? undefined);

  const { precioMinimoRequerido, precioActual } = useMemo(() => {
    if (!lote) return { precioMinimoRequerido: 0, precioActual: 0 };
    const actual = Number(lote.ultima_puja?.monto || lote.precio_base);
    // ✅ VALIDACIÓN ESTRICTA: El mínimo siempre es Actual + Incremento (o Base si es la primera)
    const hayPujas = !!lote.ultima_puja;
    const minimo = hayPujas ? actual + INCREMENTO_PASO : actual;
    return { precioMinimoRequerido: minimo, precioActual: actual };
  }, [lote]);

  useEffect(() => {
    if (open && lote) {
      setMonto(precioMinimoRequerido.toString());
      setErrorLocal(null);
    }
  }, [open, lote, precioMinimoRequerido]);

  const mutation = useMutation({
    mutationFn: async () => {
      await PujaService.create({ id_lote: lote!.id, monto_puja: Number(monto) });
    },
    onSuccess: () => {
      showSuccess(yaParticipa || soyGanador ? "¡Oferta mejorada!" : "¡Participación confirmada!");
      handleReset();
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => showError(err.response?.data?.error || "Error al procesar")
  });

  const handleReset = () => { setMonto(''); setErrorLocal(null); onClose(); };

  const montoNumerico = parseFloat(monto);
  const esMontoValido = !isNaN(montoNumerico) && montoNumerico >= precioMinimoRequerido;

  if (!lote) return null;

  return (
    <BaseModal
      open={open}
      onClose={handleReset}
      title={soyGanador ? 'Defender mi Lugar' : (yaParticipa ? 'Superar Oferta' : 'Ofertar Ahora')}
      headerColor={soyGanador ? 'success' : (yaParticipa ? 'warning' : 'primary')}
      onConfirm={() => mutation.mutate()}
      disableConfirm={!esMontoValido || mutation.isPending || (!soyGanador && !yaParticipa && !tieneTokens)}
    >
      <Stack spacing={3}>
        {/* 🚀 TIMER DE PRESIÓN */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.05), py: 1, borderRadius: 2 }}>
            <Timer fontSize="small" />
            <Typography variant="caption" fontWeight={900}>CIERRA EN POCO TIEMPO</Typography>
        </Box>

        <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" fontWeight={800} color={soyGanador ? "success.main" : "warning.main"}>
                {soyGanador ? "¡Vas ganando, no te relajes!" : "¡Oferta ahora y asegura el lote!"}
            </Typography>
        </Box>

        <Box p={2} bgcolor="background.paper" borderRadius={2} border="1px solid" borderColor="divider">
            <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">Oferta Líder:</Typography>
                <Typography variant="body2" fontWeight={800}>{formatCurrency(precioActual)}</Typography>
            </Stack>
            <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
            <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" color="primary.main" fontWeight={800}>Mínimo a ofertar:</Typography>
                <Typography variant="body2" color="primary.main" fontWeight={900}>{formatCurrency(precioMinimoRequerido)}</Typography>
            </Stack>
        </Box>

        <TextField
          autoFocus
          fullWidth
          label="Tu Monto"
          type="number"
          value={monto}
          onChange={(e) => { setMonto(e.target.value); setErrorLocal(null); }}
          error={monto !== '' && !esMontoValido}
          helperText={monto !== '' && !esMontoValido ? `Debe ser al menos ${formatCurrency(precioMinimoRequerido)}` : ''}
          InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
        />

        <Stack direction="row" spacing={1}>
          {[10000, 100000, 500000].map(v => (
            <Button key={v} variant="outlined" fullWidth onClick={() => setMonto((Number(monto) + v).toString())}>+{v/1000}k</Button>
          ))}
        </Stack>

        <Alert severity={soyGanador || yaParticipa ? "info" : "warning"} sx={{ borderRadius: 2 }}>
            <Typography variant="caption" fontWeight={700}>
                {soyGanador || yaParticipa ? "Mejora gratuita: No consume tokens." : "Esta puja consumirá 1 token."}
            </Typography>
        </Alert>
      </Stack>
    </BaseModal>
  );
};