import { Box, Paper, Typography } from '@mui/material';
import React from 'react';
import ImageUploadZone from '../../../../../../shared/components/forms/ImageUploadZone';


interface FileUploadCardProps {
    title: string;
    description: string;
    accept?: string;
    file: File | null;
    onFileSelect: (file: File) => void;
    onRemove: () => void;
}

export const FileUploadCard: React.FC<FileUploadCardProps> = ({
    title,
    description,
    accept = "image/*",
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
                    // ✅ Corregido: Usamos la prop 'image' (singular) ya que no es múltiple
                    image={file}
                    multiple={false}
                    onChange={handleZoneChange}
                    maxSizeMB={accept.includes('video') ? 50 : 10}
                    accept={accept}
                />
            </Box>
        </Paper>
    );
};