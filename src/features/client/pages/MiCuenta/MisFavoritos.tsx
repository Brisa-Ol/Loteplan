import React, { useCallback, useMemo } from 'react';
import {
  Box, Typography, Card, CardMedia, CardContent, CardActions,
  Button, IconButton, Chip, Stack, Alert, Tooltip, Skeleton,
  useTheme, alpha, Divider
} from '@mui/material';
import {
  Favorite as FavoriteIcon, 
  Visibility as VisibilityIcon,
  Gavel as GavelIcon, 
  Event as EventIcon,
  LocationOn,
  DeleteOutline,
  BookmarkBorder
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { PageContainer } from '@/shared/components/layout/containers/PageContainer/PageContainer';
import { PageHeader } from '@/shared/components/layout/headers/PageHeader';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import { ConfirmDialog } from '@/shared/components/domain/modals/ConfirmDialog/ConfirmDialog';

import ImagenService from '@/core/api/services/imagen.service';
import FavoritoService from '@/core/api/services/favorito.service';
import { env } from '@/core/config/env';
import useSnackbar from '@/shared/hooks/useSnackbar';
import type { LoteDto } from '@/core/types/dto/lote.dto';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';
import { useAuctionStatus } from '../../hooks/useAuctionStatus';
import { useImageLoader } from '../../hooks/useImageLoader';

// =====================================================
// COMPONENTE: LOTE CARD (MEMOIZADO)
// =====================================================

const LoteFavoritoCard = React.memo<{
  lote: LoteDto;
  onRemove: (id: number) => void;
  onVerDetalle: (id: number) => void;
  isRemoving: boolean;
}>(({ lote, onRemove, onVerDetalle, isRemoving }) => {
  const theme = useTheme();
  const formatCurrency = useCurrencyFormatter();
  const statusConfig = useAuctionStatus(lote.estado_subasta);
  const imageLoader = useImageLoader();

  const imagenUrl = useMemo(() => {
    const imagenPrincipal = lote.imagenes?.[0];
    return ImagenService.resolveImageUrl(imagenPrincipal?.url);
  }, [lote.imagenes]);

  const formattedPrice = useMemo(() => 
    formatCurrency(Number(lote.precio_base)),
    [formatCurrency, lote.precio_base]
  );

  const coordenadasTexto = useMemo(() => {
    if (!lote.latitud || !lote.longitud) return 'Ubicación no especificada';
    return `${Number(lote.latitud).toFixed(4)}, ${Number(lote.longitud).toFixed(4)}`;
  }, [lote.latitud, lote.longitud]);

  const handleRemoveClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(lote.id);
  }, [lote.id, onRemove]);

  const handleVerClick = useCallback(() => {
    onVerDetalle(lote.id);
  }, [lote.id, onVerDetalle]);

  return (
    <Card 
      elevation={0}
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        position: 'relative',
        borderRadius: 4, 
        border: `1px solid ${theme.palette.divider}`,
        transition: 'all 0.3s ease',
        overflow: 'hidden',
        '&:hover': { 
          transform: 'translateY(-6px)', 
          boxShadow: theme.shadows[6],
          borderColor: 'transparent'
        }
      }}
    >
      <Box sx={{ position: 'relative', height: 220, overflow: 'hidden', bgcolor: 'grey.100' }}>
        <CardMedia
          component="img" 
          height="100%" 
          image={imagenUrl} 
          alt={lote.nombre_lote} 
          sx={{ 
            objectFit: 'cover',
            opacity: imageLoader.loaded ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}
          onLoad={imageLoader.handleLoad}
          onError={(e: any) => { 
            e.target.src = '/assets/placeholder-lote.jpg';
            imageLoader.handleError();
          }}
        />
        
        <Box sx={{ 
          position: 'absolute', 
          top: 0, left: 0, width: '100%', height: '100%', 
          background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 40%)', 
          pointerEvents: 'none' 
        }} />
        
        <Chip
          label={statusConfig.label}
          color={statusConfig.color}
          size="small"
          sx={{ position: 'absolute', top: 12, right: 12, fontWeight: 700, boxShadow: 2, color: 'white' }}
        />

        <Tooltip title="Dejar de seguir">
          <IconButton
            onClick={handleRemoveClick}
            disabled={isRemoving}
            size="small"
            sx={{
              position: 'absolute', top: 12, left: 12, 
              bgcolor: 'white', color: 'error.main', boxShadow: 2,
              '&:hover': { bgcolor: 'error.main', color: 'white' },
              opacity: isRemoving ? 0.6 : 1
            }}
          >
            {isRemoving ? <DeleteOutline fontSize="small" /> : <FavoriteIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>

      <CardContent sx={{ flexGrow: 1, p: 2.5, pb: 1 }}>
        <Typography variant="h6" fontWeight={800} noWrap title={lote.nombre_lote} sx={{ mb: 0.5 }}>
          {lote.nombre_lote}
        </Typography>
        
        <Stack direction="row" spacing={0.5} alignItems="center" mb={2} color="text.secondary">
          <LocationOn sx={{ fontSize: 16, color: 'text.disabled' }} />
          <Typography variant="body2" noWrap sx={{ fontSize: '0.85rem' }}>
            {coordenadasTexto}
          </Typography>
        </Stack>

        <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />
        
        <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={0.5}>
              PRECIO BASE
            </Typography>
            <Typography variant="h6" color="primary.main" fontWeight={800} sx={{ lineHeight: 1 }}>
              {formattedPrice}
            </Typography>
          </Box>
          
          {lote.estado_subasta === 'pendiente' && lote.fecha_inicio && (
            <Chip 
              icon={<EventIcon sx={{ fontSize: '14px !important' }} />}
              label={new Date(lote.fecha_inicio).toLocaleDateString(env.defaultLocale)}
              size="small"
              color="warning"
              variant="outlined"
              sx={{ height: 24, fontSize: '0.75rem', fontWeight: 600 }}
            />
          )}
        </Stack>
      </CardContent>

      <CardActions sx={{ p: 2.5, pt: 1 }}>
        <Button 
          fullWidth 
          variant="contained" 
          disableElevation
          startIcon={<VisibilityIcon />} 
          onClick={handleVerClick}
          sx={{ 
            borderRadius: 2, fontWeight: 700, textTransform: 'none',
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: 'primary.main',
            '&:hover': { bgcolor: 'primary.main', color: 'white' }
          }}
        >
          Ver Oportunidad
        </Button>
      </CardActions>
    </Card>
  );
});

