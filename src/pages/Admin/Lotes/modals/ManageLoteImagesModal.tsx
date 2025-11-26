import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  CircularProgress, Typography, List, ListItem, ListItemAvatar,
  Avatar, ListItemText, IconButton, Tooltip, Paper, Divider, Alert, Box
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Delete as DeleteIcon, Image as ImageIcon } from '@mui/icons-material';

import ImageUploadZone from '../../../../components/common/ImageUploadZone/ImageUploadZone';
import { QueryHandler } from '../../../../components/common/QueryHandler/QueryHandler';

import type { LoteDto } from '../../../../types/dto/lote.dto';
import type { ImagenDto } from '../../../../types/dto/imagen.dto';
import imagenService from '../../../../Services/imagen.service';

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

  // 1. Obtener imágenes (Usando getByLote)
  const { data: imagenes = [], isLoading, error } = useQuery<ImagenDto[]>({
    queryKey: queryKey,
    queryFn: async () => {
        const res = await imagenService.getByLote(lote.id); // ✅ Corregido nombre del método
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
    onError: (err: any) => setUploadError(err.message)
  });

  const handleUploadSubmit = async () => {
    if (stagedFiles.length === 0) return;
    setUploadError(null);
    const promises = stagedFiles.map(file => uploadMutation.mutateAsync(file));
    try {
      await Promise.all(promises);
      setStagedFiles([]);
    } catch (err) { console.error(err); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Imágenes de "{lote.nombre_lote}"</DialogTitle>
      <DialogContent dividers>
        
        <Typography variant="subtitle2" gutterBottom>Galería Actual</Typography>
        <QueryHandler isLoading={isLoading} error={error as Error}>
          {imagenes.length === 0 ? <Alert severity="info">Sin imágenes.</Alert> : (
            <List dense sx={{ maxHeight: 200, overflow: 'auto', bgcolor: '#f5f5f5', borderRadius: 1 }}>
                {imagenes.map(img => (
                    <ListItem key={img.id} secondaryAction={
                        <IconButton edge="end" color="error" onClick={() => deleteMutation.mutate(img.id)}>
                            <DeleteIcon />
                        </IconButton>
                    }>
                        <ListItemAvatar>
                            <Avatar src={imagenService.resolveImageUrl(img.url)} variant="rounded"><ImageIcon /></Avatar>
                        </ListItemAvatar>
                        <ListItemText primary={img.descripcion || 'Sin descripción'} />
                    </ListItem>
                ))}
            </List>
          )}
        </QueryHandler>

        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle2" gutterBottom>Subir Nuevas</Typography>
        <ImageUploadZone 
            images={stagedFiles} 
            onChange={setStagedFiles} 
            maxFiles={5} 
            disabled={uploadMutation.isPending} 
        />
        
        {uploadError && <Alert severity="error" sx={{ mt: 1 }}>{uploadError}</Alert>}
        
        <Box mt={2} display="flex" justifyContent="flex-end">
            <Button 
                variant="contained" 
                onClick={handleUploadSubmit}
                disabled={stagedFiles.length === 0 || uploadMutation.isPending}
            >
                {uploadMutation.isPending ? 'Subiendo...' : 'Subir Imágenes'}
            </Button>
        </Box>

      </DialogContent>
      <DialogActions><Button onClick={onClose}>Cerrar</Button></DialogActions>
    </Dialog>
  );
};

export default ManageLoteImagesModal;