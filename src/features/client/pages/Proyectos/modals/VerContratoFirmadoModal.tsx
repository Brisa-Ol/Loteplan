// src/features/client/pages/Contratos/modals/VerContratoFirmadoModal.tsx

import {
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  Fingerprint,
  Person as PersonIcon,
  Business as ProjectIcon,
  HistoryEdu as SignatureIcon,
  VerifiedUser as VerifiedIcon
} from '@mui/icons-material';
import {
  Alert,
  Box, Chip, CircularProgress, Divider, IconButton,
  Paper, Stack, Tooltip, Typography, useTheme
} from '@mui/material';
import React, { useMemo, useState } from 'react';

import { env } from '@/core/config/env';
import ContratoService from '@/core/api/services/contrato.service';
import ImagenService from '@/core/api/services/imagen.service';
import type { ContratoFirmadoDto } from '@/core/types/dto/contrato-firmado.dto';
import PDFViewerMejorado from '../../Contratos/components/PDFViewerMejorado';
import { BaseModal, useSnackbar } from '@/shared';

interface Props {
  open: boolean;
  onClose: () => void;
  contrato: ContratoFirmadoDto | null;
}

// Formateadores construidos una sola vez con locale y timezone del env
const dateFormatter = new Intl.DateTimeFormat(env.defaultLocale, {
  timeZone: env.timezone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const timeFormatter = new Intl.DateTimeFormat(env.defaultLocale, {
  timeZone: env.timezone,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

export const VerContratoFirmadoModal: React.FC<Props> = ({ open, onClose, contrato }) => {
  const theme = useTheme();
  const { showSuccess, showError } = useSnackbar();
  const [isDownloading, setIsDownloading] = useState(false);

  const pdfUrl = useMemo(() => {
    if (!contrato?.url_archivo) return '';
    return ImagenService.resolveImageUrl(contrato.url_archivo);
  }, [contrato?.url_archivo]);

  const handleCopyHash = () => {
    if (contrato?.hash_archivo_firmado) {
      navigator.clipboard.writeText(contrato.hash_archivo_firmado);
      showSuccess('Hash copiado al portapapeles');
    }
  };

  if (!contrato) return null;

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await ContratoService.downloadAndSave(
        contrato.id,
        contrato.nombre_archivo || `contrato_${contrato.id}.pdf`
      );
      showSuccess('Documento descargado con éxito');
    } catch (error) {
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
      title={contrato.proyectoAsociado?.nombre_proyecto || "Contrato Digital"}
      subtitle={contrato.nombre_archivo}
      icon={<VerifiedIcon />}
      headerColor={esFirmado ? 'success' : 'warning'}
      maxWidth="lg"
      confirmText="Descargar PDF"
      confirmButtonIcon={isDownloading ? <CircularProgress size={20} /> : <DownloadIcon />}
      onConfirm={handleDownload}
      disableConfirm={isDownloading}
      cancelText="Cerrar"
      PaperProps={{ sx: { height: '90vh' } }}
    >
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} height="100%" overflow="hidden">

        {/* VISOR PDF */}
        <Box flex={1} bgcolor="background.default" borderRadius={2} border={`1px solid ${theme.palette.divider}`} overflow="hidden" position="relative">
          <PDFViewerMejorado pdfUrl={pdfUrl} signatureDataUrl={null} readOnlyMode={true} />
        </Box>

        {/* PANEL DE AUDITORÍA */}
        <Box width={{ xs: '100%', md: 340 }} component={Paper} elevation={0} variant="outlined" sx={{ overflow: 'auto', p: 2.5, bgcolor: 'background.paper' }}>
          <Typography variant="overline" color="text.secondary" fontWeight={800} sx={{ display: 'block', mb: 2 }}>
            DETALLES DE VALIDACIÓN
          </Typography>

          <Stack spacing={2.5}>

            {/* TITULAR DE LA FIRMA */}
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <PersonIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                <Typography variant="caption" fontWeight={700} color="text.secondary">TITULAR DE LA FIRMA</Typography>
              </Stack>
              <Typography variant="subtitle2" fontWeight={800}>
                {`${contrato.usuarioFirmante?.nombre} ${contrato.usuarioFirmante?.apellido}`}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {contrato.usuarioFirmante?.email}
              </Typography>
            </Box>

            <Divider />

            {/* Proyecto Asociado */}
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <ProjectIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                <Typography variant="caption" fontWeight={700} color="text.secondary">PROYECTO</Typography>
              </Stack>
              <Typography variant="body2" fontWeight={700}>
                {contrato.proyectoAsociado?.nombre_proyecto.toUpperCase()}
              </Typography>
            </Box>

            <Divider />

            {/* Certificación digital */}
            <Box>
              <Typography variant="caption" color="text.secondary">CERTIFICACIÓN DIGITAL</Typography>
              <Alert severity="success" icon={<SignatureIcon fontSize="small" />} sx={{ mt: 0.5, py: 0.5 }}>
                <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
                  {contrato.firma_digital}
                </Typography>
              </Alert>
            </Box>

            <Divider />

            {/* Metadatos Técnicos */}
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" mb={1}>TRAZABILIDAD DE AUDITORÍA</Typography>
              <Stack spacing={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="caption">Dirección IP:</Typography>
                  <Typography variant="caption" fontWeight={700} sx={{ fontFamily: 'monospace' }}>{contrato.ip_firma}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="caption">Fecha y Hora:</Typography>
                  {/* ✅ Formateado con env.defaultLocale y env.timezone */}
                  <Typography variant="caption" fontWeight={700}>
                    {dateFormatter.format(fechaFirma)} — {timeFormatter.format(fechaFirma)}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Divider />

            {/* Hash SHA-256 */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Fingerprint sx={{ fontSize: 16, color: 'primary.main' }} />
                  <Typography variant="caption" fontWeight={700} color="text.secondary">SHA-256 (HASH)</Typography>
                </Stack>
                <Tooltip title="Copiar Hash">
                  <IconButton size="small" onClick={handleCopyHash}>
                    <CopyIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              </Stack>
              <Box bgcolor="action.hover" p={1.5} borderRadius={1} border="1px dashed" borderColor="divider">
                <Typography variant="caption" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', fontSize: '0.65rem' }}>
                  {contrato.hash_archivo_firmado}
                </Typography>
              </Box>
            </Box>

            {/* Geolocalización */}
            {contrato.geolocalizacion_firma && (
              <Box>
                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>COORDENADAS DE ORIGEN</Typography>
                <Chip
                  label={contrato.geolocalizacion_firma}
                  size="small"
                  variant="outlined"
                  sx={{ fontFamily: 'monospace', fontSize: '0.65rem', maxWidth: '100%' }}
                />
              </Box>
            )}
          </Stack>
        </Box>
      </Stack>
    </BaseModal>
  );
};