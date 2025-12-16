import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, CircularProgress, Alert, IconButton
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

  // Query al servicio de PLANTILLAS
  const { data: plantillas, isLoading, error } = useQuery({
    queryKey: ['plantillaContrato', idProyecto],
    queryFn: async () => (await ContratoPlantillaService.findByProject(idProyecto)).data,
    enabled: open
  });

  const plantilla = plantillas && plantillas.length > 0 ? plantillas[0] : null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth scroll="paper">
      <DialogTitle display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" gap={1} alignItems="center">
            <DescriptionIcon color="primary" /> 
            <Typography variant="h6">Modelo de Contrato: {nombreProyecto}</Typography>
        </Box>
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {isLoading && (
            <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
            </Box>
        )}
        
        {error && <Alert severity="error">Error cargando el modelo de contrato.</Alert>}
        
        {!isLoading && !plantilla && (
            <Alert severity="info">No hay una plantilla de contrato disponible para este proyecto.</Alert>
        )}

        {plantilla && (
          <PDFViewerMejorado
            pdfUrl={ImagenService.resolveImageUrl(plantilla.url_archivo)}
            signatureDataUrl={null}
            onSignaturePositionSet={() => {}}
            readOnlyMode={true}
          />
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained" color="primary">
          Entendido
        </Button>
      </DialogActions>
    </Dialog>
  );
};