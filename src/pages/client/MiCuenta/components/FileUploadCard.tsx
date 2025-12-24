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
        borderStyle: file ? 'solid' : 'dashed', // Sólido si hay archivo
        borderWidth: 2,
        borderRadius: 3, // Coherencia con el resto de la UI
        borderColor: file ? theme.palette.success.main : theme.palette.divider,
        bgcolor: file 
          ? alpha(theme.palette.success.main, 0.04) 
          : 'background.paper',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 220,
        position: 'relative',
        // Efecto Hover solo si no hay archivo
        ...(!file && {
          '&:hover': {
            borderColor: theme.palette.primary.main,
            bgcolor: alpha(theme.palette.primary.main, 0.02),
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[2]
          }
        })
      }}
    >
      {file ? (
        // === ESTADO: ARCHIVO CARGADO ===
        <Stack spacing={2} alignItems="center" width="100%" sx={{ animation: 'fadeIn 0.5s ease' }}>
          <Box 
            sx={{ 
              width: 64, height: 64, borderRadius: '50%', 
              bgcolor: alpha(theme.palette.success.main, 0.1),
              color: theme.palette.success.main,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 0 8px ${alpha(theme.palette.success.main, 0.05)}`
            }}
          >
            <CheckCircle fontSize="large" />
          </Box>
          
          <Box>
            <Typography variant="subtitle1" fontWeight={700} color="text.primary">
              ¡Archivo Listo!
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" mt={0.5} sx={{ bgcolor: 'background.paper', px: 1.5, py: 0.5, borderRadius: 1, border: `1px solid ${theme.palette.divider}` }}>
               <InsertDriveFile fontSize="small" color="action" sx={{ fontSize: 16 }} />
               <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 140, fontWeight: 600 }}>
                 {file.name}
               </Typography>
            </Stack>
          </Box>

          <Button 
            size="small" 
            color="error" 
            variant="text"
            startIcon={<Delete fontSize="small" />} 
            onClick={onRemove}
            sx={{ 
                mt: 1, borderRadius: 2, 
                fontWeight: 600,
                '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) } 
            }}
          >
            Eliminar
          </Button>
        </Stack>
      ) : (
        // === ESTADO: VACÍO (SUBIR) ===
        <Stack spacing={1.5} alignItems="center" width="100%">
          <Box 
            sx={{ 
              mb: 1, color: 'text.secondary',
              width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '50%', bgcolor: alpha(theme.palette.action.active, 0.05)
            }}
          >
            <CloudUpload fontSize="medium" />
          </Box>
          
          <Typography variant="subtitle1" fontWeight={700} color="text.primary">
            {title}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ px: 2, mb: 2, fontSize: '0.85rem' }}>
            {description}
          </Typography>

          <Button
            component="label"
            variant="contained" 
            color="primary"
            size="small"
            disableElevation
            startIcon={<CloudUpload fontSize="small" />}
            sx={{ borderRadius: 2, px: 3, fontWeight: 600 }}
          >
            Seleccionar
            <input type="file" hidden accept={accept} onChange={handleChange} />
          </Button>
        </Stack>
      )}
      
      {/* Keyframes para animación suave de entrada */}
      <style>
        {`@keyframes fadeIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }`}
      </style>
    </Paper>
  );
};