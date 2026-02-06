// src/components/Admin/Proyectos/Components/modals/VerContratoModal.tsx

import React, { useState } from 'react';
import { Box, CircularProgress, Alert, Button } from '@mui/material';
import { Description as DescriptionIcon, Download } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

import ContratoPlantillaService from '@/core/api/services/contrato-plantilla.service';
import ImagenService from '@/core/api/services/imagen.service';
import BaseModal from '@/shared/components/domain/modals/BaseModal/BaseModal';
import PDFViewerMejorado from './PDFViewerMejorado';
import { downloadSecureFile } from '@/shared/utils';



interface Props {
  open: boolean;
  onClose: () => void;
  idProyecto: number;
  nombreProyecto: string;
}

export const VerContratoModal: React.FC<Props> = ({
  open, onClose, idProyecto, nombreProyecto
}) => {
  const [downloading, setDownloading] = useState(false);

  // Query al servicio de PLANTILLAS
  const { data: plantillas, isLoading, error } = useQuery({
    queryKey: ['plantillaContrato', idProyecto],
    queryFn: async () => (await ContratoPlantillaService.findByProject(idProyecto)).data,
    enabled: open
  });

  const plantilla = plantillas && plantillas.length > 0 ? plantillas[0] : null;

  // ✅ Handler de descarga
  const handleDownload = async () => {
    if (plantilla) {
        try {
            setDownloading(true);
            await downloadSecureFile(plantilla.url_archivo, plantilla.nombre_archivo);
        } catch (e) {
            console.error("Error descarga", e);
            // Si tienes un hook de toast úsalo aquí, si no, el error se loguea en consola
        } finally {
            setDownloading(false);
        }
    }
  };

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
      confirmText="Cerrar"
      onConfirm={onClose}
      hideCancelButton
      // ✅ AÑADIDO: Botón de descarga en el modal
      customActions={
        plantilla ? (
            <Button 
                startIcon={downloading ? <CircularProgress size={20} color="inherit" /> : <Download />} 
                onClick={handleDownload} 
                color="primary"
                variant="outlined"
                disabled={downloading}
            >
                Descargar Modelo
            </Button>
        ) : undefined
      }
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