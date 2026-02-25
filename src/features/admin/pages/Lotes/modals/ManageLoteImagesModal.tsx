import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Collections as GalleryIcon,
  CloudUpload as UploadIcon
} from '@mui/icons-material';
import {
  Alert, alpha, Avatar, Box, Button, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, IconButton, LinearProgress, Paper, Stack,
  Tooltip, Typography, useTheme
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useState } from 'react';

import imagenService from '../../../../../core/api/services/imagen.service';
import { env } from '../../../../../core/config/env';
import type { CreateImagenDto, ImagenDto } from '../../../../../core/types/dto/imagen.dto';
import type { LoteDto } from '../../../../../core/types/dto/lote.dto';
import { QueryHandler } from '../../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import { ConfirmDialog } from '../../../../../shared/components/domain/modals/ConfirmDialog/ConfirmDialog';
import ImageUploadZone from '../../../../../shared/components/forms/upload/ImageUploadZone';
import { useConfirmDialog } from '../../../../../shared/hooks/useConfirmDialog';
import useSnackbar from '../../../../../shared/hooks/useSnackbar';

interface ManageLoteImagesModalProps {
  open: boolean;
  onClose: () => void;
  lote: LoteDto;
}

const ManageLoteImagesModal: React.FC<ManageLoteImagesModalProps> = ({
  open, onClose, lote
}) => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useSnackbar();
  const confirmDialog = useConfirmDialog();

  const queryKey = ['loteImages', lote.id];

  // 📦 ESTADO LOCAL
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ current: number, total: number } | null>(null);

  // 📥 QUERY: Obtener imágenes
  const { data: imagenes = [], isLoading, error } = useQuery<ImagenDto[], Error>({
    queryKey: queryKey,
    queryFn: async () => (await imagenService.getAllByLote(lote.id)).data,
    enabled: open,
  });

  // 🗑️ MUTATION: Eliminar (Sincronizado con softDelete de tu Backend)
  const deleteMutation = useMutation({
    mutationFn: (imagenId: number) => imagenService.softDelete(imagenId),
    onMutate: (imagenId) => { setDeletingImageId(imagenId); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey });
      setDeletingImageId(null);
      confirmDialog.close();
      showSuccess('Imagen eliminada de la galería');
    },
    onError: (err: any) => {
      setDeletingImageId(null);
      confirmDialog.close();
      showError(err.response?.data?.error || 'No se pudo eliminar la imagen.');
    }
  });

  // 📤 MUTATION: Subir (Usa FormData internamente en el service)
  const uploadMutation = useMutation({
    mutationFn: async (formData: { file: File, descripcion: string }) => {
      const imagenData: CreateImagenDto = {
        file: formData.file,
        descripcion: formData.descripcion,
        id_proyecto: null,
        id_lote: lote.id, // Vinculación automática
      };
      return imagenService.create(imagenData);
    },
  });

  // 🎬 HANDLERS
  const handleCloseModal = useCallback(() => {
    setStagedFiles([]);
    setDeletingImageId(null);
    setUploadProgress(null);
    onClose();
  }, [onClose]);

  const requestClose = useCallback(() => {
    if (stagedFiles.length > 0) {
      confirmDialog.confirm('close_with_unsaved_changes', { count: stagedFiles.length });
    } else {
      handleCloseModal();
    }
  }, [stagedFiles.length, confirmDialog, handleCloseModal]);

  const handleConfirmAction = () => {
    if (confirmDialog.action === 'delete_single_image' && confirmDialog.data?.imagen) {
      deleteMutation.mutate(confirmDialog.data.imagen.id);
    }
    if (confirmDialog.action === 'close_with_unsaved_changes') {
      handleCloseModal();
      confirmDialog.close();
    }
  };

  const handleFilesChange = (files: File[]) => {
    const validFiles = files.filter(file => {
      if (file.size > env.maxFileSize) {
        showError(`"${file.name}" supera los ${env.maxFileSize / 1024 / 1024}MB permitidos.`);
        return false;
      }
      return true;
    });
    setStagedFiles(validFiles);
  };

  const handleUploadSubmit = async () => {
    if (stagedFiles.length === 0) return;
    setUploadProgress({ current: 0, total: stagedFiles.length });

    const failedFiles: File[] = [];
    let successCount = 0;

    // Subida secuencial para mantener control del progreso y evitar sobrecarga
    for (const file of stagedFiles) {
      try {
        await uploadMutation.mutateAsync({
          file,
          descripcion: `Imagen de ${lote.nombre_lote}`
        });
        successCount++;
        setUploadProgress(prev => prev ? { ...prev, current: prev.current + 1 } : null);
      } catch (err) {
        failedFiles.push(file);
      }
    }

    queryClient.invalidateQueries({ queryKey: queryKey });
    setUploadProgress(null);
    setStagedFiles(failedFiles);

    if (failedFiles.length > 0) {
      showError(`${failedFiles.length} archivos no pudieron subirse.`);
    } else {
      showSuccess(`¡${successCount} imágenes añadidas con éxito!`);
    }
  };

  const isUploading = !!uploadProgress;

  return (
    <>
      <Dialog
        open={open}
        onClose={requestClose}
        maxWidth="md"
        fullWidth
        PaperProps={{ elevation: 0, sx: { borderRadius: 3, overflow: 'hidden', border: `1px solid ${theme.palette.divider}` } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2.5 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar variant="rounded" sx={{ bgcolor: alpha('#CC6333', 0.1), color: '#CC6333' }}>
              <GalleryIcon />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={800}>Galería Multimedia</Typography>
              <Typography variant="caption" color="text.secondary">Lote: <b>{lote.nombre_lote}</b></Typography>
            </Box>
          </Stack>
          <IconButton onClick={requestClose} disabled={isUploading} size="small"><CloseIcon /></IconButton>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ p: 0, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
          <Stack>
            {/* 🖼️ GRILLA DE IMÁGENES ACTUALES */}
            <Box sx={{ p: 3, minHeight: 200 }}>
              <QueryHandler isLoading={isLoading} error={error}>
                {imagenes.length === 0 ? (
                  <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
                    Este lote aún no tiene imágenes asociadas.
                  </Alert>
                ) : (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                    {imagenes.map((img) => (
                      <Paper
                        key={img.id}
                        elevation={0}
                        sx={{
                          position: 'relative', borderRadius: 2, overflow: 'hidden',
                          border: `1px solid ${theme.palette.divider}`,
                          transition: '0.2s',
                          '&:hover': { borderColor: '#CC6333', boxShadow: theme.shadows[3] }
                        }}
                      >
                        <Box
                          component="img"
                          src={imagenService.resolveImageUrl(img.url)}
                          sx={{ width: '100%', height: 140, objectFit: 'cover' }}
                        />
                        <Stack
                          direction="row" justifyContent="space-between" alignItems="center"
                          sx={{ p: 1, bgcolor: 'background.paper', borderTop: `1px solid ${theme.palette.divider}` }}
                        >
                          <Typography variant="caption" fontWeight={600} noWrap sx={{ maxWidth: '70%' }}>
                            {img.descripcion || `ID: ${img.id}`}
                          </Typography>
                          <Tooltip title="Eliminar foto">
                            <IconButton
                              size="small"
                              onClick={() => confirmDialog.confirm('delete_single_image', { imagen: img })}
                              disabled={isUploading || deletingImageId === img.id}
                              sx={{ color: theme.palette.error.main, '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) } }}
                            >
                              {deletingImageId === img.id ? <CircularProgress size={14} color="inherit" /> : <DeleteIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Paper>
                    ))}
                  </Box>
                )}
              </QueryHandler>
            </Box>

            <Divider />

            {/* 📥 SECCIÓN DE CARGA */}
            <Box sx={{ p: 3, bgcolor: 'background.paper' }}>
              <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ display: 'block', mb: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
                Añadir nuevas imágenes
              </Typography>

              <Box sx={{
                p: 1, borderRadius: 3,
                border: `2px dashed ${stagedFiles.length > 0 ? '#CC6333' : alpha(theme.palette.divider, 0.8)}`,
                bgcolor: alpha(theme.palette.action.hover, 0.4)
              }}>
                <ImageUploadZone
                  multiple
                  images={stagedFiles}
                  onChange={(files) => setStagedFiles(files)} // 'files' es inferido como File[] automáticamente
                  maxFiles={10}
                  disabled={isUploading}
                />
              </Box>

              {(stagedFiles.length > 0 || isUploading) && (
                <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: alpha('#CC6333', 0.04), border: '1px solid', borderColor: alpha('#CC6333', 0.1) }}>
                  {isUploading && uploadProgress && (
                    <Box sx={{ mb: 2 }}>
                      <Stack direction="row" justifyContent="space-between" mb={1}>
                        <Typography variant="caption" fontWeight={800} color="primary">Procesando galería...</Typography>
                        <Typography variant="caption" fontWeight={800}>{uploadProgress.current} / {uploadProgress.total}</Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={(uploadProgress.current / uploadProgress.total) * 100}
                        sx={{ height: 6, borderRadius: 3, bgcolor: alpha('#CC6333', 0.1), '& .MuiLinearProgress-bar': { bgcolor: '#CC6333' } }}
                      />
                    </Box>
                  )}
                  <Stack direction="row" justifyContent="flex-end" spacing={2}>
                    <Button
                      variant="outlined" color="inherit" size="small"
                      onClick={() => setStagedFiles([])}
                      disabled={isUploading}
                    >
                      Limpiar
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleUploadSubmit}
                      disabled={stagedFiles.length === 0 || isUploading}
                      sx={{ bgcolor: '#CC6333', '&:hover': { bgcolor: '#b3562d' } }}
                      startIcon={isUploading ? <CircularProgress size={16} color="inherit" /> : <UploadIcon />}
                    >
                      {isUploading ? 'Subiendo...' : `Subir ${stagedFiles.length} fotos`}
                    </Button>
                  </Stack>
                </Box>
              )}
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, bgcolor: 'background.paper', borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button onClick={requestClose} color="inherit" disabled={isUploading} sx={{ fontWeight: 700 }}>
            Cerrar Galería
          </Button>
        </DialogActions>
      </Dialog>

      {/* ⚠️ DIÁLOGO DE CONFIRMACIÓN */}
      <ConfirmDialog
        controller={confirmDialog}
        onConfirm={handleConfirmAction}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
};

export default ManageLoteImagesModal;