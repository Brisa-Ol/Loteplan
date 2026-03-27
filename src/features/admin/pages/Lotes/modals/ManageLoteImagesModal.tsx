// src/features/admin/pages/Lotes/modals/ManageLoteImagesModal.tsx

import {
  Delete as DeleteIcon,
  Collections as GalleryIcon,
  CloudUpload as UploadIcon
} from '@mui/icons-material';
import {
  Alert, alpha,
  Box,
  CircularProgress,
  Divider, IconButton, LinearProgress, Paper, Stack,
  Tooltip, Typography, useTheme
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useMemo, useState } from 'react';

import imagenService from '@/core/api/services/imagen.service';
import type { CreateImagenDto, ImagenDto } from '@/core/types/imagen.dto';
import type { LoteDto } from '@/core/types/lote.dto';
import { BaseModal, ConfirmDialog, ImageUploadZone, QueryHandler, useConfirmDialog, useSnackbar } from '@/shared';


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

  // --- Estado Local ---
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ current: number, total: number } | null>(null);

  const isUploading = !!uploadProgress;

  // --- Queries & Mutations ---
  const { data: imagenes = [], isLoading, error } = useQuery<ImagenDto[], Error>({
    queryKey,
    queryFn: async () => (await imagenService.getAllByLote(lote.id)).data,
    enabled: open,
  });

  const deleteMutation = useMutation({
    mutationFn: (imagenId: number) => imagenService.softDelete(imagenId),
    onMutate: (imagenId) => { setDeletingImageId(imagenId); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      showSuccess('Imagen eliminada de la galería');
    },
    onError: (err: any) => {
      showError(err.response?.data?.error || 'No se pudo eliminar la imagen.');
    },
    onSettled: () => {
      setDeletingImageId(null);
      confirmDialog.close();
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: { file: File, descripcion: string }) => {
      const imagenData: CreateImagenDto = {
        file: formData.file,
        descripcion: formData.descripcion,
        id_proyecto: null,
        id_lote: lote.id,
      };
      console.log(imagenData)
      console.log(formData)
      return imagenService.create(imagenData);
    },
  });


  // --- Handlers ---
  const handleCloseModal = useCallback(() => {
    setStagedFiles([]);
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

  const handleUploadSubmit = async () => {
    if (stagedFiles.length === 0) return;
    setUploadProgress({ current: 0, total: stagedFiles.length });

    const failedFiles: File[] = [];
    let successCount = 0;

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

    queryClient.invalidateQueries({ queryKey });
    setUploadProgress(null);
    setStagedFiles(failedFiles);

    if (failedFiles.length > 0) {
      showError(`${failedFiles.length} archivos no pudieron subirse.`);
    } else {
      showSuccess(`¡${successCount} imágenes añadidas con éxito!`);
    }
  };

  const handleConfirmAction = () => {
    if (confirmDialog.action === 'delete_single_image' && confirmDialog.data?.imagen) {
      deleteMutation.mutate(confirmDialog.data.imagen.id);
    }
    if (confirmDialog.action === 'close_with_unsaved_changes') {
      handleCloseModal();
      confirmDialog.close();
    }
  };

  // --- Estilos Memorizados ---
  const styles = useMemo(() => ({
    imageGrid: {
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
      gap: 2,
      p: 3
    },
    imagePaper: {
      position: 'relative',
      borderRadius: 2,
      overflow: 'hidden',
      border: '1px solid',
      borderColor: theme.palette.divider,
      transition: 'all 0.2s ease-in-out',
      '&:hover': { borderColor: 'primary.main', transform: 'translateY(-2px)', boxShadow: theme.shadows[4] }
    },
    uploadArea: {
      p: 3,
      bgcolor: alpha(theme.palette.background.default, 0.5),
      borderTop: '1px solid',
      borderColor: theme.palette.divider
    }
  }), [theme]);

  return (
    <>
      <BaseModal
        open={open}
        onClose={requestClose}
        title="Galería Multimedia"
        subtitle={`Lote: ${lote.nombre_lote}`}
        icon={<GalleryIcon />}
        maxWidth="md"
        isLoading={isUploading}
        disableClose={isUploading}
        hideConfirmButton={stagedFiles.length === 0}
        confirmText={isUploading ? 'Subiendo...' : `Subir ${stagedFiles.length} fotos`}
        confirmButtonIcon={<UploadIcon />}
        onConfirm={handleUploadSubmit}
        // Personalizamos el scroll del PaperProps para que el visor de imágenes no tenga paddings raros
        PaperProps={{ sx: { '& .MuiDialogContent-root': { p: 0 } } }}
      >
        <Stack>
          {/* GRILLA DE IMÁGENES ACTUALES */}
          <Box sx={{ minHeight: 240 }}>
            <QueryHandler isLoading={isLoading} error={error}>
              {imagenes.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Alert severity="info" variant="outlined" sx={{ borderRadius: 2, display: 'inline-flex' }}>
                    Este lote aún no tiene imágenes asociadas.
                  </Alert>
                </Box>
              ) : (
                <Box sx={styles.imageGrid}>
                  {imagenes.map((img) => (
                    <Paper key={img.id} elevation={0} sx={styles.imagePaper}>
                      <Box
                        component="img"
                        src={imagenService.resolveImageUrl(img.url)}
                        sx={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
                      />
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ p: 1.5, bgcolor: 'background.paper', borderTop: `1px solid ${theme.palette.divider}` }}
                      >
                        <Typography variant="caption" fontWeight={800} noWrap sx={{ maxWidth: '75%', color: 'text.secondary' }}>
                          {img.descripcion || `IMG-${img.id}`}
                        </Typography>
                        <Tooltip title="Eliminar de la galería">
                          <IconButton
                            size="small"
                            onClick={() => confirmDialog.confirm('delete_single_image', { imagen: img })}
                            disabled={isUploading || deletingImageId === img.id}
                            sx={{
                              color: 'error.main',
                              bgcolor: alpha(theme.palette.error.main, 0.05),
                              '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) }
                            }}
                          >
                            {deletingImageId === img.id ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon fontSize="small" />}
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

          {/* SECCIÓN DE CARGA */}
          <Box sx={styles.uploadArea}>
            <Typography variant="caption" fontWeight={900} color="text.disabled" sx={{ display: 'block', mb: 2, textTransform: 'uppercase', letterSpacing: 1.5 }}>
              Añadir Contenido Visual
            </Typography>

            <ImageUploadZone
              multiple
              images={stagedFiles}
              onChange={(files) => setStagedFiles(files)}
              maxFiles={10}
              disabled={isUploading}
            />

            {isUploading && uploadProgress && (
              <Box sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.03), border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.1) }}>
                <Stack direction="row" justifyContent="space-between" mb={1.5}>
                  <Typography variant="caption" fontWeight={800} color="primary">Sincronizando con el servidor...</Typography>
                  <Typography variant="caption" fontWeight={900}>{uploadProgress.current} / {uploadProgress.total}</Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={(uploadProgress.current / uploadProgress.total) * 100}
                  sx={{ height: 8, borderRadius: 4, bgcolor: alpha(theme.palette.primary.main, 0.1) }}
                />
              </Box>
            )}
          </Box>
        </Stack>
      </BaseModal>

      {/* DIÁLOGO DE CONFIRMACIÓN */}
      <ConfirmDialog
        controller={confirmDialog}
        onConfirm={handleConfirmAction}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
};

export default ManageLoteImagesModal;