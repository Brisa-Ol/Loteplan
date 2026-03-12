// src/features/client/pages/Cuenta/MisFavoritos.tsx

import {
  BookmarkBorder,
  DeleteOutline,
  Favorite as FavoriteIcon,
  Gavel as GavelIcon,
  LocationOn,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import {
  Alert,
  alpha,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuctionStatus } from '../../hooks/useAuctionStatus';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';



// Servicios y Tipos
import FavoritoService from '@/core/api/services/favorito.service';
import ImagenService from '@/core/api/services/imagen.service';
import type { LoteDto } from '@/core/types/lote.dto';
import { ROUTES } from '@/routes';
import { ConfirmDialog, PageContainer, PageHeader, useConfirmDialog, useSnackbar } from '@/shared';
import { useImageLoader } from '../../hooks';

// =====================================================
// ERROR BOUNDARY
// =====================================================
class CardErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <Card elevation={0} sx={{ height: '100%', minHeight: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, border: '1px dashed', borderColor: 'divider' }}>
          <Typography variant="body2" color="text.disabled">No se pudo cargar este lote</Typography>
        </Card>
      );
    }
    return this.props.children;
  }
}

// =====================================================
// COMPONENTE: LOTE CARD (Optimizado)
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
  
  // Hook de estado de imagen
  const { isLoading, hasError, handleLoad, handleError } = useImageLoader();

  // 1. DETERMINAR SI EXISTE REGISTRO DE IMAGEN PREVENTIVAMENTE
  const rawUrl = lote.imagenes?.[0]?.url;
  const hasNoImageRecord = !rawUrl || rawUrl.trim() === '';

  const imagenUrl = useMemo(() => {
    if (hasNoImageRecord) return null;
    return ImagenService.resolveImageUrl(rawUrl);
  }, [rawUrl, hasNoImageRecord]);

  const formattedPrice = useMemo(() => formatCurrency(Number(lote.precio_base)), [formatCurrency, lote.precio_base]);

  const ubicacionLabel = useMemo(() => {
    const lat = lote.latitud;
    const lng = lote.longitud;
    if (lat == null || lng == null) return 'Ubicación no especificada';
    return `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`;
  }, [lote.latitud, lote.longitud]);

  return (
    <Card elevation={0} sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 4, border: `1px solid ${theme.palette.divider}`, transition: 'transform 0.3s ease, box-shadow 0.3s ease', overflow: 'hidden', '&:hover': { transform: 'translateY(-6px)', boxShadow: theme.shadows[6] } }}>
      <Box sx={{ position: 'relative', height: 220, overflow: 'hidden', bgcolor: 'grey.100', flexShrink: 0 }}>
        
        {/* 2. LÓGICA DE RENDERIZADO DE IMAGEN / PLACEHOLDER */}
        {hasNoImageRecord ? (
          <Stack alignItems="center" justifyContent="center" height="100%" spacing={1} sx={{ color: 'text.disabled', bgcolor: 'grey.200' }}>
            <BookmarkBorder sx={{ fontSize: 40, opacity: 0.4 }} />
            <Typography variant="caption" fontWeight={700} sx={{ letterSpacing: 1 }}>SIN IMAGEN</Typography>
          </Stack>
        ) : (
          <>
            {isLoading && (
              <Skeleton 
                variant="rectangular" 
                width="100%" 
                height="100%" 
                sx={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }} 
              />
            )}
            <CardMedia 
              component="img" 
              height="220" 
              // Si falla la carga (404 real), usamos el asset local
              image={hasError ? '/assets/placeholder-lote.jpg' : imagenUrl!} 
              alt={lote.nombre_lote} 
              sx={{ 
                objectFit: 'cover', 
                opacity: isLoading ? 0 : 1, 
                transition: 'opacity 0.3s ease', 
                width: '100%' 
              }} 
              onLoad={handleLoad} 
              onError={handleError} 
            />
          </>
        )}

        {/* Badges y botones sobre la imagen */}
        <Chip label={statusConfig.label} color={statusConfig.color} size="small" sx={{ position: 'absolute', top: 12, right: 12, fontWeight: 700, boxShadow: 2, color: 'white', zIndex: 2 }} />
        <Tooltip title="Dejar de seguir">
          <span style={{ position: 'absolute', top: 12, left: 12, zIndex: 2 }}>
            <IconButton onClick={(e) => { e.stopPropagation(); onRemove(lote.id); }} disabled={isRemoving} size="small" sx={{ bgcolor: 'white', color: 'error.main', boxShadow: 2, '&:hover': { bgcolor: 'error.main', color: 'white' }, '&.Mui-disabled': { bgcolor: 'white', opacity: 0.6 } }}>
              {isRemoving ? <DeleteOutline fontSize="small" /> : <FavoriteIcon fontSize="small" />}
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
        <Typography variant="h6" fontWeight={800} noWrap sx={{ mb: 0.5 }}>{lote.nombre_lote}</Typography>
        <Stack direction="row" spacing={0.5} alignItems="center" mb={2} color="text.secondary">
          <LocationOn sx={{ fontSize: 16, flexShrink: 0 }} />
          <Typography variant="body2" noWrap sx={{ fontSize: '0.85rem' }}>{ubicacionLabel}</Typography>
        </Stack>
        <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />
        <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">PRECIO BASE</Typography>
        <Typography variant="h6" color="primary.main" fontWeight={800}>{formattedPrice}</Typography>
      </CardContent>

      <CardActions sx={{ p: 2.5, pt: 0 }}>
        <Button fullWidth variant="contained" startIcon={<VisibilityIcon />} onClick={() => onVerDetalle(lote.id)} sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}>Ver Oportunidad</Button>
      </CardActions>
    </Card>
  );
});

