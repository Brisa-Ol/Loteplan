import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Typography, Alert, Box, CircularProgress, 
  Stack, Divider, InputAdornment 
} from '@mui/material';
import { Gavel, MonetizationOn, Token } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import PujaService from '../../../../Services/puja.service';
import type { LoteDto } from '../../../../types/dto/lote.dto';

interface Props {
  open: boolean;
  onClose: () => void;
  lote: LoteDto | null;
}

export const PujarModal: React.FC<Props> = ({ open, onClose, lote }) => {
  const [monto, setMonto] = useState('');
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Limpiar estado al abrir/cerrar
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
      queryClient.invalidateQueries({ queryKey: ['misPujas'] });
      // Aquí podrías usar un Toast/Snackbar global en lugar de alert
      alert('¡Oferta realizada con éxito!'); 
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Error al realizar la puja. Verifica tus tokens.');
    }
  });

  const handleSubmit = () => {
    if (!monto) return;
    const valorOferta = Number(monto);
    const precioBase = Number(lote?.precio_base || 0);

    if (valorOferta <= precioBase) {
      setError(`La oferta debe ser mayor al precio base ($${precioBase.toLocaleString()})`);
      return;
    }
    mutation.mutate();
  };

  if (!lote) return null;

  // Formateador de moneda
  const formatMoney = (amount: number) => 
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(amount);

  return (
    <Dialog open={open} onClose={mutation.isPending ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Gavel color="primary" /> Realizar Oferta
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={2} mt={1}>
          
          {/* Información del Lote */}
          <Box p={2} bgcolor="grey.50" borderRadius={2} border="1px solid" borderColor="divider">
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              {lote.nombre_lote}
            </Typography>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">Precio Base:</Typography>
              <Typography variant="h6" color="primary.main" fontWeight={700}>
                {formatMoney(Number(lote.precio_base))}
              </Typography>
            </Stack>
          </Box>

          {/* Input de Oferta */}
          <TextField
            autoFocus
            fullWidth
            label="Tu Oferta"
            placeholder="Ingrese monto superior a la base"
            type="number"
            value={monto}
            onChange={(e) => {
              setMonto(e.target.value);
              setError(null); // Limpiar error al escribir
            }}
            disabled={mutation.isPending}
            InputProps={{
              startAdornment: <InputAdornment position="start"><MonetizationOn color="action" /></InputAdornment>,
            }}
            error={!!error}
            helperText={error}
          />

          <Divider />

          {/* Aviso de Token */}
          <Alert severity="warning" icon={<Token fontSize="inherit" />} sx={{ alignItems: 'center' }}>
            <Typography variant="caption" display="block">
              Esta acción consumirá <strong>1 Token de Subasta</strong> de tu cuenta.
            </Typography>
          </Alert>

        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose} disabled={mutation.isPending} color="inherit">
          Cancelar
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit} 
          disabled={mutation.isPending || !monto || Number(monto) <= Number(lote.precio_base)}
          startIcon={mutation.isPending ? <CircularProgress size={20} color="inherit" /> : <Gavel />}
        >
          {mutation.isPending ? 'Procesando...' : 'Confirmar Oferta'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};