import React, { useMemo } from 'react';
import { Download as DownloadIcon, VerifiedUser as VerifiedIcon } from '@mui/icons-material';
import { alpha, Box, Chip, Typography, useTheme, Stack } from '@mui/material';


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

  // 1. Memorizar URL para evitar recálculos en re-renders
  const pdfUrl = useMemo(() => {
    if (!contrato?.url_archivo) return '';
    return ImagenService.resolveImageUrl(contrato.url_archivo);
  }, [contrato?.url_archivo]);

  // Si no hay contrato, no renderizamos nada (Early return)
  if (!contrato) return null;

  const handleDownload = () => {
    ContratoService.downloadAndSave(contrato.id, contrato.nombre_archivo);
  };

  // Formateo de fechas
  const fechaFirma = new Date(contrato.fecha_firma);
  const fechaLegible = fechaFirma.toLocaleDateString();
  const horaLegible = fechaFirma.toLocaleTimeString();

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={contrato.nombre_archivo}
      subtitle="Documento firmado digitalmente"
      icon={<VerifiedIcon />}
      headerColor="success"
      maxWidth="lg"
      confirmText="Descargar Copia"
      confirmButtonIcon={<DownloadIcon />}
      onConfirm={handleDownload}
      cancelText="Cerrar"
      PaperProps={{ sx: { height: '85vh' } }}
    >
      <Box 
        display="flex" 
        flexDirection={{ xs: 'column', md: 'row' }} 
        height="100%" 
        overflow="hidden" 
        gap={3} // ✅ Usamos gap en lugar de margins manuales
      >
          
        {/* === COLUMNA IZQUIERDA: VISOR PDF === */}
        <Box 
          flex={1} 
          overflow="hidden" 
          display="flex" 
          flexDirection="column" 
          bgcolor="action.hover" 
          borderRadius={2}
          border={`1px solid ${theme.palette.divider}`}
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
              <Typography color="error" variant="body2">
                No se pudo cargar el documento.
              </Typography>
            </Box>
          )}
        </Box>

        {/* === COLUMNA DERECHA: METADATOS DE AUDITORÍA === */}
        <Box 
          width={{ xs: '100%', md: 320 }} 
          display="flex"
          flexDirection="column"
          overflow="auto"
          component={Stack} // Usamos Stack para espaciado vertical automático
          spacing={3}
          pr={1} // Padding derecho para el scrollbar
        >
          <Box>
            <Typography 
              variant="subtitle2" 
              color="primary.main" 
              fontWeight="800" 
              sx={{ letterSpacing: 1, textTransform: 'uppercase', mb: 2 }}
            >
              Auditoría de Firma
            </Typography>

            <Stack spacing={2.5}>
              {/* 1. Estado */}
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
                  ESTADO ACTUAL
                </Typography>
                <Chip 
                  label={contrato.estado_firma} 
                  color={contrato.estado_firma === 'FIRMADO' ? 'success' : 'error'} 
                  size="small" 
                  variant="filled"
                  sx={{ fontWeight: 'bold', borderRadius: 1 }}
                />
              </Box>

              {/* 2. Fecha */}
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                  FECHA DE FIRMA
                </Typography>
                <Typography variant="body2" fontWeight="600" mt={0.5} color="text.primary">
                  {fechaLegible}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {horaLegible}
                </Typography>
              </Box>

              {/* 3. Hash */}
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
                  HASH DE INTEGRIDAD (SHA-256)
                </Typography>
                <Box 
                  bgcolor={alpha(theme.palette.action.active, 0.05)}
                  p={1.5} 
                  borderRadius={2} 
                  border={`1px solid ${theme.palette.divider}`}
                  sx={{ 
                    wordBreak: 'break-all', 
                    fontFamily: 'monospace', 
                    fontSize: '0.75rem', 
                    color: 'text.primary' 
                  }}
                >
                  {contrato.hash_archivo_firmado}
                </Box>
                <Typography 
                  variant="caption" 
                  color="text.disabled" 
                  sx={{ fontSize: '0.65rem', mt: 1, display: 'block', lineHeight: 1.3 }}
                >
                  * Este hash único garantiza criptográficamente que el contenido del documento no ha sido alterado post-firma.
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Box>
      </Box>
    </BaseModal>
  );
};