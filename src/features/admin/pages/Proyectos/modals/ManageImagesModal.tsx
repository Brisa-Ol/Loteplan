// src/components/Admin/Proyectos/Components/modals/ManageImagesModal.tsx

import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Collections as GalleryIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import {
  Alert,
  alpha,
  Box,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useMemo, useState } from 'react';

import imagenService from '@/core/api/services/imagen.service';
import { env } from '@/core/config/env';
import type { CreateImagenDto, ImagenDto } from '@/core/types/dto/imagen.dto';
import type { ProyectoDto } from '@/core/types/dto/proyecto.dto';
import { BaseModal, ConfirmDialog, ImageUploadZone, QueryHandler, useConfirmDialog, useSnackbar } from '@/shared';


const MAX_TOTAL_IMAGES = 10;

interface ManageImagesModalProps {
  open: boolean;
  onClose: () => void;
  proyecto: ProyectoDto;
}

const ManageImagesModal: React.FC<ManageImagesModalProps> = ({ open, onClose, proyecto }) => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const queryKey = ['projectImages', proyecto.id];

  const { showSuccess, showError, showWarning } = useSnackbar();
  const confirmDialog = useConfirmDialog();

  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState<{ current: number, total: number } | null>(null);

  // 📥 FETCH IMÁGENES
  const { data: serverImages = [], isLoading, error } = useQuery<ImagenDto[], Error>({
    queryKey,
    queryFn: async () => (await imagenService.getAllByProyecto(proyecto.id)).data,
    enabled: open,
  });

  const totalCount = serverImages.length + stagedFiles.length;
  const remainingSlots = Math.max(0, MAX_TOTAL_IMAGES - totalCount);
  const isLimitReached = totalCount >= MAX_TOTAL_IMAGES;

  // 🗑️ MUTATION: BORRAR
  const deleteMutation = useMutation({
    mutationFn: (imagenId: number) => imagenService.softDelete(imagenId),
    onMutate: (id) => setDeletingImageId(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      showSuccess('Imagen eliminada correctamente');
    },
    onError: () => showError('Error al eliminar la imagen'),
    onSettled: () => {
      setDeletingImageId(null);
      confirmDialog.close();
    }
  });

  // 📤 MUTATION: SUBIR
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
  });

  // --- Handlers ---
  const handleFilesSelected = (files: File | File[] | null) => {
    if (!files || !Array.isArray(files)) return;
    setUploadError(null);

    const validFiles = files.filter(file => {
      if (file.size > env.maxFileSize) {
        showWarning(`${file.name} excede el tamaño máximo.`);
        return false;
      }
      return true;
    });

    const allowed = validFiles.slice(0, remainingSlots);
    if (validFiles.length > remainingSlots) {
      showWarning(`Límite alcanzado: solo se añadieron ${remainingSlots} imágenes.`);
    }
    setStagedFiles(prev => [...prev, ...allowed]);
  };

  const handleSaveChanges = async () => {
    if (stagedFiles.length === 0) return;
    setIsSaving(true);
    setProgress({ current: 0, total: stagedFiles.length });

    const uploadPromises = stagedFiles.map(file =>
      uploadMutation.mutateAsync({ file, descripcion: file.name })
        .then(() => setProgress(prev => prev ? { ...prev, current: prev.current + 1 } : null))
        .catch(() => { /* error manejado al final */ })
    );

    await Promise.allSettled(uploadPromises);
    queryClient.invalidateQueries({ queryKey });
    setIsSaving(false);
    setProgress(null);
    setStagedFiles([]);
    showSuccess('Galería actualizada correctamente');
  };

  const performClose = useCallback(() => {
    setStagedFiles([]);
    setUploadError(null);
    onClose();
  }, [onClose]);

  const handleCloseAttempt = () => {
    if (stagedFiles.length > 0) confirmDialog.confirm('close_with_unsaved_changes', { count: stagedFiles.length });
    else performClose();
  };

  // --- Estilos Memorizados ---
  const styles = useMemo(() => ({
    imageGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
      gap: 2,
      p: 3
    },
    imagePaper: {
      position: 'relative',
      borderRadius: 2,
      overflow: 'hidden',
      border: '1px solid',
      borderColor: theme.palette.divider,
      aspectRatio: '1/1',
      transition: 'all 0.2s ease-in-out',
      '&:hover': { borderColor: theme.palette.primary.main, transform: 'translateY(-2px)', boxShadow: theme.shadows[4] }
    },
    stagedBox: {
      p: 3,
      bgcolor: alpha(theme.palette.warning.main, 0.04),
      borderTop: '1px dashed',
      borderColor: alpha(theme.palette.warning.main, 0.3)
    }
  }), [theme]);

  const isWorking = isSaving || deleteMutation.isPending;

  return (
    <>
      <BaseModal
        open={open}
        onClose={handleCloseAttempt}
        title="Galería del Proyecto"
        subtitle={proyecto.nombre_proyecto}
        icon={<GalleryIcon />}
        maxWidth="md"
        isLoading={isWorking}
        confirmText={isSaving ? 'Subiendo...' : 'Guardar Cambios'}
        confirmButtonIcon={<SaveIcon />}
        hideConfirmButton={stagedFiles.length === 0}
        onConfirm={handleSaveChanges}
        headerExtra={
          <Chip
            label={`${totalCount} / ${MAX_TOTAL_IMAGES}`}
            size="small"
            color={isLimitReached ? 'error' : 'default'}
            variant="outlined"
            sx={{ fontWeight: 800, borderRadius: 1.5 }}
          />
        }
      >
        <Stack spacing={0}>
          {/* BARRA DE PROGRESO */}
          {isSaving && progress && (
            <LinearProgress
              variant="determinate"
              value={(progress.current / progress.total) * 100}
              sx={{ height: 4, mt: -4, mx: -4, mb: 4 }}
            />
          )}

          {/* 1. ZONA DE UPLOAD */}
          <Box sx={{ p: 3 }}>
            {!isLimitReached ? (
              <ImageUploadZone
                multiple
                onChange={handleFilesSelected}
                maxFiles={remainingSlots}
                disabled={isWorking}
                label="Arrastra imágenes aquí para ampliar la galería"
              />
            ) : (
              <Alert severity="warning" variant="outlined" sx={{ borderRadius: 2 }}>
                Límite de 10 imágenes alcanzado. Elimina algunas para subir nuevas.
              </Alert>
            )}
          </Box>

          {/* 2. PREVISUALIZACIÓN (Staged) */}
          {stagedFiles.length > 0 && (
            <Box sx={styles.stagedBox}>
              <Typography variant="caption" fontWeight={900} color="warning.main" sx={{ display: 'block', mb: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
                Nuevas imágenes a sincronizar
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap">
                {stagedFiles.map((file, index) => (
                  <Box key={index} sx={{ ...styles.imagePaper, width: 100, borderColor: 'warning.main', borderStyle: 'dashed' }}>
                    <Box component="img" src={URL.createObjectURL(file)} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <IconButton
                      size="small"
                      onClick={() => setStagedFiles(prev => prev.filter((_, i) => i !== index))}
                      sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(0,0,0,0.5)', color: 'white', '&:hover': { bgcolor: 'error.main' } }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          <Divider />

          {/* 3. GALERÍA ACTUAL */}
          <Box sx={{ minHeight: 250 }}>
            <Box sx={{ px: 3, pt: 3 }}>
              <Typography variant="caption" fontWeight={900} color="text.disabled" sx={{ textTransform: 'uppercase', letterSpacing: 1.5 }}>
                Contenido publicado
              </Typography>
            </Box>
            <QueryHandler isLoading={isLoading} error={error}>
              <Box sx={styles.imageGrid}>
                {serverImages.map((img) => (
                  <Paper key={img.id} elevation={0} sx={styles.imagePaper}>
                    <Box component="img" src={imagenService.resolveImageUrl(img.url)} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0)', transition: '0.3s', '&:hover': { bgcolor: 'rgba(0,0,0,0.3)' }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Tooltip title="Eliminar permanentemente">
                        <IconButton
                          onClick={() => confirmDialog.confirm('delete_single_image', { imagen: img })}
                          disabled={deletingImageId === img.id || isSaving}
                          sx={{
                            color: 'white',
                            bgcolor: alpha(theme.palette.error.main, 0.8),
                            '&:hover': { bgcolor: theme.palette.error.main }
                          }}
                        >
                          {deletingImageId === img.id ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, bgcolor: 'rgba(0,0,0,0.6)', p: 0.5 }}>
                      <Typography variant="caption" color="white" noWrap display="block" align="center" fontSize="0.65rem" fontWeight={700}>
                        {img.descripcion || `IMG-${img.id}`}
                      </Typography>
                    </Box>
                  </Paper>
                ))}
              </Box>
            </QueryHandler>
          </Box>
        </Stack>
      </BaseModal>

      <ConfirmDialog
        controller={confirmDialog}
        onConfirm={() => {
          if (confirmDialog.action === 'delete_single_image') deleteMutation.mutate(confirmDialog.data.imagen.id);
          else { performClose(); confirmDialog.close(); }
        }}
      />
    </>
  );
};

export default ManageImagesModal;