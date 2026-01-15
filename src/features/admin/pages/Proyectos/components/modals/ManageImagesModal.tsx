// src/components/Admin/Proyectos/Components/modals/ManageImagesModal.tsx

import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  CircularProgress, Typography, IconButton, Tooltip, Paper, Divider, Alert, Box,
  Stack, useTheme, alpha, Avatar, LinearProgress, Chip, Grid
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Delete as DeleteIcon,
  Collections as GalleryIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  AddPhotoAlternate as NewImageIcon
} from '@mui/icons-material';

// --- SERVICIOS Y TIPOS ---
import type { ProyectoDto } from '../../../../../../core/types/dto/proyecto.dto';
import imagenService from '../../../../../../core/api/services/imagen.service';
import type { CreateImagenDto, ImagenDto } from '../../../../../../core/types/dto/imagen.dto';

// --- COMPONENTES SHARED ---
import { QueryHandler } from '../../../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import ImageUploadZone from '../../../../../../shared/components/forms/upload/ImageUploadZone/ImageUploadZone';
import { ConfirmDialog } from '../../../../../../shared/components/domain/modals/ConfirmDialog/ConfirmDialog';

// --- HOOKS ---
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import useSnackbar from '@/shared/hooks/useSnackbar';

const MAX_TOTAL_IMAGES = 10;

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
  
  // 🎯 HOOKS UX
  const { showSuccess, showError, showWarning, showInfo } = useSnackbar();
  const confirmDialog = useConfirmDialog();

  // 📦 ESTADO
  const [stagedFiles, setStagedFiles] = useState<File[]>([]); // Archivos pendientes
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Estado para borrado individual (para mostrar spinner en la imagen específica)
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
      queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
      setDeletingImageId(null);
    },
    onError: () => {
      setDeletingImageId(null);
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
    }
  });

  // =======================================================================
  // 🎬 HANDLERS DE BORRADO INDIVIDUAL
  // =======================================================================

  const handleDeleteSingleClick = (imagenId: number) => {
    const imagen = serverImages.find(img => img.id === imagenId);
    confirmDialog.confirm('delete_single_image', { imagen });
  };

  // =======================================================================
  // 🎬 HANDLERS DE SUBIDA (STAGING)
  // =======================================================================

  const handleFilesSelected = (files: File[]) => {
    setUploadError(null);
    
    // 1. Validación de Duplicados (Nombre)
    const existingNames = new Set([
        ...serverImages.map(img => {
            const nameFromDesc = img.descripcion || "";
            const nameFromUrl = img.url.split('/').pop() || "";
            return (nameFromDesc || nameFromUrl).toLowerCase().trim();
        }), 
        ...stagedFiles.map(f => f.name.toLowerCase().trim())
    ]);

    const uniqueFiles: File[] = [];
    const duplicateNames: string[] = [];

    files.forEach(file => {
        const normalizedName = file.name.toLowerCase().trim();
        if (existingNames.has(normalizedName)) {
            duplicateNames.push(file.name);
        } else {
            uniqueFiles.push(file);
            existingNames.add(normalizedName);
        }
    });

    if (duplicateNames.length > 0) {
        setUploadError(`${duplicateNames.length} archivo(s) ignorado(s) por nombre duplicado.`);
    }

    if (uniqueFiles.length === 0) return;

    // 2. Validación de Límite
    if (uniqueFiles.length > remainingSlots) {
        showWarning(`Solo puedes agregar ${remainingSlots} más. Se recortó la selección.`);
        const allowed = uniqueFiles.slice(0, remainingSlots);
        setStagedFiles(prev => [...prev, ...allowed]);
    } else {
        setStagedFiles(prev => [...prev, ...uniqueFiles]);
        if (duplicateNames.length === 0) {
             showSuccess(`${uniqueFiles.length} imágenes listas para subir.`);
        }
    }
  };

  const handleRemoveStaged = (indexToRemove: number) => {
    setStagedFiles(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleSaveChanges = async () => {
    if (stagedFiles.length === 0) return;
    
    setIsSaving(true);
    setUploadError(null);
    setProgress({ current: 0, total: stagedFiles.length });

    const failedFiles: File[] = [];
    let successCount = 0;

    for (let i = 0; i < stagedFiles.length; i++) {
      const file = stagedFiles[i];
      try {
        await uploadMutation.mutateAsync({
          file: file,
          descripcion: file.name
        });
        successCount++;
        setProgress(prev => prev ? { ...prev, current: prev.current + 1 } : null);
      } catch (err) {
        failedFiles.push(file);
      }
    }

    setIsSaving(false);
    setProgress(null);
    
    if (failedFiles.length > 0) {
        setUploadError(`Hubo error al subir ${failedFiles.length} imágenes.`);
        setStagedFiles(failedFiles);
    } else {
        showSuccess(`¡${successCount} imágenes guardadas correctamente!`);
        setStagedFiles([]); 
    }
  };

  // =======================================================================
  // 🎬 CIERRE Y CONFIRMACIÓN GLOBAL
  // =======================================================================

  const performClose = () => {
    setStagedFiles([]);
    setProgress(null);
    setUploadError(null);
    setDeletingImageId(null);
    onClose();
  };

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

    // 1. Borrado Individual
    if (action === 'delete_single_image' && data?.imagen) {
        deleteMutation.mutate(data.imagen.id, {
            onSuccess: () => showSuccess('Imagen eliminada.'),
            onError: () => showError('No se pudo eliminar la imagen.')
        });
    }
    // 2. Cerrar sin guardar
    else if (action === 'close_with_unsaved_changes') {
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
          sx: { borderRadius: 3, boxShadow: theme.shadows[10], overflow: 'hidden' }
        }}
      >
        {/* --- HEADER --- */}
        <DialogTitle sx={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          py: 2.5, px: 3, bgcolor: alpha(theme.palette.primary.main, 0.04),
          borderBottom: `1px solid ${theme.palette.divider}`
        }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
              <GalleryIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" color="text.primary">Galería de Imágenes</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" color="text.secondary">
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
          
          {/* BARRA DE PROGRESO */}
          {isSaving && progress && (
              <Box sx={{ width: '100%', position: 'absolute', top: 0, zIndex: 10 }}>
                  <LinearProgress 
                      variant="determinate" 
                      value={progress ? (progress.current / progress.total) * 100 : 0} 
                  />
              </Box>
          )}

          <Stack spacing={0} divider={<Divider />}>

            {/* 1. ZONA DE UPLOAD */}
            <Box sx={{ p: 3, bgcolor: 'background.paper' }}>
               {uploadError && (
                  <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setUploadError(null)}>
                      {uploadError}
                  </Alert>
               )}

               {!isLimitReached ? (
                   <ImageUploadZone
                      images={[]} 
                      onChange={handleFilesSelected}
                      maxFiles={remainingSlots}
                      maxSizeMB={15}
                      disabled={isWorking}
                   />
               ) : (
                   <Alert severity="warning" variant="outlined" sx={{ borderRadius: 2 }}>
                      Has alcanzado el límite de imágenes. Elimina algunas para subir nuevas.
                   </Alert>
               )}
            </Box>

            {/* 2. PREVISUALIZACIÓN DE CAMBIOS (Staged Files) */}
            {stagedFiles.length > 0 && (
                <Box sx={{ p: 3, bgcolor: alpha(theme.palette.warning.main, 0.03) }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'warning.main', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <NewImageIcon fontSize="small" /> NUEVAS IMÁGENES (Pendiente de guardar)
                    </Typography>
                    
                    {/* CSS GRID NATIVO (Box) */}
                    <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(120px, 1fr))" gap={2}>
                        {stagedFiles.map((file, index) => (
                            <Box key={`staged-${index}`} sx={{ 
                                    position: 'relative', borderRadius: 2, overflow: 'hidden', 
                                    boxShadow: theme.shadows[2], border: `2px solid ${theme.palette.warning.main}`,
                                    aspectRatio: '1/1'
                                }}>
                                    <Box component="img" src={URL.createObjectURL(file)} 
                                        sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.8 }} 
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
                                    <Box sx={{ position: 'absolute', bottom: 0, width: '100%', bgcolor: 'warning.main', color: 'warning.contrastText', px: 1, py: 0.5 }}>
                                        <Typography variant="caption" fontWeight={700} noWrap display="block">Nueva</Typography>
                                    </Box>
                                </Box>
                        ))}
                    </Box>
                </Box>
            )}

            {/* 3. GALERÍA EXISTENTE (Server) */}
            <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: 250 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', mb: 2 }}>
                  EN GALERÍA ({serverImages.length})
              </Typography>

              <QueryHandler isLoading={isLoading} error={error as Error | null}>
                {serverImages.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" fontStyle="italic" align="center" mt={4}>
                      No hay imágenes guardadas aún.
                  </Typography>
                ) : (
                  // CSS GRID NATIVO
                  <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(140px, 1fr))" gap={2}>
                    {serverImages.map((img) => (
                          <Box key={img.id} 
                              sx={{ 
                                  position: 'relative', borderRadius: 2, overflow: 'hidden', 
                                  boxShadow: theme.shadows[1],
                                  border: `1px solid ${theme.palette.divider}`,
                                  bgcolor: 'background.paper',
                                  aspectRatio: '1/1', 
                                  '&:hover .delete-btn': { opacity: 1 } // Mostrar botón al hover
                              }}
                          >
                              <Box component="img" src={resolveUrl(img.url)} 
                                  sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
                              />
                              
                              {/* Botón Borrar Individual */}
                              <IconButton 
                                    className="delete-btn"
                                    size="small"
                                    onClick={() => handleDeleteSingleClick(img.id)}
                                    disabled={deletingImageId === img.id || isSaving}
                                    sx={{ 
                                        position: 'absolute', top: 4, right: 4, 
                                        opacity: 0, // Oculto por defecto
                                        transition: 'opacity 0.2s',
                                        bgcolor: 'rgba(255,255,255,0.9)', color: 'error.main',
                                        '&:hover': { bgcolor: 'error.main', color: 'white' }
                                    }}
                                >
                                    {deletingImageId === img.id ? <CircularProgress size={16} /> : <DeleteIcon fontSize="small" />}
                                </IconButton>

                                {/* Descripción / ID opcional */}
                                <Box sx={{ 
                                    position: 'absolute', bottom: 0, left: 0, right: 0, 
                                    bgcolor: 'rgba(0,0,0,0.6)', p: 0.5 
                                }}>
                                    <Typography variant="caption" color="white" noWrap display="block" align="center">
                                        {img.descripcion || `ID: ${img.id}`}
                                    </Typography>
                                </Box>
                          </Box>
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
              Cancelar
          </Button>
          <Button 
              variant="contained" 
              onClick={handleSaveChanges} 
              disabled={stagedFiles.length === 0 || isWorking}
              startIcon={isSaving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
              sx={{ px: 3, fontWeight: 700 }}
          >
              {isSaving ? 'Guardando...' : `Guardar Nuevas (${stagedFiles.length})`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIÁLOGO DE CONFIRMACIÓN */}
      <ConfirmDialog 
        controller={confirmDialog} 
        onConfirm={handleDialogConfirm}
      />
    </>
  );
};

export default ManageImagesModal;