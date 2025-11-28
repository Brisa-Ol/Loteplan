// src/components/Admin/Proyectos/Modals/ManageImagesModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  CircularProgress, Typography, List, ListItem, ListItemAvatar,
  Avatar, ListItemText, IconButton, Tooltip, Paper, Divider, Alert, Box
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Delete as DeleteIcon, Image as ImageIcon } from '@mui/icons-material';

import imagenService from '../../../../Services/imagen.service';

import { QueryHandler } from '../../../../components/common/QueryHandler/QueryHandler';
import ImageUploadZone from '../../../../components/common/ImageUploadZone/ImageUploadZone';
import type { CreateImagenDto, ImagenDto } from '../../../../types/dto/imagen.dto';
import type { ProyectoDto } from '../../../../types/dto/proyecto.dto';

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

  // 📥 QUERY: Obtener imágenes actuales del proyecto
  const { data: imagenes = [], isLoading, error } = useQuery<ImagenDto[], Error>({
    queryKey: queryKey,
    // CORRECCIÓN 1: Extraer .data de la respuesta de Axios
    queryFn: async () => {
      const response = await imagenService.getByProject(proyecto.id);
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
      queryClient.invalidateQueries({ queryKey: ['adminAllProjects'] }); // Opcional, si muestras la portada en la tabla
      setDeletingImageId(null);
    },
    onError: (err: any) => {
      console.error("Error al borrar imagen", err);
      setDeletingImageId(null);
      setUploadError(err.response?.data?.error || 'Error al eliminar la imagen.');
    }
  });

  // 📤 MUTATION: Subir una nueva imagen
  const uploadMutation = useMutation({
    mutationFn: async (formData: { file: File, descripcion: string }) => {
      // CORRECCIÓN 2: Crear el objeto DTO completo (incluyendo el archivo)
      const imagenData: CreateImagenDto = {
        file: formData.file, // Aquí va el archivo
        descripcion: formData.descripcion,
        id_proyecto: proyecto.id,
        id_lote: null,
      };
      
      // Pasar un solo argumento al servicio
      return imagenService.create(imagenData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey });
      queryClient.invalidateQueries({ queryKey: ['adminAllProjects'] });
    },
    onError: (err: any) => {
      setUploadError(err.response?.data?.error || 'Error al subir una imagen.');
    }
  });

  // 🎬 HANDLERS

  const handleDeleteClick = (imagenId: number) => {
    if (window.confirm('¿Seguro que deseas eliminar esta imagen?')) {
      deleteMutation.mutate(imagenId);
    }
  };

  const handleUploadSubmit = async () => {
    if (stagedFiles.length === 0) return;
    
    setUploadError(null);
    
    try {
      await Promise.all(
        stagedFiles.map(file => 
          uploadMutation.mutateAsync({
            file: file,
            descripcion: file.name || `Imagen de ${proyecto.nombre_proyecto}`
          })
        )
      );
      
      setStagedFiles([]);
    } catch (err) {
      console.error("Una o más imágenes fallaron al subir.", err);
    }
  };
  
  const handleCloseModal = () => {
    setStagedFiles([]);
    setUploadError(null);
    setDeletingImageId(null);
    onClose();
  };

  useEffect(() => {
    if (!open) {
      setStagedFiles([]);
      setUploadError(null);
      setDeletingImageId(null);
    }
  }, [open]);

  // Usar el helper del servicio para resolver la URL o la variable de entorno
  const resolveUrl = (url: string) => imagenService.resolveImageUrl(url);

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
                        disabled={deletingImageId === img.id}
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
                        <Typography variant="caption" color="text.disabled">
                          {img.url}
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
            onChange={setStagedFiles}
            maxFiles={10}
            disabled={uploadMutation.isPending}
          />
          
          <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              variant="contained"
              onClick={handleUploadSubmit}
              disabled={stagedFiles.length === 0 || uploadMutation.isPending}
              startIcon={uploadMutation.isPending ? <CircularProgress size={20} /> : null}
            >
              {uploadMutation.isPending 
                ? 'Subiendo...' 
                : `Subir ${stagedFiles.length} ${stagedFiles.length === 1 ? 'Imagen' : 'Imágenes'}`}
            </Button>
            
            {uploadMutation.isPending && (
              <Typography variant="caption" color="text.secondary">
                Subiendo imágenes, por favor espera...
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
        <Button onClick={handleCloseModal} color="inherit">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ManageImagesModal;