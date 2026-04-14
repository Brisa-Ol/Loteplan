// src/features/admin/pages/Usuarios/modals/sections/KycImagesColumn.tsx

import { env } from '@/core/config/env';
import type { KycDTO } from '@/core/types/kyc.dto';
import { OpenInNew as OpenIcon } from '@mui/icons-material';
import { Box, IconButton, Stack, Tooltip, Typography, useTheme } from '@mui/material';
import React from 'react';

const getImageUrl = (path: string | null): string => {
    if (!path) return '';
    return `${env.apiPublicUrl}/uploads/${path.replace(/\\/g, '/')}`;
};

const EvidenceImage: React.FC<{ title: string; src: string | null }> = ({ title, src }) => {
    const theme = useTheme();

    // Estado vacío (Sin imagen) usando los colores de tu theme
    if (!src) return (
        <Box sx={{
            p: 3,
            border: '1px dashed',
            borderColor: 'secondary.main',
            bgcolor: 'secondary.light',
            borderRadius: 2,
            textAlign: 'center'
        }}>
            <Typography variant="overline" color="text.disabled" display="block" lineHeight={1}>
                {title} NO DISPONIBLE
            </Typography>
        </Box>
    );

    const url = getImageUrl(src);
    return (
        <Box>
            {/* Header de la Imagen */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                {/* Usamos tu variante overline que ya trae el uppercase y el spacing */}
                <Typography variant="overline" color="text.secondary" lineHeight={1}>
                    {title}
                </Typography>
                <Tooltip title="Abrir en tamaño completo">
                    <IconButton size="small" onClick={() => window.open(url, '_blank')} sx={{ p: 0.5, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                        <OpenIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                </Tooltip>
            </Stack>

            {/* Contenedor de la Imagen */}
            <Box
                onClick={() => window.open(url, '_blank')}
                sx={{
                    position: 'relative',
                    width: '100%',
                    height: 180, // Puedes bajarlo a 160 si quieres que sea aún más compacto
                    borderRadius: 2, // Hereda el border radius de tu shape (8px)
                    border: '1px solid',
                    borderColor: 'secondary.main',
                    bgcolor: 'secondary.light',
                    overflow: 'hidden',
                    cursor: 'zoom-in',
                    transition: theme.transitions.create(['border-color', 'box-shadow']),
                    '&:hover': {
                        boxShadow: theme.shadows[4],
                        borderColor: 'primary.main',
                        '& img': { transform: 'scale(1.05)' }
                    },
                }}
            >
                <Box
                    component="img"
                    src={url}
                    alt={title}
                    sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: theme.transitions.create('transform', {
                            duration: theme.transitions.duration.complex,
                        }),
                    }}
                />
            </Box>
        </Box>
    );
};

interface Props {
    kyc: KycDTO;
}

const KycImagesColumn: React.FC<Props> = ({ kyc }) => (
    <Box sx={{ flex: 1.4 }}>
        {/* Título Principal de la Columna usando Overline pero destacando con text.primary */}
        <Typography variant="overline" color="text.primary" display="block" mb={2}>
            Evidencia Documental
        </Typography>

        <Stack spacing={2.5}>
            <EvidenceImage title="Frente del Documento" src={kyc.url_foto_documento_frente} />
            <EvidenceImage title="Dorso del Documento" src={kyc.url_foto_documento_dorso} />
            <EvidenceImage title="Selfie con Documento" src={kyc.url_foto_selfie_con_documento} />
        </Stack>
    </Box>
);

export default KycImagesColumn;