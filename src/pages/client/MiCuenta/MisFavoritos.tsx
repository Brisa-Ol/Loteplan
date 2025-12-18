import React from 'react';
import {
  Box, Typography, Paper, Card, CardMedia, CardContent, CardActions,
  Button, IconButton, Chip, Stack, Alert, Tooltip, Skeleton
} from '@mui/material';
import {
  Favorite as FavoriteIcon, Visibility as VisibilityIcon,
  Gavel as GavelIcon, SentimentDissatisfied, Event as EventIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import imagenService from '../../../Services/imagen.service';
import FavoritoService from '../../../Services/favorito.service';
import type { LoteDto } from '../../../types/dto/lote.dto';
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';

// 🟢 Importamos el hook y el componente genérico
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog/ConfirmDialog';

// --- Card Component (Interno) ---
const LoteFavoritoCard: React.FC<{
  lote: LoteDto;
  onRemove: (id: number) => void;
  onVerDetalle: (id: number) => void;
  isRemoving: boolean;
}> = ({ lote, onRemove, onVerDetalle, isRemoving }) => {
  
  const imagenPrincipal = lote.imagenes?.find(img => img.es_principal) || lote.imagenes?.[0];
  const imagenUrl = imagenService.resolveImageUrl(imagenPrincipal?.url);

  const getBadgeColor = (estado: string) => {
    if (estado === 'activa') return 'success';
    if (estado === 'pendiente') return 'warning';
    return 'default';
  };

  return (
    <Card sx={{ 
      height: '100%', display: 'flex', flexDirection: 'column', position: 'relative',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }
    }}>
      <Box sx={{ position: 'relative', height: 200, overflow: 'hidden' }}>
        <CardMedia
          component="img" height="100%" image={imagenUrl} alt={lote.nombre_lote} sx={{ objectFit: 'cover' }}
          onError={(e: any) => { e.target.src = '/assets/placeholder-lote.jpg'; }}
        />
        <Chip
          label={lote.estado_subasta.toUpperCase()}
          color={getBadgeColor(lote.estado_subasta) as any}
          size="small"
          sx={{ position: 'absolute', top: 10, right: 10, fontWeight: 'bold' }}
        />
        <Tooltip title="Quitar de favoritos">
          <IconButton
            onClick={() => onRemove(lote.id)}
            disabled={isRemoving}
            size="small"
            sx={{
              position: 'absolute', top: 10, left: 10,
              bgcolor: 'rgba(255, 255, 255, 0.85)',
              '&:hover': { bgcolor: '#fff', color: 'error.main' },
              color: 'error.light'
            }}
          >
            <FavoriteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Typography variant="h6" fontWeight="bold" noWrap gutterBottom title={lote.nombre_lote}>
          {lote.nombre_lote}
        </Typography>
        
        <Box sx={{ bgcolor: 'action.hover', p: 1, borderRadius: 1, textAlign: 'center', mb: 2 }}>
           <Typography variant="caption" color="text.secondary">PRECIO BASE</Typography>
           <Typography variant="h6" color="primary.main" fontWeight={700}>
             {FavoritoService.formatPrecio(Number(lote.precio_base))}
           </Typography>
        </Box>

        {lote.estado_subasta === 'pendiente' && lote.fecha_inicio && (
          <Stack direction="row" spacing={1} alignItems="center" color="warning.main">
            <EventIcon fontSize="small" />
            <Typography variant="caption" fontWeight={600}>
               Inicia: {new Date(lote.fecha_inicio).toLocaleDateString()}
            </Typography>
          </Stack>
        )}
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button 
          fullWidth variant="contained" disableElevation 
          startIcon={<VisibilityIcon />} 
          onClick={() => onVerDetalle(lote.id)}
        >
          Ver Detalle
        </Button>
      </CardActions>
    </Card>
  );
};

// --- Page Component ---
const MisFavoritos: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 1. Hook unificado de confirmación
  const confirmDialog = useConfirmDialog();

  // 2. Fetch de Mis Favoritos
  const { data: favoritos = [], isLoading, error } = useQuery<LoteDto[]>({
    queryKey: ['misFavoritos'],
    queryFn: async () => (await FavoritoService.getMisFavoritos()).data,
  });

  // 3. Mutación: Eliminar (Toggle)
  const removeFavoritoMutation = useMutation({
    mutationFn: (idLote: number) => FavoritoService.toggle(idLote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['misFavoritos'] });
      // Si tenemos el dato del modal (el ID), invalidamos también la query individual
      if (confirmDialog.data) {
        queryClient.invalidateQueries({ queryKey: ['favorito', confirmDialog.data] });
      }
      confirmDialog.close(); // ✅ Cerramos usando el hook
    },
    onError: () => alert('Error al eliminar favorito')
  });

  // Handler para abrir modal
  const handleRemoveClick = (id: number) => {
    confirmDialog.confirm('remove_favorite', id); // 👈 Pasamos el ID como data
  };

  // Handler de confirmación
  const handleConfirmDelete = () => {
    if (confirmDialog.data) {
        removeFavoritoMutation.mutate(confirmDialog.data);
    }
  };

  if (isLoading) return (
    <PageContainer>
      <Skeleton width={200} height={40} sx={{ mb: 4 }} />
      <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(280px, 1fr))" gap={3}>
        {[1,2,3,4].map(n => <Skeleton key={n} variant="rectangular" height={350} sx={{ borderRadius: 2 }} />)}
      </Box>
    </PageContainer>
  );

  if (error) return (
    <PageContainer>
      <Alert severity="error">No se pudieron cargar tus favoritos.</Alert>
    </PageContainer>
  );

  return (
    <PageContainer maxWidth="xl">
      <PageHeader title="Mis Favoritos" subtitle="Gestiona los lotes que sigues" />
      
      {favoritos.length > 0 && (
        <Stack direction="row" mb={4}>
           <Chip label={`${favoritos.length} Guardados`} color="primary" icon={<FavoriteIcon />} />
        </Stack>
      )}

      {favoritos.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center', bgcolor: 'grey.50', border: '2px dashed #ccc' }}>
          <SentimentDissatisfied sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom>Aún no tienes favoritos</Typography>
          <Button variant="contained" onClick={() => navigate('/lotes')} startIcon={<GavelIcon />} sx={{ mt: 2 }}>
            Explorar Lotes
          </Button>
        </Paper>
      ) : (
        <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(280px, 1fr))" gap={3} pb={4}>
          {favoritos.map(lote => (
            <LoteFavoritoCard 
              key={lote.id} 
              lote={lote} 
              onRemove={handleRemoveClick} 
              onVerDetalle={(id) => navigate(`/lotes/${id}`)}
              isRemoving={removeFavoritoMutation.isPending}
            />
          ))}
        </Box>
      )}

      {/* Diálogo Confirmación GENÉRICO */}
      <ConfirmDialog 
        controller={confirmDialog}
        onConfirm={handleConfirmDelete}
        isLoading={removeFavoritoMutation.isPending}
      />
    </PageContainer>
  );
};

export default MisFavoritos;