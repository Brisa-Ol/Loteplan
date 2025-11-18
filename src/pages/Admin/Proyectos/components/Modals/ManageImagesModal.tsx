// src/components/Admin/Proyectos/Modals/ManageImagesModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  CircularProgress, Typography, List, ListItem, ListItemAvatar,
  Avatar, ListItemText, IconButton, Tooltip, Paper, Divider, Alert, Box
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Delete as DeleteIcon, Image as ImageIcon } from '@mui/icons-material';
import { imagenService } from '../../../../../Services/imagen.service';
import type { CreateImagenDTO, ImagenDTO } from '../../../../../types/dto/imagen.dto';
import { QueryHandler } from '../../../../../components/common/QueryHandler/QueryHandler';
import ImageUploadZone from '../../../../../components/common/ImageUploadZone/ImageUploadZone';
import type { ProyectoDTO } from '../../../../../types/dto/proyecto.dto';



interface ManageImagesModalProps {
  open: boolean;
  onClose: () => void;
  proyecto: ProyectoDTO;
}

/**
 * 🎯 PROPÓSITO: Modal para gestionar las imágenes de un proyecto
 * 
 * FUNCIONALIDADES:
 * 1. Ver todas las imágenes actuales del proyecto
 * 2. Eliminar imágenes existentes
 * 3. Subir nuevas imágenes (una o varias a la vez)
 * 
 * FLUJO DE TRABAJO:
 * 1. Al abrir, carga las imágenes del proyecto desde la API
 * 2. Muestra las imágenes en una lista con opción de eliminar
 * 3. Permite seleccionar nuevas imágenes (zona de arrastrar/soltar)
 * 4. Sube las imágenes seleccionadas al servidor
 * 5. Refresca la lista automáticamente después de cada operación
 */

// Query key única para este proyecto específico
const getQueryKey = (proyectoId: number) => ['projectImages', proyectoId];

const ManageImagesModal: React.FC<ManageImagesModalProps> = ({
  open,
  onClose,
  proyecto
}) => {
  const queryClient = useQueryClient();
  const queryKey = getQueryKey(proyecto.id);

  // 📦 ESTADO LOCAL
  const [stagedFiles, setStagedFiles] = useState<File[]>([]); // Archivos preparados para subir
  const [uploadError, setUploadError] = useState<string | null>(null); // Errores de subida
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null); // ID de imagen siendo eliminada

  // 📥 QUERY: Obtener imágenes actuales del proyecto
  const { data: imagenes = [], isLoading, error } = useQuery<ImagenDTO[], Error>({
    queryKey: queryKey,
    queryFn: () => imagenService.getByProjectId(proyecto.id),
    enabled: open, // Solo carga cuando el modal está abierto
  });

  // 🗑️ MUTATION: Eliminar una imagen
  const deleteMutation = useMutation({
    mutationFn: (imagenId: number) => imagenService.softDelete(imagenId),
    onMutate: (imagenId) => {
      // Se ejecuta ANTES de la petición: marca la imagen como "eliminando"
      setDeletingImageId(imagenId);
    },
    onSuccess: () => {
      // Se ejecuta después del éxito: refresca las queries
      queryClient.invalidateQueries({ queryKey: queryKey }); // Refresca imágenes del modal
      queryClient.invalidateQueries({ queryKey: ['adminAllProjects'] }); // Refresca tabla principal
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
      // Prepara los datos según el DTO CreateImagenDTO
      const imagenData: CreateImagenDTO = {
        descripcion: formData.descripcion,
        id_proyecto: proyecto.id,
        id_lote: null,
      };
      
      // Usa el servicio de imagen.service.ts que ya tienes
      return imagenService.create(formData.file, imagenData);
    },
    onSuccess: () => {
      // Refresca ambas queries después de subir exitosamente
      queryClient.invalidateQueries({ queryKey: queryKey });
      queryClient.invalidateQueries({ queryKey: ['adminAllProjects'] });
    },
    onError: (err: any) => {
      setUploadError(err.response?.data?.error || 'Error al subir una imagen.');
    }
  });

  // 🎬 HANDLERS: Funciones de interacción

  /**
   * Maneja el click en el botón de eliminar
   */
  const handleDeleteClick = (imagenId: number) => {
    if (window.confirm('¿Seguro que deseas eliminar esta imagen?')) {
      deleteMutation.mutate(imagenId);
    }
  };

  /**
   * Maneja la subida de todos los archivos preparados (staged)
   * 
   * PROCESO:
   * 1. Verifica que haya archivos seleccionados
   * 2. Crea una promesa por cada archivo
   * 3. Sube todos en paralelo con Promise.all
   * 4. Limpia el área de staging si todo sale bien
   */
  const handleUploadSubmit = async () => {
    if (stagedFiles.length === 0) return;
    
    setUploadError(null);
    
    try {
      // Sube todas las imágenes en paralelo
      await Promise.all(
        stagedFiles.map(file => 
          uploadMutation.mutateAsync({
            file: file,
            descripcion: file.name || `Imagen de ${proyecto.nombre_proyecto}`
          })
        )
      );
      
      // Si todas tienen éxito, limpia el área de staging
      setStagedFiles([]);
    } catch (err) {
      console.error("Una o más imágenes fallaron al subir.", err);
      // El error individual ya es manejado por 'onError' de la mutación
    }
  };
  
  /**
   * Maneja el cierre del modal
   * Limpia todos los estados locales
   */
  const handleCloseModal = () => {
    setStagedFiles([]);
    setUploadError(null);
    setDeletingImageId(null);
    onClose();
  };

  /**
   * Efecto de limpieza automática cuando se cierra el modal
   * Previene estados residuales entre aperturas
   */
  useEffect(() => {
    if (!open) {
      setStagedFiles([]);
      setUploadError(null);
      setDeletingImageId(null);
    }
  }, [open]);

  // 🖼️ URL base para mostrar las imágenes
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

  return (
    <Dialog open={open} onClose={handleCloseModal} maxWidth="md" fullWidth>
      <DialogTitle>
        Gestionar Imágenes de "{proyecto.nombre_proyecto}"
      </DialogTitle>
      
      <DialogContent dividers>
        
        {/* ═══════════════════════════════════════════════════════
            SECCIÓN 1: IMÁGENES ACTUALES
            Muestra las imágenes ya subidas con opción de eliminar
            ═══════════════════════════════════════════════════════ */}
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
                      src={`${API_BASE_URL}${img.url}`}
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
                          Subida: {new Date(img.createdAt).toLocaleDateString()}
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

        {/* ═══════════════════════════════════════════════════════
            SECCIÓN 2: AÑADIR NUEVAS IMÁGENES
            Zona para seleccionar y subir nuevas imágenes
            ═══════════════════════════════════════════════════════ */}
        <Typography variant="h6" gutterBottom>
          Añadir Nuevas Imágenes
        </Typography>
        
        <Paper variant="outlined" sx={{ p: 2 }}>
          {/* Componente de zona de arrastrar/soltar */}
          <ImageUploadZone
            images={stagedFiles}
            onChange={setStagedFiles}
            maxFiles={10} // Límite de archivos por carga
            disabled={uploadMutation.isPending}
          />
          
          {/* Botón de subida y estado */}
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
          
          {/* Alerta de error si ocurre */}
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