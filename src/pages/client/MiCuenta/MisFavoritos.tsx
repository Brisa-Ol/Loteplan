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
  Event as EventIcon,
  LocationOn,
  DeleteOutline
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import imagenService from '../../../services/imagen.service';
import FavoritoService from '../../../services/favorito.service';
import type { LoteDto } from '../../../types/dto/lote.dto';
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';

// ✅ Importamos Hook y Componente
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog/ConfirmDialog';

// --- Card Component ---
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
    switch (estado) {
        case 'activa': return 'success';
        case 'pendiente': return 'warning';
        case 'finalizada': return 'error';
        default: return 'default';
    }
  };

  return (
    <Card 
      elevation={0}
      sx={{ 
        height: '100%', display: 'flex', flexDirection: 'column', position: 'relative',
        borderRadius: 3, border: `1px solid ${theme.palette.divider}`,
        transition: 'all 0.3s', bgcolor: 'background.paper',
        '&:hover': { transform: 'translateY(-4px)', boxShadow: theme.shadows[4], borderColor: theme.palette.primary.main }
      }}
    >
      <Box sx={{ position: 'relative', height: 200, overflow: 'hidden', bgcolor: 'grey.100' }}>
        <CardMedia
          component="img" height="100%" image={imagenUrl} alt={lote.nombre_lote} sx={{ objectFit: 'cover' }}
          onError={(e: any) => { e.target.src = '/assets/placeholder-lote.jpg'; }}
        />
        <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 50%)', pointerEvents: 'none' }} />
        
        <Chip
          label={lote.estado_subasta.toUpperCase()}
          color={getBadgeColor(lote.estado_subasta) as any}
          size="small" variant="filled"
          sx={{ position: 'absolute', top: 12, right: 12, fontWeight: 700, boxShadow: 2, height: 24 }}
        />

        <Tooltip title="Quitar de favoritos">
          <IconButton
            onClick={() => onRemove(lote.id)}
            disabled={isRemoving}
            size="small"
            sx={{
              position: 'absolute', top: 12, left: 12, bgcolor: 'background.paper', color: 'error.main', boxShadow: 2,
              '&:hover': { bgcolor: 'error.main', color: 'common.white' },
              opacity: isRemoving ? 0.5 : 1
            }}
          >
            {isRemoving ? <DeleteOutline fontSize="small" /> : <FavoriteIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>

      <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
        <Typography variant="h6" fontWeight={700} noWrap gutterBottom title={lote.nombre_lote}>{lote.nombre_lote}</Typography>
        <Stack direction="row" spacing={0.5} alignItems="center" mb={2} color="text.secondary">
           <LocationOn fontSize="small" sx={{ fontSize: 18, color: 'text.disabled' }} />
           <Typography variant="body2" noWrap>Ubicación del Lote</Typography>
        </Stack>
        <Divider sx={{ my: 2, borderStyle: 'dashed' }} />
        <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>PRECIO BASE</Typography>
            <Typography variant="h6" color="primary.main" fontWeight={800}>{FavoritoService.formatPrecio(Number(lote.precio_base))}</Typography>
        </Box>
        {lote.estado_subasta === 'pendiente' && lote.fecha_inicio && (
          <Stack direction="row" spacing={1} alignItems="center" mt={2} sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), p: 1, borderRadius: 1, color: 'warning.dark' }}>
            <EventIcon fontSize="small" />
            <Typography variant="caption" fontWeight={700}>Inicia: {new Date(lote.fecha_inicio).toLocaleDateString()}</Typography>
          </Stack>
        )}
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button fullWidth variant="outlined" color="inherit" startIcon={<VisibilityIcon />} onClick={() => onVerDetalle(lote.id)} sx={{ borderColor: theme.palette.divider, color: 'text.secondary', fontWeight: 600 }}>Ver Detalle</Button>
      </CardActions>
    </Card>
  );
};

