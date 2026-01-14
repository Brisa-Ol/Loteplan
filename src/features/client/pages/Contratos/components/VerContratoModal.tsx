// src/components/Admin/Proyectos/Components/modals/VerContratoModal.tsx

import React from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import { Description as DescriptionIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

// Componentes y Servicios
import { BaseModal } from '../../../../shared/components/ui/cards/BaseModal/BaseModal';
import ContratoPlantillaService from '../../../../services/contrato-plantilla.service';
import ImagenService from '../../../../services/imagen.service';
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
    <BaseModal
      open={open}
      onClose={onClose}
      title="Modelo de Contrato"
      subtitle={nombreProyecto}
      icon={<DescriptionIcon />}
      headerColor="primary"
      maxWidth="lg"
      // Configuración de botones
      confirmText="Entendido"
      onConfirm={onClose}
      hideCancelButton
      // Layout específico para PDF
      PaperProps={{ sx: { height: '85vh' } }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        
        {isLoading && (
            <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
                <CircularProgress />
            </Box>
        )}
        
        {error && (
            <Box p={3}>
                <Alert severity="error" variant="outlined">Error cargando el modelo de contrato. Por favor, intente nuevamente.</Alert>
            </Box>
        )}
        
        {!isLoading && !error && !plantilla && (
            <Box p={3}>
                <Alert severity="info" variant="outlined">No hay una plantilla de contrato disponible para este proyecto.</Alert>
            </Box>
        )}

        {plantilla && (
          <Box flex={1} overflow="hidden" sx={{ bgcolor: 'background.default', borderRadius: 2 }}>
              <PDFViewerMejorado
                pdfUrl={ImagenService.resolveImageUrl(plantilla.url_archivo)}
                signatureDataUrl={null}
                onSignaturePositionSet={() => {}}
                readOnlyMode={true}
              />
          </Box>
        )}

      </Box>
    </BaseModal>
  );
};

export default VerContratoModal;