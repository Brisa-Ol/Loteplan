import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  CircularProgress, Typography, List, ListItem, ListItemAvatar,
  Avatar, ListItemText, IconButton, Tooltip, Paper, Divider, Alert, Box
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Delete as DeleteIcon, Image as ImageIcon } from '@mui/icons-material';

// 1. IMPORTAMOS TU COMPONENTE
import ImageUploadZone from '../../common/ImageUploadZone/ImageUploadZone';

import type { ProyectoDTO } from '../../../types/dto/proyecto.dto';

import adminImagenService from '../../../Services/adminImagen.service';
import imagenService from '../../../Services/imagen.service';
import { QueryHandler } from '../../common/QueryHandler/QueryHandler';
import type { IImagen } from '../../../types/dto/imagen.dto';

interface ManageImagesModalProps {
  open: boolean;
  onClose: () => void;
  proyecto: ProyectoDTO;
}

// Clave de query única para las imágenes de este proyecto
const getQueryKey = (proyectoId: number) => ['projectImages', proyectoId];

const ManageImagesModal: React.FC<ManageImagesModalProps> = ({
  open,
  onClose,
  proyecto
}) => {
  const queryClient = useQueryClient();
  const queryKey = getQueryKey(proyecto.id);

  // 2. Estado para los archivos "en preparación" (staged)
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // 1. Query para OBTENER las imágenes actuales del proyecto
  const { data: imagenes = [], isLoading, error } = useQuery<IImagen[], Error>({
    queryKey: queryKey,
    queryFn: () => imagenService.getImagesByProjectId(proyecto.id),
    enabled: open, // Solo se ejecuta si el modal está abierto
  });

  // 2. Mutación para BORRAR una imagen
  const deleteMutation = useMutation({
    mutationFn: (imagenId: number) => adminImagenService.softDelete(imagenId),
    onSuccess: () => {
      // Refresca la lista de imágenes en este modal
      queryClient.invalidateQueries({ queryKey: queryKey });
      // Refresca la tabla principal (para actualizar el conteo de imágenes)
      queryClient.invalidateQueries({ queryKey: ['adminAllProjects'] });
    },
    onError: (err: any) => {
      console.error("Error al borrar imagen", err);
      // Aquí podrías poner un snackbar si quisieras
    }
  });

  // 3. Mutación para SUBIR una nueva imagen
  const uploadMutation = useMutation({
    mutationFn: (formData: { file: File, descripcion: string }) =>
      adminImagenService.create(
        formData.file,
        formData.descripcion,
        proyecto.id, // id_proyecto
        null // id_lote
      ),
    onSuccess: () => {
      // Refresca ambas queries
      queryClient.invalidateQueries({ queryKey: queryKey });
      queryClient.invalidateQueries({ queryKey: ['adminAllProjects'] });
    },
    onError: (err: any) => {
      setUploadError(err.response?.data?.error || 'Error al subir una imagen.');
    }
  });


  const handleDeleteClick = (imagenId: number) => {
    // Evita borrar la última imagen si quieres (opcional)
    // if (imagenes.length <= 1) {
    //   alert("No puedes borrar la última imagen. Sube una nueva primero.");
    //   return;
    // }
    if (window.confirm('¿Seguro que deseas eliminar esta imagen?')) {
      deleteMutation.mutate(imagenId);
    }
  };

  // 4. Handler para subir los archivos preparados
  const handleUploadSubmit = async () => {
    if (stagedFiles.length === 0) return;
    
    setUploadError(null);
    const uploadPromises = stagedFiles.map(file => 
      uploadMutation.mutateAsync({
        file: file,
        descripcion: file.name || `Imagen de ${proyecto.nombre_proyecto}`
      })
    );

    try {
      await Promise.all(uploadPromises);
      // Si todas tienen éxito, limpia el área
      setStagedFiles([]);
    } catch (err) {
      console.error("Una o más imágenes fallaron al subir.", err);
      // El error individual ya es manejado por 'onError' de la mutación
    }
  };
  
  const handleCloseModal = () => {
    onClose();
    // Limpia el estado al cerrar
    setStagedFiles([]);
    setUploadError(null);
  };

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

  return (
    <Dialog open={open} onClose={handleCloseModal} maxWidth="md" fullWidth>
      <DialogTitle>
        Gestionar Imágenes de "{proyecto.nombre_proyecto}"
      </DialogTitle>
      
      <DialogContent dividers>
        
        {/* SECCIÓN 1: IMÁGENES ACTUALES */}
        <Typography variant="h6" gutterBottom>Imágenes Actuales</Typography>
        <QueryHandler isLoading={isLoading} error={error as Error | null}>
          {imagenes.length === 0 ? (
            <Alert severity="info">Este proyecto no tiene imágenes.</Alert>
          ) : (
            <List dense>
              {imagenes.map((img) => (
                <ListItem
                  key={img.id}
                  secondaryAction={
                    <Tooltip title="Eliminar Imagen">
                      <IconButton 
                        edge="end" 
                        color="error"
                        onClick={() => handleDeleteClick(img.id)}
                        disabled={deleteMutation.isPending && deleteMutation.variables === img.id}
                      >
                        {deleteMutation.isPending && deleteMutation.variables === img.id 
                          ? <CircularProgress size={20} color="inherit" />
                          : <DeleteIcon />}
                      </IconButton>
                    </Tooltip>
                  }
                >
                  <ListItemAvatar>
                    <Avatar variant="rounded" src={`${API_BASE_URL}${img.url}`}>
                      <ImageIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={img.descripcion || `Imagen ID: ${img.id}`}
                    secondary={`${API_BASE_URL}${img.url}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </QueryHandler>
        
        <Divider sx={{ my: 3 }} />

        {/* 5. SECCIÓN 2: USANDO TU ImageUploadZone */}
        <Typography variant="h6" gutterBottom>Añadir Nuevas Imágenes</Typography>
        <Paper variant="outlined" sx={{ p: 2 }}>
          
          <ImageUploadZone
            images={stagedFiles}
            onChange={setStagedFiles}
            maxFiles={10} // Límite de subida en lote
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