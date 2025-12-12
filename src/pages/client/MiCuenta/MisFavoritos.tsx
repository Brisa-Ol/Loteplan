import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Chip,
  Stack,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
  useTheme
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  Visibility as VisibilityIcon,
  Gavel as GavelIcon,
  DeleteOutline as DeleteIcon,
  SentimentDissatisfied,
  Event as EventIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

// Servicios y Tipos
import imagenService from '../../../Services/imagen.service'; // ✅ Importante: Tu servicio con resolveImageUrl
import FavoritoService from '../../../Services/favorito.service';
import type { LoteDto } from '../../../types/dto/lote.dto';
import type { ImagenDto } from '../../../types/dto/imagen.dto';
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';

// ==========================================
// 🎨 COMPONENTE CARD (Estilizado)
// ==========================================

const LoteFavoritoCard: React.FC<{
  lote: LoteDto;
  onRemove: (id: number) => void;
  onVerDetalle: (id: number) => void;
  isRemoving: boolean;
}> = ({ lote, onRemove, onVerDetalle, isRemoving }) => {
  const theme = useTheme();

  // 1. Lógica de Imagen: Buscar principal -> Primera -> Undefined
  const imagenPrincipal: ImagenDto | undefined = lote.imagenes?.find(img => img.es_principal) || lote.imagenes?.[0];

  // 2. Resolver URL usando el servicio (Evita el error 404 del backend)
  const imagenUrl = imagenService.resolveImageUrl(imagenPrincipal?.url);

  // Helper para color de estado
  const getEstadoColor = (estado: string): 'success' | 'info' | 'warning' | 'default' => {
    switch (estado) {
      case 'activa': return 'success';
      case 'finalizada': return 'info';
      case 'pendiente': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4]
        }
      }}
    >
      {/* --- IMAGEN Y BADGES --- */}
      <Box sx={{ position: 'relative', height: 220, overflow: 'hidden' }}>
        <CardMedia
          component="img"
          height="100%"
          image={imagenUrl}
          alt={lote.nombre_lote}
          sx={{ objectFit: 'cover' }}
          onError={(e: any) => {
            // Fallback si falla la carga
            e.target.src = '/assets/placeholder-lote.jpg';
          }}
        />

        {/* Badge Estado */}
        <Chip
          label={lote.estado_subasta.toUpperCase()}
          color={getEstadoColor(lote.estado_subasta)}
          size="small"
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            fontWeight: 'bold',
            boxShadow: 1
          }}
        />

        {/* Botón Quitar Favorito */}
        <Tooltip title="Quitar de favoritos">
          <IconButton
            onClick={() => onRemove(lote.id)}
            disabled={isRemoving}
            size="small"
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(4px)',
              '&:hover': { bgcolor: '#fff', color: 'error.main' },
              color: 'error.main'
            }}
          >
            <FavoriteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* --- CONTENIDO --- */}
      <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
        <Stack spacing={1.5}>
          {/* Título y Tipo */}
          <Box>
            <Typography variant="h6" fontWeight="bold" noWrap title={lote.nombre_lote} sx={{ lineHeight: 1.2 }}>
              {lote.nombre_lote}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1} mt={0.5}>
              <Typography variant="caption" color="text.secondary">
                ID: {lote.id}
              </Typography>
              {lote.id_proyecto && (
                <Chip
                  label="Privado"
                  size="small"
                  variant="outlined"
                  color="primary"
                  sx={{ height: 20, fontSize: '0.65rem' }}
                />
              )}
            </Stack>
          </Box>

          {/* Precio */}
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              bgcolor: 'secondary.light', // #F6F6F6 según tu theme
              borderRadius: 2,
              textAlign: 'center',
              border: '1px solid',
              borderColor: 'secondary.dark' // #D4D4D4
            }}
          >
            <Typography variant="caption" display="block" color="text.secondary">
              Precio Base
            </Typography>
            <Typography variant="h6" fontWeight="bold" color="primary.main">
              ${Number(lote.precio_base).toLocaleString('es-AR')}
            </Typography>
          </Paper>

          {/* Fecha Inicio (Si pendiente) */}
          {lote.estado_subasta === 'pendiente' && lote.fecha_inicio && (
            <Stack direction="row" alignItems="center" spacing={1} color="warning.main">
              <EventIcon fontSize="small" />
              <Typography variant="caption" fontWeight={500}>
                Inicia: {new Date(lote.fecha_inicio).toLocaleDateString()}
              </Typography>
            </Stack>
          )}
        </Stack>
      </CardContent>

      {/* --- ACCIONES --- */}
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          disableElevation
          startIcon={<VisibilityIcon />}
          onClick={() => onVerDetalle(lote.id)}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          Ver Detalle
        </Button>
      </CardActions>
    </Card>
  );
};

