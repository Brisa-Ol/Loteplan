// src/pages/Lotes/DetalleLote.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Typography, Button, Stack, Chip, Paper, Divider,
  Card, CardContent, Alert, Skeleton, IconButton
} from '@mui/material';
import {
  ArrowBack, LocationOn, Gavel, AttachMoney,
  CalendarToday, CheckCircle, AccessTime
} from '@mui/icons-material';
import LoteService from '../../../Services/lote.service';
import type { LoteDto } from '../../../types/dto/lote.dto';
import { useAuth } from '../../../context/AuthContext';
import ImagenService from '../../../Services/imagen.service';
import { FavoritoButton } from '../../../components/common/BotonFavorito/BotonFavorito';
import { PujarModal } from '../Proyectos/components/PujarModal';


const DetalleLote: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showPujarModal, setShowPujarModal] = useState(false);

  // Tipamos explícitamente el return del Query como LoteDto
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
        <Alert severity="error">Lote no encontrado o no disponible</Alert>
        <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>Volver</Button>
      </Box>
    );
  }

  const getStatusConfig = () => {
    switch(lote.estado_subasta) {
      case 'activa':
        return { label: 'Subasta Activa', color: 'success' as const, icon: <CheckCircle /> };
      case 'pendiente':
        return { label: 'Próximamente', color: 'info' as const, icon: <AccessTime /> };
      default:
        return { label: 'Finalizada', color: 'default' as const, icon: null };
    }
  };

  const statusConfig = getStatusConfig();
  
  // Manejo seguro de imágenes según tu DTO (ImagenDto[])
  const imageUrl = lote.imagenes && lote.imagenes.length > 0
    ? ImagenService.resolveImageUrl(lote.imagenes[0].url)
    : '/assets/placeholder-lote.jpg';

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, md: 4 } }}>
      
      {/* Breadcrumb */}
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: 'background.paper' }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="body2" color="text.secondary">
          Proyectos / {lote.proyecto?.nombre_proyecto || 'General'} / Lote #{lote.id}
        </Typography>
      </Stack>

      {/* LAYOUT PRINCIPAL - CSS Grid */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
        gap: 4,
        alignItems: 'start'
      }}>
        
        {/* COLUMNA IZQUIERDA */}
        <Box component="section">
          
          {/* Hero Image */}
          <Box sx={{ position: 'relative', height: { xs: 300, md: 500 }, borderRadius: 3, overflow: 'hidden', mb: 3, boxShadow: 3 }}>
            <Box component="img" src={imageUrl} alt={lote.nombre_lote} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
              <Chip label={statusConfig.label} color={statusConfig.color} icon={statusConfig.icon || undefined} sx={{ fontWeight: 'bold' }} />
            </Box>
          </Box>

          {/* Galería Thumbnails */}
          {lote.imagenes && lote.imagenes.length > 1 && (
            <Stack direction="row" spacing={2} mb={4} sx={{ overflowX: 'auto' }}>
              {lote.imagenes.slice(1, 5).map((img, idx) => (
                <Box key={img.id} component="img" src={ImagenService.resolveImageUrl(img.url)} alt={`Vista ${idx + 2}`}
                  sx={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 2, cursor: 'pointer', flexShrink: 0, '&:hover': { opacity: 0.8 } }}
                />
              ))}
            </Stack>
          )}

          {/* Descripción */}
          <Paper elevation={2} sx={{ p: 4, borderRadius: 3, mb: 3 }}>
            <Typography variant="h5" fontWeight="bold" mb={2}>Información del Lote</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
              Lote perteneciente al proyecto <strong>{lote.proyecto?.nombre_proyecto}</strong>. 
              {lote.proyecto?.descripcion && (
                <>
                  <br /><br />
                  {lote.proyecto.descripcion}
                </>
              )}
            </Typography>
          </Paper>

          {/* Características Geográficas */}
          {(lote.latitud || lote.longitud) && (
            <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight="bold" mb={3}>Ubicación</Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <Box sx={{ width: '100%' }}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <LocationOn color="primary" sx={{ fontSize: 30 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Coordenadas GPS</Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {lote.latitud ?? 'N/A'}, {lote.longitud ?? 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Paper>
          )}

        </Box>

        {/* COLUMNA DERECHA - Sticky Sidebar */}
        <Box component="aside">
          <Paper elevation={4} sx={{ p: 4, borderRadius: 3, position: { lg: 'sticky' }, top: 100 }}>
            
            {/* HEADER CON TITULO Y FAVORITO (AQUI ESTÁ EL CAMBIO) */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h4" fontWeight="bold" sx={{ mr: 1 }}>
                {lote.nombre_lote}
              </Typography>
              <FavoritoButton loteId={lote.id} size="large" /> 
            </Box>

            <Box display="flex" alignItems="center" gap={1} mb={3}>
              <LocationOn fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {lote.proyecto?.nombre_proyecto || 'Sin Proyecto Asignado'}
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Precio */}
            <Box mb={4}>
              <Typography variant="caption" color="text.secondary">PRECIO BASE DE SUBASTA</Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <AttachMoney sx={{ fontSize: 40, color: 'success.main' }} />
                <Typography variant="h3" fontWeight="bold" color="primary.main">
                  {Number(lote.precio_base).toLocaleString()}
                </Typography>
                <Typography variant="h5" color="text.secondary">USD</Typography>
              </Box>
            </Box>

            {/* Fechas */}
            {lote.estado_subasta === 'activa' && lote.fecha_inicio && lote.fecha_fin && (
              <Card variant="outlined" sx={{ mb: 3, bgcolor: 'success.50' }}>
                <CardContent>
                  <Stack spacing={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <CalendarToday fontSize="small" color="success" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Inicio</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {new Date(lote.fecha_inicio).toLocaleDateString('es-AR')}
                        </Typography>
                      </Box>
                    </Box>
                    <Divider />
                    <Box display="flex" alignItems="center" gap={1}>
                      <AccessTime fontSize="small" color="warning" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Cierre</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {new Date(lote.fecha_fin).toLocaleDateString('es-AR')}
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            )}

            {/* Botón de Acción */}
            {lote.estado_subasta === 'activa' ? (
              <>
                <Button variant="contained" size="large" fullWidth startIcon={<Gavel />}
                  onClick={() => {
                    if (!isAuthenticated) return navigate('/login');
                    setShowPujarModal(true);
                  }}
                  sx={{ py: 2, fontSize: '1.1rem', fontWeight: 'bold', mb: 2 }}
                >
                  Realizar Puja
                </Button>
                <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
                  La subasta está activa. Realizá tu oferta para participar.
                </Alert>
              </>
            ) : lote.estado_subasta === 'pendiente' ? (
              <Alert severity="warning">Esta subasta aún no ha comenzado.</Alert>
            ) : (
              <Alert severity="error">Esta subasta ha finalizado.</Alert>
            )}

          </Paper>
        </Box>

      </Box>

      {/* Modal de Puja */}
      {showPujarModal && (
        <PujarModal open={showPujarModal} lote={lote} onClose={() => setShowPujarModal(false)} />
      )}
      
    </Box>
  );
};

export default DetalleLote;