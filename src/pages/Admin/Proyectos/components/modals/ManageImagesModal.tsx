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
  CloudUpload as UploadIcon
} from '@mui/icons-material';

import imagenService from '../../../../../Services/imagen.service';
import { QueryHandler } from '../../../../../components/common/QueryHandler/QueryHandler';
import ImageUploadZone from '../../../../../components/common/ImageUploadZone/ImageUploadZone';
import type { CreateImagenDto, ImagenDto } from '../../../../../types/dto/imagen.dto';
import type { ProyectoDto } from '../../../../../types/dto/proyecto.dto';

// Constante para validación
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

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
  const theme = useTheme(); // Hook para acceder a tus variables (colores, espaciado)
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
      queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
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
        // El tema ya define borderRadius para MuiPaper, pero Dialog a veces necesita refuerzo
        PaperProps={{ 
            elevation: 0,
            sx: { 
                borderRadius: 3, // Usamos un radio un poco más amplio para el modal (24px aprox)
                boxShadow: theme.shadows[10],
                overflow: 'hidden'
            } 
        }}
    >
      {/* HEADER: Fondo sutil con el color primario */}
      <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          py: 2.5, px: 3,
          bgcolor: alpha(theme.palette.primary.main, 0.04), // Naranja muy suave
          borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar 
            variant="rounded" 
            sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.1), 
                color: theme.palette.primary.main,
                width: 40, height: 40
            }}
          >
            <GalleryIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" color="text.primary">
              Galería de Imágenes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Proyecto: <Box component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>{proyecto.nombre_proyecto}</Box>
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={handleCloseModal} size="small" disabled={isUploading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        <Stack spacing={0}>
            
            {/* SECCIÓN 1: IMÁGENES EXISTENTES */}
            <Box sx={{ p: 3, bgcolor: 'background.default' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 0.5 }}>
                        IMÁGENES ACTUALES ({imagenes.length})
                    </Typography>
                </Stack>
                
                <QueryHandler isLoading={isLoading} error={error as Error | null}>
                    {imagenes.length === 0 ? (
                        <Alert severity="info" variant="outlined" sx={{ bgcolor: 'background.paper' }}>
                            La galería está vacía. Sube imágenes para destacar este proyecto.
                        </Alert>
                    ) : (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                            {imagenes.map((img) => (
                                <Box 
                                    key={img.id}
                                    sx={{
                                        width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.33% - 11px)' },
                                        position: 'relative',
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                        bgcolor: 'background.paper',
                                        boxShadow: theme.shadows[1],
                                        border: `1px solid ${theme.palette.divider}`,
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        '&:hover': { 
                                            boxShadow: theme.shadows[8],
                                            borderColor: theme.palette.primary.main,
                                            transform: 'translateY(-4px)'
                                        }
                                    }}
                                >
                                    {/* Imagen */}
                                    <Box 
                                        component="img"
                                        src={resolveUrl(img.url)}
                                        alt="Preview"
                                        sx={{ 
                                            width: '100%', 
                                            height: 160, 
                                            objectFit: 'cover',
                                            display: 'block',
                                            bgcolor: 'grey.100'
                                        }}
                                    />
                                    
                                    {/* Footer de la tarjeta */}
                                    <Stack 
                                        direction="row" 
                                        justifyContent="space-between" 
                                        alignItems="center" 
                                        sx={{ 
                                            p: 1.5, 
                                            borderTop: `1px solid ${theme.palette.divider}`,
                                            bgcolor: 'background.paper'
                                        }}
                                    >
                                        <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: '75%' }}>
                                            {img.descripcion || `ID: ${img.id}`}
                                        </Typography>
                                        
                                        <Tooltip title="Eliminar imagen">
                                            <IconButton 
                                                size="small" 
                                                onClick={() => handleDeleteClick(img.id)}
                                                disabled={deletingImageId === img.id || isUploading}
                                                sx={{ 
                                                    color: 'text.disabled',
                                                    '&:hover': { 
                                                        color: 'error.main',
                                                        bgcolor: alpha(theme.palette.error.main, 0.1) 
                                                    } 
                                                }}
                                            >
                                                {deletingImageId === img.id ? <CircularProgress size={16} /> : <DeleteIcon fontSize="small" />}
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
            <Box sx={{ p: 3, bgcolor: 'background.paper' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 0.5, mb: 2 }}>
                    AÑADIR NUEVAS IMÁGENES
                </Typography>
                
                {/* El contenedor de subida ahora usa el borde primario discontinuo 
                   para llamar la atención como zona de acción 
                */}
                <Paper 
                    elevation={0} 
                    sx={{ 
                        p: 0, 
                        border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`, 
                        borderRadius: 3,
                        bgcolor: alpha(theme.palette.primary.main, 0.01),
                        overflow: 'hidden',
                        transition: 'border-color 0.2s',
                        '&:hover': {
                           borderColor: theme.palette.primary.main 
                        }
                    }}
                >
                    <Box sx={{ p: 3 }}>
                        <ImageUploadZone
                            images={stagedFiles}
                            onChange={handleFilesChange}
                            maxFiles={10}
                            disabled={isUploading}
                        />
                    </Box>

                    {/* Barra de Progreso y Footer de subida */}
                    {(stagedFiles.length > 0 || isUploading) && (
                        <Box sx={{ 
                            p: 2, 
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                            borderTop: `1px dashed ${alpha(theme.palette.primary.main, 0.3)}`
                        }}>
                             {isUploading && uploadProgress && (
                                <Box sx={{ mb: 2 }}>
                                    <Stack direction="row" justifyContent="space-between" mb={0.5}>
                                        <Typography variant="caption" color="primary.main" fontWeight={600}>
                                            Subiendo...
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

                            <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2}>
                                {uploadError && (
                                    <Typography variant="caption" color="error" fontWeight={600}>
                                        ⚠️ {uploadError}
                                    </Typography>
                                )}
                                
                                {/* NOTA: No es necesario pasar estilos manuales al botón 'contained', 
                                    el theme/index.ts ya maneja el color naranja, el shadow y el padding.
                                */}
                                <Button
                                    variant="contained"
                                    onClick={handleUploadSubmit}
                                    disabled={stagedFiles.length === 0 || isUploading}
                                    startIcon={isUploading ? <CircularProgress size={16} color="inherit" /> : <UploadIcon />}
                                >
                                    {isUploading ? 'Procesando...' : `Subir ${stagedFiles.length > 0 ? `(${stagedFiles.length})` : ''}`}
                                </Button>
                            </Stack>
                        </Box>
                    )}
                </Paper>
            </Box>

        </Stack>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button onClick={handleCloseModal} color="inherit" disabled={isUploading}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ManageImagesModal;