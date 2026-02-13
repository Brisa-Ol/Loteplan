// src/components/common/ImageUpload/ImageUpload.tsx

import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Image as ImageIcon,
  CloudUpload as UploadIcon,
  VideoLibrary as VideoIcon
} from '@mui/icons-material';
import {
  Alert,
  alpha,
  Box,
  Chip,
  IconButton, Paper, Stack,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

interface ImageUploadProps {
  // Modo múltiple o único
  multiple?: boolean;

  // Para modo único (single)
  image?: File | null;
  existingImageUrl?: string; // Imagen existente del backend

  // Para modo múltiple (multiple)
  images?: File[];

  // Callback unificado
  onChange: (files: File | File[] | null) => void;

  // Configuración
  maxFiles?: number;
  maxSizeMB?: number;
  disabled?: boolean;
  accept?: string; // 'image/*' | 'video/*' | 'image/*,video/*'

  // UI
  label?: string;
  helperText?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  multiple = false,
  image = null,
  existingImageUrl,
  images = [],
  onChange,
  maxFiles = 5,
  maxSizeMB = 15,
  disabled = false,
  accept = 'image/*',
  label,
  helperText,
}) => {
  const theme = useTheme();
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determinar si estamos en modo video
  const acceptsVideo = accept.includes('video');
  const acceptsImage = accept.includes('image');

  // Para modo single: generar URL de preview
  const singleDisplayImage = useMemo(() => {
    if (!multiple && image) return URL.createObjectURL(image);
    return existingImageUrl || null;
  }, [multiple, image, existingImageUrl]);

  // Cleanup de URLs object
  useEffect(() => {
    return () => {
      if (!multiple && image && singleDisplayImage?.startsWith('blob:')) {
        URL.revokeObjectURL(singleDisplayImage);
      }
    };
  }, [multiple, image, singleDisplayImage]);

  // Validación unificada
  const validateFile = useCallback((file: File): boolean => {
    // Validar tipo
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (acceptsVideo && isVideo) {
      // OK, es video y aceptamos video
    } else if (acceptsImage && isImage) {
      // OK, es imagen y aceptamos imagen
    } else {
      setError(`"${file.name}" no es un formato válido.`);
      return false;
    }

    // Validar tamaño
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      setError(`"${file.name}" excede los ${maxSizeMB}MB permitidos.`);
      return false;
    }

    return true;
  }, [maxSizeMB, acceptsVideo, acceptsImage]);

  // Procesamiento de archivos
  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || disabled) return;
      setError(null);

      if (multiple) {
        // MODO MÚLTIPLE
        const newFiles = Array.from(fileList);

        if (images.length + newFiles.length > maxFiles) {
          setError(`Solo puedes subir un máximo de ${maxFiles} archivos.`);
          return;
        }

        const validated = newFiles.filter(validateFile);
        if (validated.length > 0) {
          onChange([...images, ...validated]);
        }
      } else {
        // MODO ÚNICO
        const file = fileList[0];
        if (file && validateFile(file)) {
          onChange(file);
        }
      }
    },
    [multiple, images, onChange, disabled, maxFiles, validateFile]
  );

  // Drag & Drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, [disabled]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  }, [handleFiles, disabled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = ''; // Reset para permitir re-selección
  };

  // Remover archivo(s)
  const handleRemove = (indexToRemove?: number) => {
    if (multiple && typeof indexToRemove === 'number') {
      onChange(images.filter((_, i) => i !== indexToRemove));
    } else {
      onChange(null);
    }
    setError(null);
  };

  // Determinar texto del helper
  const getHelperText = () => {
    if (helperText) return helperText;

    const formats = [];
    if (acceptsImage) formats.push('JPG, PNG, WEBP');
    if (acceptsVideo) formats.push('MP4, WEBM');

    return `${formats.join(' • ')} • Máx ${maxSizeMB}MB`;
  };

  // Determinar label
  const getLabel = () => {
    if (label) return label;
    if (dragActive) return '¡Suelta los archivos aquí!';
    if (multiple) return 'Haz clic o arrastra archivos';
    return 'Sube una imagen de portada';
  };

  // Estado de "tiene archivos"
  const hasFiles = multiple ? images.length > 0 : !!singleDisplayImage;

  return (
    <Box>
      {/* MODO SINGLE CON PREVIEW */}
      {!multiple && singleDisplayImage ? (
        <Paper
          elevation={3}
          sx={{
            position: 'relative',
            width: '100%',
            height: 300,
            overflow: 'hidden',
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: 'black'
          }}
        >
          <Box
            component="img"
            src={singleDisplayImage}
            alt="Vista previa"
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              opacity: disabled ? 0.7 : 1
            }}
          />

          {/* Overlay de acciones */}
          <Box
            sx={{
              position: 'absolute', top: 0, left: 0, right: 0, p: 1,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)',
              display: 'flex', justifyContent: 'flex-end', gap: 1
            }}
          >
            <input
              type="file"
              accept={accept}
              onChange={handleChange}
              disabled={disabled}
              style={{ display: 'none' }}
              id="image-replace-input"
            />

            <label htmlFor="image-replace-input">
              <Tooltip title="Cambiar archivo">
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
                onClick={() => handleRemove()}
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

          {/* Info del archivo */}
          {image && (
            <Box sx={{ position: 'absolute', bottom: 12, left: 12 }}>
              <Chip
                icon={acceptsVideo ? <VideoIcon sx={{ fontSize: 14, color: 'white !important' }} /> : <ImageIcon sx={{ fontSize: 14, color: 'white !important' }} />}
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
      ) : (
        /* DROPZONE (MODO SINGLE SIN PREVIEW O MODO MULTIPLE) */
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
            accept={accept}
            multiple={multiple}
            onChange={handleChange}
            disabled={disabled}
            style={{ display: 'none' }}
            id="image-upload-input"
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
                  {getLabel()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {getHelperText()}
                </Typography>
              </Box>

              {multiple && images.length > 0 && (
                <Chip
                  label={`${images.length} / ${maxFiles} seleccionadas`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  icon={acceptsVideo ? <VideoIcon fontSize="small" /> : <ImageIcon fontSize="small" />}
                />
              )}
            </Stack>
          </label>
        </Paper>
      )}

      {/* MENSAJES DE ERROR */}
      {error && (
        <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* VISTA PREVIA PARA MODO MÚLTIPLE */}
      {multiple && images.length > 0 && (
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

                <IconButton
                  size="small"
                  onClick={() => handleRemove(i)}
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

export default ImageUpload;