// ... (Resto de los componentes EmptyState y FavoritosSkeletonGrid se mantienen igual)

const EmptyState: React.FC<{ onExplorar: () => void }> = ({ onExplorar }) => {
  const theme = useTheme();
  return (
    <Card elevation={0} sx={{ p: { xs: 4, sm: 8 }, textAlign: 'center', bgcolor: 'background.default', border: `2px dashed ${theme.palette.divider}`, borderRadius: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <BookmarkBorder sx={{ fontSize: 48, color: 'primary.main', opacity: 0.6, mb: 3 }} />
      <Typography variant="h5" fontWeight={800} gutterBottom>Tu lista de seguimiento está vacía</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400, mb: 4 }}>Guarda los lotes que te interesen para monitorear su precio y estado.</Typography>
      <Button variant="contained" size="large" startIcon={<GavelIcon />} onClick={onExplorar} sx={{ borderRadius: 2, fontWeight: 700, px: 4 }}>Explorar Oportunidades</Button>
    </Card>
  );
};

const FavoritosSkeletonGrid: React.FC = () => (
  <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(280px, 1fr))" gap={3}>
    {[1, 2, 3, 4].map(n => <Skeleton key={n} variant="rectangular" height={380} sx={{ borderRadius: 4 }} />)}
  </Box>
);

// =====================================================
// COMPONENTE PRINCIPAL (MisFavoritos)
// =====================================================
const MisFavoritos: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const confirmDialog = useConfirmDialog();
  const { showSuccess } = useSnackbar();

  const { data: favoritos = [], isLoading, error } = useQuery<LoteDto[]>({
    queryKey: ['misFavoritos'],
    queryFn: async () => {
      const res = await FavoritoService.getMisFavoritos();
      const responseData = res.data as any;
      
      if (Array.isArray(responseData)) return responseData;
      if (responseData && Array.isArray(responseData.data)) return responseData.data;
      if (responseData && Array.isArray(responseData.favorites)) return responseData.favorites;
      
      return []; 
    },
    staleTime: 120_000,
  });

  const removeFavoritoMutation = useMutation({
    mutationFn: (idLote: number) => FavoritoService.toggle(idLote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['misFavoritos'] });
      confirmDialog.close();
      showSuccess('Lote eliminado de tus favoritos');
    },
    onError: () => confirmDialog.close(),
  });

  const handleConfirmDelete = useCallback(() => {
    if (confirmDialog.data != null) {
      removeFavoritoMutation.mutate(confirmDialog.data as number);
    }
  }, [confirmDialog.data, removeFavoritoMutation]);

  const handleNavigateToLote = useCallback((id: number) => {
    navigate(ROUTES.CLIENT.LOTES.DETALLE.replace(':id', String(id)));
  }, [navigate]);

  const handleExplorar = useCallback(() => {
    navigate(ROUTES.PROYECTOS.SELECCION_ROL);
  }, [navigate]);

  if (isLoading) {
    return (
      <PageContainer maxWidth="xl">
        <PageHeader title="Mis Favoritos" subtitle="Cargando..." />
        <FavoritosSkeletonGrid />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer maxWidth="xl">
        <PageHeader title="Mis Favoritos" subtitle="" />
        <Alert severity="error" sx={{ borderRadius: 2 }}>Error al cargar tus favoritos. Intentá de nuevo más tarde.</Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="xl">
      <PageHeader title="Mis Favoritos" subtitle="Seguí de cerca las oportunidades que te interesan." />

      {favoritos.length > 0 ? (
        <>
          <Box mb={3}>
            <Chip label={`${favoritos.length} lote${favoritos.length !== 1 ? 's' : ''} en seguimiento`} color="primary" size="small" sx={{ fontWeight: 700 }} />
          </Box>
          <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(280px, 1fr))" gap={3} pb={4}>
            {favoritos.map(lote => (
              <CardErrorBoundary key={lote.id}>
                <LoteFavoritoCard
                  lote={lote}
                  onRemove={(id) => confirmDialog.confirm('remove_favorite', id)}
                  onVerDetalle={handleNavigateToLote}
                  isRemoving={removeFavoritoMutation.isPending && confirmDialog.data === lote.id}
                />
              </CardErrorBoundary>
            ))}
          </Box>
        </>
      ) : (
        <EmptyState onExplorar={handleExplorar} />
      )}

      <ConfirmDialog
        controller={confirmDialog}
        onConfirm={handleConfirmDelete}
        isLoading={removeFavoritoMutation.isPending}
        title="¿Dejar de seguir este lote?"
        description="Se eliminará de tu lista de favoritos."
      />
    </PageContainer>
  );
};

export default MisFavoritos;