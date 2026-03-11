import { Box, Paper, Typography } from '@mui/material';
import React from 'react';
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

// Convertimos bytes → MB que espera ImageUploadZone
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

    // env.maxImageSize para imágenes, env.maxFileSize para video
    const maxSizeMB = accept.includes('video')
        ? toMB(env.maxFileSize)
        : toMB(env.maxImageSize);

    return (
        <Paper
            variant="outlined"
            sx={{ p: 2, borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}
        >
            <Box mb={2}>
                <Typography variant="subtitle2" fontWeight={700} color="text.primary">{title}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2, display: 'block' }}>{description}</Typography>
            </Box>

            <Box flexGrow={1}>
                <ImageUploadZone
                    image={file}
                    multiple={false}
                    onChange={handleZoneChange}
                    maxSizeMB={maxSizeMB}
                    accept={accept}
                />
            </Box>
        </Paper>
    );
};