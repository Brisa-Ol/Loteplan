import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, CardContent, CardMedia, Typography, Button,
  Chip, Stack, Skeleton, Alert, Fade, useTheme, alpha
} from '@mui/material';
import {
  Gavel, CheckCircle, Lock, MonetizationOn, AccessTime, CalendarMonth, LocationOn
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useModal } from '../../../hooks/useModal';
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import type { LoteDto } from '../../../types/dto/lote.dto';
import LoteService from '../../../services/lote.service';
import FavoritoService from '../../../services/favorito.service';
import ImagenService from '../../../services/imagen.service';
import { FavoritoButton } from '../../../components/common/BotonFavorito/BotonFavorito';
import PujarModal from './components/PujarModal';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog/ConfirmDialog';
import { useSnackbar } from '../../../context/SnackbarContext';

interface Props {
  idProyecto: number;
}

export const ListaLotesProyecto: React.FC<Props> = ({ idProyecto }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const { showSuccess, showError } = useSnackbar();
  
  // 1. Hooks
  const pujarModal = useModal();
  const confirmDialog = useConfirmDialog();
  
  // 2. Estados
  const [selectedLote, setSelectedLote] = useState<LoteDto | null>(null);

  const { data: lotes, isLoading, error } = useQuery<LoteDto[]>({
    queryKey: ['lotesProyecto', idProyecto],
    queryFn: async () => {
      const res = await LoteService.getAllActive();
      const allLotes = Array.isArray(res.data) ? res.data : [];
      return allLotes.filter(lote => lote.id_proyecto === idProyecto);
    },
    enabled: !!idProyecto && isAuthenticated,
    retry: 1
  });

  // 3. Mutación Favorito
  const unfavMutation = useMutation({
    mutationFn: async (loteId: number) => await FavoritoService.toggle(loteId),
    onSuccess: (_, loteId) => {
      queryClient.setQueryData(['checkFavorito', loteId], { es_favorito: false });
      queryClient.invalidateQueries({ queryKey: ['misFavoritos'] });
      confirmDialog.close();
      showSuccess('Eliminado de favoritos');
    },
    onError: () => {
        showError('Error al quitar de favoritos');
        confirmDialog.close();
    }
  });

  // Handlers
  const handlePujarClick = (lote: LoteDto) => {
    setSelectedLote(lote);
    pujarModal.open();
  };

  const handleRemoveRequest = (loteId: number) => {
    confirmDialog.confirm('remove_favorite', loteId);
  };

  const handleConfirmUnfav = () => {
    if (confirmDialog.data) unfavMutation.mutate(confirmDialog.data);
  };

  // --- RENDER ---

  if (!isAuthenticated) {
    return (
      <Box mt={{ xs: 2, md: 4 }} p={{ xs: 3, md: 5 }} textAlign="center" bgcolor="background.paper" borderRadius={3} border={`1px dashed ${theme.palette.divider}`}>
        <Lock sx={{ fontSize: { xs: 40, md: 60 }, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
        <Typography variant="h6" fontWeight="bold" color="text.primary" gutterBottom>Sección Exclusiva</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>Debes iniciar sesión para ver el inventario disponible.</Typography>
        <Button variant="contained" onClick={() => navigate('/login')} fullWidth sx={{ maxWidth: 300, borderRadius: 2 }}>Iniciar Sesión</Button>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box mt={{ xs: 2, md: 4 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap" useFlexGap>
          {[1, 2, 3].map((i) => (
             <Box key={i} sx={{ width: { xs: '100%', sm: 'calc(50% - 16px)', md: 'calc(33.33% - 16px)' } }}>
                <Skeleton variant="rectangular" height={200} sx={{ borderRadius: '12px 12px 0 0' }} />
                <Skeleton variant="rectangular" height={150} sx={{ borderRadius: '0 0 12px 12px' }} />
             </Box>
          ))}
        </Stack>
      </Box>
    );
  }

  if (error) return <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>No se pudo cargar el inventario. Intente nuevamente.</Alert>;

  if (!lotes || lotes.length === 0) {
    return (
      <Box mt={{ xs: 2, md: 4 }} p={4} bgcolor="background.paper" borderRadius={2} textAlign="center" border={`1px solid ${theme.palette.divider}`}>
        <Typography color="text.secondary" variant="body2">No hay lotes activos asignados a este proyecto actualmente.</Typography>
      </Box>
    );
  }

  return (
    <Box mt={{ xs: 3, md: 4 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
          Inventario <Box component="span" color="text.secondary" fontWeight={400}>({lotes.length})</Box>
        </Typography>
      </Stack>

      {/* GRID RESPONSIVE MEJORADO */}
      <Box sx={{ 
        display: 'grid', 
        // Móvil: 1 col | Tablet: 2 cols | Desktop: 3 cols | Pantallas grandes: 4 cols
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)', xl: 'repeat(4, 1fr)' }, 
        // Gap más pequeño en móvil para ganar espacio
        gap: { xs: 2, md: 3 } 
      }}>
        {lotes.map((lote) => {
          const imgUrl = lote.imagenes && lote.imagenes.length > 0
            ? ImagenService.resolveImageUrl(lote.imagenes[0].url)
            : '/assets/placeholder-lote.jpg';

          return (
            <Fade in={true} key={lote.id} timeout={500}>
              <Card
                variant="outlined"
                sx={{
                  display: 'flex', flexDirection: 'column', 
                  borderRadius: 3,
                  cursor: 'pointer', 
                  transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s', 
                  position: 'relative', overflow: 'hidden',
                  borderColor: theme.palette.divider,
                  bgcolor: 'background.paper',
                  height: '100%', // Altura completa para alinear tarjetas en la misma fila
                  '&:hover': { 
                    transform: 'translateY(-4px)', 
                    boxShadow: theme.shadows[8],
                    borderColor: 'primary.main' 
                  }
                }}
                onClick={() => navigate(`/lotes/${lote.id}`)}
              >
                {/* ZONA DE IMAGEN */}
                <Box sx={{ position: 'relative', bgcolor: 'action.hover' }}>
                  <CardMedia
                    component="img" 
                    // Altura reducida en móviles para que se vea más info sin scrollear
                    sx={{ 
                        height: { xs: 180, sm: 200 }, 
                        objectFit: 'cover' 
                    }}
                    image={imgUrl} 
                    alt={lote.nombre_lote} 
                    onError={(e) => { (e.target as HTMLImageElement).src = '/assets/placeholder-lote.jpg'; }}
                  />
                  
                  {/* Gradiente para que el texto sobre la imagen se lea bien */}
                  <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '40%', background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)' }} />

                  <Box position="absolute" top={12} left={12}>
                    {lote.estado_subasta === 'activa' ? (
                      <Chip label="Subasta Activa" color="success" size="small" icon={<CheckCircle sx={{ color: 'white !important', fontSize: '16px !important' }} />} sx={{ fontWeight: 700, height: 24 }} />
                    ) : lote.estado_subasta === 'pendiente' ? (
                      <Chip label="Próximamente" color="warning" size="small" icon={<AccessTime sx={{ color: 'white !important', fontSize: '16px !important' }} />} sx={{ fontWeight: 700, height: 24 }} />
                    ) : (
                      <Chip label={lote.estado_subasta} color="default" size="small" sx={{ fontWeight: 700, height: 24, textTransform: 'capitalize' }} />
                    )}
                  </Box>

                  {/* BOTÓN FAVORITO */}
                  <Box 
                    position="absolute" top={8} right={8} 
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.9)', 
                      backdropFilter: 'blur(4px)',
                      borderRadius: '50%', width: 36, height: 36,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      boxShadow: theme.shadows[2],
                      transition: '0.2s', '&:hover': { transform: 'scale(1.1)', bgcolor: 'white' }
                    }}
                  >
                    <FavoritoButton 
                        loteId={lote.id} 
                        size="small" 
                        onRemoveRequest={handleRemoveRequest}
                    />
                  </Box>
                </Box>

                {/* ZONA DE CONTENIDO */}
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: { xs: 2, md: 2.5 } }}>
                  <Typography variant="h6" fontWeight={700} lineHeight={1.2} mb={0.5} noWrap color="text.primary" fontSize={{ xs: '1rem', md: '1.125rem' }}>
                    {lote.nombre_lote}
                  </Typography>
                  
                  <Stack direction="row" spacing={0.5} alignItems="center" mb={2}>
                      <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary" fontWeight={500}>Lote #{lote.id}</Typography>
                  </Stack>

                  {lote.estado_subasta === 'pendiente' && lote.fecha_inicio && (
                    <Stack direction="row" spacing={1} alignItems="center" mb={2} sx={{ color: 'warning.dark', bgcolor: alpha(theme.palette.warning.main, 0.1), p: 1, borderRadius: 1 }}>
                      <CalendarMonth fontSize="small" />
                      <Typography variant="caption" fontWeight="bold">Inicia: {new Date(lote.fecha_inicio).toLocaleDateString()}</Typography>
                    </Stack>
                  )}

                  {/* Espaciador flexible para empujar el precio y botón al fondo */}
                  <Box flexGrow={1} />

                  <Box mb={2} p={1.5} bgcolor={alpha(theme.palette.primary.main, 0.04)} borderRadius={2} border={`1px solid ${alpha(theme.palette.primary.main, 0.1)}`}>
                    <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5} fontWeight={600} fontSize="0.7rem" textTransform="uppercase">
                      <MonetizationOn fontSize="inherit" /> Precio Base
                    </Typography>
                    <Typography variant="h6" color="primary.main" fontWeight={800} fontSize={{ xs: '1.1rem', md: '1.25rem' }}>
                      {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(Number(lote.precio_base))}
                    </Typography>
                  </Box>

                  {lote.estado_subasta === 'activa' ? (
                    <Button
                      variant="contained" fullWidth startIcon={<Gavel />}
                      onClick={(e) => { e.stopPropagation(); handlePujarClick(lote); }}
                      sx={{ borderRadius: 2, fontWeight: 'bold', boxShadow: 'none', py: 1 }}
                    >
                      Pujar Ahora
                    </Button>
                  ) : (
                    <Button
                      variant="outlined" fullWidth
                      sx={{ borderRadius: 2, fontWeight: 'bold', borderWidth: 1.5, '&:hover': { borderWidth: 1.5 }, py: 1 }}
                      onClick={(e) => { e.stopPropagation(); navigate(`/lotes/${lote.id}`); }}
                    >
                      Ver Detalles
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Fade>
          );
        })}
      </Box>

      {/* Modal de Puja */}
      {selectedLote && (
        <PujarModal open={pujarModal.isOpen} lote={selectedLote} onClose={() => { pujarModal.close(); setSelectedLote(null); }} />
      )}

      {/* Diálogo Confirmación */}
      <ConfirmDialog 
        controller={confirmDialog}
        onConfirm={handleConfirmUnfav}
        isLoading={unfavMutation.isPending}
      />

    </Box>
  );
};  