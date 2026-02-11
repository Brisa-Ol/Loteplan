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

// Componentes y Hooks
import { ConfirmDialog } from '@/shared/components/domain/modals/ConfirmDialog/ConfirmDialog';
import { PageContainer } from '@/shared/components/layout/containers/PageContainer/PageContainer';
import { PageHeader } from '@/shared/components/layout/headers/PageHeader';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import useSnackbar from '@/shared/hooks/useSnackbar';
import { useAuctionStatus } from '../../hooks/useAuctionStatus';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';
import { useImageLoader } from '../../hooks/useImageLoader';

// Servicios y Tipos
import FavoritoService from '@/core/api/services/favorito.service';
import ImagenService from '@/core/api/services/imagen.service';
import type { LoteDto } from '@/core/types/dto/lote.dto';
import { ROUTES } from '@/routes'; // ✅ Importamos las rutas

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

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%', display: 'flex', flexDirection: 'column',
        borderRadius: 4, border: `1px solid ${theme.palette.divider}`,
        transition: 'all 0.3s ease', overflow: 'hidden',
        '&:hover': { transform: 'translateY(-6px)', boxShadow: theme.shadows[6] }
      }}
    >
      <Box sx={{ position: 'relative', height: 220, overflow: 'hidden', bgcolor: 'grey.100' }}>
        <CardMedia
          component="img"
          height="100%"
          image={imagenUrl}
          alt={lote.nombre_lote}
          sx={{ objectFit: 'cover', opacity: imageLoader.loaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
          onLoad={imageLoader.handleLoad}
          onError={(e: any) => {
            e.target.src = '/assets/placeholder-lote.jpg';
            imageLoader.handleError();
          }}
        />
        <Chip
          label={statusConfig.label}
          color={statusConfig.color}
          size="small"
          sx={{ position: 'absolute', top: 12, right: 12, fontWeight: 700, boxShadow: 2, color: 'white' }}
        />
        <Tooltip title="Dejar de seguir">
          <IconButton
            onClick={(e) => { e.stopPropagation(); onRemove(lote.id); }}
            disabled={isRemoving}
            size="small"
            sx={{
              position: 'absolute', top: 12, left: 12,
              bgcolor: 'white', color: 'error.main', boxShadow: 2,
              '&:hover': { bgcolor: 'error.main', color: 'white' }
            }}
          >
            {isRemoving ? <DeleteOutline fontSize="small" /> : <FavoriteIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>

      <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
        <Typography variant="h6" fontWeight={800} noWrap sx={{ mb: 0.5 }}>{lote.nombre_lote}</Typography>
        <Stack direction="row" spacing={0.5} alignItems="center" mb={2} color="text.secondary">
          <LocationOn sx={{ fontSize: 16 }} />
          <Typography variant="body2" noWrap sx={{ fontSize: '0.85rem' }}>
            {lote.latitud ? `${Number(lote.latitud).toFixed(4)}, ${Number(lote.longitud).toFixed(4)}` : 'Ubicación no especificada'}
          </Typography>
        </Stack>
        <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />
        <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">PRECIO BASE</Typography>
        <Typography variant="h6" color="primary.main" fontWeight={800}>{formattedPrice}</Typography>
      </CardContent>

      <CardActions sx={{ p: 2.5, pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<VisibilityIcon />}
          onClick={() => onVerDetalle(lote.id)}
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
    staleTime: 120000,
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

  const handleConfirmDelete = useCallback(() => {
    if (confirmDialog.data) removeFavoritoMutation.mutate(confirmDialog.data as number);
  }, [confirmDialog.data, removeFavoritoMutation]);

  // ✅ CORRECCIÓN: Ahora usa la ruta centralizada del cliente
  const handleNavigateToLote = useCallback((id: number) => {
    navigate(ROUTES.CLIENT.LOTES.DETALLE.replace(':id', String(id)));
  }, [navigate]);

  if (isLoading) {
    return (
      <PageContainer maxWidth="xl">
        <PageHeader title="Mis Favoritos" subtitle="Cargando..." />
        <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={3}>
          {[1, 2, 3, 4].map(n => <Skeleton key={n} variant="rectangular" height={380} sx={{ borderRadius: 4 }} />)}
        </Box>
      </PageContainer>
    );
  }

  if (error) return <PageContainer maxWidth="xl"><Alert severity="error">Error al cargar favoritos.</Alert></PageContainer>;

  return (
    <PageContainer maxWidth="xl">
      <PageHeader title="Mis Favoritos" subtitle="Sigue de cerca las oportunidades que te interesan." />

      {favoritos.length > 0 ? (
        <>
          <Box mb={4}>
            <Chip label={`${favoritos.length} lotes en seguimiento`} color="primary" size="small" sx={{ fontWeight: 700 }} />
          </Box>
          <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={3} pb={4}>
            {favoritos.map(lote => (
              <LoteFavoritoCard
                key={lote.id}
                lote={lote}
                onRemove={(id) => confirmDialog.confirm('remove_favorite', id)}
                onVerDetalle={handleNavigateToLote}
                isRemoving={removeFavoritoMutation.isPending && confirmDialog.data === lote.id}
              />
            ))}
          </Box>
        </>
      ) : (
        <Card elevation={0} sx={{ p: 8, textAlign: 'center', bgcolor: 'background.default', border: `2px dashed ${theme.palette.divider}`, borderRadius: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <BookmarkBorder sx={{ fontSize: 48, color: 'primary.main', opacity: 0.6, mb: 3 }} />
          <Typography variant="h5" fontWeight={800} gutterBottom>Tu lista de seguimiento está vacía</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400, mb: 4 }}>Guarda los lotes que te interesen para monitorear su precio y estado.</Typography>
          <Button
            variant="contained" size="large" startIcon={<GavelIcon />}
            onClick={() => navigate(ROUTES.PROYECTOS.SELECCION_ROL)} // ✅ Redirección lógica
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
        description="Se eliminará de tu lista de favoritos."
      />
    </PageContainer>
  );
};

export default MisFavoritos;