import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, IconButton, Chip, Divider
} from '@mui/material';
import { 
  Close as CloseIcon, 
  Download as DownloadIcon, 
  VerifiedUser as VerifiedIcon 
} from '@mui/icons-material';

// Tipos y Servicios
import type { ContratoFirmadoDto } from '../../../../types/dto/contrato.dto';
import ContratoService from '../../../../Services/contrato.service';
import ImagenService from '../../../../Services/imagen.service';
import PDFViewerMejorado from '../../Contratos/components/PDFViewerMejorado';

interface Props {
  open: boolean;
  onClose: () => void;
  contrato: ContratoFirmadoDto | null;
}

export const VerContratoFirmadoModal: React.FC<Props> = ({
  open, onClose, contrato
}) => {

  if (!contrato) return null;

  const handleDownload = () => {
    ContratoService.downloadAndSave(contrato.id, contrato.nombre_archivo);
  };

  // Resolver URL de forma segura
  const pdfUrl = contrato.url_archivo ? ImagenService.resolveImageUrl(contrato.url_archivo) : '';

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth 
      scroll="paper"
      PaperProps={{ sx: { height: '85vh' } }} // Altura fija para mejor experiencia
    >
      {/* HEADER */}
      <DialogTitle display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" gap={1} alignItems="center" overflow="hidden">
            <VerifiedIcon color="success" /> 
            <Typography variant="h6" noWrap>
              {contrato.nombre_archivo}
            </Typography>
        </Box>
        <IconButton onClick={onClose} aria-label="cerrar">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 0, bgcolor: '#f5f5f5', display: 'flex', flexDirection: 'column' }}>
        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} flex={1} overflow="hidden">
          
          {/* COLUMNA IZQUIERDA: VISOR PDF */}
          <Box flex={1} p={2} overflow="auto" display="flex" flexDirection="column">
            {pdfUrl ? (
                <PDFViewerMejorado
                  pdfUrl={pdfUrl}
                  signatureDataUrl={null}
                  onSignaturePositionSet={() => {}}
                  readOnlyMode={true}
                />
            ) : (
                <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                    <Typography color="error">No se pudo cargar el documento.</Typography>
                </Box>
            )}
          </Box>

          {/* COLUMNA DERECHA: METADATOS DE AUDITORÍA */}
          <Box 
            width={{ xs: '100%', md: 320 }} 
            bgcolor="white" 
            borderLeft={1} 
            borderColor="divider" 
            p={3}
            display="flex"
            flexDirection="column"
            gap={3}
            overflow="auto"
          >
            <Typography variant="subtitle2" color="text.secondary" fontWeight="bold" sx={{ letterSpacing: 1 }}>
              AUDITORÍA DE FIRMA
            </Typography>

            <Box>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Estado Actual</Typography>
              <Chip 
                label={contrato.estado_firma} 
                color={contrato.estado_firma === 'FIRMADO' ? 'success' : 'error'} 
                size="small" 
                variant="filled"
                sx={{ fontWeight: 'bold' }}
              />
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" display="block">Fecha de Firma</Typography>
              <Typography variant="body2" fontWeight="600" mt={0.5}>
                {new Date(contrato.fecha_firma).toLocaleDateString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(contrato.fecha_firma).toLocaleTimeString()}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                  Hash de Integridad (SHA-256)
              </Typography>
              <Box 
                bgcolor="grey.100" 
                p={1.5} 
                borderRadius={2} 
                border="1px solid"
                borderColor="grey.300"
                sx={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.75rem', color: 'text.primary' }}
              >
                {contrato.hash_archivo_firmado}
              </Box>
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem', mt: 0.5, display: 'block' }}>
                  Este hash garantiza que el documento no ha sido modificado desde su firma.
              </Typography>
            </Box>

            <Box mt="auto" pt={2}>
              <Button 
                variant="contained" 
                fullWidth 
                startIcon={<DownloadIcon />} 
                onClick={handleDownload}
                size="large"
              >
                Descargar Copia
              </Button>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 1.5, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={onClose} color="inherit">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};