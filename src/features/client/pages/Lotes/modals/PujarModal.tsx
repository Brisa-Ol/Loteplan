import {
  BookmarkBorder,
  Timer
} from '@mui/icons-material';
import {
  Alert, alpha, Box, Button, Divider, InputAdornment,
  Skeleton,
  Stack, TextField, Typography, useTheme
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';

import ImagenService from '@/core/api/services/imagen.service';
import PujaService from '@/core/api/services/puja.service';
import type { LoteDto } from '@/core/types/lote.dto';
import { useImageLoader } from '@/features/client/hooks';
import { useCurrencyFormatter } from '@/features/client/hooks/useCurrencyFormatter';
import { useVerificarSuscripcion } from '@/features/client/hooks/useVerificarSuscripcion';
import { BaseModal } from '@/shared/components/domain/modals/BaseModal';
import useSnackbar from '@/shared/hooks/useSnackbar';

const INCREMENTO_PASO = 10_000;

interface Props {
  open: boolean;
  onClose: () => void;
  lote: LoteDto | null;
  soyGanador?: boolean;
  yaParticipa?: boolean;
  onSuccess?: () => void;
}

export const PujarModal: React.FC<Props> = ({
  open, onClose, lote,
  soyGanador = false, yaParticipa = false, onSuccess,
}) => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const formatCurrency = useCurrencyFormatter();
  const { showSuccess, showError } = useSnackbar();

  const [monto, setMonto] = useState('');
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  // ✅ Estado para guardar el mínimo al abrir el modal
  const [minimoAlAbrir, setMinimoAlAbrir] = useState(0);

  const { isLoading: imgLoading, hasError: imgError, handleLoad, handleError } = useImageLoader();
  const { tieneTokens } = useVerificarSuscripcion(lote?.id_proyecto ?? undefined);

  const rawUrl = lote?.imagenes?.[0]?.url;
  const hasNoImageRecord = !rawUrl || rawUrl.trim() === '';

  const imagenUrl = useMemo(() => {
    if (hasNoImageRecord) return null;
    return ImagenService.resolveImageUrl(rawUrl);
  }, [rawUrl, hasNoImageRecord]);

  // ✅ Lógica corregida para buscar la puja más alta donde sea que venga
  const { precioMinimoRequerido, precioActual, hayOfertas, precioBase } = useMemo(() => {
    if (!lote) return { precioMinimoRequerido: 0, precioActual: 0, hayOfertas: false, precioBase: 0 };
    
    const base = Number(lote.precio_base || 0);
    let actual = base;
    let tieneOfertas = false;
    
    if (lote.id_puja_mas_alta && Array.isArray(lote.pujas)) {
      const pGanadora = lote.pujas.find((p: any) => p.id === lote.id_puja_mas_alta);
      if (pGanadora) {
        actual = Number(pGanadora.monto_puja);
        tieneOfertas = true;
      }
    } else if (lote.ultima_puja?.monto) {
      actual = Number(lote.ultima_puja.monto);
      tieneOfertas = true;
    }
    
    // Si hay oferta previa, suma el paso. Si es la primera oferta, también debe ser mayor que la base.
    const minimo = actual + INCREMENTO_PASO;
    return { precioMinimoRequerido: minimo, precioActual: actual, hayOfertas: tieneOfertas, precioBase: base };
  }, [lote]);

  // ✅ useEffect actualizado
  useEffect(() => {
    if (open) {
      setMonto(precioMinimoRequerido.toString());
      setMinimoAlAbrir(precioMinimoRequerido);
      setErrorLocal(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const mutation = useMutation({
    mutationFn: async () => {
      await PujaService.create({ id_lote: lote!.id, monto_puja: Number(monto) });
    },
    onSuccess: () => {
      showSuccess(yaParticipa || soyGanador ? '¡Oferta mejorada!' : '¡Participación confirmada!');
      handleReset();
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => showError(err.response?.data?.error || 'Error al procesar'),
  });

  const handleReset = () => {
    setMonto('');
    setErrorLocal(null);
    onClose();
  };

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

        <Box
          sx={{
            height: 120, borderRadius: 2, overflow: 'hidden', position: 'relative',
            border: '1px solid', borderColor: 'divider', bgcolor: 'grey.100',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          {hasNoImageRecord ? (
            <Stack direction="row" alignItems="center" spacing={2} sx={{ color: 'text.disabled' }}>
              <BookmarkBorder opacity={0.5} />
              <Typography variant="caption" fontWeight={700}>LOTE SIN IMAGEN</Typography>
            </Stack>
          ) : (
            <>
              {imgLoading && <Skeleton variant="rectangular" width="100%" height="100%" sx={{ position: 'absolute' }} />}
              <Box
                component="img"
                src={imgError ? '/assets/placeholder-lote.jpg' : imagenUrl!}
                onLoad={handleLoad}
                onError={handleError}
                sx={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  opacity: imgLoading ? 0 : 1, transition: 'opacity 0.3s'
                }}
              />
              <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 1, background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', color: 'white' }}>
                <Typography variant="caption" fontWeight={800} noWrap display="block">
                  {lote.nombre_lote}
                </Typography>
              </Box>
            </>
          )}
        </Box>

        <Box
          sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
            color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.05),
            py: 1, borderRadius: 2,
          }}
        >
          <Timer fontSize="small" />
          <Typography variant="caption" fontWeight={900}>CIERRA EN POCO TIEMPO</Typography>
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="subtitle1" fontWeight={800} color={soyGanador ? 'success.main' : 'warning.main'}>
            {soyGanador ? '¡Vas ganando, no te relajes!' : '¡Oferta ahora y asegura el lote!'}
          </Typography>
        </Box>

        <Box p={2} bgcolor="background.paper" borderRadius={2} border="1px solid" borderColor="divider">
          <Stack direction="row" justifyContent="space-between" mb={1}>
            <Typography variant="caption" color="text.secondary">Precio Base Inicial:</Typography>
            <Typography variant="body2" color="text.secondary">{formatCurrency(precioBase)}</Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="caption" color="text.secondary">
              {hayOfertas ? 'Oferta Líder Actual:' : 'Sin Ofertas (Mínimo arranca en):'}
            </Typography>
            <Typography variant="body2" fontWeight={800}>{formatCurrency(precioActual)}</Typography>
          </Stack>
          <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="caption" color="primary.main" fontWeight={800}>Mínimo a ofertar ahora:</Typography>
            <Typography variant="body2" color="primary.main" fontWeight={900}>
              {formatCurrency(precioMinimoRequerido)}
            </Typography>
          </Stack>
        </Box>

        {/* ✅ Alerta dinámica antes del TextField */}
        {precioMinimoRequerido > minimoAlAbrir && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            <Typography variant="caption" fontWeight={800}>
              ¡ATENCIÓN! Alguien acaba de ofertar. El nuevo mínimo es {formatCurrency(precioMinimoRequerido)}.
            </Typography>
          </Alert>
        )}

        <TextField
          autoFocus
          fullWidth
          label="Tu Monto"
          type="number"
          value={monto}
          onChange={(e) => { setMonto(e.target.value); setErrorLocal(null); }}
          error={monto !== '' && !esMontoValido}
          helperText={
            monto !== '' && !esMontoValido
              ? `Debe ser al menos ${formatCurrency(precioMinimoRequerido)}`
              : ''
          }
          InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
        />

        <Stack direction="row" spacing={1}>
          {[10_000, 100_000, 500_000].map((v) => (
            <Button
              key={v} variant="outlined" fullWidth
              onClick={() => setMonto((Number(monto) + v).toString())}
            >
              +{v / 1_000}k
            </Button>
          ))}
        </Stack>

        <Alert severity={soyGanador || yaParticipa ? 'info' : 'warning'} sx={{ borderRadius: 2 }}>
          <Typography variant="caption" fontWeight={700}>
            {soyGanador || yaParticipa
              ? 'Mejora gratuita: No consume tokens.'
              : 'Esta puja consumirá 1 token.'}
          </Typography>
        </Alert>
      </Stack>
    </BaseModal>
  );
};