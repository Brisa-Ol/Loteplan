// src/pages/Admin/Inventario/modals/ManageLoteImagesModal.tsx

import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Typography, List, ListItem, ListItemAvatar, Avatar, ListItemText, 
  IconButton, Divider, Alert, Box, CircularProgress, useTheme, alpha
} from '@mui/material';
import { Delete as DeleteIcon, Image as ImageIcon, Close as CloseIcon, Collections } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Componentes comunes
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
  const theme = useTheme();
  const queryClient = useQueryClient();
  const queryKey = ['loteImages', lote.id];

  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // 1. Obtener imágenes
  const { data: imagenes = [], isLoading, error } = useQuery<ImagenDto[]>({
    queryKey: queryKey,
    queryFn: async () => {
        const res = await imagenService.getAllByLote(lote.id);
        return res.data; 
    },
    enabled: open,
  });

  // 2. Borrar imagen
  const deleteMutation = useMutation({
    mutationFn: (id: number) => imagenService.softDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
    }
  });

  // 3. Subir imagen
  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      imagenService.create({
        file: file,
        descripcion: `Lote: ${lote.nombre_lote}`,
        id_lote: lote.id,
      }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey });
        queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
    },
    onError: (err: any) => {
        const msg = err.response?.data?.error || err.message || 'Error al subir imagen';
        setUploadError(msg);
    }
  });

  const handleUploadSubmit = async () => {
    if (stagedFiles.length === 0) return;
    setUploadError(null);
    
    const promises = stagedFiles.map(file => uploadMutation.mutateAsync(file));
    
    try {
      await Promise.all(promises);
      setStagedFiles([]); 
    } catch (err) { 
        console.error("Error en carga masiva", err); 
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, boxShadow: theme.shadows[10] } }}
    >
      {/* HEADER */}
      <DialogTitle sx={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        pb: 2, pt: 3, px: 3,
        bgcolor: alpha(theme.palette.primary.main, 0.04)
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
            <Collections />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ lineHeight: 1.2 }}>
              Imágenes del Lote
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Lote: <strong>{lote.nombre_lote}</strong>
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent sx={{ p: 4 }}>
        
        {/* --- SECCIÓN: GALERÍA ACTUAL --- */}
        <Typography variant="subtitle2" gutterBottom fontWeight="bold" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
          Galería Actual
        </Typography>
        
        <QueryHandler isLoading={isLoading} error={error as Error}>
          {imagenes.length === 0 ? (
            <Alert severity="info" variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
                Este lote no tiene imágenes cargadas.
            </Alert>
          ) : (
            <List 
                dense 
                sx={{ 
                    maxHeight: 250, 
                    overflow: 'auto', 
                    bgcolor: 'background.paper', 
                    border: '1px solid',
                    borderColor: 'divider',
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
                                size="small"
                            >
                                <DeleteIcon />
                            </IconButton>
                        }
                    >
                        <ListItemAvatar>
                            <Avatar 
                                src={imagenService.resolveImageUrl(img.url)} 
                                variant="rounded"
                                sx={{ width: 56, height: 56, mr: 2, border: '1px solid', borderColor: 'divider' }}
                            >
                                <ImageIcon />
                            </Avatar>
                        </ListItemAvatar>
                        
                        <ListItemText 
                            primary={img.descripcion || 'Imagen sin descripción'} 
                            secondary={`ID: ${img.id} ${img.es_principal ? '• (Principal)' : ''}`}
                            primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                        />
                    </ListItem>
                ))}
            </List>
          )}
        </QueryHandler>

        <Divider sx={{ my: 3 }} />
        
        {/* --- SECCIÓN: SUBIR NUEVAS --- */}
        <Typography variant="subtitle2" gutterBottom fontWeight="bold" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
          Subir Nuevas Imágenes
        </Typography>
        
        <ImageUploadZone 
            images={stagedFiles} 
            onChange={setStagedFiles} 
            maxFiles={5} 
            disabled={uploadMutation.isPending} 
        />
        
        {uploadError && (
            <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                {uploadError}
            </Alert>
        )}
        
        <Box mt={2} display="flex" justifyContent="flex-end" gap={2} alignItems="center">
            {uploadMutation.isPending && <CircularProgress size={24} />}
            <Button 
                variant="contained" 
                color="primary"
                onClick={handleUploadSubmit}
                disabled={stagedFiles.length === 0 || uploadMutation.isPending}
                sx={{ borderRadius: 2, fontWeight: 700 }}
            >
                {uploadMutation.isPending ? 'Subiendo...' : `Subir ${stagedFiles.length > 0 ? stagedFiles.length : ''} Imágenes`}
            </Button>
        </Box>

      </DialogContent>
      
      <Divider />

      <DialogActions sx={{ p: 3, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
        <Button onClick={onClose} color="inherit" sx={{ borderRadius: 2 }}>
            Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ManageLoteImagesModal;