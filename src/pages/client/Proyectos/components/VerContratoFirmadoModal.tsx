import React from 'react';
import { Typography, Box, Chip, useTheme, alpha, Button } from '@mui/material';
import { VerifiedUser as VerifiedIcon, Download as DownloadIcon } from '@mui/icons-material';

import { BaseModal } from '../../../../components/common/BaseModal/BaseModal';
import type { ContratoFirmadoDto } from '../../../../types/dto/contrato.dto';
import ContratoService from '../../../../services/contrato.service';
import ImagenService from '../../../../services/imagen.service';
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
    <BaseModal
      open={open}
      onClose={onClose}
      title={contrato.nombre_archivo}
      subtitle="Documento firmado digitalmente"
      icon={<VerifiedIcon />}
      headerColor="success"
      maxWidth="lg"
      // Configuramos el botón principal como "Descargar"
      confirmText="Descargar Copia"
      confirmButtonIcon={<DownloadIcon />}
      onConfirm={handleDownload}
      cancelText="Cerrar"
      // Layout específico para visor
      PaperProps={{ sx: { height: '85vh' } }}
    >
      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} height="100%" overflow="hidden">
          
          {/* COLUMNA IZQUIERDA: VISOR PDF */}
          <Box flex={1} p={0} overflow="hidden" display="flex" flexDirection="column" bgcolor="action.hover" borderRadius={2} mr={{ md: 3 }} mb={{ xs: 2, md: 0 }}>
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
            width={{ xs: '100%', md: 300 }} 
            display="flex"
            flexDirection="column"
            gap={3}
            overflow="auto"
          >
            <Box>
                <Typography variant="subtitle2" color="primary.main" fontWeight="800" sx={{ letterSpacing: 1, textTransform: 'uppercase', mb: 2 }}>
                    Auditoría de Firma
                </Typography>

                <Box mb={2}>
                    <Typography variant="caption" color="text.secondary" display="block" mb={0.5} fontWeight={600}>ESTADO ACTUAL</Typography>
                    <Chip 
                        label={contrato.estado_firma} 
                        color={contrato.estado_firma === 'FIRMADO' ? 'success' : 'error'} 
                        size="small" 
                        variant="filled"
                        sx={{ fontWeight: 'bold', borderRadius: 1 }}
                    />
                </Box>

                <Box mb={2}>
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
                        bgcolor={alpha(theme.palette.action.active, 0.05)}
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
            </Box>
          </Box>
      </Box>
    </BaseModal>
  );
};