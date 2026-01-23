import React, { useCallback, useEffect, useState } from 'react';
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

import type { LoteDto } from '../../../../../core/types/dto/lote.dto';
import type { CreateImagenDto, ImagenDto } from '../../../../../core/types/dto/imagen.dto';
import imagenService from '../../../../../core/api/services/imagen.service';
import useSnackbar from '../../../../../shared/hooks/useSnackbar';
import { useConfirmDialog } from '../../../../../shared/hooks/useConfirmDialog'; // 👈 IMPORTAR HOOK
import { ConfirmDialog } from '../../../../../shared/components/domain/modals/ConfirmDialog/ConfirmDialog'; // 👈 IMPORTAR COMPONENTE
import { env } from '../../../../../core/config/env';
import { QueryHandler } from '../../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import ImageUploadZone from '../../../../../shared/components/forms/upload/ImageUploadZone/ImageUploadZone';

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
  
  // 1. Inicializamos el Dialog Controller
  const confirmDialog = useConfirmDialog();
  
  const queryKey = ['loteImages', lote.id];

  // 📦 ESTADO LOCAL
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ current: number, total: number } | null>(null);

  // 📥 QUERY
  const { data: imagenes = [], isLoading, error } = useQuery<ImagenDto[], Error>({
    queryKey: queryKey,
    queryFn: async () => (await imagenService.getAllByLote(lote.id)).data,
    enabled: open,
  });

  // 🗑️ MUTATION: Eliminar
  const deleteMutation = useMutation({
    mutationFn: (imagenId: number) => imagenService.softDelete(imagenId),
    onMutate: (imagenId) => { setDeletingImageId(imagenId); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey });
      setDeletingImageId(null);
      confirmDialog.close(); // Cerramos el diálogo
      showSuccess('Imagen eliminada correctamente');
    },
    onError: (err: any) => {
      setDeletingImageId(null);
      confirmDialog.close();
      showError(err.response?.data?.error || 'Error al eliminar.');
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

  // A. Borrado: Ahora delega al ConfirmDialog
  const requestDelete = (imagen: ImagenDto) => {
    confirmDialog.confirm('delete_single_image', { imagen });
  };

  // B. Cierre: Intercepta si hay cambios sin guardar
  const requestClose = useCallback(() => {
    if (stagedFiles.length > 0) {
        confirmDialog.confirm('close_with_unsaved_changes', { count: stagedFiles.length });
    } else {
        handleCloseModal(); // Cierre directo
    }
  }, [stagedFiles, confirmDialog]);

  // C. Ejecución de la acción confirmada
  const handleConfirmAction = () => {
      if (confirmDialog.action === 'delete_single_image' && confirmDialog.data?.imagen) {
          deleteMutation.mutate(confirmDialog.data.imagen.id);
      }
      if (confirmDialog.action === 'close_with_unsaved_changes') {
          handleCloseModal(); // Forzar cierre
          confirmDialog.close();
      }
  };

  // Limpieza real del modal
  const handleCloseModal = () => {
    setStagedFiles([]);
    setDeletingImageId(null);
    setUploadProgress(null);
    onClose();
  };

  const handleFilesChange = (files: File[]) => {
    const validFiles = files.filter(file => {
      if (file.size > env.maxFileSize) {
        showError(`"${file.name}" excede el límite.`);
        return false;
      }
      return true;
    });
    setStagedFiles(validFiles);
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
        await uploadMutation.mutateAsync({ file, descripcion: file.name || `Lote ${lote.id}` });
        successCount++;
        setUploadProgress(prev => prev ? { ...prev, current: prev.current + 1 } : null);
      } catch (err) {
        failedFiles.push(file);
      }
    }

    queryClient.invalidateQueries({ queryKey: queryKey });
    setUploadProgress(null);
    setStagedFiles(failedFiles);

    if (failedFiles.length > 0) showError(`Errores en ${failedFiles.length} archivos.`);
    else if (successCount > 0) showSuccess(`¡${successCount} imágenes subidas!`);
  };

  const resolveUrl = (url: string) => imagenService.resolveImageUrl(url);
  const isUploading = uploadMutation.isPending || uploadProgress !== null;

  return (
    <>
        <Dialog open={open} onClose={requestClose} maxWidth="md" fullWidth PaperProps={{ elevation: 0, sx: { borderRadius: 2, boxShadow: theme.shadows[8], overflow: 'hidden' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2, px: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
                <GalleryIcon />
            </Avatar>
            <Box>
                <Typography variant="h6" fontWeight={700}>Galería del Lote</Typography>
                <Typography variant="body2" color="text.secondary">Gestionando: <b>{lote.nombre_lote}</b></Typography>
            </Box>
            </Stack>
            <IconButton onClick={requestClose} disabled={isUploading}><CloseIcon /></IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
            <Stack>
            {/* GALERÍA */}
            <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: 250 }}>
                <QueryHandler isLoading={isLoading} error={error as Error | null}>
                {imagenes.length === 0 ? (
                    <Alert severity="info" variant="outlined" sx={{ bgcolor: 'background.paper' }}>No hay imágenes asignadas.</Alert>
                ) : (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {imagenes.map((img) => (
                        <Paper key={img.id} elevation={0} sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.33% - 11px)' }, borderRadius: 1.5, overflow: 'hidden', border: `1px solid ${theme.palette.divider}`, '&:hover': { boxShadow: theme.shadows[2], borderColor: theme.palette.primary.main } }}>
                        <Box component="img" src={resolveUrl(img.url)} sx={{ width: '100%', height: 140, objectFit: 'cover' }} />
                        
                        {/* FOOTER SIMPLE (Ya no necesita lógica inline compleja) */}
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1, bgcolor: 'background.paper', borderTop: `1px solid ${theme.palette.divider}`, minHeight: 46 }}>
                            <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: '80%' }}>{img.descripcion || `IMG #${img.id}`}</Typography>
                            <Tooltip title="Eliminar">
                                <IconButton size="small" onClick={() => requestDelete(img)} disabled={isUploading || deletingImageId === img.id} color="error" sx={{ '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) } }}>
                                {deletingImageId === img.id ? <CircularProgress size={16} color="error" /> : <DeleteIcon fontSize="small" />}
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

            {/* ZONA DE SUBIDA */}
            <Box sx={{ p: 3, bgcolor: 'background.paper' }}>
                <Typography variant="subtitle2" color="text.secondary" fontWeight={700} mb={2}>SUBIR NUEVAS FOTOS</Typography>
                <Paper elevation={0} sx={{ border: `2px dashed ${alpha(theme.palette.text.disabled, 0.3)}`, borderRadius: 2, bgcolor: alpha(theme.palette.action.hover, 0.3) }}>
                <Box sx={{ p: 2 }}>
                    <ImageUploadZone images={stagedFiles} onChange={handleFilesChange} maxFiles={10} disabled={isUploading} />
                </Box>
                {(stagedFiles.length > 0 || isUploading) && (
                    <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.04), borderTop: `1px dashed ${alpha(theme.palette.primary.main, 0.2)}` }}>
                    {isUploading && uploadProgress && (
                        <Box sx={{ mb: 2 }}>
                        <Stack direction="row" justifyContent="space-between" mb={0.5}>
                            <Typography variant="caption" color="primary" fontWeight={600}>Subiendo...</Typography>
                            <Typography variant="caption">{uploadProgress.current} / {uploadProgress.total}</Typography>
                        </Stack>
                        <LinearProgress variant="determinate" value={(uploadProgress.current / uploadProgress.total) * 100} sx={{ borderRadius: 1 }} />
                        </Box>
                    )}
                    <Stack direction="row" justifyContent="flex-end">
                        <Button variant="contained" onClick={handleUploadSubmit} disabled={stagedFiles.length === 0 || isUploading} startIcon={isUploading ? <CircularProgress size={16} color="inherit" /> : <UploadIcon />}>
                        {isUploading ? 'Procesando...' : `Subir ${stagedFiles.length} Archivos`}
                        </Button>
                    </Stack>
                    </Box>
                )}
                </Paper>
            </Box>
            </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Button onClick={requestClose} color="inherit" disabled={isUploading}>Cerrar</Button>
        </DialogActions>
        </Dialog>

        {/* 4. RENDERIZAMOS EL DIÁLOGO GLOBAL DE CONFIRMACIÓN */}
        <ConfirmDialog 
            controller={confirmDialog} 
            onConfirm={handleConfirmAction} 
            isLoading={deleteMutation.isPending} // Bloquea el botón "Sí" mientras borra
        />
    </>
  );
};

export default ManageLoteImagesModal;