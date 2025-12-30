// src/pages/Admin/Inventario/modals/ManageLoteImagesModal.tsx

import React, { useState } from 'react';
import {
  Typography, List, ListItem, ListItemAvatar, Avatar, ListItemText, 
  IconButton, Divider, Alert, Box, useTheme, Chip, Stack
} from '@mui/material';
import { Delete as DeleteIcon, Image as ImageIcon, Collections, CloudUpload } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Componentes comunes
import ImageUploadZone from '../../../../components/common/ImageUploadZone/ImageUploadZone';
import { QueryHandler } from '../../../../components/common/QueryHandler/QueryHandler';
import { BaseModal } from '../../../../components/common/BaseModal/BaseModal';
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
    queryFn: async () => (await imagenService.getAllByLote(lote.id)).data,
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

  // Handler para el botón de confirmar (Subida masiva)
  const handleConfirmUpload = async () => {
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

  const handleClose = () => {
      setStagedFiles([]);
      setUploadError(null);
      onClose();
  };

  const sectionTitleSx = { 
      textTransform: 'uppercase', letterSpacing: 1, fontWeight: 800, 
      color: 'text.secondary', fontSize: '0.7rem', mb: 1.5,
      display: 'flex', alignItems: 'center', gap: 1
  };

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      title="Imágenes del Lote"
      subtitle={`Administrar galería de: ${lote.nombre_lote}`}
      icon={<Collections />}
      headerColor="primary"
      maxWidth="md"
      
      // Configuración del Footer (Acción de Subida)
      confirmText={stagedFiles.length > 0 ? `Subir ${stagedFiles.length} Imágenes` : 'Subir Imágenes'}
      confirmButtonIcon={<CloudUpload />}
      onConfirm={handleConfirmUpload}
      disableConfirm={stagedFiles.length === 0 || uploadMutation.isPending}
      isLoading={uploadMutation.isPending}
      cancelText="Cerrar"
      
      // Extra en Header: Contador
      headerExtra={
        <Chip 
            label={`${imagenes.length} archivos`} 
            size="small" 
            color="primary" 
            variant="outlined" 
            sx={{ fontWeight: 700, borderRadius: 1.5 }}
        />
      }
    >
        <Stack spacing={3}>
            
            {/* SECCIÓN: GALERÍA ACTUAL */}
            <Box>
                <Typography sx={sectionTitleSx}><Collections fontSize="inherit"/> Galería Actual</Typography>
                
                <QueryHandler isLoading={isLoading} error={error as Error}>
                    {imagenes.length === 0 ? (
                        <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
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
                                            disabled={deleteMutation.isPending || uploadMutation.isPending}
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
            </Box>

            <Divider />
            
            {/* SECCIÓN: SUBIR NUEVAS */}
            <Box>
                <Typography sx={sectionTitleSx}><CloudUpload fontSize="inherit"/> Subir Nuevas Imágenes</Typography>
                
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
            </Box>
        </Stack>
    </BaseModal>
  );
};

export default ManageLoteImagesModal;