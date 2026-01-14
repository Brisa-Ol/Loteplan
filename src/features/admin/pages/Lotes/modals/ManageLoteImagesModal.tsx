// src/pages/Admin/Inventario/modals/ManageLoteImagesModal.tsx

import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Collections as GalleryIcon,
  CloudUpload as UploadIcon
} from '@mui/icons-material';
import {
  Alert,
  alpha, Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress, Paper,
  Stack,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useEffect, useState } from 'react';
import type { LoteDto } from '../../../../../core/types/dto/lote.dto';
import useSnackbar from '../../../../../shared/hooks/useSnackbar';
import imagenService from '../../../../../core/api/services/imagen.service';
import type { CreateImagenDto, ImagenDto } from '../../../../../core/types/dto/imagen.dto';
import { env } from '../../../../../core/config/env';
import { QueryHandler } from '../../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import ImageUploadZone from '../../../../../shared/components/forms/upload/ImageUploadZone/ImageUploadZone';



interface ManageLoteImagesModalProps {
  open: boolean;
  onClose: () => void;
  lote: LoteDto;
}

const ManageLoteImagesModal: React.FC<ManageLoteImagesModalProps> = ({
  open,
  onClose,
  lote
}) => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useSnackbar(); 
  
  const queryKey = ['loteImages', lote.id];

  // 📦 ESTADO LOCAL
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ current: number, total: number } | null>(null);

  // 📥 QUERY
  const { data: imagenes = [], isLoading, error } = useQuery<ImagenDto[], Error>({
    queryKey: queryKey,
    queryFn: async () => {
      const response = await imagenService.getAllByLote(lote.id);
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
      setDeletingImageId(null);
      showSuccess('Imagen eliminada correctamente');
    },
    onError: (err: any) => {
      setDeletingImageId(null);
      const msg = err.response?.data?.error || 'Error al eliminar la imagen.';
      showError(msg);
    }
  });

  // 📤 MUTATION: Subir
  const uploadMutation = useMutation({
    mutationFn: async (formData: { file: File, descripcion: string }) => {
      const imagenData: CreateImagenDto = {
        file: formData.file,
        descripcion: formData.descripcion,
        id_proyecto: null,
        id_lote: lote.id,
      };
      return imagenService.create(imagenData);
    },
  });

  // 🎬 HANDLERS
  const handleFilesChange = (files: File[]) => {
    const validFiles: File[] = [];

    files.forEach(file => {
      if (file.size > env.maxFileSize) {
        showError(`El archivo "${file.name}" excede el límite permitido.`);
      } else {
        validFiles.push(file);
      }
    });

    setStagedFiles(validFiles);
  };

  const handleDeleteClick = (imagenId: number) => {
    if (window.confirm('¿Eliminar esta imagen de la galería del lote?')) {
      deleteMutation.mutate(imagenId);
    }
  };

  const handleUploadSubmit = async () => {
    if (stagedFiles.length === 0) return;
    
    setUploadProgress({ current: 0, total: stagedFiles.length });

    const filesToUpload = [...stagedFiles];
    const failedFiles: File[] = [];
    let successCount = 0;

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      try {
        await uploadMutation.mutateAsync({
          file: file,
          descripcion: file.name || `Lote ${lote.id} - ${i + 1}`
        });
        successCount++;
        setUploadProgress(prev => prev ? { ...prev, current: prev.current + 1 } : null);
      } catch (err: any) {
        console.error(`Fallo al subir ${file.name}`, err);
        failedFiles.push(file);
      }
    }

    queryClient.invalidateQueries({ queryKey: queryKey });
    
    setUploadProgress(null);
    setStagedFiles(failedFiles);

    if (failedFiles.length > 0) {
        showError(`Hubo errores al subir ${failedFiles.length} archivos.`);
    } else {
        showSuccess(`¡${successCount} imágenes subidas correctamente!`);
    }
  };

  const handleCloseModal = useCallback(() => {
    setStagedFiles([]);
    setDeletingImageId(null);
    setUploadProgress(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
     if (!open) {
         setStagedFiles([]);
         setUploadProgress(null);
     }
  }, [open]);

  const resolveUrl = (url: string) => imagenService.resolveImageUrl(url);
  const isUploading = uploadMutation.isPending || uploadProgress !== null;

  return (
    <Dialog
      open={open}
      onClose={handleCloseModal}
      maxWidth="md"
      fullWidth
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: 3,
          boxShadow: theme.shadows[10],
          overflow: 'hidden'
        }
      }}
    >
      {/* HEADER */}
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 2.5, px: 3,
        bgcolor: alpha(theme.palette.primary.main, 0.04),
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
              Galería del Lote
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Lote: <Box component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>{lote.nombre_lote}</Box> (#{lote.id})
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
          <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: 200 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 0.5 }}>
                IMÁGENES ACTUALES ({imagenes.length})
              </Typography>
            </Stack>

            <QueryHandler isLoading={isLoading} error={error as Error | null}>
              {imagenes.length === 0 ? (
                <Alert severity="info" variant="outlined" sx={{ bgcolor: 'background.paper' }}>
                  Este lote no tiene imágenes. Sube fotos para mostrarlo en la web.
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
                            {/* ✅ CORREGIDO AQUÍ: Se eliminó el texto "[Image of...]" */}
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
              AÑADIR NUEVAS FOTOS
            </Typography>

            <Paper
              elevation={0}
              sx={{
                p: 0,
                border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.primary.main, 0.01),
                overflow: 'hidden',
                transition: 'border-color 0.2s',
                '&:hover': { borderColor: theme.palette.primary.main }
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
                    <Button
                      variant="contained"
                      onClick={handleUploadSubmit}
                      disabled={stagedFiles.length === 0 || isUploading}
                      // ✅ CORREGIDO AQUÍ: Se eliminó el texto "[Image of...]"
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

export default ManageLoteImagesModal;