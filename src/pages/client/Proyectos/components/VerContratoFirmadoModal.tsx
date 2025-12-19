import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, IconButton, Chip, Divider, useTheme, alpha
} from '@mui/material';
import { 
  Close as CloseIcon, 
  Download as DownloadIcon, 
  VerifiedUser as VerifiedIcon 
} from '@mui/icons-material';

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
  const theme = useTheme();

  if (!contrato) return null;

  const handleDownload = () => {
    ContratoService.downloadAndSave(contrato.id, contrato.nombre_archivo);
  };

  const pdfUrl = contrato.url_archivo ? ImagenService.resolveImageUrl(contrato.url_archivo) : '';

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth 
      PaperProps={{ sx: { height: '85vh', borderRadius: 3, overflow: 'hidden' } }}
    >
      {/* HEADER */}
      <DialogTitle 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center"
        sx={{ borderBottom: `1px solid ${theme.palette.divider}`, py: 2 }}
      >
        <Box display="flex" gap={1.5} alignItems="center" overflow="hidden">
            <Box sx={{ p: 0.5, borderRadius: '50%', bgcolor: alpha(theme.palette.success.main, 0.1), display: 'flex' }}>
                <VerifiedIcon color="success" fontSize="small" /> 
            </Box>
            <Typography variant="h6" noWrap fontWeight={700} color="text.primary">
              {contrato.nombre_archivo}
            </Typography>
        </Box>
        <IconButton onClick={onClose} aria-label="cerrar">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} flex={1} overflow="hidden">
          
          {/* COLUMNA IZQUIERDA: VISOR PDF */}
          <Box flex={1} p={0} overflow="hidden" display="flex" flexDirection="column" bgcolor="grey.100">
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
            width={{ xs: '100%', md: 340 }} 
            bgcolor="background.paper" 
            borderLeft={`1px solid ${theme.palette.divider}`} 
            p={3}
            display="flex"
            flexDirection="column"
            gap={3}
            overflow="auto"
          >
            <Typography variant="subtitle2" color="primary.main" fontWeight="800" sx={{ letterSpacing: 1, textTransform: 'uppercase' }}>
              Auditoría de Firma
            </Typography>

            <Box>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.5} fontWeight={600}>ESTADO ACTUAL</Typography>
              <Chip 
                label={contrato.estado_firma} 
                color={contrato.estado_firma === 'FIRMADO' ? 'success' : 'error'} 
                size="small" 
                variant="filled" // Mantenemos filled para impacto
                sx={{ fontWeight: 'bold', borderRadius: 1 }}
              />
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>FECHA DE FIRMA</Typography>
              <Typography variant="body2" fontWeight="600" mt={0.5} color="text.primary">
                {new Date(contrato.fecha_firma).toLocaleDateString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(contrato.fecha_firma).toLocaleTimeString()}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.5} fontWeight={600}>
                  HASH DE INTEGRIDAD (SHA-256)
              </Typography>
              <Box 
                bgcolor="action.hover" // Usamos variable del theme
                p={1.5} 
                borderRadius={2} 
                border={`1px solid ${theme.palette.divider}`}
                sx={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.75rem', color: 'text.primary' }}
              >
                {contrato.hash_archivo_firmado}
              </Box>
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem', mt: 0.5, display: 'block', lineHeight: 1.2 }}>
                  * Este hash único garantiza criptográficamente que el contenido del documento no ha sido alterado post-firma.
              </Typography>
            </Box>

            <Box mt="auto" pt={2}>
              <Button 
                variant="contained" 
                fullWidth 
                startIcon={<DownloadIcon />} 
                onClick={handleDownload}
                size="large"
                sx={{ fontWeight: 700 }}
              >
                Descargar Copia
              </Button>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 1.5, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button onClick={onClose} color="inherit">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};