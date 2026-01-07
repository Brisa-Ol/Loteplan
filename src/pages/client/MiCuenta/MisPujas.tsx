import React, { useState } from 'react';
import {
  TextField, Stack, Box, Typography, InputAdornment, Alert, Divider,
  Paper, useTheme, alpha, Chip
} from '@mui/material';
import {
  Gavel as GavelIcon,
  MonetizationOn,
  Token,
  TrendingUp
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { LoteDto } from '../../../types/dto/lote.dto';
import useSnackbar from '../../../hooks/useSnackbar';
import PujaService from '../../../services/puja.service';
import type { CreatePujaDto } from '../../../types/dto/puja.dto';
import BaseModal from '../../../components/common/BaseModal/BaseModal';



interface PujarModalProps {
  open: boolean;
  onClose: () => void;
  lote: LoteDto;
  onSuccess?: () => void;
}

// Esquema de validación
const validationSchema = (minAmount: number) => Yup.object({
  monto_puja: Yup.number()
    .required('Debes ingresar un monto')
    .min(minAmount, `La oferta debe ser mayor a $${minAmount.toLocaleString()}`)
    .typeError('Debe ser un número válido'),
});

const PujarModal: React.FC<PujarModalProps> = ({ open, onClose, lote, onSuccess }) => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { showSuccess } = useSnackbar();
  const [serverError, setServerError] = useState<string | null>(null);

  // Determinar el monto mínimo sugerido (Puja más alta + 1, o Precio Base)
  // Nota: Esto es solo una ayuda visual, el backend tiene la validación final real.
  const precioBase = Number(lote.precio_base);
  
  // Si el DTO de Lote incluye el monto actual (depende de tu backend), úsalo aquí.
  // Si no, usamos el precio base como referencia inicial.
  // En tu modelo backend: 'monto_ganador_lote' o 'id_puja_mas_alta'.
  // Asumiremos que si hay puja, el usuario debe superar la actual.
  const pujaMasAlta = Number((lote as any).monto_ganador_lote || 0); 
  const montoMinimo = Math.max(precioBase, pujaMasAlta);

  // Mutación para crear la puja
  const pujaMutation = useMutation({
    mutationFn: async (data: CreatePujaDto) => {
      return await PujaService.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['misPujas'] });
      queryClient.invalidateQueries({ queryKey: ['lote', lote.id] }); // Refrescar datos del lote
      
      showSuccess('¡Oferta realizada con éxito!');
      if (onSuccess) onSuccess();
      handleClose();
    },
    onError: (err: any) => {
      // Capturamos el error del backend (ej: "No tienes tokens")
      const msg = err.response?.data?.error || err.message || 'Error al procesar la oferta';
      setServerError(msg);
    }
  });

  const formik = useFormik({
    initialValues: {
      monto_puja: '',
    },
    validationSchema: validationSchema(montoMinimo),
    onSubmit: async (values) => {
      setServerError(null);
      await pujaMutation.mutateAsync({
        id_lote: lote.id,
        monto_puja: Number(values.monto_puja)
      });
    },
  });

  const handleClose = () => {
    formik.resetForm();
    setServerError(null);
    onClose();
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      title="Realizar Oferta"
      subtitle={`Lote: ${lote.nombre_lote}`}
      icon={<GavelIcon />}
      onConfirm={formik.submitForm}
      confirmText="Confirmar Oferta"
      isLoading={pujaMutation.isPending}
      disableConfirm={!formik.isValid || !formik.dirty || pujaMutation.isPending}
      maxWidth="sm"
    >
      <Stack spacing={3}>
        
        {/* RESUMEN DE ESTADO ACTUAL */}
        <Paper 
            variant="outlined" 
            sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.03), borderColor: theme.palette.divider }}
        >
            <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">Precio Base:</Typography>
                    <Typography variant="body1" fontWeight={600}>{formatCurrency(precioBase)}</Typography>
                </Box>
                <Divider />
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={1}>
                        <TrendingUp fontSize="small" color="primary"/>
                        <Typography variant="body2" color="primary.main" fontWeight={600}>Oferta más alta:</Typography>
                    </Box>
                    <Typography variant="h6" fontWeight={700} color="primary.main">
                        {pujaMasAlta > 0 ? formatCurrency(pujaMasAlta) : 'Sin ofertas'}
                    </Typography>
                </Box>
            </Stack>
        </Paper>

        {/* INPUT DE OFERTA */}
        <Box>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                TU PROPUESTA
            </Typography>
            <TextField
                fullWidth
                id="monto_puja"
                name="monto_puja"
                label="Monto a ofertar"
                type="number"
                placeholder={`Mínimo: ${montoMinimo}`}
                value={formik.values.monto_puja}
                onChange={formik.handleChange}
                error={formik.touched.monto_puja && Boolean(formik.errors.monto_puja)}
                helperText={formik.touched.monto_puja && formik.errors.monto_puja}
                disabled={pujaMutation.isPending}
                InputProps={{
                    startAdornment: <InputAdornment position="start"><MonetizationOn color="action" /></InputAdornment>,
                }}
                sx={{
                    '& .MuiOutlinedInput-root': {
                        fontSize: '1.2rem',
                        fontWeight: 600
                    }
                }}
            />
        </Box>

        {/* ERRORES DEL SERVIDOR */}
        {serverError && (
            <Alert severity="error" variant="filled" sx={{ borderRadius: 2 }}>
                {serverError}
            </Alert>
        )}

        {/* ADVERTENCIA DE TOKENS */}
        <Alert 
            severity="info" 
            icon={<Token />}
            sx={{ 
                alignItems: 'center', 
                bgcolor: alpha(theme.palette.info.main, 0.1), 
                color: theme.palette.info.dark 
            }}
        >
            <Typography variant="body2" fontWeight={500}>
                Al confirmar, se descontará <strong>1 Token</strong> de tu suscripción si es tu primera oferta en este lote.
            </Typography>
        </Alert>

      </Stack>
    </BaseModal>
  );
};

export default PujarModal;