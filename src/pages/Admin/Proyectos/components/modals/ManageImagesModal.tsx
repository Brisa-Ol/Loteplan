// src/components/Admin/Proyectos/Components/modals/ManageImagesModal.tsx

import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  CircularProgress, Typography, IconButton, Tooltip, Paper, Divider, Alert, Box,
  Stack, useTheme, alpha, Avatar, LinearProgress
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Delete as DeleteIcon, 
  Collections as GalleryIcon,
  Close as CloseIcon,
  CloudUpload as UploadIcon,
  Image as ImageIcon
} from '@mui/icons-material';

import imagenService from '../../../../../Services/imagen.service';
import { QueryHandler } from '../../../../../components/common/QueryHandler/QueryHandler';
import ImageUploadZone from '../../../../../components/common/ImageUploadZone/ImageUploadZone';
import type { CreateImagenDto, ImagenDto } from '../../../../../types/dto/imagen.dto';
import type { ProyectoDto } from '../../../../../types/dto/proyecto.dto';

// Constante para validación
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

// ✅ INTERFAZ CORRECTA: Debe incluir open y onClose
interface ManageImagesModalProps {
  open: boolean;
  onClose: () => void;
  proyecto: ProyectoDto;
}

const getQueryKey = (proyectoId: number) => ['projectImages', proyectoId];

