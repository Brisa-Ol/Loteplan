import { Box, Paper, Typography } from '@mui/material';
import React, { useMemo } from 'react'; // 👈 Añadimos useMemo
import { env } from '@/core/config/env';
import ImageUploadZone from '../../../../../../shared/components/forms/ImageUploadZone';

interface FileUploadCardProps {
    title: string;
    description: string;
    accept?: string;
    file: File | null;
    onFileSelect: (file: File) => void;
    onRemove: () => void;
}

// Helper de conversión
const toMB = (bytes: number) => bytes / 1_048_576;

export const FileUploadCard: React.FC<FileUploadCardProps> = ({
    title,
    description,
    accept = 'image/*',
    file,
    onFileSelect,
    onRemove
}) => {

    const handleZoneChange = (newFile: File | null) => {
        if (newFile) {
            onFileSelect(newFile);
        } else {
            onRemove();
        }
    };

    // 🚀 MEJORA: Cálculo seguro con fallbacks y memoización
    const maxSizeMB = useMemo(() => {
        const isVideo = accept.includes('video');
        
        // Usamos los valores de env con un respaldo (fallback) razonable
        // 100MB para video, 5MB para imágenes si el env falla.
        const bytes = isVideo 
            ? (env.maxFileSize || 104857600) 
            : (env.maxImageSize || 5242880);
            
        return toMB(bytes);
    }, [accept]);

    return (
        <Paper
            variant="outlined"
            sx={{ 
                p: 2, 
                borderRadius: 3, 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                bgcolor: 'background.default',
                transition: 'border-color 0.2s',
                '&:hover': { borderColor: 'primary.main' } // Un toque visual extra
            }}
        >
            <Box mb={2}>
                <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                    {title}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2, display: 'block' }}>
                    {description}
                </Typography>
            </Box>

            <Box flexGrow={1}>
                <ImageUploadZone
                    image={file}
                    multiple={false}
                    onChange={handleZoneChange}
                    maxSizeMB={maxSizeMB} // 👈 Valor inyectado desde env.ts
                    accept={accept}
                />
            </Box>
        </Paper>
    );
};