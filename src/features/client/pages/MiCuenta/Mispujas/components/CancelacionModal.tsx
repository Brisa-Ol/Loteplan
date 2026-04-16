// src/features/client/pages/Pujas/CancelModal.tsx

import type { PujaDto } from '@/core/types/puja.dto';
import { BaseModal } from '@/shared';
import { Cancel, InfoOutlined } from '@mui/icons-material';
import {
  alpha,
  Box,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

interface CancelModalProps {
  open: boolean;
  puja: PujaDto | null;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: (motivo: string) => void;
  formatCurrency: (value: number | string) => string;
}

const CancelacionModal: React.FC<CancelModalProps> = ({
  open,
  puja,
  isLoading,
  onClose,
  onConfirm,
  formatCurrency,
}) => {
  const theme = useTheme();
  // Estado LOCAL → los keystrokes no re-renderizan MisPujas
  const [motivo, setMotivo] = useState('');

  // Limpia el campo cada vez que el modal se abre
  useEffect(() => {
    if (open) setMotivo('');
  }, [open]);

  const handleClose = () => {
    setMotivo('');
    onClose();
  };

  const handleConfirm = () => {
    console.log("estado local motivo", JSON.stringify(motivo))
    console.log('2. Largo:', motivo.length);
    onConfirm(motivo);


  };

  const nombreProyecto =
    (puja?.lote as any)?.proyectoLote?.nombre_proyecto ||
    puja?.proyectoAsociado?.nombre_proyecto ||
    'Proyecto General';

  const isValid = motivo.trim().length >= 10;

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      title="Solicitar Cancelación de Adjudicación"
      maxWidth="xs"
      confirmText="Enviar Solicitud"
      onConfirm={handleConfirm}
      isLoading={isLoading}
      headerColor="error"
      icon={<Cancel />}
      disableConfirm={!isValid}
    >
      <Stack spacing={2.5} sx={{ mt: 0.5 }}>

        {/* Aviso de proceso manual */}
        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            p: 1.5,
            bgcolor: alpha(theme.palette.warning.main, 0.06),
            border: `1px solid ${alpha(theme.palette.warning.main, 0.15)}`,
            borderRadius: 2,
          }}
        >
          <InfoOutlined
            sx={{ color: 'warning.main', fontSize: 18, flexShrink: 0, mt: 0.1 }}
          />
          <Box>
            <Typography variant="caption" fontWeight={700} color="warning.dark" display="block">
              Revisión manual requerida
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
              La cancelación no es inmediata. Un administrador evaluará tu solicitud
              y recibirás una notificación con la resolución.
            </Typography>
          </Box>
        </Box>

        {/* Resumen del lote que se quiere cancelar */}
        {puja && (
          <Paper
            variant="outlined"
            sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.error.main, 0.02) }}
          >
            <Stack spacing={1}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" fontWeight={700} color="text.secondary">
                  PROYECTO
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {nombreProyecto}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" fontWeight={700} color="text.secondary">
                  LOTE
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {puja.lote?.nombre_lote || `Lote #${puja.id_lote}`}
                </Typography>
              </Box>
              <Divider />
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" fontWeight={700} color="text.secondary">
                  OFERTA A CANCELAR
                </Typography>
                <Typography variant="body2" fontWeight={900} color="error.main">
                  {formatCurrency(puja.monto_puja)}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        )}

        {/* Campo de motivo */}
        <Box>
          <TextField
            label="Motivo de la cancelación"
            multiline
            rows={4}
            fullWidth
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Explicá brevemente por qué solicitás la cancelación..."
            inputProps={{ maxLength: 500 }}
            helperText={
              <Box
                component="span"
                sx={{ display: 'flex', justifyContent: 'space-between' }}
              >
                <span style={{ color: isValid ? theme.palette.success.main : undefined }}>
                  {isValid ? 'Listo para enviar' : 'Mínimo 10 caracteres requeridos'}
                </span>
                <span>{motivo.length} / 500</span>
              </Box>
            }
            error={motivo.length > 0 && !isValid}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': { borderRadius: 2 },
            }}
          />
        </Box>

      </Stack>
    </BaseModal>
  );
};

export default CancelacionModal;