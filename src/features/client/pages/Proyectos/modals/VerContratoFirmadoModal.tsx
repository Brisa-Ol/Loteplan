// src/features/client/pages/Contratos/modals/VerContratoFirmadoModal.tsx
import {
  CheckCircle,
  Download as DownloadIcon,
  Fingerprint,
  Info,
  VerifiedUser as VerifiedIcon
} from '@mui/icons-material';
import {
  Alert,
  alpha,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
  useTheme
} from '@mui/material';
import React, { useMemo, useState } from 'react';

import ContratoService from '@/core/api/services/contrato.service';
import ImagenService from '@/core/api/services/imagen.service';
import type { ContratoFirmadoDto } from '@/core/types/dto/contrato-firmado.dto';
import BaseModal from '@/shared/components/domain/modals/BaseModal/BaseModal';
import useSnackbar from '@/shared/hooks/useSnackbar';
import PDFViewerMejorado from '../../Contratos/components/PDFViewerMejorado';

interface Props {
  open: boolean;
  onClose: () => void;
  contrato: ContratoFirmadoDto | null;
}

export const VerContratoFirmadoModal: React.FC<Props> = ({ open, onClose, contrato }) => {
  const theme = useTheme();
  const { showSuccess, showError } = useSnackbar();
  const [isDownloading, setIsDownloading] = useState(false);

  // ===================================================
  // URL DEL PDF FIRMADO
  // ===================================================
  const pdfUrl = useMemo(() => {
    if (!contrato?.url_archivo) return '';

    // ✅ CRÍTICO: Este PDF ya tiene la firma embebida
    // El backend lo guardó con la firma del usuario cuando se registró
    return ImagenService.resolveImageUrl(contrato.url_archivo);
  }, [contrato?.url_archivo]);

  if (!contrato) return null;

  // ===================================================
  // HANDLER DE DESCARGA
  // ===================================================
  const handleDownload = async () => {
    try {
      setIsDownloading(true);

      // Descarga el PDF que ya tiene la firma embebida
      await ContratoService.downloadAndSave(
        contrato.id,
        contrato.nombre_archivo || `contrato_${contrato.id}.pdf`
      );

      showSuccess('Documento descargado exitosamente');
    } catch (error) {
      console.error('Error descargando contrato:', error);
      showError('Error al descargar el documento');
    } finally {
      setIsDownloading(false);
    }
  };

  const fechaFirma = new Date(contrato.fecha_firma);
  const esFirmado = contrato.estado_firma === 'FIRMADO';

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={contrato.nombre_archivo}
      subtitle="Documento firmado digitalmente y auditado"
      icon={<VerifiedIcon />}
      headerColor={esFirmado ? 'success' : 'warning'}
      maxWidth="lg"
      confirmText="Descargar Original"
      // ✅ Solo una vez, y pasamos el elemento visual
      confirmButtonIcon={isDownloading ? <CircularProgress size={20} /> : <DownloadIcon />}
      onConfirm={handleDownload}
      // ✅ Usamos la prop correcta para deshabilitar el botón
      disableConfirm={isDownloading}
      isLoading={isDownloading} // Si tu BaseModal lo soporta, esto pondrá el estado loading global del modal
      cancelText="Cerrar"
      PaperProps={{ sx: { height: '90vh' } }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={3}
        height="100%"
        overflow="hidden"
      >
        {/* ===================================================
            COLUMNA IZQUIERDA: VISOR PDF
            =================================================== */}
        <Box
          flex={1}
          bgcolor="background.default"
          borderRadius={2}
          border={`1px solid ${theme.palette.divider}`}
          overflow="hidden"
          position="relative"
        >
          {pdfUrl ? (
            <>
              {/* ✅ Banner informativo */}
              <Box
                position="absolute"
                top={16}
                left={16}
                right={16}
                zIndex={10}
              >
                <Alert
                  severity={esFirmado ? 'success' : 'info'}
                  icon={esFirmado ? <CheckCircle /> : <Info />}
                  sx={{
                    bgcolor: alpha(
                      esFirmado ? theme.palette.success.main : theme.palette.info.main,
                      0.95
                    ),
                    backdropFilter: 'blur(10px)',
                    boxShadow: theme.shadows[4]
                  }}
                >
                  <Typography variant="body2" fontWeight={600}>
                    {esFirmado
                      ? '✓ Este documento contiene la firma digital del usuario'
                      : 'ℹ️ Documento en proceso de firma'}
                  </Typography>
                </Alert>
              </Box>

              {/* ✅ Visor del PDF (ya tiene la firma embebida) */}
              <PDFViewerMejorado
                pdfUrl={pdfUrl}
                signatureDataUrl={null} // No necesitamos overlay porque la firma ya está en el PDF
                onSignaturePositionSet={() => { }}
                readOnlyMode={true}
              />
            </>
          ) : (
            <Box display="flex" alignItems="center" justifyContent="center" height="100%">
              <Typography color="text.secondary">Documento no disponible</Typography>
            </Box>
          )}
        </Box>

        {/* ===================================================
            COLUMNA DERECHA: AUDITORÍA
            =================================================== */}
        <Box
          width={{ xs: '100%', md: 340 }}
          component={Paper}
          elevation={0}
          variant="outlined"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            bgcolor: 'background.paper'
          }}
        >
          <Box p={2.5}>
            <Typography
              variant="overline"
              color="text.secondary"
              fontWeight={700}
              letterSpacing={1.2}
            >
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
                  color={esFirmado ? 'success' : 'warning'}
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
                  {fechaFirma.toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
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
                <Typography
                  variant="caption"
                  color="text.disabled"
                  sx={{ mt: 1, display: 'block', fontSize: '0.65rem' }}
                >
                  * Esta huella digital garantiza que el contenido del contrato no ha sido
                  alterado ni un solo bit desde el momento de la firma.
                </Typography>
              </Box>

              <Divider />

              {/* 4. Información adicional */}
              {contrato.geolocalizacion_firma && (
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    Ubicación de Firma
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontFamily: 'monospace',
                      color: 'text.secondary',
                      bgcolor: alpha(theme.palette.action.focus, 0.5),
                      p: 0.5,
                      borderRadius: 1,
                      display: 'inline-block'
                    }}
                  >
                    {contrato.geolocalizacion_firma}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
        </Box>
      </Stack>
    </BaseModal>
  );
};