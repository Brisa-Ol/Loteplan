import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, CircularProgress, Alert, IconButton, useTheme, alpha
} from '@mui/material';
import { Close as CloseIcon, Description as DescriptionIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

// Servicios
import ContratoPlantillaService from '../../../../Services/contrato-plantilla.service';
import ImagenService from '../../../../Services/imagen.service';
import PDFViewerMejorado from './PDFViewerMejorado';

interface Props {
  open: boolean;
  onClose: () => void;
  idProyecto: number;
  nombreProyecto: string;
}

export const VerContratoModal: React.FC<Props> = ({
  open, onClose, idProyecto, nombreProyecto
}) => {
  const theme = useTheme();

  // Query al servicio de PLANTILLAS
  const { data: plantillas, isLoading, error } = useQuery({
    queryKey: ['plantillaContrato', idProyecto],
    queryFn: async () => (await ContratoPlantillaService.findByProject(idProyecto)).data,
    enabled: open
  });

  const plantilla = plantillas && plantillas.length > 0 ? plantillas[0] : null;

  return (
    <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="lg" 
        fullWidth 
        scroll="paper"
        PaperProps={{ sx: { borderRadius: 3, height: '85vh' } }}
    >
      <DialogTitle 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center"
        sx={{ borderBottom: `1px solid ${theme.palette.divider}`, py: 2 }}
      >
        <Box display="flex" gap={2} alignItems="center">
            <Box sx={{ 
                p: 1, borderRadius: '50%', 
                bgcolor: alpha(theme.palette.primary.main, 0.1), 
                color: 'primary.main', display: 'flex' 
            }}>
                <DescriptionIcon /> 
            </Box>
            <Box>
                <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                    Modelo de Contrato
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {nombreProyecto}
                </Typography>
            </Box>
        </Box>
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
        {isLoading && (
            <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
                <CircularProgress />
            </Box>
        )}
        
        {error && (
            <Box p={3}>
                <Alert severity="error">Error cargando el modelo de contrato.</Alert>
            </Box>
        )}
        
        {!isLoading && !plantilla && (
            <Box p={3}>
                <Alert severity="info">No hay una plantilla de contrato disponible para este proyecto.</Alert>
            </Box>
        )}

        {plantilla && (
          <Box flex={1} overflow="hidden">
              <PDFViewerMejorado
                pdfUrl={ImagenService.resolveImageUrl(plantilla.url_archivo)}
                signatureDataUrl={null}
                onSignaturePositionSet={() => {}}
                readOnlyMode={true}
              />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button onClick={onClose} variant="contained" color="primary" sx={{ fontWeight: 700 }}>
          Entendido
        </Button>
      </DialogActions>
    </Dialog>
  );
};