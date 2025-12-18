import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Typography, Button, Stack, Chip, Paper, Divider,
  Card, CardContent, Alert, Skeleton, IconButton
} from '@mui/material';
import {
  ArrowBack, LocationOn, Gavel, AttachMoney,
  CalendarToday, CheckCircle, AccessTime, Map as MapIcon,
  InfoOutlined
} from '@mui/icons-material';

// Servicios y Tipos
import LoteService from '../../../Services/lote.service';
import type { LoteDto } from '../../../types/dto/lote.dto';
import ImagenService from '../../../Services/imagen.service';

// Contextos y Hooks
import { useAuth } from '../../../context/AuthContext';
import { useModal } from '../../../hooks/useModal'; // 👈 Importamos el hook

// Componentes
import { FavoritoButton } from '../../../components/common/BotonFavorito/BotonFavorito';
import { PujarModal } from '../Proyectos/components/PujarModal';

const DetalleLote: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  // 1. Hook useModal para el modal de puja
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
        <Box mt={3}>
          <Skeleton width="60%" height={40} />
          <Skeleton width="40%" />
        </Box>
      </Box>
    );
  }

  if (error || !lote) {
    return (
      <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3 }}>
        <Alert severity="error">Lote no encontrado o no disponible públicamente.</Alert>
        <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>Volver</Button>
      </Box>
    );
  }

  // Configuración visual de estados
  const getStatusConfig = () => {
    switch (lote.estado_subasta) {
      case 'activa':
        return { label: 'Subasta Activa', color: 'success' as const, icon: <CheckCircle /> };
      case 'pendiente':
        return { label: 'Próximamente', color: 'warning' as const, icon: <AccessTime /> };
      default:
        return { label: 'Finalizada', color: 'default' as const, icon: null };
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
    pujarModal.open(); // Usamos el hook
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, md: 4 } }}>

      {/* Breadcrumb */}
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: 'background.paper', boxShadow: 1 }}>
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
          <Box sx={{ position: 'relative', height: { xs: 300, md: 500 }, borderRadius: 3, overflow: 'hidden', mb: 2, boxShadow: 3, bgcolor: '#f5f5f5' }}>
            <Box component="img" src={mainImageUrl} alt={lote.nombre_lote} sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
              <Chip label={statusConfig.label} color={statusConfig.color} icon={statusConfig.icon || undefined} sx={{ fontWeight: 'bold', boxShadow: 2 }} />
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
                    border: selectedImageIndex === idx ? '2px solid #1976d2' : '2px solid transparent',
                    transition: 'all 0.2s',
                    '&:hover': { opacity: 0.8 }
                  }}
                />
              ))}
            </Stack>
          )}

          {/* Descripción / Proyecto */}
          <Paper elevation={2} sx={{ p: 4, borderRadius: 3, mb: 3 }}>
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
          </Paper>

          {/* Características Geográficas */}
          {(lote.latitud || lote.longitud) && (
            <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="h6" fontWeight="bold" mb={1} display="flex" alignItems="center" gap={1}>
                    <LocationOn color="error" /> Ubicación
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Coordenadas GPS configuradas por la administración.
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 1, borderRadius: 1, display: 'inline-block' }}>
                    {lote.latitud ?? '?'} , {lote.longitud ?? '?'}
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<MapIcon />}
                  onClick={openMap}
                >
                  Ver en Mapa
                </Button>
              </Box>
            </Paper>
          )}

        </Box>

        {/* === COLUMNA DERECHA (Acciones y Precio) === */}
        <Box component="aside">
          <Paper elevation={4} sx={{ p: 4, borderRadius: 3, position: { lg: 'sticky' }, top: 100 }}>

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h4" fontWeight="bold" sx={{ mr: 1, lineHeight: 1.2 }}>
                {lote.nombre_lote}
              </Typography>
              <FavoritoButton loteId={lote.id} size="large" />
            </Box>

            <Box display="flex" alignItems="center" gap={1} mb={3}>
              <LocationOn fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {lote.proyecto?.nombre_proyecto || 'Sin Proyecto'}
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Precio Base */}
            <Box mb={4}>
              <Typography variant="caption" color="text.secondary" fontWeight="bold">PRECIO BASE</Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <AttachMoney sx={{ fontSize: 40, color: 'success.main' }} />
                <Typography variant="h3" fontWeight="bold" color="primary.main">
                  {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(Number(lote.precio_base))}
                </Typography>
                <Typography variant="h5" color="text.secondary">ARS</Typography>
              </Box>
            </Box>

            {/* Panel de Fechas */}
            <Card variant="outlined" sx={{ mb: 3, bgcolor: lote.estado_subasta === 'activa' ? 'success.50' : 'grey.50' }}>
              <CardContent>
                <Stack spacing={2}>
                  {/* Fecha Inicio */}
                  {lote.fecha_inicio && (
                    <Box display="flex" alignItems="center" gap={1}>
                      <CalendarToday fontSize="small" color="primary" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Inicio Subasta</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {new Date(lote.fecha_inicio).toLocaleDateString('es-AR')} {new Date(lote.fecha_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}hs
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  <Divider />

                  {/* Fecha Fin */}
                  {lote.fecha_fin && (
                    <Box display="flex" alignItems="center" gap={1}>
                      <AccessTime fontSize="small" color={lote.estado_subasta === 'activa' ? 'error' : 'action'} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Cierre Subasta</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {new Date(lote.fecha_fin).toLocaleDateString('es-AR')} {new Date(lote.fecha_fin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}hs
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {!lote.fecha_inicio && !lote.fecha_fin && (
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                      Fechas aún no definidas por la administración.
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>

            {/* Botón de Acción */}
            {lote.estado_subasta === 'activa' ? (
              <>
                <Button 
                  variant="contained" 
                  size="large" 
                  fullWidth 
                  startIcon={<Gavel />}
                  onClick={handleOpenPujar} // Usamos el handler con hook
                  sx={{ py: 2, fontSize: '1.1rem', fontWeight: 'bold', mb: 2 }}
                >
                  Realizar Puja
                </Button>
                <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
                  Subasta en curso. Oferta mínima requerida.
                </Alert>
              </>
            ) : lote.estado_subasta === 'pendiente' ? (
              <Alert severity="warning" icon={<AccessTime fontSize="inherit" />}>
                La subasta comenzará pronto en la fecha indicada.
              </Alert>
            ) : (
              <Alert severity="error">Esta subasta ha finalizado.</Alert>
            )}

          </Paper>
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