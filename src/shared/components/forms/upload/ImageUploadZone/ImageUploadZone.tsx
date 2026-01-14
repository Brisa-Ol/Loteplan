// src/components/common/ImageUploadZone/ImageUploadZone.tsx

import React, { useState, useCallback } from 'react';
import {
  Box, Typography, IconButton, Paper, Stack, Alert, Chip, useTheme, alpha
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Image as ImageIcon
} from '@mui/icons-material';

interface ImageUploadZoneProps {
  images: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  disabled?: boolean;
}

const ImageUploadZone: React.FC<ImageUploadZoneProps> = ({
  images,
  onChange,
  maxFiles = 5,
  maxSizeMB = 15,
  disabled = false,
}) => {
  const theme = useTheme();
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validar tipo y tamaño
  const validateFile = useCallback((file: File): boolean => {
    if (!file.type.startsWith('image/')) {
      setError(`El archivo "${file.name}" no es una imagen válida.`);
      return false;
    }

    if (file.size / 1024 / 1024 > maxSizeMB) {
      setError(`"${file.name}" excede los ${maxSizeMB}MB permitidos.`);
      return false;
    }

    return true;
  }, [maxSizeMB]);

  // Procesar archivos (Drop o Input)
  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || disabled) return;

      setError(null);
      const newFiles = Array.from(fileList);

      if (images.length + newFiles.length > maxFiles) {
        setError(`Solo puedes subir un máximo de ${maxFiles} imágenes.`);
        return;
      }

      const filtered = newFiles.filter(validateFile);

      if (filtered.length > 0) {
        onChange([...images, ...filtered]);
      }
    },
    [images, onChange, disabled, maxFiles, validateFile]
  );

  // Manejadores de Drag & Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeImage = (indexToRemove: number) => {
    onChange(images.filter((_, index) => index !== indexToRemove));
  };

  return (
    <Box>
      {/* --- ZONA DE DROP --- */}
      <Paper
        variant="outlined"
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        sx={{
          p: { xs: 2, md: 4 },
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          backgroundColor: dragActive ? alpha(theme.palette.primary.main, 0.08) : 'background.paper',
          borderStyle: 'dashed',
          borderWidth: 2,
          borderColor: dragActive ? 'primary.main' : 'divider',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.2s ease-in-out',
          borderRadius: 3,
          '&:hover': !disabled ? {
            borderColor: 'primary.main',
            backgroundColor: alpha(theme.palette.primary.main, 0.04)
          } : {}
        }}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          id="image-upload-input"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={disabled}
          style={{ display: 'none' }}
        />

        <label htmlFor="image-upload-input" style={{ cursor: disabled ? 'not-allowed' : 'pointer', width: '100%', display: 'block' }}>
          <Stack spacing={2} alignItems="center">
            <Box 
                sx={{ 
                    p: 2, 
                    borderRadius: '50%', 
                    bgcolor: dragActive ? 'primary.main' : 'action.hover',
                    color: dragActive ? 'white' : 'text.secondary',
                    transition: '0.3s'
                }}
            >
                <UploadIcon sx={{ fontSize: 32 }} />
            </Box>

            <Box>
                <Typography fontWeight={600} variant="body1">
                {dragActive ? '¡Suelta los archivos aquí!' : 'Haz clic o arrastra imágenes'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                Soporta: JPG, PNG, WEBP • Máx {maxFiles} archivos • {maxSizeMB}MB c/u
                </Typography>
            </Box>

            {images.length > 0 && (
                <Chip
                label={`${images.length} / ${maxFiles} seleccionadas`}
                size="small"
                color="primary"
                variant="outlined"
                icon={<ImageIcon fontSize="small" />}
                />
            )}
          </Stack>
        </label>
      </Paper>

      {/* --- MENSAJES DE ERROR --- */}
      {error && (
        <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* --- VISTA PREVIA (GRID RESPONSIVE) --- */}
      {images.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom color="text.secondary" fontWeight={600}>
            Vista Previa
          </Typography>

          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            {images.map((file, i) => (
              <Paper
                key={`${file.name}-${i}`}
                elevation={3}
                sx={{
                  // ✅ RESPONSIVE: Miniaturas más pequeñas en móvil para que quepan más
                  width: { xs: 100, sm: 120 }, 
                  height: { xs: 100, sm: 120 },
                  borderRadius: 2,
                  overflow: 'hidden',
                  position: 'relative',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Box
                  component="img"
                  src={URL.createObjectURL(file)}
                  alt="preview"
                  sx={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      transition: '0.3s',
                      '&:hover': { transform: 'scale(1.05)' }
                  }}
                />

                {/* Botón Eliminar */}
                <IconButton
                  size="small"
                  onClick={() => removeImage(i)}
                  disabled={disabled}
                  sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    bgcolor: 'rgba(0,0,0,0.6)',
                    color: 'white',
                    padding: 0.5,
                    '&:hover': { bgcolor: 'error.main' },
                  }}
                >
                  <DeleteIcon sx={{ fontSize: 16 }} />
                </IconButton>

                {/* Etiqueta de tamaño */}
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        bgcolor: 'rgba(0,0,0,0.6)',
                        color: 'white',
                        fontSize: '0.65rem',
                        textAlign: 'center',
                        py: 0.5
                    }}
                >
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                </Box>
              </Paper>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
};

export default ImageUploadZone;