// ==========================================
// 🚀 PAGE COMPONENT PRINCIPAL
// ==========================================

const MisFavoritos: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const theme = useTheme(); // Acceso a tu theme personalizado

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [loteAEliminar, setLoteAEliminar] = useState<number | null>(null);

  // 📡 1. Query: Obtener Favoritos
  const { data: favoritos = [], isLoading, error } = useQuery<LoteDto[]>({
    queryKey: ['misFavoritos'],
    queryFn: async () => (await FavoritoService.getMisFavoritos()).data,
  });

  // 📡 2. Mutation: Quitar Favorito
  const removeFavoritoMutation = useMutation({
    mutationFn: (idLote: number) => FavoritoService.toggle(idLote),
    onSuccess: () => {
      // Invalidamos la query para que recargue la lista automáticamente
      queryClient.invalidateQueries({ queryKey: ['misFavoritos'] });
    },
    onError: (err: any) => {
      console.error(err);
      alert('Hubo un error al intentar quitar el favorito.');
    }
  });

  // Handlers
  const handleRemoveClick = (idLote: number) => {
    setLoteAEliminar(idLote);
    setConfirmDialogOpen(true);
  };

  const handleConfirmRemove = () => {
    if (loteAEliminar) {
      removeFavoritoMutation.mutate(loteAEliminar);
    }
    setConfirmDialogOpen(false);
    setLoteAEliminar(null);
  };

  // Stats rápidas
  const stats = {
    total: favoritos.length,
    activas: favoritos.filter(l => l.estado_subasta === 'activa').length,
  };

  // 🔄 Render: Loading Skeleton
  if (isLoading) {
    return (
      <PageContainer>
        <Box sx={{ mb: 4 }}>
          <Skeleton width="40%" height={40} />
          <Skeleton width="20%" height={24} />
        </Box>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 3
          }}
        >
          {[1, 2, 3, 4].map(n => (
            <Skeleton key={n} variant="rectangular" height={350} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
      </PageContainer>
    );
  }

  // ❌ Render: Error
  if (error) {
    return (
      <PageContainer>
        <Alert severity="error" variant="filled">
          No se pudieron cargar tus favoritos. Intenta recargar la página.
        </Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="xl">
    <PageHeader title=" Mis Favoritos"/>
      {/* Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        mb={5}
        spacing={2}
      >

        {/* Chip contador */}
        {favoritos.length > 0 && (
          <Chip
            icon={<FavoriteIcon sx={{ color: 'white !important' }} />}
            label={`${stats.total} Guardados`}
            color="primary"
            sx={{ fontWeight: 'bold' }}
          />
        )}
      </Stack>

      {/* Contenido Principal */}
      {favoritos.length === 0 ? (
        // Estado Vacío
        <Paper
          elevation={0}
          sx={{
            p: 8,
            textAlign: 'center',
            bgcolor: 'background.paper', // #ECECEC
            border: `2px dashed ${theme.palette.divider}`,
            borderRadius: 4
          }}
        >
          <SentimentDissatisfied sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom fontWeight={600}>
            Aún no tienes favoritos
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={4} maxWidth={500} mx="auto">
            Explora el catálogo y marca con el corazón ❤️ los lotes que te interesen para acceder a ellos rápidamente aquí.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/lotes')}
            startIcon={<GavelIcon />}
            sx={{ px: 4 }}
          >
            Explorar Lotes
          </Button>
        </Paper>
      ) : (
        // ✅ CSS GRID LAYOUT (Sin Grid de MUI deprecado)
        <Box
          sx={{
            display: 'grid',
            // Crea columnas automáticas con un ancho mínimo de 280px
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 4, // Espaciado (4 * 8px = 32px)
            pb: 4
          }}
        >
          {favoritos.map((lote) => (
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

      {/* Diálogo de Confirmación */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 3, p: 1, maxWidth: 400 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                bgcolor: 'error.light',
                color: 'error.main',
                p: 1,
                borderRadius: '50%',
                display: 'flex'
              }}
            >
              <DeleteIcon />
            </Box>
            <Typography variant="h6" fontWeight={600}>
              ¿Quitar de Favoritos?
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <Typography color="text.secondary">
            El lote se eliminará de tu lista de seguimiento, pero podrás volver a agregarlo desde el catálogo.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setConfirmDialogOpen(false)}
            color="inherit"
            disabled={removeFavoritoMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmRemove}
            color="error"
            variant="contained"
            disableElevation
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