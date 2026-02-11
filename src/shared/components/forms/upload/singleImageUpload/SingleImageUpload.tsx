// src/components/common/SingleImageUpload/SingleImageUpload.tsx

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Box, Typography, IconButton, Paper, Stack, Alert, Chip, useTheme, alpha,
  Tooltip
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Image as ImageIcon
} from '@mui/icons-material';

interface SingleImageUploadProps {
  image: File | null;
  onChange: (file: File | null) => void;
  maxSizeMB?: number;
  disabled?: boolean;
  existingImageUrl?: string; // Para mostrar una imagen que ya viene del backend (edición)
}

const SingleImageUpload: React.FC<SingleImageUploadProps> = ({
  image,
  onChange,
  maxSizeMB = 15,
  disabled = false,
  existingImageUrl,
}) => {
  const theme = useTheme();
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generar URL de previsualización
  const displayImage = useMemo(() => {
    if (image) return URL.createObjectURL(image);
    return existingImageUrl || null;
  }, [image, existingImageUrl]);

  // Limpiar URL object al desmontar para evitar memory leaks
  useEffect(() => {
    return () => {
      if (image && displayImage && displayImage.startsWith('blob:')) {
        URL.revokeObjectURL(displayImage);
      }
    };
  }, [image, displayImage]);

  // Validación
  const validateFile = useCallback((file: File): boolean => {
    if (!file.type.startsWith('image/')) {
      setError(`El archivo "${file.name}" no es una imagen válida.`);
      return false;
    }
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      setError(`La imagen excede los ${maxSizeMB}MB.`);
      return false;
    }
    return true;
  }, [maxSizeMB]);

  // Manejo de archivo
  const handleFile = useCallback((file: File | null) => {
    if (!file || disabled) return;
    setError(null);
    if (validateFile(file)) {
      onChange(file);
    }
  }, [onChange, disabled, validateFile]);

  // Drag & Drop Handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (disabled) return;
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else setDragActive(false);
  }, [disabled]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0] || null;
    handleFile(file);
  }, [handleFile, disabled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFile(file);
    // Reset input value to allow selecting same file again if needed
    e.target.value = '';
  };

  const handleRemove = () => {
    onChange(null);
    setError(null);
  };

  return (
    <Box>
      {!displayImage ? (
        // --- ESTADO VACÍO (DROPZONE) ---
        <Paper
          variant="outlined"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          sx={{
            p: 4,
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
            onChange={handleChange}
            disabled={disabled}
            style={{ display: 'none' }}
            id="single-image-upload-input"
          />

          <label htmlFor="single-image-upload-input" style={{ cursor: disabled ? 'not-allowed' : 'pointer', width: '100%', display: 'block' }}>
            <Stack spacing={2} alignItems="center">
              <Box
                sx={{
                  p: 2, borderRadius: '50%',
                  bgcolor: dragActive ? 'primary.main' : 'action.hover',
                  color: dragActive ? 'white' : 'text.secondary',
                  transition: '0.3s'
                }}
              >
                <UploadIcon sx={{ fontSize: 32 }} />
              </Box>

              <Box>
                <Typography fontWeight={600} variant="body1" color="text.primary">
                  {dragActive ? '¡Suelta la imagen aquí!' : 'Sube una imagen de portada'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  JPG, PNG, WEBP • Máx {maxSizeMB}MB
                </Typography>
              </Box>
            </Stack>
          </label>
        </Paper>
      ) : (
        // --- ESTADO CON IMAGEN (PREVIEW) ---
        <Paper
          elevation={3}
          sx={{
            position: 'relative',
            width: '100%',
            height: 300, // Altura fija o responsive según necesidad
            overflow: 'hidden',
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: 'black' // Fondo negro para imágenes con transparencia o distinto ratio
          }}
        >
          <Box
            component="img"
            src={displayImage}
            alt="Vista previa"
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'contain', // 'cover' si quieres llenar todo el espacio
              opacity: disabled ? 0.7 : 1
            }}
          />

          {/* Overlay de acciones (visible siempre o en hover) */}
          <Box
            sx={{
              position: 'absolute', top: 0, left: 0, right: 0, p: 1,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)',
              display: 'flex', justifyContent: 'flex-end', gap: 1
            }}
          >
            {/* Input oculto para "Editar/Reemplazar" */}
            <input
              type="file"
              accept="image/*"
              onChange={handleChange}
              disabled={disabled}
              style={{ display: 'none' }}
              id="single-image-replace-input"
            />

            <label htmlFor="single-image-replace-input">
              <Tooltip title="Cambiar imagen">
                <IconButton
                  component="span"
                  size="small"
                  disabled={disabled}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)', color: 'white',
                    backdropFilter: 'blur(4px)',
                    '&:hover': { bgcolor: 'primary.main' }
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </label>

            <Tooltip title="Eliminar">
              <IconButton
                size="small"
                onClick={handleRemove}
                disabled={disabled}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)', color: 'white',
                  backdropFilter: 'blur(4px)',
                  '&:hover': { bgcolor: 'error.main' }
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Chip con información del archivo nuevo */}
          {image && (
            <Box sx={{ position: 'absolute', bottom: 12, left: 12 }}>
              <Chip
                icon={<ImageIcon sx={{ fontSize: 14, color: 'white !important' }} />}
                label={`${(image.size / 1024 / 1024).toFixed(2)} MB`}
                size="small"
                sx={{
                  bgcolor: 'rgba(0,0,0,0.6)', color: 'white',
                  backdropFilter: 'blur(4px)', fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              />
            </Box>
          )}
        </Paper>
      )}

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mt: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default SingleImageUpload;