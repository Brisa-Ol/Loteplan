import React, { useCallback, useEffect, useState, useId } from 'react'; // <-- Agregamos useId
import { Delete as DeleteIcon, Edit as EditIcon, CloudUpload as UploadIcon } from '@mui/icons-material';
import { Alert, alpha, Box, Chip, IconButton, Paper, Stack, Tooltip, Typography, useTheme } from '@mui/material';

// --- Tipos ---
interface BaseUploadProps {
    maxSizeMB?: number;
    disabled?: boolean;
    accept?: string;
    label?: string;
    helperText?: string;
}

interface SingleUploadProps extends BaseUploadProps {
    multiple?: false;
    image?: File | null;
    existingImageUrl?: string;
    onChange: (file: File | null) => void;
}

interface MultipleUploadProps extends BaseUploadProps {
    multiple: true;
    images?: File[];
    maxFiles?: number;
    onChange: (files: File[]) => void;
}

type ImageUploadProps = SingleUploadProps | MultipleUploadProps;

// --- Sub-componente para evitar memory leaks en modo múltiple ---
const ImagePreviewItem = ({ file, onRemove }: { file: File; onRemove: () => void }) => {
    const [url, setUrl] = useState<string>('');

    useEffect(() => {
        const objectUrl = URL.createObjectURL(file);
        setUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

    return (
        <Paper elevation={2} sx={{ width: 100, height: 100, borderRadius: 2, overflow: 'hidden', position: 'relative', border: '1px solid', borderColor: 'divider' }}>
            <Box component="img" src={url} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <IconButton
                size="small"
                onClick={onRemove}
                sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(0,0,0,0.5)', color: 'white', padding: 0.5, '&:hover': { bgcolor: 'error.main' } }}
            >
                <DeleteIcon sx={{ fontSize: 14 }} />
            </IconButton>
        </Paper>
    );
};

export const ImageUploadZone: React.FC<ImageUploadProps> = (props) => {
    const { multiple = false, maxSizeMB = 15, disabled = false, accept = 'image/*', label, helperText, onChange } = props;
    const theme = useTheme();
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Generador de ID único para esta instancia
    const uniqueId = useId(); 

    // Variables calculadas según el modo
    const images = multiple ? (props as MultipleUploadProps).images || [] : [];
    const singleImage = !multiple ? (props as SingleUploadProps).image : null;
    const existingImageUrl = !multiple ? (props as SingleUploadProps).existingImageUrl : undefined;
    const maxFiles = multiple ? (props as MultipleUploadProps).maxFiles || 5 : 1;

    // Vista previa para modo único
    const [singlePreview, setSinglePreview] = useState<string | null>(null);

    useEffect(() => {
        if (!multiple && singleImage) {
            const url = URL.createObjectURL(singleImage);
            setSinglePreview(url);
            return () => URL.revokeObjectURL(url);
        }
        setSinglePreview(existingImageUrl || null);
    }, [multiple, singleImage, existingImageUrl]);

    const validateFile = useCallback((file: File): boolean => {
        const isValidFormat = file.type.startsWith('video/') || file.type.startsWith('image/');
        if (!isValidFormat) {
            setError(`"${file.name}" no es un formato válido.`);
            return false;
        }
        if (file.size / (1024 * 1024) > maxSizeMB) {
            setError(`"${file.name}" excede los ${maxSizeMB}MB.`);
            return false;
        }
        return true;
    }, [maxSizeMB]);

    const handleFiles = useCallback((fileList: FileList | null) => {
        if (!fileList || disabled) return;
        setError(null);

        const incomingFiles = Array.from(fileList);

        if (multiple) {
            if (images.length + incomingFiles.length > maxFiles) {
                setError(`Máximo ${maxFiles} archivos.`);
                return;
            }
            const validated = incomingFiles.filter(validateFile);
            if (validated.length > 0) {
                (onChange as (f: File[]) => void)([...images, ...validated]);
            }
        } else {
            const file = incomingFiles[0];
            if (file && validateFile(file)) {
                (onChange as (f: File | null) => void)(file);
            }
        }
    }, [multiple, images, onChange, disabled, maxFiles, validateFile]);

    const handleRemove = (indexToRemove?: number) => {
        if (multiple && typeof indexToRemove === 'number') {
            (onChange as (f: File[]) => void)(images.filter((_, i) => i !== indexToRemove));
        } else {
            (onChange as (f: File | null) => void)(null);
        }
        setError(null);
    };

    const onDragEvent = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (!disabled) setDragActive(e.type === 'dragenter' || e.type === 'dragover');
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        setDragActive(false);
        if (!disabled) handleFiles(e.dataTransfer.files);
    };

    return (
        <Box>
            {!multiple && singlePreview ? (
                <Paper elevation={3} sx={{ position: 'relative', width: '100%', height: 300, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, bgcolor: 'black', overflow: 'hidden' }}>
                    <Box component="img" src={singlePreview} sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, p: 1, background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)', display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        {/* ID dinámico para reemplazar */}
                        <input type="file" accept={accept} onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }} disabled={disabled} style={{ display: 'none' }} id={`${uniqueId}-replace`} />
                        <label htmlFor={`${uniqueId}-replace`}>
                            <Tooltip title="Cambiar"><IconButton component="span" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(4px)', '&:hover': { bgcolor: 'primary.main' } }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                        </label>
                        <Tooltip title="Eliminar"><IconButton size="small" onClick={() => handleRemove()} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(4px)', '&:hover': { bgcolor: 'error.main' } }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                    </Box>
                </Paper>
            ) : (
                <Paper
                    variant="outlined" onDragEnter={onDragEvent} onDragLeave={onDragEvent} onDragOver={onDragEvent} onDrop={onDrop}
                    sx={{
                        p: 4, textAlign: 'center', cursor: disabled ? 'not-allowed' : 'pointer', borderRadius: 3, borderStyle: 'dashed', borderWidth: 2,
                        borderColor: dragActive ? 'primary.main' : 'divider', bgcolor: dragActive ? alpha(theme.palette.primary.main, 0.05) : 'background.paper',
                        '&:hover': !disabled ? { borderColor: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.02) } : {}
                    }}
                >
                    {/* ID dinámico para la subida inicial */}
                    <input type="file" accept={accept} multiple={multiple} onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }} disabled={disabled} style={{ display: 'none' }} id={`${uniqueId}-upload`} />
                    <label htmlFor={`${uniqueId}-upload`} style={{ cursor: 'inherit', width: '100%', display: 'block' }}>
                        <Stack spacing={2} alignItems="center">
                            <Box sx={{ p: 2, borderRadius: '50%', bgcolor: dragActive ? 'primary.main' : 'action.hover', color: dragActive ? 'white' : 'text.secondary' }}><UploadIcon sx={{ fontSize: 32 }} /></Box>
                            <Box>
                                <Typography fontWeight={600}>{label || (multiple ? 'Arrastra varios archivos' : 'Sube una imagen')}</Typography>
                                <Typography variant="caption" color="text.secondary">{helperText || `${accept} • Máx ${maxSizeMB}MB`}</Typography>
                            </Box>
                            {multiple && images.length > 0 && <Chip label={`${images.length} / ${maxFiles} seleccionadas`} size="small" color="primary" variant="outlined" />}
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
                            <ImagePreviewItem key={`${file.name}-${i}`} file={file} onRemove={() => handleRemove(i)} />
                        ))}
                    </Stack>
                </Box>
            )}
        </Box>
    );
};

export default ImageUploadZone;