import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, IconButton, Chip, Stack, Divider
} from '@mui/material';
import { 
  Close as CloseIcon, 
  Download as DownloadIcon, 
  VerifiedUser as VerifiedIcon 
} from '@mui/icons-material';

// Tipos y Servicios
import type { ContratoFirmadoDto } from '../../../../types/dto/contrato.dto';
import ContratoService from '../../../../Services/contrato.service'; // Usamos el servicio unificado
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

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth 
      scroll="paper"
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

      <DialogContent sx={{ p: 0, bgcolor: '#f5f5f5' }}>
        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} height="100%">
          
          {/* COLUMNA IZQUIERDA: VISOR PDF */}
          <Box flex={1} p={2}>
            <PDFViewerMejorado
              pdfUrl={ImagenService.resolveImageUrl(contrato.url_archivo)}
              signatureDataUrl={null}
              onSignaturePositionSet={() => {}}
              readOnlyMode={true}
            />
          </Box>

          {/* COLUMNA DERECHA: METADATOS DE AUDITORÍA */}
          <Box 
            width={{ xs: '100%', md: 300 }} 
            bgcolor="white" 
            borderLeft={1} 
            borderColor="divider" 
            p={3}
            display="flex"
            flexDirection="column"
            gap={2}
          >
            <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">
              DATOS DE FIRMA
            </Typography>

            <Box>
              <Typography variant="caption" color="text.secondary">Estado</Typography>
              <Box mt={0.5}>
                <Chip 
                  label={contrato.estado_firma} 
                  color={contrato.estado_firma === 'FIRMADO' ? 'success' : 'error'} 
                  size="small" 
                  variant="outlined"
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">Fecha de Firma</Typography>
              <Typography variant="body2" fontWeight="500">
                {new Date(contrato.fecha_firma).toLocaleDateString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(contrato.fecha_firma).toLocaleTimeString()}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">Hash de Integridad (SHA-256)</Typography>
              <Box 
                bgcolor="grey.100" 
                p={1} 
                borderRadius={1} 
                mt={0.5} 
                sx={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.7rem', color: 'text.primary' }}
              >
                {contrato.hash_archivo_firmado}
              </Box>
            </Box>

            <Box mt="auto">
              <Button 
                variant="contained" 
                fullWidth 
                startIcon={<DownloadIcon />} 
                onClick={handleDownload}
              >
                Descargar PDF
              </Button>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={onClose} color="inherit">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};