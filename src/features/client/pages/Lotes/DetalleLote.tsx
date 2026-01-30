import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Button, Stack, Chip, Divider,
  Card, CardContent, Alert, Skeleton, IconButton, useTheme, alpha,
  Avatar, keyframes, Paper
} from '@mui/material';
import {
  ArrowBack, LocationOn, Gavel, AccessTime, Map as MapIcon,
  InfoOutlined, EmojiEvents, EmojiEmotions, VerifiedUser, Security, Share, Lock,
  BrokenImage // <--- Agregado
} from '@mui/icons-material';

import { useModal } from '../../../../shared/hooks/useModal';
import PujarModal from './components/PujarModal';
import LoteService from '@/core/api/services/lote.service';
import type { LoteDto } from '@/core/types/dto/lote.dto';
import { useAuth } from '@/core/context/AuthContext';
import ImagenService from '@/core/api/services/imagen.service';

import { useVerificarSuscripcion } from '../../hooks/useVerificarSuscripcion';
import { FavoritoButton } from '@/shared/components/ui/buttons/BotonFavorito';

// --- ANIMACIONES CSS ---
const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(46, 125, 50, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(46, 125, 50, 0); }
  100% { box-shadow: 0 0 0 0 rgba(46, 125, 50, 0); }
`;

interface LoteConPuja extends LoteDto {
  ultima_puja?: {
    monto: string | number;
    id_usuario: number;
  };
}

const DetalleLote: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const theme = useTheme();
  const queryClient = useQueryClient();

  const pujarModal = useModal();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // ✅ ESTADOS DE IMAGEN
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // 1. QUERY REAL-TIME LOTE
  const { data: loteData, isLoading, error } = useQuery<LoteDto>({
    queryKey: ['lote', id],
    queryFn: async () => {
      if (!id) throw new Error('ID inválido');
      const res = await LoteService.getByIdActive(Number(id));
      return res.data;
    },
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
    retry: false
  });

  const lote = loteData as LoteConPuja;

  // 2. QUERY VERIFICACIÓN SUSCRIPCIÓN
  const {
    estaSuscripto,
    tieneTokens,
    tokensDisponibles,
    isLoading: loadingSub
  } = useVerificarSuscripcion(lote?.id_proyecto ?? undefined);

  // --- LÓGICA DE NEGOCIO (MEMOIZED) ---
  const { precioDisplay, soyGanador, hayOfertas, statusConfig } = useMemo(() => {
    type ChipColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';

    let config: { label: string; color: ChipColor; icon?: React.ReactElement; bgColor?: string } = {
      label: '', color: 'default', icon: undefined, bgColor: ''
    };

    if (!lote) return { precioDisplay: 0, soyGanador: false, hayOfertas: false, statusConfig: config };

    const montoGanador = Number(lote.monto_ganador_lote || 0);
    const montoUltimaPuja = Number(lote.ultima_puja?.monto || 0);
    const ofertaActual = Math.max(montoGanador, montoUltimaPuja);
    const precioBase = Number(lote.precio_base);

    const precioDisplay = ofertaActual > 0 ? ofertaActual : precioBase;
    const hayOfertas = ofertaActual > 0;
    const soyGanador = isAuthenticated && (lote.id_ganador === user?.id);

    switch (lote.estado_subasta) {
      case 'activa':
        config = { label: 'Subasta en Vivo', color: 'success', icon: <Gavel fontSize="small" />, bgColor: alpha(theme.palette.success.main, 0.1) };
        break;
      case 'pendiente':
        config = { label: 'Próximamente', color: 'warning', icon: <AccessTime fontSize="small" />, bgColor: alpha(theme.palette.warning.main, 0.1) };
        break;
      case 'finalizada':
        config = { label: 'Finalizada', color: 'error', icon: <EmojiEvents fontSize="small" />, bgColor: alpha(theme.palette.error.main, 0.1) };
        break;
      default:
        config.label = lote.estado_subasta;
        config.color = 'default';
        break;
    }

    return { precioDisplay, soyGanador, hayOfertas, statusConfig: config };
  }, [lote, isAuthenticated, user, theme]);

  // --- HELPERS ---
  const imagenes = useMemo(() => {
    if (!lote || !lote.imagenes) return [];
    return lote.imagenes.filter(img => (img as any).activo !== false);
  }, [lote]);

  const mainImageUrl = useMemo(() => {
    if (imagenes.length === 0) return '';
    const index = selectedImageIndex >= imagenes.length ? 0 : selectedImageIndex;
    return ImagenService.resolveImageUrl(imagenes[index].url);
  }, [imagenes, selectedImageIndex]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(val);

  const openMap = () => {
    if (lote?.latitud && lote?.longitud) {
      window.open(`https://www.google.com/maps?q=${lote.latitud},${lote.longitud}`, '_blank');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: lote.nombre_lote,
        text: `Mira este lote en subasta: ${lote.nombre_lote}`,
        url: window.location.href,
      }).catch(console.error);
    }
  };

  const handleBotonAccion = () => {
    if (!isAuthenticated) {
      return navigate('/login', { state: { from: location.pathname } });
    }

    const proyecto = lote?.proyecto;
    if (!proyecto) return;

    if (proyecto.tipo_inversion === 'mensual') {
      if (!estaSuscripto) {
        return navigate(`/cliente/proyectos/${lote.id_proyecto}`);
      }
      pujarModal.open();
    } else if (proyecto.tipo_inversion === 'directo') {
      navigate(`/cliente/proyectos/${lote.id_proyecto}`, {
        state: { scrollTo: 'investment-section' }
      });
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, md: 4 } }}>
        <Skeleton variant="rectangular" height={500} sx={{ borderRadius: 4, mb: 4 }} />
        <Box display="grid" gridTemplateColumns={{ xs: '1fr', lg: "2fr 1fr" }} gap={4}>
          <Skeleton height={300} sx={{ borderRadius: 4 }} />
          <Skeleton height={400} sx={{ borderRadius: 4 }} />
        </Box>
      </Box>
    );
  }

  if (error || !lote) return <Box p={4}><Alert severity="error">No se encontró el lote.</Alert></Box>;

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, md: 4 }, pb: 12 }}>

      {/* HEADER */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: 'background.paper', border: `1px solid ${theme.palette.divider}`, boxShadow: 1 }}>
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              PROYECTO: {lote.proyecto?.nombre_proyecto || 'GENERAL'}
            </Typography>
            <Typography variant="h5" fontWeight="800" sx={{ lineHeight: 1 }}>
              {lote.nombre_lote}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1}>
          <IconButton onClick={handleShare} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <Share fontSize="small" />
          </IconButton>
          <FavoritoButton loteId={lote.id} size="large" />
        </Stack>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 4, alignItems: 'start' }}>

        {/* COLUMNA IZQUIERDA */}
        <Box sx={{ minWidth: 0 }}>
          <Paper
            elevation={0}
            sx={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 4,
              mb: 2,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: theme.shadows[2],
              bgcolor: 'grey.100' // Fondo base para carga
            }}
          >
            <Box sx={{ height: { xs: 300, sm: 500 }, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              
              {/* ✅ MANEJO DE IMAGEN PRINCIPAL */}
              {mainImageUrl && !imageError ? (
                <Box
                  component="img"
                  src={mainImageUrl}
                  alt={lote.nombre_lote}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'opacity 0.5s ease',
                    opacity: imageLoaded ? 1 : 0
                  }}
                />
              ) : (
                <Stack alignItems="center" spacing={1} color="text.disabled">
                  <BrokenImage sx={{ fontSize: 64 }} />
                  <Typography variant="caption">Imagen no disponible</Typography>
                </Stack>
              )}

              {/* Placeholder mientras carga */}
              {!imageLoaded && mainImageUrl && !imageError && (
                 <Skeleton variant="rectangular" width="100%" height="100%" sx={{ position: 'absolute', top: 0, left: 0 }} />
              )}

              {/* Chip de Estado */}
              <Box sx={{ position: 'absolute', top: 20, left: 20, zIndex: 2 }}>
                <Chip
                  label={statusConfig.label}
                  color={statusConfig.color}
                  icon={statusConfig.icon}
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    height: 32,
                    boxShadow: 3,
                    ...(lote.estado_subasta === 'activa' && { animation: `${pulse} 2s infinite` })
                  }}
                />
              </Box>
            </Box>

            {/* Galería de miniaturas */}
            {imagenes.length > 1 && (
              <Box sx={{ p: 2, bgcolor: 'background.paper', borderTop: `1px solid ${theme.palette.divider}` }}>
                <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 1 }}>
                  {imagenes.map((img, idx) => (
                    <Box
                      key={img.id}
                      component="img"
                      src={ImagenService.resolveImageUrl(img.url)}
                      onClick={() => {
                        setSelectedImageIndex(idx);
                        setImageLoaded(false);
                        setImageError(false);
                      }}
                      sx={{
                        width: 80,
                        height: 60,
                        objectFit: 'cover',
                        borderRadius: 2,
                        cursor: 'pointer',
                        border: selectedImageIndex === idx ? `2px solid ${theme.palette.primary.main}` : `1px solid transparent`,
                        opacity: selectedImageIndex === idx ? 1 : 0.6,
                        transition: 'all 0.2s',
                        '&:hover': { opacity: 1, transform: 'translateY(-2px)' }
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </Paper>

          {/* ... resto del componente (Detalles, Ubicación, Sidebar, Modal) ... */}
          {/* Los detalles del lote se mantienen iguales pero asegúrate de que el cierre del Paper sea correcto */}
          
          <Card elevation={0} variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom display="flex" alignItems="center" gap={1}>
                <InfoOutlined color="primary" /> Detalles del Lote
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph sx={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>
                {lote.proyecto?.descripcion ? `Este lote se encuentra en el desarrollo ${lote.proyecto.nombre_proyecto}. \n\n${lote.proyecto.descripcion}` : 'No hay descripción detallada disponible para este lote.'}
              </Typography>
              <Divider sx={{ my: 3 }} />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4}>
                 <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">TIPO DE VENTA</Typography>
                    <Typography variant="body1">Subasta Online</Typography>
                 </Box>
                 <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">MONEDA</Typography>
                    <Typography variant="body1">ARS</Typography>
                 </Box>
                 <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">IDENTIFICADOR</Typography>
                    <Chip label={`#${lote.id}`} size="small" variant="outlined" />
                 </Box>
              </Stack>
            </CardContent>
          </Card>

          {(lote.latitud || lote.longitud) && (
            <Card elevation={0} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: alpha(theme.palette.info.main, 0.05) }}>
                    <Box>
                        <Typography variant="h6" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                            <LocationOn color="error" /> Ubicación Geográfica
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Visita el lote usando las coordenadas oficiales.
                        </Typography>
                    </Box>
                    <Button variant="contained" color="info" startIcon={<MapIcon />} onClick={openMap} sx={{ borderRadius: 2, boxShadow: 'none' }}>
                        Abrir Mapa
                    </Button>
                </Box>
            </Card>
          )}
        </Box>

        {/* SIDEBAR DERECHO */}
        <Box component="aside">
          {/* Se mantiene la lógica del Card anterior con el fragmento sidebar inteligente */}
          <Card elevation={4} sx={{ borderRadius: 3, position: { lg: 'sticky' }, top: { lg: 100 }, border: `1px solid ${soyGanador ? theme.palette.success.main : theme.palette.divider}`, transition: 'all 0.3s ease' }}>
            {soyGanador && lote.estado_subasta === 'activa' && (
                <Box sx={{ bgcolor: 'success.main', color: 'white', p: 1.5, textAlign: 'center' }}>
                    <Typography variant="subtitle2" fontWeight="bold" display="flex" justifyContent="center" alignItems="center" gap={1}>
                        <EmojiEmotions /> ¡VAS GANANDO ESTA SUBASTA!
                    </Typography>
                </Box>
            )}

            <CardContent sx={{ p: 3 }}>
              <Box mb={3}>
                <Typography variant="caption" color="text.secondary" fontWeight="bold" textTransform="uppercase" letterSpacing={1}>
                    {soyGanador ? 'TU OFERTA ACTUAL' : (hayOfertas ? 'OFERTA MÁS ALTA' : 'PRECIO INICIAL')}
                </Typography>
                <Typography variant="h3" fontWeight="900" color={soyGanador ? 'success.main' : 'text.primary'} sx={{ my: 1 }}>
                    {formatCurrency(precioDisplay)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {hayOfertas ? `${lote.pujas?.length || 1} ofertas realizadas` : 'Sé el primero en ofertar'}
                </Typography>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Stack spacing={2} mb={4}>
                 <Box display="flex" gap={2}>
                    <Avatar variant="rounded" sx={{ bgcolor: 'action.hover', color: 'text.primary' }}><AccessTime /></Avatar>
                    <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight="bold">CIERRE PREVISTO</Typography>
                        <Typography variant="body1" fontWeight="600">
                            {lote.fecha_fin ? new Date(lote.fecha_fin).toLocaleDateString() : '--'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {lote.fecha_fin ? new Date(lote.fecha_fin).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) + ' hs' : ''}
                        </Typography>
                    </Box>
                 </Box>
              </Stack>

              {lote.estado_subasta === 'activa' ? (
                <Stack spacing={2}>
                  {!estaSuscripto && !loadingSub && isAuthenticated && (
                    <Alert severity="warning" variant="outlined" icon={<Lock fontSize="inherit" />}>
                      <Typography variant="body2" fontWeight={600} gutterBottom>Suscripción Requerida</Typography>
                      <Typography variant="body2">Debes estar <strong>suscripto al proyecto</strong> para participar.</Typography>
                      <Button size="small" variant="text" onClick={() => navigate(`/cliente/proyectos/${lote.id_proyecto}`)} sx={{ mt: 1 }}>Ver opciones</Button>
                    </Alert>
                  )}

                  {estaSuscripto && !tieneTokens && !loadingSub && !soyGanador && (
                    <Alert severity="info" variant="filled" icon={<EmojiEvents fontSize="inherit" />}>
                      <Typography variant="body2" fontWeight={600}>Token en Uso</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Ya estás participando en otra subasta de este proyecto.</Typography>
                    </Alert>
                  )}

                  <Button 
                    variant="contained" 
                    size="large" 
                    fullWidth 
                    startIcon={!estaSuscripto ? <VerifiedUser /> : !tieneTokens && !soyGanador ? <EmojiEvents /> : soyGanador ? <EmojiEmotions /> : <Gavel />} 
                    onClick={handleBotonAccion}
                    color={soyGanador ? "success" : !estaSuscripto || (!tieneTokens && !soyGanador) ? "secondary" : "primary"}
                    disabled={loadingSub || (!estaSuscripto || (!tieneTokens && !soyGanador))}
                    sx={{ py: 2, fontSize: '1.1rem', fontWeight: 'bold', borderRadius: 2 }}
                  >
                    {loadingSub ? "Verificando..." : (!estaSuscripto ? "Suscribirse" : !tieneTokens && !soyGanador ? "Token en Uso" : soyGanador ? "Mejorar Oferta" : "Ofertar Ahora")}
                  </Button>
                  
                  {estaSuscripto && (
                    <Box display="flex" justifyContent="center">
                      <Chip label={`${tokensDisponibles || 0} token(s) disponible(s)`} size="small" color={tieneTokens ? "success" : "default"} variant="outlined" />
                    </Box>
                  )}
                </Stack>
              ) : (
                <Alert severity={lote.estado_subasta === 'finalizada' ? "error" : "warning"} variant="filled">
                  {lote.estado_subasta === 'finalizada' ? "Subasta Finalizada" : "Subasta Aún No Iniciada"}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Modal de Puja */}
      <PujarModal 
        {...pujarModal.modalProps}
        lote={lote} 
        soyGanador={!!soyGanador}
        onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['lote', id] });
        }}
      />
    </Box>
  );
};

export default DetalleLote;