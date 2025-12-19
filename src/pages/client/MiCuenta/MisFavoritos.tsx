import React from 'react';
import {
  Box, Typography, Card, CardMedia, CardContent, CardActions,
  Button, IconButton, Chip, Stack, Alert, Tooltip, Skeleton,
  useTheme, alpha, Divider
} from '@mui/material';
import {
  Favorite as FavoriteIcon, 
  Visibility as VisibilityIcon,
  Gavel as GavelIcon, 
  SentimentDissatisfied, 
  Event as EventIcon,
  LocationOn,
  DeleteOutline // Usaremos un icono más claro para la acción de "Borrar" del favorito si se prefiere, o mantenemos el corazón
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

// --- Card Component (Interno - Estilizado) ---
const LoteFavoritoCard: React.FC<{
  lote: LoteDto;
  onRemove: (id: number) => void;
  onVerDetalle: (id: number) => void;
  isRemoving: boolean;
}> = ({ lote, onRemove, onVerDetalle, isRemoving }) => {
  const theme = useTheme();
  
  const imagenPrincipal = lote.imagenes?.find(img => img.es_principal) || lote.imagenes?.[0];
  const imagenUrl = imagenService.resolveImageUrl(imagenPrincipal?.url);

  const getBadgeColor = (estado: string) => {
    if (estado === 'activa') return 'success';
    if (estado === 'pendiente') return 'warning';
    return 'default';
  };

  return (
    <Card 
      elevation={0} // Empezamos plano
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        position: 'relative',
        borderRadius: 3, // 12px según tu theme
        border: `1px solid ${theme.palette.divider}`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': { 
          transform: 'translateY(-4px)', 
          boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
          borderColor: 'primary.main'
        }
      }}
    >
      {/* Imagen Header */}
      <Box sx={{ position: 'relative', height: 220, overflow: 'hidden' }}>
        <CardMedia
          component="img" 
          height="100%" 
          image={imagenUrl} 
          alt={lote.nombre_lote} 
          sx={{ objectFit: 'cover' }}
          onError={(e: any) => { e.target.src = '/assets/placeholder-lote.jpg'; }}
        />
        
        {/* Overlay Gradiente para mejorar lectura de textos sobre imagen */}
        <Box sx={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0) 100%)',
          pointerEvents: 'none'
        }} />

        {/* Badge de Estado */}
        <Chip
          label={lote.estado_subasta.toUpperCase()}
          color={getBadgeColor(lote.estado_subasta) as any}
          size="small"
          sx={{ 
            position: 'absolute', top: 12, right: 12, 
            fontWeight: 700, boxShadow: 2 
          }}
        />

        {/* Botón Favorito (Toggle) */}
        <Tooltip title="Quitar de favoritos">
          <IconButton
            onClick={() => onRemove(lote.id)}
            disabled={isRemoving}
            sx={{
              position: 'absolute', top: 12, left: 12,
              bgcolor: 'background.paper',
              color: 'error.main', // Rojo porque YA es favorito
              boxShadow: 2,
              '&:hover': { 
                bgcolor: 'error.main', 
                color: 'white' 
              }
            }}
          >
            <FavoriteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Contenido */}
      <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
        
        {/* Título */}
        <Typography variant="h6" fontWeight={700} noWrap gutterBottom title={lote.nombre_lote}>
          {lote.nombre_lote}
        </Typography>

        {/* Ubicación (Simulada o real si la tienes en el DTO) */}
        <Stack direction="row" spacing={0.5} alignItems="center" mb={2} color="text.secondary">
           <LocationOn fontSize="small" sx={{ fontSize: 16 }} />
           <Typography variant="body2" noWrap>
             Ubicación del Lote {/* Reemplazar con lote.ubicacion si existe */}
           </Typography>
        </Stack>
        
        <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />

        {/* Precio */}
        <Box>
           <Typography variant="caption" color="text.secondary" fontWeight={600} letterSpacing={0.5}>
             PRECIO BASE
           </Typography>
           <Typography variant="h5" color="primary.main" fontWeight={800}>
             {FavoritoService.formatPrecio(Number(lote.precio_base))}
           </Typography>
        </Box>

        {/* Fecha (si pendiente) */}
        {lote.estado_subasta === 'pendiente' && lote.fecha_inicio && (
          <Stack direction="row" spacing={1} alignItems="center" mt={1} sx={{ bgcolor: 'warning.lighter', p: 1, borderRadius: 1, color: 'warning.dark' }}>
            <EventIcon fontSize="small" />
            <Typography variant="caption" fontWeight={700}>
               Inicia: {new Date(lote.fecha_inicio).toLocaleDateString()}
            </Typography>
          </Stack>
        )}
      </CardContent>

      {/* Acciones */}
      <CardActions sx={{ p: 2.5, pt: 0 }}>
        <Button 
          fullWidth 
          variant="outlined" // Outlined queda elegante aquí
          color="primary"
          startIcon={<VisibilityIcon />} 
          onClick={() => onVerDetalle(lote.id)}
          sx={{ fontWeight: 600, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
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
      confirmDialog.close();
    },
    onError: () => alert('Error al eliminar favorito')
  });

  // Handler para abrir modal
  const handleRemoveClick = (id: number) => {
    confirmDialog.confirm('remove_favorite', id);
  };

  // Handler de confirmación
  const handleConfirmDelete = () => {
    if (confirmDialog.data) {
        removeFavoritoMutation.mutate(confirmDialog.data);
    }
  };

  if (isLoading) return (
    <PageContainer maxWidth="xl">
      <PageHeader title="Mis Favoritos" subtitle="Cargando tus lotes guardados..." />
      <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(280px, 1fr))" gap={3}>
        {[1,2,3,4].map(n => <Skeleton key={n} variant="rectangular" height={380} sx={{ borderRadius: 3 }} />)}
      </Box>
    </PageContainer>
  );

  if (error) return (
    <PageContainer maxWidth="xl">
      <Alert severity="error">No se pudieron cargar tus favoritos.</Alert>
    </PageContainer>
  );

  return (
    <PageContainer maxWidth="xl">
      <PageHeader 
        title="Mis Favoritos" 
        subtitle="Gestiona los lotes que estás siguiendo." 
      />
      
      {/* Contador flotante (opcional, estilo chip) */}
      {favoritos.length > 0 && (
        <Box mb={4}>
            <Chip 
                label={`${favoritos.length} lotes guardados`} 
                color="primary" 
                variant="outlined"
                icon={<FavoriteIcon />} 
                sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.primary.main, 0.05) }}
            />
        </Box>
      )}

      {favoritos.length === 0 ? (
        // Empty State consistente con otras pantallas
        <Card 
            elevation={0} 
            sx={{ 
                p: 8, 
                textAlign: 'center', 
                bgcolor: 'background.default', 
                border: `2px dashed ${theme.palette.divider}`,
                borderRadius: 4
            }}
        >
          <Box 
            sx={{ 
                width: 80, height: 80, mx: 'auto', mb: 2, borderRadius: '50%',
                bgcolor: alpha(theme.palette.text.secondary, 0.1),
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
             <FavoriteIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.5 }} />
          </Box>
          <Typography variant="h5" fontWeight={700} color="text.secondary" gutterBottom>
            Aún no tienes favoritos
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={4}>
            Guarda los lotes que te interesen para acceder a ellos rápidamente.
          </Typography>
          <Button 
            variant="contained" 
            size="large"
            onClick={() => navigate('/lotes')} 
            startIcon={<GavelIcon />}
          >
            Explorar Subastas
          </Button>
        </Card>
      ) : (
        // Grid Layout
        <Box 
            display="grid" 
            gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))" 
            gap={3} 
            pb={4}
        >
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