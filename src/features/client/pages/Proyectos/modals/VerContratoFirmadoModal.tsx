import React, { useMemo } from 'react';
import { Download as DownloadIcon, VerifiedUser as VerifiedIcon, Fingerprint } from '@mui/icons-material';
import { alpha, Box, Chip, Typography, useTheme, Stack, Divider, Paper } from '@mui/material';

import PDFViewerMejorado from '../../Contratos/components/PDFViewerMejorado';
import type { ContratoFirmadoDto } from '@/core/types/dto/contrato-firmado.dto';
import ImagenService from '@/core/api/services/imagen.service';
import ContratoService from '@/core/api/services/contrato.service';
import BaseModal from '@/shared/components/domain/modals/BaseModal/BaseModal';

interface Props {
  open: boolean;
  onClose: () => void;
  contrato: ContratoFirmadoDto | null;
}

export const VerContratoFirmadoModal: React.FC<Props> = ({ open, onClose, contrato }) => {
  const theme = useTheme();

  // 1. Memorizar URL
  const pdfUrl = useMemo(() => {
    if (!contrato?.url_archivo) return '';
    return ImagenService.resolveImageUrl(contrato.url_archivo);
  }, [contrato?.url_archivo]);

  if (!contrato) return null;

  const handleDownload = () => {
    ContratoService.downloadAndSave(contrato.id, contrato.nombre_archivo);
  };

  const fechaFirma = new Date(contrato.fecha_firma);

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={contrato.nombre_archivo}
      subtitle="Documento firmado digitalmente y auditado"
      icon={<VerifiedIcon />}
      headerColor="success"
      maxWidth="lg"
      confirmText="Descargar Original"
      confirmButtonIcon={<DownloadIcon />}
      onConfirm={handleDownload}
      cancelText="Cerrar"
      PaperProps={{ sx: { height: '90vh' } }} // Un poco más alto para mejor lectura
    >
      <Stack 
        direction={{ xs: 'column', md: 'row' }} 
        spacing={3} 
        height="100%" 
        overflow="hidden"
      >
          
        {/* === COLUMNA IZQUIERDA: VISOR PDF === */}
        <Box 
          flex={1} 
          bgcolor="background.default" 
          borderRadius={2}
          border={`1px solid ${theme.palette.divider}`}
          overflow="hidden"
          position="relative"
        >
          {pdfUrl ? (
            <PDFViewerMejorado
              pdfUrl={pdfUrl}
              signatureDataUrl={null}
              onSignaturePositionSet={() => {}}
              readOnlyMode={true}
            />
          ) : (
            <Box display="flex" alignItems="center" justifyContent="center" height="100%">
              <Typography color="text.secondary">Documento no disponible</Typography>
            </Box>
          )}
        </Box>

        {/* === COLUMNA DERECHA: AUDITORÍA === */}
        <Box 
          width={{ xs: '100%', md: 340 }} 
          component={Paper}
          elevation={0}
          variant="outlined"
          sx={{ display: 'flex', flexDirection: 'column', overflow: 'auto', bgcolor: 'background.paper' }}
        >
          <Box p={2.5}>
            <Typography variant="overline" color="text.secondary" fontWeight={700} letterSpacing={1.2}>
              TRAZABILIDAD
            </Typography>
            
            <Stack spacing={3} mt={2}>
              
              {/* 1. Estado */}
              <Box>
                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                  Estado del Documento
                </Typography>
                <Chip 
                  label={contrato.estado_firma} 
                  color={contrato.estado_firma === 'FIRMADO' ? 'success' : 'warning'} 
                  size="small" 
                  icon={<VerifiedIcon />}
                  sx={{ fontWeight: 700, borderRadius: 1 }}
                />
              </Box>

              <Divider />

              {/* 2. Fecha */}
              <Box>
                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                  Fecha de Firma
                </Typography>
                <Typography variant="body2" fontWeight={600} color="text.primary">
                  {fechaFirma.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Hora: {fechaFirma.toLocaleTimeString()}
                </Typography>
              </Box>

              <Divider />

              {/* 3. Hash de Integridad */}
              <Box>
                <Stack direction="row" alignItems="center" gap={1} mb={1}>
                    <Fingerprint fontSize="small" color="primary" />
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    HASH DE INTEGRIDAD (SHA-256)
                    </Typography>
                </Stack>
                
                

                <Box 
                  bgcolor={alpha(theme.palette.primary.main, 0.04)}
                  p={1.5} 
                  borderRadius={2} 
                  border={`1px dashed ${theme.palette.divider}`}
                  sx={{ 
                    fontFamily: 'monospace', 
                    fontSize: '0.7rem', 
                    color: 'text.primary',
                    wordBreak: 'break-all',
                    lineHeight: 1.4
                  }}
                >
                  {contrato.hash_archivo_firmado || 'No disponible'}
                </Box>
                <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block', fontSize: '0.65rem' }}>
                  * Esta huella digital garantiza que el contenido del contrato no ha sido alterado ni un solo bit desde el momento de la firma.
                </Typography>
              </Box>

            </Stack>
          </Box>
        </Box>

      </Stack>
    </BaseModal>
  );
};