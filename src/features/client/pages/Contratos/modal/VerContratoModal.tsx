// src/components/Admin/Proyectos/Components/modals/VerContratoModal.tsx

import { Description as DescriptionIcon, Download } from '@mui/icons-material';
import { Alert, Box, Button, CircularProgress } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';

import ContratoPlantillaService from '@/core/api/services/contrato-plantilla.service';
import ImagenService from '@/core/api/services/imagen.service';
import PDFViewerMejorado from '../components/PDFViewerMejorado';
import { BaseModal, downloadSecureFile } from '@/shared';

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
      // Layout específico para PDF
      PaperProps={{ sx: { height: '85vh' } }}
      // ✅ AÑADIDO: Agrupamos Cerrar y Descargar en customActions para no perder el botón de cierre
      customActions={
        <>
          <Button
            onClick={onClose}
            color="inherit"
            sx={{ fontWeight: 700, px: 3, color: 'text.secondary' }}
          >
            Cerrar
          </Button>
          {plantilla && (
            <Button
              startIcon={downloading ? <CircularProgress size={20} color="inherit" /> : <Download />}
              onClick={handleDownload}
              color="primary"
              variant="contained"
              disabled={downloading}
              sx={{ fontWeight: 800, px: 3, borderRadius: 2 }}
            >
              {downloading ? 'Descargando...' : 'Descargar Modelo'}
            </Button>
          )}
        </>
      }
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
              onSignaturePositionSet={() => { }}
              readOnlyMode={true}
            />
          </Box>
        )}

      </Box>
    </BaseModal>
  );
};

export default VerContratoModal;