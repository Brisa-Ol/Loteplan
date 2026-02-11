// src/pages/Client/Kyc/components/FileUploadCard.tsx

import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import ImageUploadZone from '@/shared/components/forms/upload/ImageUploadZone/ImageUploadZone';


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

  // Adaptador: ImageUploadZone trabaja con arrays, KYC con archivo único
  const handleZoneChange = (files: File[]) => {
    if (files.length > 0) {
      // Si hay archivos, tomamos el último que se subió (o el primero)
      onFileSelect(files[files.length - 1]);
    } else {
      // Si el array vuelve vacío, es que el usuario eliminó la imagen
      onRemove();
    }
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default' // Un fondo sutil para diferenciarlo
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
          // Convertimos el archivo único a array para el componente
          images={file ? [file] : []}
          onChange={handleZoneChange}
          maxFiles={1} // Forzamos modo archivo único
          maxSizeMB={accept.includes('video') ? 50 : 10} // Más MB para video
          accept={accept}
        />
      </Box>
    </Paper>
  );
};