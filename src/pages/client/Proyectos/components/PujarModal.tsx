// src/components/Proyectos/PujarModal.tsx

import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Typography, Alert, Box, CircularProgress 
} from '@mui/material';
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

  const mutation = useMutation({
    mutationFn: async () => {
      if (!lote) return;
      await PujaService.create({
        id_lote: lote.id,
        monto_puja: Number(monto)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lotesProyecto'] }); // Refrescar lista
      onClose();
      setMonto('');
      setError(null);
      alert('¡Puja realizada con éxito! 1 Token consumido.');
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Error al realizar la puja.');
    }
  });

  const handleSubmit = () => {
    if (!monto || Number(monto) <= (lote?.precio_base || 0)) {
      setError('El monto debe ser mayor al precio base.');
      return;
    }
    mutation.mutate();
  };

  if (!lote) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Realizar Oferta</DialogTitle>
      <DialogContent>
        <Box mb={2}>
          <Typography variant="subtitle2" color="text.secondary">Lote: {lote.nombre_lote}</Typography>
          <Typography variant="h6" color="primary">Base: USD {Number(lote.precio_base).toLocaleString()}</Typography>
        </Box>

        <Typography variant="body2" gutterBottom>
           ⚠️ Esta acción consumirá <strong>1 Token de Subasta</strong>.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <TextField
          autoFocus
          fullWidth
          label="Tu Oferta (USD)"
          type="number"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          disabled={mutation.isPending}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={mutation.isPending}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={mutation.isPending}>
          {mutation.isPending ? <CircularProgress size={24} /> : 'Confirmar Puja'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};