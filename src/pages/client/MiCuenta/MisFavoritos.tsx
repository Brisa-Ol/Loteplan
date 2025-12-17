import React, { useState } from 'react';
import {
  Box, Typography, Paper, Card, CardMedia, CardContent, CardActions,
  Button, IconButton, Chip, Stack, Alert, Tooltip, Dialog,
  DialogTitle, DialogContent, DialogActions, Skeleton, useTheme
} from '@mui/material';
import {
  Favorite as FavoriteIcon, Visibility as VisibilityIcon,
  Gavel as GavelIcon, DeleteOutline as DeleteIcon,
  SentimentDissatisfied, Event as EventIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import imagenService from '../../../Services/imagen.service';
import FavoritoService from '../../../Services/favorito.service';
import type { LoteDto } from '../../../types/dto/lote.dto';
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';

// --- Card Component (Interno para limpieza) ---
const LoteFavoritoCard: React.FC<{
  lote: LoteDto;
  onRemove: (id: number) => void;
  onVerDetalle: (id: number) => void;
  isRemoving: boolean;
}> = ({ lote, onRemove, onVerDetalle, isRemoving }) => {
  const theme = useTheme();
  
  const imagenPrincipal = lote.imagenes?.find(img => img.es_principal) || lote.imagenes?.[0];
  const imagenUrl = imagenService.resolveImageUrl(imagenPrincipal?.url);

  // Helper visual para estado
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
          component="img"
          height="100%"
          image={imagenUrl}
          alt={lote.nombre_lote}
          sx={{ objectFit: 'cover' }}
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
              bgcolor: 'rgba(255,255,255,0.85)',
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
  const theme = useTheme();

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [loteAEliminar, setLoteAEliminar] = useState<number | null>(null);

  // 1. Fetch de Mis Favoritos
  const { data: favoritos = [], isLoading, error } = useQuery<LoteDto[]>({
    queryKey: ['misFavoritos'],
    queryFn: async () => (await FavoritoService.getMisFavoritos()).data,
  });

  // 2. Mutación: Eliminar (Toggle)
  const removeFavoritoMutation = useMutation({
    mutationFn: (idLote: number) => FavoritoService.toggle(idLote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['misFavoritos'] });
      // También invalidamos el estado individual del botón si existe en caché
      if (loteAEliminar) {
        queryClient.invalidateQueries({ queryKey: ['favorito', loteAEliminar] });
      }
      setConfirmDialogOpen(false);
      setLoteAEliminar(null);
    },
    onError: () => alert('Error al eliminar favorito')
  });

  const handleRemoveClick = (id: number) => {
    setLoteAEliminar(id);
    setConfirmDialogOpen(true);
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

      {/* Diálogo Confirmación */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle display="flex" alignItems="center" gap={1}>
           <DeleteIcon color="error" /> ¿Quitar de favoritos?
        </DialogTitle>
        <DialogContent>
          <Typography>El lote se eliminará de tu lista de seguimiento.</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmDialogOpen(false)} color="inherit">Cancelar</Button>
          <Button 
            onClick={() => loteAEliminar && removeFavoritoMutation.mutate(loteAEliminar)} 
            color="error" variant="contained" 
            disabled={removeFavoritoMutation.isPending}
          >
            {removeFavoritoMutation.isPending ? 'Quitando...' : 'Sí, quitar'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default MisFavoritos;