LoteFavoritoCard.displayName = 'LoteFavoritoCard';

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

const MisFavoritos: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const confirmDialog = useConfirmDialog();
  const { showSuccess } = useSnackbar(); 

  const { data: favoritos = [], isLoading, error } = useQuery<LoteDto[]>({
    queryKey: ['misFavoritos'],
    queryFn: async () => (await FavoritoService.getMisFavoritos()).data,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const removeFavoritoMutation = useMutation({
    mutationFn: (idLote: number) => FavoritoService.toggle(idLote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['misFavoritos'] });
      confirmDialog.close();
      showSuccess('Lote eliminado de tus favoritos');
    },
    onError: () => confirmDialog.close()
  });

  const handleRemoveClick = useCallback((id: number) => {
    confirmDialog.confirm('remove_favorite', id);
  }, [confirmDialog]);

  const handleConfirmDelete = useCallback(() => {
    if (confirmDialog.data) {
      removeFavoritoMutation.mutate(confirmDialog.data as number);
    }
  }, [confirmDialog.data, removeFavoritoMutation]);

  const handleNavigateToLote = useCallback((id: number) => {
    navigate(`/lotes/${id}`);
  }, [navigate]);

  if (isLoading) {
    return (
      <PageContainer maxWidth="xl">
        <PageHeader title="Mis Favoritos" subtitle="Cargando..." />
        <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={3}>
          {[1,2,3,4].map(n => (
            <Skeleton key={n} variant="rectangular" height={380} sx={{ borderRadius: 4 }} />
          ))}
        </Box>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer maxWidth="xl">
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          No pudimos cargar tus favoritos. Intenta nuevamente.
        </Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="xl">
      <PageHeader 
        title="Mis Favoritos" 
        subtitle="Sigue de cerca las oportunidades que te interesan." 
      />
      
      {favoritos.length > 0 ? (
        <>
          <Box mb={4} display="flex" alignItems="center" gap={1}>
            <Chip 
              label={`${favoritos.length} lote${favoritos.length === 1 ? '' : 's'} en seguimiento`} 
              color="primary" 
              size="small"
              sx={{ fontWeight: 700, borderRadius: 1 }} 
            />
          </Box>

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
                onVerDetalle={handleNavigateToLote}
                isRemoving={removeFavoritoMutation.isPending && confirmDialog.data === lote.id} 
              />
            ))}
          </Box>
        </>
      ) : (
        <Card 
          elevation={0} 
          sx={{ 
            p: 8, 
            textAlign: 'center', 
            bgcolor: 'background.default', 
            border: `2px dashed ${theme.palette.divider}`, 
            borderRadius: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <Box sx={{ 
            width: 100, height: 100, borderRadius: '50%', 
            bgcolor: alpha(theme.palette.primary.main, 0.05), 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mb: 3
          }}>
            <BookmarkBorder sx={{ fontSize: 48, color: 'primary.main', opacity: 0.6 }} />
          </Box>
          
          <Typography variant="h5" fontWeight={800} color="text.primary" gutterBottom>
            Tu lista de seguimiento está vacía
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400, mb: 4 }}>
            Guarda los lotes que te interesen para monitorear su precio y estado antes de ofertar.
          </Typography>
          
          <Button 
            variant="contained" 
            size="large"
            onClick={() => navigate('/subastas')}
            startIcon={<GavelIcon />} 
            disableElevation 
            sx={{ borderRadius: 2, fontWeight: 700, px: 4 }}
          >
            Explorar Oportunidades
          </Button>
        </Card>
      )}

      <ConfirmDialog 
        controller={confirmDialog}
        onConfirm={handleConfirmDelete}
        isLoading={removeFavoritoMutation.isPending}
        title="¿Dejar de seguir este lote?"
        description="Se eliminará de tu lista de favoritos y dejarás de recibir actualizaciones rápidas sobre él." 
      />
    </PageContainer>
  );
};

export default MisFavoritos;