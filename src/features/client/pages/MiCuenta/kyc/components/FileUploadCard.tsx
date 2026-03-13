import React, { useMemo } from 'react';
import { Box, Paper, Typography, useTheme } from '@mui/material';
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

// Helper de conversión (fuera del componente para no re-declararlo)
const toMB = (bytes: number) => bytes / 1_048_576;

export const FileUploadCard: React.FC<FileUploadCardProps> = React.memo(({
  title,
  description,
  accept = 'image/*',
  file,
  onFileSelect,
  onRemove
}) => {
  const theme = useTheme();

  // 1. Manejador de cambio de zona
  const handleZoneChange = (newFile: File | null) => {
    if (newFile) {
      onFileSelect(newFile);
    } else {
      onRemove();
    }
  };

  // 2. Cálculo de tamaño máximo basado en el tipo de archivo
  const maxSizeMB = useMemo(() => {
    const isVideo = accept.includes('video');
    const bytes = isVideo 
      ? (env.maxFileSize || 104857600) 
      : (env.maxImageSize || 5242880);
      
    return toMB(bytes);
  }, [accept]);

  // 3. Estilos encapsulados para limpieza visual
  const cardStyles = {
    p: 2,
    borderRadius: 3,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    bgcolor: 'background.default',
    transition: 'all 0.2s ease-in-out',
    border: `1px solid ${theme.palette.divider}`,
    '&:hover': { 
      borderColor: 'primary.main',
      boxShadow: theme.shadows[1]
    }
  };

  return (
    <Paper variant="outlined" sx={cardStyles}>
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
          maxSizeMB={maxSizeMB}
          accept={accept}
        />
      </Box>
    </Paper>
  );
});

FileUploadCard.displayName = 'FileUploadCard';