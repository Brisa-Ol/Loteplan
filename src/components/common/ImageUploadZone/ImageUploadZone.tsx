// src/components/common/ImageUploadZone/ImageUploadZone.tsx
import React, { useState, useCallback } from 'react';
import {
  Box, Typography, IconButton, Paper, Stack, Alert, Chip
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon
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
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ 1. Envolvemos validateFile en useCallback
  const validateFile = useCallback((file: File): boolean => {
    if (!file.type.startsWith('image/')) {
      setError(`El archivo "${file.name}" no es una imagen válida.`);
      return false;
    }

    if (file.size / 1024 / 1024 > maxSizeMB) {
      setError(`"${file.name}" excede los ${maxSizeMB}MB.`);
      return false;
    }

    return true;
  }, [maxSizeMB]); // Solo cambia si cambia el límite de tamaño

  // ✅ 2. Ahora podemos incluir validateFile en las dependencias de handleFiles
  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || disabled) return;

      setError(null);

      const newFiles = Array.from(fileList);

      if (images.length + newFiles.length > maxFiles) {
        setError(`Máximo permitido: ${maxFiles} imágenes.`);
        return;
      }

      const filtered = newFiles.filter(validateFile);

      if (filtered.length > 0) {
        onChange([...images, ...filtered]);
      }
    },
    [images, onChange, disabled, maxFiles, validateFile] // validateFile agregado aquí
  );

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;

    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setDragActive(false);

    handleFiles(e.dataTransfer.files);
  };

  const removeImage = (i: number) => {
    onChange(images.filter((_, index) => index !== i));
  };

  return (
    <Box>
      <Paper
        variant="outlined"
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        sx={{
          p: 3,
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          backgroundColor: dragActive ? 'action.hover' : 'background.paper',
          border: '2px dashed',
          borderColor: dragActive ? 'primary.main' : 'divider',
          opacity: disabled ? 0.6 : 1,
          transition: '0.3s',
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

        <label htmlFor="image-upload-input" style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}>
          <Stack spacing={2} alignItems="center">
            <UploadIcon sx={{ fontSize: 48, color: dragActive ? 'primary.main' : 'action.active' }} />

            <Typography fontWeight={500}>
              {dragActive ? '¡Soltá las imágenes!' : 'Arrastrá imágenes o hacé click'}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              Máx {maxFiles} imágenes • {maxSizeMB}MB c/u
            </Typography>

            <Chip
              label={`${images.length}/${maxFiles} cargadas`}
              size="small"
              color={images.length > 0 ? 'primary' : 'default'}
            />
          </Stack>
        </label>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {images.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Vista previa
          </Typography>

          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            {images.map((file, i) => (
              <Paper
                key={`${file.name}-${i}`} // Mejor key para evitar warnings de renderizado
                elevation={2}
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: 2,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <Box
                  component="img"
                  src={URL.createObjectURL(file)}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />

                <IconButton
                  size="small"
                  onClick={() => removeImage(i)}
                  disabled={disabled}
                  sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    bgcolor: 'error.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'error.dark' },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>

                <Chip
                  label={`${(file.size / 1024 / 1024).toFixed(2)}MB`}
                  size="small"
                  sx={{
                    position: 'absolute',
                    bottom: 4,
                    left: 4,
                    bgcolor: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    fontSize: '0.65rem'
                  }}
                />
              </Paper>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
};

export default ImageUploadZone;