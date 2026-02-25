// src/components/Admin/Proyectos/Components/modals/ManageImagesModal.tsx

import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Collections as GalleryIcon,
  AddPhotoAlternate as NewImageIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import {
  Alert,
  alpha, Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import React, { useCallback, useState } from 'react';

// --- SERVICIOS Y TIPOS ---
import imagenService from '@/core/api/services/imagen.service';
import type { CreateImagenDto, ImagenDto } from '@/core/types/dto/imagen.dto';
import type { ProyectoDto } from '@/core/types/dto/proyecto.dto';

// --- COMPONENTES SHARED ---
import { QueryHandler } from '@/shared/components/data-grid/QueryHandler/QueryHandler';
import { ConfirmDialog } from '@/shared/components/domain/modals/ConfirmDialog/ConfirmDialog';
import ImageUpload from '@/shared/components/forms/upload/ImageUploadZone';

// --- HOOKS ---
import { env } from '@/core/config/env';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import useSnackbar from '@/shared/hooks/useSnackbar';

const MAX_TOTAL_IMAGES = 10;

interface ManageImagesModalProps {
  open: boolean;
  onClose: () => void;
  proyecto: ProyectoDto;
}

const ManageImagesModal: React.FC<ManageImagesModalProps> = ({
  open,
  onClose,
  proyecto
}) => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const queryKey = ['projectImages', proyecto.id];

  // 🎯 HOOKS UX
  const { showSuccess, showError, showWarning } = useSnackbar();
  const confirmDialog = useConfirmDialog();

  // 📦 ESTADO
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);

  // Estado de carga global (Guardar)
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState<{ current: number, total: number } | null>(null);

  // 📥 QUERY (Imágenes del servidor)
  const { data: serverImages = [], isLoading, error } = useQuery<ImagenDto[], Error>({
    queryKey: queryKey,
    queryFn: async () => {
      const response = await imagenService.getAllByProyecto(proyecto.id);
      return response.data;
    },
    enabled: open,
  });

  // 🧮 CÁLCULOS
  const totalCount = serverImages.length + stagedFiles.length;
  const remainingSlots = Math.max(0, MAX_TOTAL_IMAGES - totalCount);
  const isLimitReached = totalCount >= MAX_TOTAL_IMAGES;

  // 🗑️ MUTATION: Borrar Individual
  const deleteMutation = useMutation({
    mutationFn: (imagenId: number) => imagenService.softDelete(imagenId),
    onMutate: (id) => setDeletingImageId(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey });
      setDeletingImageId(null);
      showSuccess('Imagen eliminada correctamente');
    },
    onError: () => {
      setDeletingImageId(null);
      showError('Error al eliminar la imagen');
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
  });

  // =======================================================================
  // 🎬 HANDLERS
  // =======================================================================

  const handleDeleteSingleClick = (imagenId: number) => {
    const imagen = serverImages.find(img => img.id === imagenId);
    confirmDialog.confirm('delete_single_image', { imagen });
  };

  const handleFilesSelected = (files: File | File[] | null) => {
    if (!files || !Array.isArray(files)) return;

    setUploadError(null);

    const uniqueFiles: File[] = [];
    const duplicateNames: string[] = [];

    const existingNames = new Set([
      ...serverImages.map(img => {
        const nameFromUrl = img.url.split('/').pop() || "";
        return (img.descripcion || nameFromUrl).toLowerCase().trim();
      }),
      ...stagedFiles.map(f => f.name.toLowerCase().trim())
    ]);

    files.forEach(file => {
      if (file.size > env.maxFileSize) {
        showWarning(`El archivo ${file.name} excede el tamaño máximo.`);
        return;
      }

      const normalizedName = file.name.toLowerCase().trim();
      if (existingNames.has(normalizedName)) {
        duplicateNames.push(file.name);
      } else {
        uniqueFiles.push(file);
        existingNames.add(normalizedName);
      }
    });

    if (duplicateNames.length > 0) {
      showWarning(`${duplicateNames.length} archivo(s) ignorado(s) por nombre duplicado.`);
    }

    if (uniqueFiles.length === 0) return;

    if (uniqueFiles.length > remainingSlots) {
      showWarning(`Solo puedes agregar ${remainingSlots} más. Se recortó la selección.`);
      const allowed = uniqueFiles.slice(0, remainingSlots);
      setStagedFiles(prev => [...prev, ...allowed]);
    } else {
      setStagedFiles(prev => [...prev, ...uniqueFiles]);
    }
  };

  const handleRemoveStaged = (indexToRemove: number) => {
    setStagedFiles(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  // 🚀 SUBIDA EN PARALELO ADAPTADA PARA TU BACKEND (single image)
  const handleSaveChanges = async () => {
    if (stagedFiles.length === 0) return;

    setIsSaving(true);
    setUploadError(null);
    setProgress({ current: 0, total: stagedFiles.length });

    const failedFiles: File[] = [];
    let successCount = 0;

    // Disparamos todas las peticiones al mismo tiempo
    const uploadPromises = stagedFiles.map(file =>
      uploadMutation.mutateAsync({
        file: file,
        descripcion: file.name
      }).then(() => {
        // Se actualiza el progreso a medida que cada petición individual termina
        setProgress(prev => prev ? { ...prev, current: prev.current + 1 } : null);
        successCount++;
      }).catch(() => {
        failedFiles.push(file);
      })
    );

    // Esperamos a que todas las peticiones en paralelo finalicen
    await Promise.allSettled(uploadPromises);

    queryClient.invalidateQueries({ queryKey: queryKey });
    setIsSaving(false);
    setProgress(null);

    if (failedFiles.length > 0) {
      setUploadError(`Hubo error al subir ${failedFiles.length} imagen(es). Inténtalo de nuevo.`);
      setStagedFiles(failedFiles);

      if (successCount > 0) {
        showSuccess(`Se subieron ${successCount} imágenes, pero fallaron ${failedFiles.length}.`);
      }
    } else {
      showSuccess(`¡${successCount} imágenes guardadas correctamente!`);
      setStagedFiles([]);
      onClose();
    }
  };

  // =======================================================================
  // 🎬 CIERRE Y RENDER
  // =======================================================================

  const performClose = useCallback(() => {
    setStagedFiles([]);
    setProgress(null);
    setUploadError(null);
    setDeletingImageId(null);
    onClose();
  }, [onClose]);

  const handleCloseAttempt = () => {
    if (stagedFiles.length > 0) {
      confirmDialog.confirm('close_with_unsaved_changes', { count: stagedFiles.length });
    } else {
      performClose();
    }
  };

  const handleDialogConfirm = async () => {
    const { action, data } = confirmDialog;
    confirmDialog.close();

    if (action === 'delete_single_image' && data?.imagen) {
      deleteMutation.mutate(data.imagen.id);
    } else if (action === 'close_with_unsaved_changes') {
      performClose();
    }
  };

  const resolveUrl = (url: string) => imagenService.resolveImageUrl(url);
  const isWorking = isSaving || deleteMutation.isPending;

  return (
    <>
      <Dialog
        open={open}
        onClose={handleCloseAttempt}
        maxWidth="md"
        fullWidth
        PaperProps={{
          elevation: 0,
          sx: {
            borderRadius: 1.5,
            boxShadow: theme.shadows[8],
            overflow: 'hidden'
          }
        }}
      >
        {/* --- HEADER --- */}
        <DialogTitle sx={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          py: 2, px: 3,
          bgcolor: 'background.paper',
          borderBottom: `1px solid ${theme.palette.divider}`
        }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main, borderRadius: 1 }}>
              <GalleryIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700}>Galería del Proyecto</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  {proyecto.nombre_proyecto}
                </Typography>
                <Chip
                  label={`${totalCount} / ${MAX_TOTAL_IMAGES}`}
                  size="small"
                  color={isLimitReached ? 'error' : 'default'}
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
                />
              </Stack>
            </Box>
          </Stack>
          <IconButton onClick={handleCloseAttempt} size="small" disabled={isWorking}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>

          {/* BARRA DE PROGRESO DE CARGA MÚLTIPLE */}
          {isSaving && progress && (
            <Box sx={{ width: '100%', position: 'absolute', top: 0, zIndex: 10 }}>
              <LinearProgress
                variant="determinate"
                value={(progress.current / progress.total) * 100}
                sx={{ height: 4 }}
              />
            </Box>
          )}

          <Stack spacing={0}>

            {/* 1. ZONA DE UPLOAD */}
            <Box sx={{ p: 3, bgcolor: 'background.paper' }}>
              {uploadError && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 1 }} onClose={() => setUploadError(null)}>
                  {uploadError}
                </Alert>
              )}

              {!isLimitReached ? (
                <ImageUpload
                  multiple={true}
                  images={[]}
                  onChange={handleFilesSelected}
                  maxFiles={remainingSlots}
                  maxSizeMB={15}
                  disabled={isWorking}
                  label="Arrastra o selecciona imágenes para la galería"
                  helperText={`Puedes agregar hasta ${remainingSlots} imágenes más`}
                />
              ) : (
                <Alert severity="warning" variant="outlined" sx={{ borderRadius: 1 }}>
                  Has alcanzado el límite de imágenes. Elimina algunas para subir nuevas.
                </Alert>
              )}
            </Box>

            {/* 2. PREVISUALIZACIÓN DE CAMBIOS (Staged Files) */}
            {stagedFiles.length > 0 && (
              <Box sx={{ p: 3, bgcolor: alpha(theme.palette.warning.main, 0.04), borderTop: `1px dashed ${alpha(theme.palette.warning.main, 0.3)}` }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'warning.main', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <NewImageIcon fontSize="small" /> NUEVAS IMÁGENES (Pendiente de guardar)
                </Typography>

                <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(100px, 1fr))" gap={2}>
                  {stagedFiles.map((file, index) => (
                    <Box key={`staged-${index}`} sx={{
                      position: 'relative', borderRadius: 2, overflow: 'hidden',
                      boxShadow: theme.shadows[2], border: `2px solid ${theme.palette.warning.main}`,
                      aspectRatio: '1/1'
                    }}>
                      <Box component="img" src={URL.createObjectURL(file)}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.85 }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveStaged(index)}
                        disabled={isSaving}
                        sx={{
                          position: 'absolute', top: 4, right: 4,
                          bgcolor: 'rgba(0,0,0,0.5)', color: 'white',
                          '&:hover': { bgcolor: 'error.main' }
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            <Divider />

            {/* 3. GALERÍA EXISTENTE (Server) */}
            <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: 250 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', mb: 2 }}>
                GALERÍA ACTUAL
              </Typography>

              <QueryHandler isLoading={isLoading} error={error as Error | null}>
                {serverImages.length === 0 ? (
                  <Box display="flex" justifyContent="center" alignItems="center" height={100} border={`1px dashed ${theme.palette.divider}`} borderRadius={2}>
                    <Typography variant="body2" color="text.disabled">
                      No hay imágenes publicadas.
                    </Typography>
                  </Box>
                ) : (
                  <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(140px, 1fr))" gap={2}>
                    {serverImages.map((img) => (
                      <Paper key={img.id}
                        elevation={0}
                        sx={{
                          position: 'relative', borderRadius: 2, overflow: 'hidden',
                          border: `1px solid ${theme.palette.divider}`,
                          bgcolor: 'background.paper',
                          aspectRatio: '1/1',
                          transition: 'all 0.2s',
                          '&:hover': {
                            boxShadow: theme.shadows[4],
                            borderColor: theme.palette.primary.main,
                            '& .delete-btn': { opacity: 1 }
                          }
                        }}
                      >
                        <Box component="img" src={resolveUrl(img.url)}
                          sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />

                        <Tooltip title="Eliminar imagen">
                          <IconButton
                            className="delete-btn"
                            size="small"
                            onClick={() => handleDeleteSingleClick(img.id)}
                            disabled={deletingImageId === img.id || isSaving}
                            sx={{
                              position: 'absolute', top: 4, right: 4,
                              opacity: 0,
                              transition: 'opacity 0.2s',
                              bgcolor: 'rgba(255,255,255,0.9)', color: 'error.main',
                              '&:hover': { bgcolor: 'error.main', color: 'white' }
                            }}
                          >
                            {deletingImageId === img.id ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>

                        <Box sx={{
                          position: 'absolute', bottom: 0, left: 0, right: 0,
                          bgcolor: 'rgba(0,0,0,0.6)', px: 1, py: 0.5
                        }}>
                          <Typography variant="caption" color="white" noWrap display="block" align="center" fontSize="0.7rem">
                            {img.descripcion || `IMG #${img.id}`}
                          </Typography>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                )}
              </QueryHandler>
            </Box>

          </Stack>
        </DialogContent>

        {/* FOOTER */}
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper' }}>
          <Button onClick={handleCloseAttempt} color="inherit" disabled={isWorking}>
            Cerrar
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveChanges}
            disabled={stagedFiles.length === 0 || isWorking}
            startIcon={isSaving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
            disableElevation
            sx={{ px: 3, fontWeight: 700 }}
          >
            {isSaving ? 'Guardando...' : `Guardar Cambios`}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        controller={confirmDialog}
        onConfirm={handleDialogConfirm}
      />
    </>
  );
};

export default ManageImagesModal;