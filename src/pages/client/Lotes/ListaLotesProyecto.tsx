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
import { useSnackbar } from '../../../context/SnackbarContext'; // Importar snackbar

interface Props {
  idProyecto: number;
}

export const ListaLotesProyecto: React.FC<Props> = ({ idProyecto }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const { showSuccess, showError } = useSnackbar(); // Usar snackbar
  
  // 1. Hooks de Modales
  const pujarModal = useModal();
  const confirmDialog = useConfirmDialog();
  
  // 2. Estados
  const [selectedLote, setSelectedLote] = useState<LoteDto | null>(null);

  // Query para obtener lotes
  const { data: lotes, isLoading, error } = useQuery<LoteDto[]>({
    queryKey: ['lotesProyecto', idProyecto],
    queryFn: async () => {
      // Nota: Si tienes un endpoint específico para lotes por proyecto, úsalo.
      // Si no, filtrar en el cliente está bien para pocos datos.
      const res = await LoteService.getAllActive();
      // Aseguramos que res.data sea un array antes de filtrar
      const allLotes = Array.isArray(res.data) ? res.data : [];
      return allLotes.filter(lote => lote.id_proyecto === idProyecto);
    },
    enabled: !!idProyecto && isAuthenticated,
    retry: 1
  });

  // 3. Mutación para eliminar favorito
  const unfavMutation = useMutation({
    mutationFn: async (loteId: number) => await FavoritoService.toggle(loteId),
    onSuccess: (_, loteId) => {
      // Actualizamos optimísticamente el caché de este lote específico
      queryClient.setQueryData(['checkFavorito', loteId], { es_favorito: false });
      
      // Invalidamos para refrescar la lista de favoritos global
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
      <Box mt={4} p={{ xs: 3, md: 5 }} textAlign="center" bgcolor="background.paper" borderRadius={3} border={`1px dashed ${theme.palette.divider}`}>
        <Lock sx={{ fontSize: { xs: 40, md: 60 }, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
        <Typography variant="h6" fontWeight="bold" color="text.primary" gutterBottom>Sección Exclusiva</Typography>
        <Typography variant="body1" color="text.secondary" mb={3}>Debes iniciar sesión para ver los lotes.</Typography>
        <Button variant="contained" onClick={() => navigate('/login')} fullWidth sx={{ maxWidth: 300 }}>Iniciar Sesión</Button>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box mt={4}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
          {[1, 2, 3].map((i) => <Skeleton key={i} variant="rectangular" height={380} width="100%" sx={{ borderRadius: 3 }} />)}
        </Stack>
      </Box>
    );
  }

  if (error) return <Alert severity="error" sx={{ mt: 2 }}>Error al cargar los lotes disponibles.</Alert>;

  if (!lotes || lotes.length === 0) {
    return (
      <Box mt={4} p={4} bgcolor="background.paper" borderRadius={2} textAlign="center" border={`1px solid ${theme.palette.divider}`}>
        <Typography color="text.secondary">No hay lotes activos asignados a este proyecto actualmente.</Typography>
      </Box>
    );
  }

  return (
    <Box mt={4}>
      <Typography variant="h5" fontWeight="bold" mb={3} color="text.primary" sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
        Inventario del Proyecto ({lotes.length})
      </Typography>

      {/* GRID RESPONSIVE */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, 
        gap: 3 
      }}>
        {lotes.map((lote) => {
          const imgUrl = lote.imagenes && lote.imagenes.length > 0
            ? ImagenService.resolveImageUrl(lote.imagenes[0].url)
            : '/assets/placeholder-lote.jpg';

          return (
            <Fade in={true} key={lote.id}>
              <Card
                variant="outlined"
                sx={{
                  display: 'flex', flexDirection: 'column', 
                  borderRadius: 3,
                  cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                  position: 'relative', overflow: 'visible',
                  borderColor: theme.palette.divider,
                  bgcolor: 'background.paper',
                  minHeight: 380,
                  '&:hover': { 
                    transform: 'translateY(-4px)', 
                    boxShadow: theme.shadows[4],
                    borderColor: 'primary.main' 
                  }
                }}
                onClick={() => navigate(`/lotes/${lote.id}`)}
              >
                {/* ZONA DE IMAGEN */}
                <Box sx={{ position: 'relative', height: 200, borderRadius: '12px 12px 0 0', overflow: 'hidden', bgcolor: 'action.hover' }}>
                  <CardMedia
                    component="img" height="200" image={imgUrl} alt={lote.nombre_lote} sx={{ objectFit: 'cover' }}
                    onError={(e) => { (e.target as HTMLImageElement).src = '/assets/placeholder-lote.jpg'; }}
                  />
                  
                  {/* Gradiente sutil */}
                  <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '40%', background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)' }} />

                  <Box position="absolute" top={10} left={10}>
                    {lote.estado_subasta === 'activa' ? (
                      <Chip label="Activo" color="success" size="small" icon={<CheckCircle sx={{ color: 'white !important' }} />} sx={{ fontWeight: 700 }} />
                    ) : lote.estado_subasta === 'pendiente' ? (
                      <Chip label="Próximamente" color="warning" size="small" icon={<AccessTime sx={{ color: 'white !important' }} />} sx={{ fontWeight: 700 }} />
                    ) : (
                      <Chip label={lote.estado_subasta} color="default" size="small" sx={{ fontWeight: 700 }} />
                    )}
                  </Box>

                  {/* BOTÓN FAVORITO */}
                  <Box 
                    position="absolute" top={10} right={10} 
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                      bgcolor: 'background.paper', borderRadius: '50%', width: 40, height: 40,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      boxShadow: theme.shadows[2],
                      transition: '0.2s', '&:hover': { transform: 'scale(1.1)', boxShadow: theme.shadows[4] }
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
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', pt: 2.5, px: 2.5 }}>
                  <Typography variant="h6" fontWeight={700} lineHeight={1.2} mb={0.5} noWrap color="text.primary">
                    {lote.nombre_lote}
                  </Typography>
                  
                  <Stack direction="row" spacing={0.5} alignItems="center" mb={2}>
                      <LocationOn sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">Lote #{lote.id}</Typography>
                  </Stack>

                  {lote.estado_subasta === 'pendiente' && lote.fecha_inicio && (
                    <Stack direction="row" spacing={1} alignItems="center" mb={2} sx={{ color: 'warning.dark', bgcolor: alpha(theme.palette.warning.main, 0.1), p: 1, borderRadius: 1 }}>
                      <CalendarMonth fontSize="small" />
                      <Typography variant="caption" fontWeight="bold">Inicia: {new Date(lote.fecha_inicio).toLocaleDateString()}</Typography>
                    </Stack>
                  )}

                  {/* Espaciador flexible */}
                  <Box flexGrow={1} />

                  <Box mb={2} p={1.5} bgcolor={alpha(theme.palette.primary.main, 0.05)} borderRadius={2} border={`1px solid ${alpha(theme.palette.primary.main, 0.1)}`}>
                    <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5} fontWeight={600}>
                      <MonetizationOn fontSize="inherit" /> PRECIO BASE
                    </Typography>
                    <Typography variant="h6" color="primary.main" fontWeight={800}>
                      {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(Number(lote.precio_base))}
                    </Typography>
                  </Box>

                  {lote.estado_subasta === 'activa' ? (
                    <Button
                      variant="contained" fullWidth startIcon={<Gavel />}
                      onClick={(e) => { e.stopPropagation(); handlePujarClick(lote); }}
                      sx={{ borderRadius: 2, fontWeight: 'bold', boxShadow: 'none', py: 1.2 }}
                    >
                      Pujar Ahora
                    </Button>
                  ) : (
                    <Button
                      variant="outlined" fullWidth
                      sx={{ borderRadius: 2, fontWeight: 'bold', borderWidth: 2, '&:hover': { borderWidth: 2 }, py: 1.2 }}
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