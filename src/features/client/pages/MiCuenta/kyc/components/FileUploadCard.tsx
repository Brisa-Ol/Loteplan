import { env } from '@/core/config/env';
import { Box, Typography, alpha, useTheme } from '@mui/material';
import React, { useMemo } from 'react';
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

  // 3. Estilos integrados con el Theme
  const cardStyles = {
    p: 2,
    borderRadius: 3, // Bordes un poco más redondeados para suavizar la UI
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    bgcolor: 'background.paper',
    border: `1px solid ${theme.palette.secondary.main}`,
    transition: theme.transitions.create(['border-color', 'box-shadow', 'transform']),
    '&:hover': {
      borderColor: theme.palette.primary.main,
      boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.12)}`,
      transform: 'translateY(-4px)'
    }
  };

  return (
    <Box sx={cardStyles}>
      <Box mb={2}>
        {/* Usamos tu variante overline definida en el theme para los títulos */}
        <Typography
          variant="overline"
          color="primary.main"
          display="block"
          lineHeight={1.2}
          mb={0.5}
        >
          {title}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
        >
          {description}
        </Typography>
      </Box>

      <Box flexGrow={1} display="flex" flexDirection="column">
        {/* Si tu ImageUploadZone tiene estilos internos, asegúrate de que también
          use colores de tu theme (como primary.main para el borde dashed) 
        */}
        <ImageUploadZone
          image={file}
          multiple={false}
          onChange={handleZoneChange}
          maxSizeMB={maxSizeMB}
          accept={accept}
        />
      </Box>
    </Box>
  );
});

FileUploadCard.displayName = 'FileUploadCard';