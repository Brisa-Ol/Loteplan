import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  CloudUpload as UploadIcon
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

// 1. Props compartidas entre ambos modos
interface BaseUploadProps {
  maxSizeMB?: number;
  disabled?: boolean;
  accept?: string;
  label?: string;
  helperText?: string;
}

// 2. Props para modo ÚNICO
interface SingleUploadProps extends BaseUploadProps {
  multiple?: false;
  image?: File | null;
  existingImageUrl?: string;
  onChange: (file: File | null) => void;
}

// 3. Props para modo MÚLTIPLE
interface MultipleUploadProps extends BaseUploadProps {
  multiple: true;
  images?: File[];
  maxFiles?: number;
  onChange: (files: File[]) => void;
}

// 4. Tipo unificado
type ImageUploadProps = SingleUploadProps | MultipleUploadProps;

const ImageUploadZone: React.FC<ImageUploadProps> = (props) => {
  const {
    multiple = false,
    maxSizeMB = 15,
    disabled = false,
    accept = 'image/*',
    label,
    helperText,
    onChange
  } = props;

  const theme = useTheme();
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Castings internos para simplificar la lógica de renderizado
  const image = !multiple ? (props as SingleUploadProps).image : null;
  const images = multiple ? (props as MultipleUploadProps).images || [] : [];
  const existingImageUrl = !multiple ? (props as SingleUploadProps).existingImageUrl : undefined;
  const maxFiles = multiple ? (props as MultipleUploadProps).maxFiles || 5 : 1;

  const acceptsVideo = accept.includes('video');
  const acceptsImage = accept.includes('image');

  // Preview para modo Single
  const singleDisplayImage = useMemo(() => {
    if (!multiple && image) return URL.createObjectURL(image);
    return existingImageUrl || null;
  }, [multiple, image, existingImageUrl]);

  useEffect(() => {
    return () => {
      if (singleDisplayImage?.startsWith('blob:')) {
        URL.revokeObjectURL(singleDisplayImage);
      }
    };
  }, [singleDisplayImage]);

  const validateFile = useCallback((file: File): boolean => {
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if ((acceptsVideo && isVideo) || (acceptsImage && isImage)) {
      if (file.size / (1024 * 1024) > maxSizeMB) {
        setError(`"${file.name}" excede los ${maxSizeMB}MB.`);
        return false;
      }
      return true;
    }
    setError(`"${file.name}" no es un formato válido.`);
    return false;
  }, [maxSizeMB, acceptsVideo, acceptsImage]);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || disabled) return;
      setError(null);

      if (multiple) {
        const newFiles = Array.from(fileList);
        if (images.length + newFiles.length > maxFiles) {
          setError(`Máximo ${maxFiles} archivos.`);
          return;
        }
        const validated = newFiles.filter(validateFile);
        if (validated.length > 0) {
          // Casteamos el onChange para que TS sepa que estamos en modo múltiple
          (onChange as (f: File[]) => void)([...images, ...validated]);
        }
      } else {
        const file = fileList[0];
        if (file && validateFile(file)) {
          // Casteamos el onChange para modo single
          (onChange as (f: File | null) => void)(file);
        }
      }
    },
    [multiple, images, onChange, disabled, maxFiles, validateFile]
  );

  const handleRemove = (indexToRemove?: number) => {
    if (multiple && typeof indexToRemove === 'number') {
      (onChange as (f: File[]) => void)(images.filter((_, i) => i !== indexToRemove));
    } else {
      (onChange as (f: File | null) => void)(null);
    }
    setError(null);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!disabled) setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, [disabled]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (!disabled) handleFiles(e.dataTransfer.files);
  }, [handleFiles, disabled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = '';
  };

  return (
    <Box>
      {!multiple && singleDisplayImage ? (
        <Paper elevation={3} sx={{ position: 'relative', width: '100%', height: 300, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, bgcolor: 'black', overflow: 'hidden' }}>
          <Box component="img" src={singleDisplayImage} sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, p: 1, background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)', display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <input type="file" accept={accept} onChange={handleChange} disabled={disabled} style={{ display: 'none' }} id="image-replace-input" />
            <label htmlFor="image-replace-input">
              <Tooltip title="Cambiar">
                <IconButton component="span" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(4px)', '&:hover': { bgcolor: 'primary.main' } }}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </label>
            <Tooltip title="Eliminar">
              <IconButton size="small" onClick={() => handleRemove()} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(4px)', '&:hover': { bgcolor: 'error.main' } }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>
      ) : (
        <Paper
          variant="outlined" onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
          sx={{
            p: 4, textAlign: 'center', cursor: disabled ? 'not-allowed' : 'pointer', borderRadius: 3, borderStyle: 'dashed', borderWidth: 2,
            borderColor: dragActive ? 'primary.main' : 'divider', bgcolor: dragActive ? alpha(theme.palette.primary.main, 0.05) : 'background.paper',
            '&:hover': !disabled ? { borderColor: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.02) } : {}
          }}
        >
          <input type="file" accept={accept} multiple={multiple} onChange={handleChange} disabled={disabled} style={{ display: 'none' }} id="image-upload-input" />
          <label htmlFor="image-upload-input" style={{ cursor: 'inherit', width: '100%', display: 'block' }}>
            <Stack spacing={2} alignItems="center">
              <Box sx={{ p: 2, borderRadius: '50%', bgcolor: dragActive ? 'primary.main' : 'action.hover', color: dragActive ? 'white' : 'text.secondary' }}>
                <UploadIcon sx={{ fontSize: 32 }} />
              </Box>
              <Box>
                <Typography fontWeight={600}>{label || (multiple ? 'Arrastra varios archivos' : 'Sube una imagen')}</Typography>
                <Typography variant="caption" color="text.secondary">{helperText || `${accept.replace('/*', '')} • Máx ${maxSizeMB}MB`}</Typography>
              </Box>
              {multiple && images.length > 0 && (
                <Chip label={`${images.length} / ${maxFiles} seleccionadas`} size="small" color="primary" variant="outlined" />
              )}
            </Stack>
          </label>
        </Paper>
      )}

      {error && <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {multiple && images.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" fontWeight={600} mb={1}>Vista Previa</Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            {images.map((file, i) => (
              <Paper key={`${file.name}-${i}`} elevation={2} sx={{ width: 100, height: 100, borderRadius: 2, overflow: 'hidden', position: 'relative', border: '1px solid', borderColor: 'divider' }}>
                <Box component="img" src={URL.createObjectURL(file)} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <IconButton size="small" onClick={() => handleRemove(i)} sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(0,0,0,0.5)', color: 'white', padding: 0.5, '&:hover': { bgcolor: 'error.main' } }}>
                  <DeleteIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Paper>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
};

export default ImageUploadZone;