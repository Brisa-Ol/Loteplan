// src/components/common/FileUploadCard/FileUploadCard.tsx

import React, { type ChangeEvent } from 'react'; // ✅ Corrección aquí
import { 
  Box, Typography, Button, Paper, useTheme, alpha, Stack 
} from '@mui/material';
import { 
  CloudUpload, Delete, CheckCircle, InsertDriveFile 
} from '@mui/icons-material';
import { keyframes } from '@emotion/react';

// ════════════════════════════════════════════════════════════
// ANIMACIONES
// ════════════════════════════════════════════════════════════

const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
`;

const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
`;

// ════════════════════════════════════════════════════════════
// PROPS
// ════════════════════════════════════════════════════════════

interface FileUploadCardProps {
  title: string;
  description: string;
  accept: string;
  file: File | null;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  disabled?: boolean;
}

// ════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════

export const FileUploadCard: React.FC<FileUploadCardProps> = ({ 
  title, description, accept, file, onFileSelect, onRemove, disabled = false 
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
        borderStyle: file ? 'solid' : 'dashed',
        borderWidth: 2,
        borderRadius: 3,
        borderColor: file ? 'success.main' : 'divider',
        bgcolor: file ? alpha(theme.palette.success.main, 0.02) : 'background.paper',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 220,
        position: 'relative',
        cursor: (!file && !disabled) ? 'pointer' : 'default',
        // Efecto Hover
        ...(!file && !disabled && {
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: alpha(theme.palette.primary.main, 0.02),
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[2],
            '& .icon-upload': {
                animation: `${bounce} 1s infinite ease-in-out`
            }
          }
        })
      }}
    >
      {file ? (
        // === ESTADO: ARCHIVO CARGADO ===
        <Stack 
            spacing={2} 
            alignItems="center" 
            width="100%" 
            sx={{ animation: `${fadeIn} 0.4s ease-out` }}
        >
          <Box 
            sx={{ 
              width: 64, height: 64, borderRadius: '50%', 
              bgcolor: alpha(theme.palette.success.main, 0.1),
              color: 'success.main',
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
            
            <Stack 
                direction="row" 
                spacing={1} 
                alignItems="center" 
                justifyContent="center" 
                mt={1} 
                sx={{ 
                    bgcolor: 'background.paper', 
                    px: 2, py: 0.75, 
                    borderRadius: 2, 
                    border: `1px solid ${theme.palette.divider}`,
                    maxWidth: '100%'
                }}
            >
               <InsertDriveFile fontSize="small" color="action" sx={{ fontSize: 18 }} />
               <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200, fontWeight: 600 }}>
                 {file.name}
               </Typography>
               <Typography variant="caption" color="text.disabled">
                 ({(file.size / 1024 / 1024).toFixed(2)} MB)
               </Typography>
            </Stack>
          </Box>

          <Button 
            size="small" 
            color="error" 
            variant="outlined"
            startIcon={<Delete fontSize="small" />} 
            onClick={onRemove}
            disabled={disabled}
            sx={{ 
                mt: 1, borderRadius: 2, textTransform: 'none', fontWeight: 700,
                borderColor: alpha(theme.palette.error.main, 0.3),
                color: 'error.main',
                '&:hover': { 
                    bgcolor: 'error.main', 
                    color: 'white',
                    borderColor: 'error.main' 
                } 
            }}
          >
            Eliminar Archivo
          </Button>
        </Stack>
      ) : (
        // === ESTADO: VACÍO (SUBIR) ===
        <Stack spacing={1.5} alignItems="center" width="100%">
          <Box 
            className="icon-upload"
            sx={{ 
              mb: 1, color: 'text.secondary',
              width: 64, height: 64, 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '50%', 
              bgcolor: alpha(theme.palette.action.active, 0.05),
              transition: 'all 0.3s ease'
            }}
          >
            <CloudUpload sx={{ fontSize: 32 }} />
          </Box>
          
          <Typography variant="subtitle1" fontWeight={800} color="text.primary">
            {title}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ px: 2, mb: 2, maxWidth: 300 }}>
            {description}
          </Typography>

          <Button
            component="label"
            variant="contained" 
            color="primary"
            size="small"
            disableElevation
            disabled={disabled}
            startIcon={<CloudUpload fontSize="small" />}
            sx={{ borderRadius: 2, px: 3, py: 1, fontWeight: 700 }}
          >
            Seleccionar Archivo
            <input type="file" hidden accept={accept} onChange={handleChange} disabled={disabled} />
          </Button>
        </Stack>
      )}
    </Paper>
  );
};