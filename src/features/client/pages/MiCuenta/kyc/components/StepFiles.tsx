import React from 'react';
import { Box, Stack, Avatar, Typography, useTheme, alpha } from '@mui/material';
import { UploadFile } from '@mui/icons-material';
import { env } from '@/core/config/env';
import { FileUploadCard } from './FileUploadCard';


interface StepFilesProps {
  files: {
    frente: File | null;
    dorso: File | null;
    selfie: File | null;
    video: File | null;
  };
  onFileChange: (field: string, file: File | null) => void;
}

export const StepFiles: React.FC<StepFilesProps> = ({ files, onFileChange }) => {
  const theme = useTheme();
  const acceptedTypes = env.allowedKycFileTypes.join(',');

  return (
    <Stack spacing={4}>
      {/* Header del Paso */}
      <Box display="flex" alignItems="center" gap={2}>
        <Avatar 
          variant="rounded" 
          sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}
        >
          <UploadFile />
        </Avatar>
        <Box>
          <Typography variant="h6" fontWeight={700}>Carga de Documentos</Typography>
          <Typography variant="body2" color="text.secondary">
            Sube fotos claras, sin flash y sobre fondo liso.
          </Typography>
        </Box>
      </Box>

      {/* Grid de Carga de Archivos */}
      <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>
        <FileUploadCard 
          title="Frente DNI *" 
          description="Foto frontal legible del documento"
          accept={acceptedTypes} 
          file={files.frente} 
          onFileSelect={(f) => onFileChange('frente', f)} 
          onRemove={() => onFileChange('frente', null)} 
        />
        
        <FileUploadCard 
          title="Dorso DNI" 
          description="Reverso del documento"
          accept={acceptedTypes} 
          file={files.dorso} 
          onFileSelect={(f) => onFileChange('dorso', f)} 
          onRemove={() => onFileChange('dorso', null)} 
        />
        
        <FileUploadCard 
          title="Selfie con DNI *" 
          description="Sostén el DNI junto a tu rostro"
          accept={acceptedTypes} 
          file={files.selfie} 
          onFileSelect={(f) => onFileChange('selfie', f)} 
          onRemove={() => onFileChange('selfie', null)} 
        />
        
        <FileUploadCard 
          title="Video (Opcional)" 
          description="Pequeña prueba de vida"
          accept="video/*" 
          file={files.video} 
          onFileSelect={(f) => onFileChange('video', f)} 
          onRemove={() => onFileChange('video', null)} 
        />
      </Box>
    </Stack>
  );
};