// --- Page Component ---
const MisFavoritos: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const theme = useTheme();

  // 1. Instanciamos el Hook (Controller)
  const confirmDialog = useConfirmDialog();

  // 2. Fetch
  const { data: favoritos = [], isLoading, error } = useQuery<LoteDto[]>({
    queryKey: ['misFavoritos'],
    queryFn: async () => (await FavoritoService.getMisFavoritos()).data,
  });

  // 3. Mutación
  const removeFavoritoMutation = useMutation({
    mutationFn: (idLote: number) => FavoritoService.toggle(idLote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['misFavoritos'] });
      // Si el diálogo tenía un ID (data), invalidamos ese específico también por seguridad
      if (confirmDialog.data) {
        queryClient.invalidateQueries({ queryKey: ['favorito', confirmDialog.data] });
      }
      confirmDialog.close();
    },
    onError: () => {
        alert('Error al eliminar favorito');
        confirmDialog.close();
    }
  });

  // 4. Handler para abrir modal
  const handleRemoveClick = (id: number) => {
    // ✅ Llamada correcta al hook: Acción + Datos (ID)
    confirmDialog.confirm('remove_favorite', id);
  };

  // 5. Handler de confirmación
  const handleConfirmDelete = () => {
    // El ID se guardó en el estado del hook (data)
    if (confirmDialog.data) {
        removeFavoritoMutation.mutate(confirmDialog.data);
    }
  };

  if (isLoading) return (
    <PageContainer maxWidth="xl">
      <PageHeader title="Mis Favoritos" subtitle="Cargando..." />
      <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(280px, 1fr))" gap={3}>
        {[1,2,3].map(n => <Skeleton key={n} variant="rectangular" height={380} sx={{ borderRadius: 3 }} />)}
      </Box>
    </PageContainer>
  );

  if (error) return (
    <PageContainer maxWidth="xl">
      <Alert severity="error">Error al cargar favoritos.</Alert>
    </PageContainer>
  );

  return (
    <PageContainer maxWidth="xl">
      <PageHeader title="Mis Favoritos" subtitle="Gestiona los lotes que estás siguiendo." />
      
      {favoritos.length > 0 && (
        <Box mb={4}>
            <Chip label={`${favoritos.length} lotes guardados`} color="primary" variant="outlined" icon={<FavoriteIcon />} sx={{ fontWeight: 700 }} />
        </Box>
      )}

      {favoritos.length === 0 ? (
        <Card elevation={0} sx={{ p: 8, textAlign: 'center', bgcolor: 'background.default', border: `2px dashed ${theme.palette.divider}`, borderRadius: 4 }}>
          <Box sx={{ width: 80, height: 80, mx: 'auto', mb: 2, borderRadius: '50%', bgcolor: alpha(theme.palette.text.secondary, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <FavoriteIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.5 }} />
          </Box>
          <Typography variant="h5" fontWeight={700} color="text.secondary" gutterBottom>Aún no tienes favoritos</Typography>
          <Button variant="contained" onClick={() => navigate('/client/Proyectos/RoleSelection')} startIcon={<GavelIcon />} disableElevation sx={{ mt: 2 }}>Explorar Subastas</Button>
        </Card>
      ) : (
        <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={3} pb={4}>
          {favoritos.map(lote => (
            <LoteFavoritoCard 
              key={lote.id} 
              lote={lote} 
              onRemove={handleRemoveClick} 
              onVerDetalle={(id) => navigate(`/lotes/${id}`)}
              isRemoving={removeFavoritoMutation.isPending && confirmDialog.data === lote.id} // Loading solo en la card afectada si quieres ser muy específico
            />
          ))}
        </Box>
      )}

      {/* ✅ INTEGRACIÓN DEL COMPONENTE GLOBAL */}
      <ConfirmDialog 
        controller={confirmDialog}
        onConfirm={handleConfirmDelete}
        isLoading={removeFavoritoMutation.isPending}
        // Sobrescribimos el título/descripción por defecto del hook si queremos ser específicos en esta pantalla
        description="Este lote ya no aparecerá en tu lista de seguimiento." 
      />
    </PageContainer>
  );
};

export default MisFavoritos;