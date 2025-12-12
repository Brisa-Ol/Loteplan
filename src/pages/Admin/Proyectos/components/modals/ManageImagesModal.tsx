import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  CircularProgress, Typography, List, ListItem, ListItemAvatar,
  Avatar, ListItemText, IconButton, Tooltip, Paper, Divider, Alert, Box
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Delete as DeleteIcon, Image as ImageIcon } from '@mui/icons-material';

import imagenService from '../../../../../Services/imagen.service';

import { QueryHandler } from '../../../../../components/common/QueryHandler/QueryHandler';
import ImageUploadZone from '../../../../../components/common/ImageUploadZone/ImageUploadZone';
import type { CreateImagenDto, ImagenDto } from '../../../../../types/dto/imagen.dto';
import type { ProyectoDto } from '../../../../../types/dto/proyecto.dto';

// ✅ 3. Constante para validación
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
  const queryClient = useQueryClient();
  const queryKey = getQueryKey(proyecto.id);

  // 📦 ESTADO LOCAL
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);
  // Estado para mostrar progreso "X de Y subidas" (opcional, pero útil con el loop)
  const [uploadProgress, setUploadProgress] = useState<{current: number, total: number} | null>(null);

  // 📥 QUERY: Obtener imágenes actuales del proyecto
  const { data: imagenes = [], isLoading, error } = useQuery<ImagenDto[], Error>({
    queryKey: queryKey,
    queryFn: async () => {
      const response = await imagenService.getAllByProyecto(proyecto.id);
      return response.data;
    },
    enabled: open,
  });

  // 🗑️ MUTATION: Eliminar una imagen
  const deleteMutation = useMutation({
    mutationFn: (imagenId: number) => imagenService.softDelete(imagenId),
    onMutate: (imagenId) => {
      setDeletingImageId(imagenId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey });
      queryClient.invalidateQueries({ queryKey: ['adminProyectos'] }); // Actualizar tabla principal
      setDeletingImageId(null);
    },
    onError: (err: any) => {
      console.error("Error al borrar imagen", err);
      setDeletingImageId(null);
      setUploadError(err.response?.data?.error || 'Error al eliminar la imagen.');
    }
  });

  // 📤 MUTATION: Subir una nueva imagen (✅ 1. Mejorado)
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
      // Invalidamos queries aquí para que la lista se actualice en tiempo real tras cada subida
      queryClient.invalidateQueries({ queryKey: queryKey });
      queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
    },
    onError: (err: any) => {
        // Guardamos el error pero no bloqueamos el flujo del loop inmediatamente
        const msg = err.response?.data?.message || err.response?.data?.error || 'Error al subir una imagen.';
        console.error('Upload error:', err);
        // Nota: El manejo principal del error visual está en el handler del submit
        throw new Error(msg); 
    }
  });

  // 🎬 HANDLERS

  // ✅ 3. Validación de tamaño de archivo al seleccionar
  const handleFilesChange = (files: File[]) => {
    setUploadError(null);
    const validFiles: File[] = [];
    let errorFound = false;

    files.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(`El archivo "${file.name}" excede el tamaño máximo de 15MB.`);
        errorFound = true;
      } else {
        validFiles.push(file);
      }
    });

    if (errorFound && validFiles.length > 0) {
        // Si hay error pero algunos son validos, mostramos aviso pero guardamos los validos
        setTimeout(() => setUploadError('Se filtraron archivos que excedían 15MB.'), 2000);
    }

    setStagedFiles(validFiles);
  };

  const handleDeleteClick = (imagenId: number) => {
    if (window.confirm('¿Seguro que deseas eliminar esta imagen?')) {
      deleteMutation.mutate(imagenId);
    }
  };

  // ✅ 2. Feedback visual y subida secuencial
  const handleUploadSubmit = async () => {
    if (stagedFiles.length === 0) return;
    
    setUploadError(null);
    setUploadProgress({ current: 0, total: stagedFiles.length });
    
    // Copiamos el array para iterar
    const filesToUpload = [...stagedFiles];
    const failedFiles: File[] = [];

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      try {
        await uploadMutation.mutateAsync({
          file: file,
          descripcion: file.name || `Imagen ${i + 1} de ${proyecto.nombre_proyecto}`
        });
        // Actualizar progreso visual
        setUploadProgress(prev => prev ? { ...prev, current: prev.current + 1 } : null);
      } catch (err: any) {
        console.error(`Fallo al subir ${file.name}`, err);
        failedFiles.push(file); // Guardamos los que fallaron para dejarlos en la zona de carga
        setUploadError(err.message || `Error al subir ${file.name}`);
      }
    }
    
    // Al finalizar
    setUploadProgress(null);
    setStagedFiles(failedFiles); // Dejamos solo los que fallaron (si hubo)

    if (failedFiles.length === 0) {
        // Todo éxito
    } else {
        // Hubo errores
        // El setUploadError ya se seteó en el catch
    }
  };
  
  const handleCloseModal = () => {
    setStagedFiles([]);
    setUploadError(null);
    setDeletingImageId(null);
    setUploadProgress(null);
    onClose();
  };

  useEffect(() => {
    if (!open) {
      setStagedFiles([]);
      setUploadError(null);
      setDeletingImageId(null);
      setUploadProgress(null);
    }
  }, [open]);

  const resolveUrl = (url: string) => imagenService.resolveImageUrl(url);
  const isUploading = uploadMutation.isPending || uploadProgress !== null;

  return (
    <Dialog open={open} onClose={handleCloseModal} maxWidth="md" fullWidth>
      <DialogTitle>
        Gestionar Imágenes de "{proyecto.nombre_proyecto}"
      </DialogTitle>
      
      <DialogContent dividers>
        
        <Typography variant="h6" gutterBottom>
          Imágenes Actuales ({imagenes.length})
        </Typography>
        
        <QueryHandler isLoading={isLoading} error={error as Error | null}>
          {imagenes.length === 0 ? (
            <Alert severity="info">
              Este proyecto no tiene imágenes. Agrega algunas usando el área de abajo.
            </Alert>
          ) : (
            <List dense>
              {imagenes.map((img) => (
                <ListItem
                  key={img.id}
                  sx={{
                    bgcolor: 'background.paper',
                    mb: 1,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                  secondaryAction={
                    <Tooltip title="Eliminar Imagen">
                      <IconButton 
                        edge="end" 
                        color="error"
                        onClick={() => handleDeleteClick(img.id)}
                        disabled={deletingImageId === img.id || isUploading}
                      >
                        {deletingImageId === img.id
                          ? <CircularProgress size={20} color="inherit" />
                          : <DeleteIcon />}
                      </IconButton>
                    </Tooltip>
                  }
                >
                  <ListItemAvatar>
                    <Avatar 
                      variant="rounded" 
                      src={resolveUrl(img.url)}
                      sx={{ width: 60, height: 60 }}
                    >
                      <ImageIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={img.descripcion || `Imagen ID: ${img.id}`}
                    secondary={
                      <>
                        <Typography variant="caption" display="block">
                          Subida: {img.createdAt ? new Date(img.createdAt).toLocaleDateString() : '-'}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </QueryHandler>
        
        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          Añadir Nuevas Imágenes
        </Typography>
        
        <Paper variant="outlined" sx={{ p: 2 }}>
          <ImageUploadZone
            images={stagedFiles}
            onChange={handleFilesChange} // ✅ Usamos el handler con validación
            maxFiles={10}
            disabled={isUploading}
          />
          
          <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={handleUploadSubmit}
              disabled={stagedFiles.length === 0 || isUploading}
              startIcon={isUploading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {isUploading 
                ? `Subiendo (${uploadProgress?.current || 0}/${uploadProgress?.total || 0})...` 
                : `Subir ${stagedFiles.length} ${stagedFiles.length === 1 ? 'Imagen' : 'Imágenes'}`}
            </Button>
            
            {isUploading && (
              <Typography variant="caption" color="text.secondary">
                Por favor espera mientras se procesan las imágenes...
              </Typography>
            )}
          </Box>
          
          {uploadError && (
            <Alert severity="error" sx={{ mt: 2 }} onClose={() => setUploadError(null)}>
              {uploadError}
            </Alert>
          )}
        </Paper>

      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleCloseModal} color="inherit" disabled={isUploading}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ManageImagesModal;