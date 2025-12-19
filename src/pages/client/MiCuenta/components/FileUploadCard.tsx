import React from 'react';
import { Box, Typography, Button, Paper, useTheme, alpha, Stack, IconButton } from '@mui/material';
import { CloudUpload, Delete, CheckCircle, InsertDriveFile } from '@mui/icons-material';
import type { ChangeEvent } from 'react';

interface FileUploadCardProps {
  title: string;
  description: string;
  accept: string;
  file: File | null;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
}

export const FileUploadCard: React.FC<FileUploadCardProps> = ({ 
  title, description, accept, file, onFileSelect, onRemove 
}) => {
  const theme = useTheme();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
    // Resetear value para permitir re-selección del mismo archivo
    e.target.value = ''; 
  };

  return (
    <Paper 
      variant="outlined" 
      sx={{ 
        p: 3, 
        textAlign: 'center', 
        borderStyle: 'dashed', 
        borderWidth: 2,
        borderRadius: 3, // Bordes más redondeados (coherencia con el resto)
        borderColor: file ? 'success.main' : 'divider',
        bgcolor: file 
          ? alpha(theme.palette.success.main, 0.04) 
          : 'background.default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 200,
        // Efecto Hover solo si no hay archivo (para invitar a subir)
        ...(!file && {
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: alpha(theme.palette.primary.main, 0.02),
            transform: 'translateY(-2px)'
          }
        })
      }}
    >
      {file ? (
        // === ESTADO: ARCHIVO CARGADO ===
        <Stack spacing={2} alignItems="center" width="100%">
          <Box 
            sx={{ 
              width: 60, height: 60, borderRadius: '50%', 
              bgcolor: alpha(theme.palette.success.main, 0.1),
              color: 'success.main',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <CheckCircle fontSize="large" />
          </Box>
          
          <Box>
            <Typography variant="subtitle1" fontWeight={700} color="text.primary">
              ¡Archivo Listo!
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" mt={0.5}>
               <InsertDriveFile fontSize="small" color="action" />
               <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 180 }}>
                 {file.name}
               </Typography>
            </Stack>
          </Box>

          <Button 
            size="small" 
            color="error" 
            variant="outlined"
            startIcon={<Delete />} 
            onClick={onRemove}
            sx={{ mt: 1, borderRadius: 2 }}
          >
            Eliminar y Cambiar
          </Button>
        </Stack>
      ) : (
        // === ESTADO: VACÍO (SUBIR) ===
        <Stack spacing={1} alignItems="center" width="100%">
          <Box 
            sx={{ 
              mb: 1, color: 'text.secondary',
              p: 2, borderRadius: '50%', bgcolor: 'action.hover'
            }}
          >
            <CloudUpload fontSize="large" />
          </Box>
          
          <Typography variant="subtitle1" fontWeight={700}>
            {title}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ px: 2, mb: 2 }}>
            {description}
          </Typography>

          <Button
            component="label"
            variant="contained" // Contained llama más la atención
            size="small"
            disableElevation
            sx={{ borderRadius: 2, px: 3 }}
          >
            Seleccionar Archivo
            <input type="file" hidden accept={accept} onChange={handleChange} />
          </Button>
        </Stack>
      )}
    </Paper>
  );
};