const ManageImagesModal: React.FC<ManageImagesModalProps> = ({
  open,
  onClose,
  proyecto
}) => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const queryKey = getQueryKey(proyecto.id);

  // 📦 ESTADO LOCAL
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{current: number, total: number} | null>(null);

  // 📥 QUERY
  const { data: imagenes = [], isLoading, error } = useQuery<ImagenDto[], Error>({
    queryKey: queryKey,
    queryFn: async () => {
      const response = await imagenService.getAllByProyecto(proyecto.id);
      return response.data;
    },
    enabled: open,
  });

  // 🗑️ MUTATION: Eliminar
  const deleteMutation = useMutation({
    mutationFn: (imagenId: number) => imagenService.softDelete(imagenId),
    onMutate: (imagenId) => { setDeletingImageId(imagenId); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey });
      queryClient.invalidateQueries({ queryKey: ['adminProyectos'] }); // Actualizar avatar en tabla principal
      setDeletingImageId(null);
    },
    onError: (err: any) => {
      console.error("Error al borrar", err);
      setDeletingImageId(null);
      setUploadError(err.response?.data?.error || 'Error al eliminar la imagen.');
    }
  });

  // 📤 MUTATION: Subir
  const uploadMutation = useMutation({
    mutationFn: async (formData: { file: File, descripcion: string }) => {
      const imagenData: CreateImagenDto = {
        file: formData.file,
        descripcion: formData.descripcion,
        id_proyecto: proyecto.id,
        id_lote: null,
      };
      return imagenService.create(imagenData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey });
      queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
    },
    onError: (err: any) => {
       const msg = err.response?.data?.message || err.response?.data?.error || 'Error al subir una imagen.';
       throw new Error(msg); 
    }
  });

  // 🎬 HANDLERS
  const handleFilesChange = (files: File[]) => {
    setUploadError(null);
    const validFiles: File[] = [];
    let errorFound = false;

    files.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(`El archivo "${file.name}" excede 15MB.`);
        errorFound = true;
      } else {
        validFiles.push(file);
      }
    });

    if (errorFound && validFiles.length > 0) {
        setTimeout(() => setUploadError('Se filtraron archivos que excedían 15MB.'), 2000);
    }
    setStagedFiles(validFiles);
  };

  const handleDeleteClick = (imagenId: number) => {
    if (window.confirm('¿Eliminar esta imagen de la galería?')) {
      deleteMutation.mutate(imagenId);
    }
  };

  const handleUploadSubmit = async () => {
    if (stagedFiles.length === 0) return;
    setUploadError(null);
    setUploadProgress({ current: 0, total: stagedFiles.length });
    
    const filesToUpload = [...stagedFiles];
    const failedFiles: File[] = [];

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      try {
        await uploadMutation.mutateAsync({
          file: file,
          descripcion: file.name || `Imagen ${i + 1} de ${proyecto.nombre_proyecto}`
        });
        setUploadProgress(prev => prev ? { ...prev, current: prev.current + 1 } : null);
      } catch (err: any) {
        console.error(`Fallo al subir ${file.name}`, err);
        failedFiles.push(file);
        setUploadError(err.message || `Error al subir ${file.name}`);
      }
    }
    
    setUploadProgress(null);
    setStagedFiles(failedFiles);
  };
  
  const handleCloseModal = () => {
    setStagedFiles([]);
    setUploadError(null);
    setDeletingImageId(null);
    setUploadProgress(null);
    onClose();
  };

  useEffect(() => {
    if (!open) handleCloseModal();
  }, [open]);

  const resolveUrl = (url: string) => imagenService.resolveImageUrl(url);
  const isUploading = uploadMutation.isPending || uploadProgress !== null;

  return (
    <Dialog 
        open={open} 
        onClose={handleCloseModal} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, boxShadow: theme.shadows[10] } }}
    >
      {/* HEADER ESTILIZADO */}
      <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          pb: 2, pt: 3, px: 3,
          bgcolor: alpha(theme.palette.primary.main, 0.04)
      }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
            <GalleryIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ lineHeight: 1.2 }}>
              Galería de Imágenes
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Proyecto: <strong>{proyecto.nombre_proyecto}</strong>
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={handleCloseModal} size="small" disabled={isUploading} sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Divider />

      <DialogContent sx={{ p: 4 }}>
        <Stack spacing={4}>
            
            {/* SECCIÓN 1: IMÁGENES EXISTENTES */}
            <Box>
                <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', mb: 2 }}>
                    IMÁGENES ACTUALES ({imagenes.length})
                </Typography>
                
                <QueryHandler isLoading={isLoading} error={error as Error | null}>
                    {imagenes.length === 0 ? (
                        <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
                            La galería está vacía. Sube imágenes para destacar este proyecto.
                        </Alert>
                    ) : (
                        // Grid Layout Personalizado con Flexbox (Sin usar componente Grid)
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                            {imagenes.map((img) => (
                                <Box 
                                    key={img.id}
                                    sx={{
                                        width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.33% - 11px)' },
                                        position: 'relative',
                                        borderRadius: 2,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        overflow: 'hidden',
                                        bgcolor: 'background.paper',
                                        transition: 'box-shadow 0.2s',
                                        '&:hover': { boxShadow: theme.shadows[3] }
                                    }}
                                >
                                    {/* Imagen */}
                                    <Box 
                                        component="img"
                                        src={resolveUrl(img.url)}
                                        alt="Preview"
                                        sx={{ 
                                            width: '100%', 
                                            height: 140, 
                                            objectFit: 'cover',
                                            display: 'block' 
                                        }}
                                    />
                                    
                                    {/* Footer de la tarjeta */}
                                    <Stack 
                                        direction="row" 
                                        justifyContent="space-between" 
                                        alignItems="center" 
                                        sx={{ p: 1, bgcolor: alpha(theme.palette.background.default, 0.5) }}
                                    >
                                        <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: '70%' }}>
                                            {img.descripcion || `ID: ${img.id}`}
                                        </Typography>
                                        
                                        <Tooltip title="Eliminar">
                                            <IconButton 
                                                size="small" 
                                                color="error"
                                                onClick={() => handleDeleteClick(img.id)}
                                                disabled={deletingImageId === img.id || isUploading}
                                                sx={{ 
                                                    bgcolor: alpha(theme.palette.error.main, 0.1), 
                                                    '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) } 
                                                }}
                                            >
                                                {deletingImageId === img.id ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon fontSize="small" />}
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                </Box>
                            ))}
                        </Box>
                    )}
                </QueryHandler>
            </Box>

            <Divider />

            {/* SECCIÓN 2: ZONA DE SUBIDA */}
            <Box>
                <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', mb: 2 }}>
                    AÑADIR NUEVAS IMÁGENES
                </Typography>
                
                <Paper 
                    elevation={0} 
                    sx={{ 
                        p: 3, 
                        border: `1px dashed ${theme.palette.divider}`, 
                        borderRadius: 3,
                        bgcolor: alpha(theme.palette.primary.main, 0.02) 
                    }}
                >
                    <ImageUploadZone
                        images={stagedFiles}
                        onChange={handleFilesChange}
                        maxFiles={10}
                        disabled={isUploading}
                    />
                    
                    {/* Barra de Progreso */}
                    {isUploading && uploadProgress && (
                        <Box sx={{ mt: 2 }}>
                            <Stack direction="row" justifyContent="space-between" mb={0.5}>
                                <Typography variant="caption" color="primary.main" fontWeight={600}>
                                    Subiendo imágenes...
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {uploadProgress.current} / {uploadProgress.total}
                                </Typography>
                            </Stack>
                            <LinearProgress 
                                variant="determinate" 
                                value={(uploadProgress.current / uploadProgress.total) * 100} 
                                sx={{ borderRadius: 1, height: 6 }}
                            />
                        </Box>
                    )}

                    {/* Botón de Acción */}
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2, alignItems: 'center' }}>
                        {uploadError && (
                            <Typography variant="caption" color="error" fontWeight={600} sx={{ mr: 'auto' }}>
                                ⚠️ {uploadError}
                            </Typography>
                        )}
                        
                        <Button
                            variant="contained"
                            onClick={handleUploadSubmit}
                            disabled={stagedFiles.length === 0 || isUploading}
                            startIcon={isUploading ? <CircularProgress size={16} color="inherit" /> : <UploadIcon />}
                            sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}
                        >
                            {isUploading ? 'Procesando...' : `Subir ${stagedFiles.length > 0 ? stagedFiles.length : ''} Imágenes`}
                        </Button>
                    </Box>
                </Paper>
            </Box>

        </Stack>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
        <Button onClick={handleCloseModal} color="inherit" disabled={isUploading} sx={{ borderRadius: 2 }}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ManageImagesModal;