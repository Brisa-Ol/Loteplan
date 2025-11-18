import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  CircularProgress, Typography, List, ListItem, ListItemAvatar,
  Avatar, ListItemText, IconButton, Tooltip, Paper, Divider, Alert, Box
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Delete as DeleteIcon, Image as ImageIcon } from '@mui/icons-material';

// 1. Importamos tu componente de subida múltiple
import ImageUploadZone from '../../../../components/common/ImageUploadZone/ImageUploadZone';

import type { LoteDTO } from '../../../../types/dto/lote.dto';

import adminImagenService from '../../../../Services/adminImagen.service';
import { imagenService } from '../../../../Services/imagen.service'; // Para leer imágenes
import { QueryHandler } from '../../../../components/common/QueryHandler/QueryHandler';
import type { IImagen } from '../../../../types/dto/imagen.dto';

interface ManageLoteImagesModalProps {
  open: boolean;
  onClose: () => void;
  lote: LoteDTO;
}

// Clave de query única para las imágenes de este LOTE
const getQueryKey = (loteId: number) => ['loteImages', loteId];

const ManageLoteImagesModal: React.FC<ManageLoteImagesModalProps> = ({
  open,
  onClose,
  lote
}) => {
  const queryClient = useQueryClient();
  const queryKey = getQueryKey(lote.id);

  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // 1. Query para OBTENER las imágenes actuales del LOTE
  const { data: imagenes = [], isLoading, error } = useQuery<IImagen[], Error>({
    queryKey: queryKey,
    // ❗ Apunta al servicio de LOTE
    queryFn: () => imagenService.getImagesByLoteId(lote.id),
    enabled: open, // Solo se ejecuta si el modal está abierto
  });

  // 2. Mutación para BORRAR una imagen (igual)
  const deleteMutation = useMutation({
    mutationFn: (imagenId: number) => adminImagenService.softDelete(imagenId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey });
      queryClient.invalidateQueries({ queryKey: ['adminAllLotes'] }); // Para refrescar conteo
    },
    onError: (err: any) => {
      console.error("Error al borrar imagen", err);
    }
  });

  // 3. Mutación para SUBIR una nueva imagen
  const uploadMutation = useMutation({
    mutationFn: (formData: { file: File, descripcion: string }) =>
      adminImagenService.create(
        formData.file,
        formData.descripcion,
        null,       // ❗ id_proyecto es null
        lote.id     // ❗ id_lote es el ID del lote
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey });
      queryClient.invalidateQueries({ queryKey: ['adminAllLotes'] });
    },
    onError: (err: any) => {
      setUploadError(err.response?.data?.error || 'Error al subir una imagen.');
    }
  });


  const handleDeleteClick = (imagenId: number) => {
    if (window.confirm('¿Seguro que deseas eliminar esta imagen?')) {
      deleteMutation.mutate(imagenId);
    }
  };

  const handleUploadSubmit = async () => {
    if (stagedFiles.length === 0) return;
    
    setUploadError(null);
    const uploadPromises = stagedFiles.map(file => 
      uploadMutation.mutateAsync({
        file: file,
        descripcion: file.name || `Imagen de ${lote.nombre_lote}`
      })
    );

    try {
      await Promise.all(uploadPromises);
      setStagedFiles([]); // Limpia el área
    } catch (err) {
      console.error("Una o más imágenes fallaron al subir.", err);
    }
  };
  
  const handleCloseModal = () => {
    onClose();
    setStagedFiles([]);
    setUploadError(null);
  };

  // Asumo que tienes VITE_API_BASE_URL en tu .env para ver las imágenes
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

  return (
    <Dialog open={open} onClose={handleCloseModal} maxWidth="md" fullWidth>
      <DialogTitle>
        Gestionar Imágenes de "{lote.nombre_lote}"
      </DialogTitle>
      
      <DialogContent dividers>
        
        {/* SECCIÓN 1: IMÁGENES ACTUALES */}
        <Typography variant="h6" gutterBottom>Imágenes Actuales</Typography>
        <QueryHandler isLoading={isLoading} error={error as Error | null}>
          {imagenes.length === 0 ? (
            <Alert severity="info">Este lote no tiene imágenes.</Alert>
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

        {/* SECCIÓN 2: USANDO TU ImageUploadZone */}
        <Typography variant="h6" gutterBottom>Añadir Nuevas Imágenes</Typography>
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

export default ManageLoteImagesModal;