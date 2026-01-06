// src/components/common/SingleImageUpload/SingleImageUpload.tsx
import React, { useState, useCallback, useMemo } from 'react';
import {
  Box, Typography, IconButton, Paper, Stack, Alert, Chip
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';

interface SingleImageUploadProps {
  image: File | null;
  onChange: (file: File | null) => void;
  maxSizeMB?: number;
  disabled?: boolean;
  existingImageUrl?: string;
}

const SingleImageUpload: React.FC<SingleImageUploadProps> = ({
  image,
  onChange,
  maxSizeMB = 15,
  disabled = false,
  existingImageUrl,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayImage = useMemo(() => {
    if (image) return URL.createObjectURL(image);
    return existingImageUrl || null;
  }, [image, existingImageUrl]);

  // ✅ 1. Memorizar validateFile para mantener una referencia estable
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

  // ✅ 2. Agregar validateFile como dependencia de handleFile
  const handleFile = useCallback(
    (file: File | null) => {
      if (!file || disabled) return;

      setError(null);

      if (validateFile(file)) {
        onChange(file);
      }
    },
    [onChange, disabled, validateFile] // validateFile agregado aquí
  );

  const handleDrag = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;

      if (e.type === 'dragenter' || e.type === 'dragover') {
        setDragActive(true);
      } else {
        setDragActive(false);
      }
    },
    [disabled]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (disabled) return;

      const file = e.dataTransfer.files?.[0] || null;
      handleFile(file);
    },
    [handleFile, disabled]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFile(file);
  };

  const handleRemove = () => {
    onChange(null);
    setError(null);
  };

  return (
    <Box>
      {!displayImage ? (
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
            onChange={handleChange}
            disabled={disabled}
            style={{ display: 'none' }}
            id="single-image-upload-input"
          />

          <label htmlFor="single-image-upload-input" style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}>
            <Stack spacing={2} alignItems="center">
              <UploadIcon sx={{ fontSize: 48, color: dragActive ? 'primary.main' : 'action.active' }} />
              <Typography fontWeight={500}>
                {dragActive ? '¡Soltá la imagen!' : 'Arrastrá una imagen o hacé click'}
              </Typography>
              <Typography variant="caption">Máx: {maxSizeMB}MB</Typography>
            </Stack>
          </label>
        </Paper>
      ) : (
        <Paper
          elevation={2}
          sx={{
            position: 'relative',
            width: '100%',
            maxWidth: 400,
            height: 300,
            overflow: 'hidden',
            borderRadius: 2,
            mx: 'auto',
          }}
        >
          <Box
            component="img"
            src={displayImage}
            alt="Vista previa"
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />

          <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleChange}
              disabled={disabled}
              style={{ display: 'none' }}
              id="single-image-replace-input"
            />

            <label htmlFor="single-image-replace-input">
              <IconButton
                size="small"
                disabled={disabled}
                sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </label>

            <IconButton
              size="small"
              onClick={handleRemove}
              disabled={disabled}
              sx={{ bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' } }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>

          {image && (
            <Chip
              label={`${(image.size / 1024 / 1024).toFixed(2)} MB`}
              size="small"
              sx={{
                position: 'absolute',
                bottom: 8,
                left: 8,
                bgcolor: 'rgba(0,0,0,0.7)',
                color: 'white',
              }}
            />
          )}
        </Paper>
      )}

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default SingleImageUpload;