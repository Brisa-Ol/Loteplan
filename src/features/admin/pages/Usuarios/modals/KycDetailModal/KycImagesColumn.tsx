// src/features/admin/pages/Usuarios/modals/sections/KycImagesColumn.tsx

import { env } from '@/core/config/env';
import type { KycDTO } from '@/core/types/dto/kyc.dto';
import { OpenInNew as OpenIcon } from '@mui/icons-material';
import { Box, IconButton, Stack, Tooltip, Typography, useTheme } from '@mui/material';
import React from 'react';

const getImageUrl = (path: string | null): string => {
  if (!path) return '';
  return `${env.apiPublicUrl}/uploads/${path.replace(/\\/g, '/')}`;
};

const EvidenceImage: React.FC<{ title: string; src: string | null }> = ({ title, src }) => {
  const theme = useTheme();
  if (!src) return (
    <Box sx={{ p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 2, textAlign: 'center' }}>
      <Typography variant="caption" color="text.disabled" fontWeight={700}>{title.toUpperCase()} NO DISPONIBLE</Typography>
    </Box>
  );

  const url = getImageUrl(src);
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
        <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ fontSize: '0.6rem' }}>
          {title.toUpperCase()}
        </Typography>
        <Tooltip title="Abrir en tamaño completo">
          <IconButton size="small" onClick={() => window.open(url, '_blank')} sx={{ p: 0.5 }}>
            <OpenIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      </Stack>
      <Box onClick={() => window.open(url, '_blank')} sx={{
        position: 'relative', width: '100%', height: 180,
        borderRadius: 2, border: '1px solid', borderColor: theme.palette.divider,
        bgcolor: 'action.hover', overflow: 'hidden', cursor: 'zoom-in',
        transition: 'all 0.3s ease',
        '&:hover': { boxShadow: theme.shadows[4], borderColor: theme.palette.primary.main, '& img': { transform: 'scale(1.08)' } },
      }}>
        <Box component="img" src={url} alt={title} sx={{
          width: '100%', height: '100%', objectFit: 'cover',
          transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </Box>
    </Box>
  );
};

interface Props {
  kyc: KycDTO;
}

const KycImagesColumn: React.FC<Props> = ({ kyc }) => (
  <Box sx={{ flex: 1.4 }}>
    <Typography variant="subtitle2" fontWeight={800} color="text.primary" mb={2}
      sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.75rem' }}
    >
      Evidencia Documental
    </Typography>
    <Stack spacing={2.5}>
      <EvidenceImage title="Frente del Documento"    src={kyc.url_foto_documento_frente} />
      <EvidenceImage title="Dorso del Documento"     src={kyc.url_foto_documento_dorso} />
      <EvidenceImage title="Selfie con Documento"    src={kyc.url_foto_selfie_con_documento} />
    </Stack>
  </Box>
);

export default KycImagesColumn;