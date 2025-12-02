// src/pages/Admin/Lotes/components/ManageLoteImagesModal.tsx

import React, { useState } from 'react';
import {
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button,
  Typography, 
  List, 
  ListItem, 
  ListItemAvatar,
  Avatar, 
  ListItemText, 
  IconButton, 
  Divider, 
  Alert, 
  Box,
  Skeleton,
  CircularProgress
} from '@mui/material';
import { Delete as DeleteIcon, Image as ImageIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Componentes comunes (Asegúrate que la ruta sea correcta)
import ImageUploadZone from '../../../../components/common/ImageUploadZone/ImageUploadZone';
import { QueryHandler } from '../../../../components/common/QueryHandler/QueryHandler';
import type { LoteDto } from '../../../../types/dto/lote.dto';
import imagenService from '../../../../Services/imagen.service';
import type { ImagenDto } from '../../../../types/dto/imagen.dto';



interface ManageLoteImagesModalProps {
  open: boolean;
  onClose: () => void;
  lote: LoteDto;
}

const ManageLoteImagesModal: React.FC<ManageLoteImagesModalProps> = ({
  open, onClose, lote
}) => {
  const queryClient = useQueryClient();
  const queryKey = ['loteImages', lote.id];

  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // =========================================================
  // 1. Obtener imágenes (Query)
  // =========================================================
  const { data: imagenes = [], isLoading, error } = useQuery<ImagenDto[]>({
    queryKey: queryKey,
    queryFn: async () => {
        // ✅ CORRECCIÓN: Usamos 'getAllByLote' que coincide con el servicio
        const res = await imagenService.getAllByLote(lote.id);
        return res.data; 
    },
    enabled: open, // Solo carga si el modal está abierto
  });

  // =========================================================
  // 2. Borrar imagen (Mutation)
  // =========================================================
  const deleteMutation = useMutation({
    mutationFn: (id: number) => imagenService.softDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      // También invalidamos la lista general de lotes por si mostramos la imagen principal allí
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
    }
  });

  // =========================================================
  // 3. Subir imagen (Mutation)
  // =========================================================
  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      imagenService.create({
        file: file,
        descripcion: `Lote: ${lote.nombre_lote}`,
        id_lote: lote.id, // Asociación correcta al lote
        // id_proyecto: null (Opcional, ya es null por defecto)
      }),
    onSuccess: () => {
        // Refrescamos las imágenes
        queryClient.invalidateQueries({ queryKey });
        queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
    },
    onError: (err: any) => {
        const msg = err.response?.data?.error || err.message || 'Error al subir imagen';
        setUploadError(msg);
    }
  });

  // Manejador de subida masiva
  const handleUploadSubmit = async () => {
    if (stagedFiles.length === 0) return;
    setUploadError(null);
    
    // Ejecutar subidas en paralelo
    const promises = stagedFiles.map(file => uploadMutation.mutateAsync(file));
    
    try {
      await Promise.all(promises);
      setStagedFiles([]); // Limpiar zona de carga al finalizar
    } catch (err) { 
        // El error ya se maneja en el onError de la mutación individual, 
        // pero aquí evitamos que rompa la UI
        console.error("Error en carga masiva", err); 
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Imágenes de "{lote.nombre_lote}"
      </DialogTitle>
      
      <DialogContent dividers>
        
        {/* --- SECCIÓN: GALERÍA ACTUAL --- */}
        <Typography variant="subtitle2" gutterBottom fontWeight="bold">
          Galería Actual
        </Typography>
        
        <QueryHandler isLoading={isLoading} error={error as Error}>
          {imagenes.length === 0 ? (
            <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
                Este lote no tiene imágenes cargadas.
            </Alert>
          ) : (
            <List 
                dense 
                sx={{ 
                    maxHeight: 250, 
                    overflow: 'auto', 
                    bgcolor: 'background.paper', 
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                    mb: 2
                }}
            >
                {imagenes.map(img => (
                    <ListItem 
                        key={img.id}
                        divider
                        secondaryAction={
                            <IconButton 
                                edge="end" 
                                color="error" 
                                onClick={() => deleteMutation.mutate(img.id)}
                                disabled={deleteMutation.isPending}
                            >
                                <DeleteIcon />
                            </IconButton>
                        }
                    >
                        <ListItemAvatar>
                            {/* ✅ USO CORRECTO: resolveImageUrl para ver la imagen real */}
                            <Avatar 
                                src={imagenService.resolveImageUrl(img.url)} 
                                variant="rounded"
                                sx={{ width: 56, height: 56, mr: 2 }}
                            >
                                <ImageIcon />
                            </Avatar>
                        </ListItemAvatar>
                        
                        <ListItemText 
                            primary={img.descripcion || 'Imagen sin descripción'} 
                            secondary={`ID: ${img.id} ${img.es_principal ? '• (Principal)' : ''}`}
                        />
                    </ListItem>
                ))}
            </List>
          )}
        </QueryHandler>

        <Divider sx={{ my: 3 }} />
        
        {/* --- SECCIÓN: SUBIR NUEVAS --- */}
        <Typography variant="subtitle2" gutterBottom fontWeight="bold">
          Subir Nuevas Imágenes
        </Typography>
        
        <ImageUploadZone 
            images={stagedFiles} 
            onChange={setStagedFiles} 
            maxFiles={5} 
            disabled={uploadMutation.isPending} 
        />
        
        {/* Feedback de error */}
        {uploadError && (
            <Alert severity="error" sx={{ mt: 2 }}>
                {uploadError}
            </Alert>
        )}
        
        <Box mt={2} display="flex" justifyContent="flex-end" gap={2}>
            {uploadMutation.isPending && <CircularProgress size={24} />}
            <Button 
                variant="contained" 
                onClick={handleUploadSubmit}
                disabled={stagedFiles.length === 0 || uploadMutation.isPending}
            >
                {uploadMutation.isPending ? 'Subiendo...' : `Subir ${stagedFiles.length > 0 ? stagedFiles.length : ''} Imágenes`}
            </Button>
        </Box>

      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="inherit">
            Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ManageLoteImagesModal;