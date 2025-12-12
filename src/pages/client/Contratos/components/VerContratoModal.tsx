// src/components/Contratos/VerContratoModal.tsx
import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, CircularProgress, Alert, IconButton
} from '@mui/material';
import { Close as CloseIcon, Description as DescriptionIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import contratoService from '../../../../Services/contrato.service';


interface Props {
  open: boolean;
  onClose: () => void;
  idProyecto: number;
  nombreProyecto: string;
}

export const VerContratoModal: React.FC<Props> = ({
  open,
  onClose,
  idProyecto,
  nombreProyecto
}) => {

  // Query para obtener la plantilla del contrato
  const { data: plantilla, isLoading, error } = useQuery({
    queryKey: ['plantillaContrato', idProyecto],
    queryFn: async () => {
      const res = await contratoService.getPlantillasByProject(idProyecto);
      return res.data;
    },
    enabled: open // Solo ejecuta cuando el modal está abierto
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DescriptionIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Contrato del Proyecto
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {isLoading && (
          <Box display="flex" justifyContent="center" py={5}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error">
            No se pudo cargar la plantilla del contrato. Por favor, intenta más tarde.
          </Alert>
        )}

        {plantilla && (
          <>
            {/* Header del Contrato */}
            <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {nombreProyecto}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ID Proyecto: {idProyecto} • Plantilla ID: {plantilla.id}
              </Typography>
            </Box>

            {/* Contenido del Contrato */}
            <Box
              sx={{
                p: 3,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                maxHeight: 500,
                overflowY: 'auto',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                lineHeight: 1.8,
                whiteSpace: 'pre-wrap',
                '&::-webkit-scrollbar': { width: 8 },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'primary.main',
                  borderRadius: 4
                }
              }}
            >
              {plantilla.contenido_plantilla || 'El contrato no tiene contenido definido.'}
            </Box>

            {/* Metadata */}
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                <strong>Nota Legal:</strong> Este documento es una plantilla y no tiene validez 
                legal hasta que sea firmado digitalmente por ambas partes. Una vez que realices 
                tu inversión o suscripción, podrás firmar el contrato personalizado desde tu panel.
              </Typography>
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} variant="outlined">
          Cerrar
        </Button>
        <Button
          variant="contained"
          onClick={onClose}
          disabled={!plantilla}
        >
          Entendido
        </Button>
      </DialogActions>
    </Dialog>
  );
};