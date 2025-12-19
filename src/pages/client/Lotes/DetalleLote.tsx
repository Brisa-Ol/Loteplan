import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Typography, Button, Stack, Chip, Divider,
  Card, CardContent, Alert, Skeleton, IconButton, useTheme, alpha,
  Avatar
} from '@mui/material';
import {
  ArrowBack, LocationOn, Gavel, AttachMoney,
  CalendarToday, CheckCircle, AccessTime, Map as MapIcon,
  InfoOutlined, Cancel, EmojiEvents
} from '@mui/icons-material';

// Servicios y Tipos
import LoteService from '../../../Services/lote.service';
import type { LoteDto } from '../../../types/dto/lote.dto';
import ImagenService from '../../../Services/imagen.service';

// Contextos y Hooks
import { useAuth } from '../../../context/AuthContext';
import { useModal } from '../../../hooks/useModal';

// Componentes
import { FavoritoButton } from '../../../components/common/BotonFavorito/BotonFavorito';
import { PujarModal } from '../Proyectos/components/PujarModal';

const DetalleLote: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const theme = useTheme();
  
  // Hook useModal para el modal de puja
  const pujarModal = useModal(); 

  // Estado para la imagen seleccionada en la galería
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const { data: lote, isLoading, error } = useQuery<LoteDto>({
    queryKey: ['lote', id],
    queryFn: async () => {
      if (!id) throw new Error('ID inválido');
      const res = await LoteService.getByIdActive(Number(id));
      return res.data;
    },
    retry: false
  });

  if (isLoading) {
    return (
      <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3 }}>
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
        <Box mt={3} display="grid" gridTemplateColumns="2fr 1fr" gap={4}>
          <Skeleton height={200} sx={{ borderRadius: 3 }} />
          <Skeleton height={200} sx={{ borderRadius: 3 }} />
        </Box>
      </Box>
    );
  }

  if (error || !lote) {
    return (
      <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3 }}>
        <Alert severity="error">Lote no encontrado o no disponible públicamente.</Alert>
        <Button onClick={() => navigate(-1)} sx={{ mt: 2 }} variant="outlined">Volver</Button>
      </Box>
    );
  }

  // Configuración visual de estados
  const getStatusConfig = () => {
    switch (lote.estado_subasta) {
      case 'activa':
        return { label: 'Subasta Activa', color: 'success' as const, icon: <Gavel fontSize="small" /> };
      case 'pendiente':
        return { label: 'Próximamente', color: 'warning' as const, icon: <AccessTime fontSize="small" /> };
      case 'finalizada':
        return { label: 'Finalizada', color: 'error' as const, icon: <EmojiEvents fontSize="small" /> };
      default:
        return { label: lote.estado_subasta, color: 'default' as const, icon: null };
    }
  };

  const statusConfig = getStatusConfig();

  // Lógica de Imágenes
  const imagenes = lote.imagenes || [];
  const mainImageUrl = imagenes.length > 0
    ? ImagenService.resolveImageUrl(imagenes[selectedImageIndex].url)
    : '/assets/placeholder-lote.jpg';

  // Función para abrir mapa
  const openMap = () => {
    if (lote.latitud && lote.longitud) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${lote.latitud},${lote.longitud}`, '_blank');
    }
  };

  // Handler para abrir modal de puja
  const handleOpenPujar = () => {
    if (!isAuthenticated) return navigate('/login');
    pujarModal.open();
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, md: 4 } }}>

      {/* Breadcrumb */}
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: 'background.paper', border: `1px solid ${theme.palette.divider}` }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="body2" color="text.secondary">
          Proyectos / {lote.proyecto?.nombre_proyecto || 'General'} / <strong>{lote.nombre_lote}</strong>
        </Typography>
      </Stack>

      {/* LAYOUT PRINCIPAL */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
        gap: 4,
        alignItems: 'start'
      }}>

        {/* === COLUMNA IZQUIERDA (Visuales e Info) === */}
        <Box component="section">

          {/* Imagen Principal */}
          <Box 
            sx={{ 
                position: 'relative', 
                height: { xs: 300, md: 500 }, 
                borderRadius: 4, 
                overflow: 'hidden', 
                mb: 2, 
                boxShadow: theme.shadows[2], 
                bgcolor: 'grey.100',
                border: `1px solid ${theme.palette.divider}`
            }}
          >
            <Box component="img" src={mainImageUrl} alt={lote.nombre_lote} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            
            {/* Chip de Estado Flotante */}
            <Box sx={{ position: 'absolute', top: 20, left: 20 }}>
              <Chip 
                label={statusConfig.label} 
                color={statusConfig.color} 
                icon={statusConfig.icon || undefined} 
                sx={{ fontWeight: 'bold', boxShadow: 2 }} 
              />
            </Box>
          </Box>

          {/* Galería de Miniaturas */}
          {imagenes.length > 1 && (
            <Stack direction="row" spacing={2} mb={4} sx={{ overflowX: 'auto', py: 1 }}>
              {imagenes.map((img, idx) => (
                <Box
                  key={img.id}
                  component="img"
                  src={ImagenService.resolveImageUrl(img.url)}
                  alt={`Vista ${idx + 1}`}
                  onClick={() => setSelectedImageIndex(idx)}
                  sx={{
                    width: 100, height: 70, objectFit: 'cover', borderRadius: 2, cursor: 'pointer',
                    border: selectedImageIndex === idx ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
                    opacity: selectedImageIndex === idx ? 1 : 0.7,
                    transition: 'all 0.2s',
                    '&:hover': { opacity: 1, transform: 'scale(1.05)' }
                  }}
                />
              ))}
            </Stack>
          )}

          {/* Descripción / Proyecto */}
          <Card elevation={0} sx={{ borderRadius: 3, mb: 3, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" fontWeight="bold" mb={2} display="flex" alignItems="center" gap={1}>
                <InfoOutlined color="primary" /> Información del Lote
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                Este lote forma parte del proyecto <strong>{lote.proyecto?.nombre_proyecto}</strong>.
                {lote.proyecto?.descripcion ? (
                  <>
                    <br /><br />
                    {lote.proyecto.descripcion}
                  </>
                ) : (
                  <>
                    <br /><br />
                    No hay una descripción detallada disponible para este proyecto actualmente.
                  </>
                )}
              </Typography>
            </CardContent>
          </Card>

          {/* Características Geográficas */}
          {(lote.latitud || lote.longitud) && (
            <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
              <CardContent sx={{ p: 4 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
                  <Box>
                    <Typography variant="h6" fontWeight="bold" mb={1} display="flex" alignItems="center" gap={1}>
                      <LocationOn color="error" /> Ubicación
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      Coordenadas GPS configuradas por la administración.
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" sx={{ fontFamily: 'monospace', bgcolor: alpha(theme.palette.common.black, 0.05), p: 1, borderRadius: 1, display: 'inline-block' }}>
                      Lat: {lote.latitud ?? '?'} , Lng: {lote.longitud ?? '?'}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    startIcon={<MapIcon />}
                    onClick={openMap}
                    sx={{ borderRadius: 2 }}
                  >
                    Ver en Google Maps
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

        </Box>

        {/* === COLUMNA DERECHA (Acciones y Precio) === */}
        <Box component="aside">
          <Card elevation={0} sx={{ borderRadius: 3, position: { lg: 'sticky' }, top: 100, border: `1px solid ${theme.palette.divider}`, boxShadow: theme.shadows[4] }}>
            <CardContent sx={{ p: 4 }}>

              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                <Box>
                    <Typography variant="h4" fontWeight="800" sx={{ lineHeight: 1.2, mb: 0.5 }}>
                    {lote.nombre_lote}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                        <LocationOn fontSize="small" /> {lote.proyecto?.nombre_proyecto || 'Sin Proyecto'}
                    </Typography>
                </Box>
                <FavoritoButton loteId={lote.id} size="large" />
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Precio Base */}
              <Box mb={4} p={2} bgcolor={alpha(theme.palette.primary.main, 0.05)} borderRadius={2} border={`1px solid ${alpha(theme.palette.primary.main, 0.1)}`}>
                <Typography variant="caption" color="text.secondary" fontWeight="bold" display="flex" alignItems="center" gap={0.5}>
                    <AttachMoney fontSize="small"/> PRECIO BASE
                </Typography>
                <Stack direction="row" alignItems="baseline" spacing={1}>
                    <Typography variant="h3" fontWeight="800" color="primary.main">
                        {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(Number(lote.precio_base))}
                    </Typography>
                    <Typography variant="h6" color="text.secondary" fontWeight={500}>ARS</Typography>
                </Stack>
              </Box>

              {/* Panel de Fechas */}
              <Box mb={3}>
                  <Stack spacing={2}>
                    {/* Fecha Inicio */}
                    {lote.fecha_inicio && (
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main', width: 32, height: 32 }}>
                            <CalendarToday fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Inicio Subasta</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {new Date(lote.fecha_inicio).toLocaleDateString('es-AR')} {new Date(lote.fecha_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}hs
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    <Divider variant="inset" component="li" sx={{ ml: 6 }} />

                    {/* Fecha Fin */}
                    {lote.fecha_fin && (
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ 
                            bgcolor: lote.estado_subasta === 'activa' ? alpha(theme.palette.error.main, 0.1) : alpha(theme.palette.text.secondary, 0.1), 
                            color: lote.estado_subasta === 'activa' ? 'error.main' : 'text.secondary', 
                            width: 32, height: 32 
                        }}>
                            <AccessTime fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Cierre Subasta</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {new Date(lote.fecha_fin).toLocaleDateString('es-AR')} {new Date(lote.fecha_fin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}hs
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    {!lote.fecha_inicio && !lote.fecha_fin && (
                      <Typography variant="body2" color="text.secondary" fontStyle="italic" textAlign="center">
                        Fechas por definir.
                      </Typography>
                    )}
                  </Stack>
              </Box>

              {/* Botón de Acción */}
              {lote.estado_subasta === 'activa' ? (
                <>
                  <Button 
                    variant="contained" 
                    size="large" 
                    fullWidth 
                    startIcon={<Gavel />}
                    onClick={handleOpenPujar} // Usamos el handler con hook
                    sx={{ py: 1.5, fontSize: '1.1rem', fontWeight: 'bold', mb: 2, boxShadow: theme.shadows[4] }}
                  >
                    Realizar Puja
                  </Button>
                  <Alert severity="info" sx={{ fontSize: '0.875rem', borderRadius: 2 }}>
                    Subasta en curso. Oferta mínima superior al precio base.
                  </Alert>
                </>
              ) : lote.estado_subasta === 'pendiente' ? (
                <Alert severity="warning" icon={<AccessTime fontSize="inherit" />} sx={{ borderRadius: 2 }}>
                  La subasta comenzará pronto en la fecha indicada.
                </Alert>
              ) : (
                <Alert severity="error" icon={<Cancel fontSize="inherit" />} sx={{ borderRadius: 2 }}>
                    Esta subasta ha finalizado.
                </Alert>
              )}

            </CardContent>
          </Card>
        </Box>

      </Box>

      {/* Modal de Puja (Controlado por el Hook) */}
      <PujarModal 
        open={pujarModal.isOpen} 
        lote={lote} 
        onClose={pujarModal.close} 
      />

    </Box>
  );
};

export default DetalleLote;