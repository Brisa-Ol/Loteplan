import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Button, Stack, Chip, Divider,
  Card, CardContent, Alert, Skeleton, IconButton, useTheme, alpha,
  Avatar
} from '@mui/material';
import {
  ArrowBack, LocationOn, Gavel, AttachMoney,
  CalendarToday, AccessTime, Map as MapIcon,
  InfoOutlined, Cancel, EmojiEvents, TrendingUp,
  EmojiEmotions, VerifiedUser 
} from '@mui/icons-material';

import { useModal } from '../../../../shared/hooks/useModal';


import PujarModal from './components/PujarModal';
import LoteService from '@/core/api/services/lote.service';
import type { LoteDto } from '@/core/types/dto/lote.dto';
import { useAuth } from '@/core/context/AuthContext';
import ImagenService from '@/core/api/services/imagen.service';
import { FavoritoButton } from '@/shared/components/ui/buttons/BotonFavorito';

// ✅ INTERFAZ EXTENDIDA
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

  // 1. QUERY REAL-TIME (Polling cada 3s para subasta en vivo)
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

  // --- LÓGICA DE NEGOCIO (MEMOIZED) ---
  const { precioDisplay, soyGanador, hayOfertas, statusConfig } = useMemo(() => {
    type ChipColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
    
    let config: { 
        label: string; 
        color: ChipColor; 
        icon?: React.ReactElement; 
    } = { 
        label: '', 
        color: 'default', 
        icon: undefined 
    };

    if (!lote) return { 
        precioDisplay: 0, soyGanador: false, hayOfertas: false, 
        statusConfig: config 
    };

    const montoGanador = lote.monto_ganador_lote ? Number(lote.monto_ganador_lote) : 0;
    const montoUltimaPuja = lote.ultima_puja?.monto ? Number(lote.ultima_puja.monto) : 0;
    
    const ofertaActual = Math.max(montoGanador, montoUltimaPuja);
    const precioBase = Number(lote.precio_base);
    
    const precioDisplay = ofertaActual > 0 ? ofertaActual : precioBase;
    const hayOfertas = ofertaActual > 0;

    const soyGanador = isAuthenticated && (lote.id_ganador === user?.id);

    config.label = lote.estado_subasta as string;

    switch (lote.estado_subasta) {
      case 'activa': 
        config = { label: 'Subasta Activa', color: 'success', icon: <Gavel fontSize="small" /> };
        break;
      case 'pendiente': 
        config = { label: 'Próximamente', color: 'warning', icon: <AccessTime fontSize="small" /> };
        break;
      case 'finalizada': 
        config = { label: 'Finalizada', color: 'error', icon: <EmojiEvents fontSize="small" /> };
        break;
      default:
        config.label = lote.estado_subasta;
        config.color = 'default';
        break;
    }

    return { precioDisplay, soyGanador, hayOfertas, statusConfig: config };
  }, [lote, isAuthenticated, user]);


  // --- RENDERS DE CARGA Y ERROR ---
  if (isLoading) {
    return (
      <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, md: 4 } }}>
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3, mb: 4 }} />
        <Box display="grid" gridTemplateColumns={{ xs: '1fr', lg: "2fr 1fr" }} gap={4}>
          <Box>
             <Skeleton height={200} sx={{ borderRadius: 3, mb: 2 }} />
             <Skeleton height={150} sx={{ borderRadius: 3 }} />
          </Box>
          <Skeleton height={400} sx={{ borderRadius: 3 }} />
        </Box>
      </Box>
    );
  }

  if (error || !lote) {
    return (
      <Box sx={{ maxWidth: 1400, mx: 'auto', p: 4, display: 'flex', justifyContent: 'center' }}>
        <Alert 
            severity="error" 
            variant="outlined" 
            action={<Button color="inherit" size="small" onClick={() => navigate(-1)}>Volver</Button>}
        >
            Lote no encontrado o no disponible en este momento.
        </Alert>
      </Box>
    );
  }

  const imagenes = lote.imagenes || [];
  const mainImageUrl = imagenes.length > 0
    ? ImagenService.resolveImageUrl(imagenes[selectedImageIndex].url)
    : '/assets/placeholder-lote.jpg';

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(val);

  const openMap = () => {
    if (lote.latitud && lote.longitud) {
      // Enlace universal de mapas
      window.open(`https://www.google.com/maps/search/?api=1&query=${lote.latitud},${lote.longitud}`, '_blank');
    }
  };

  const handleOpenPujar = () => {
    if (!isAuthenticated) return navigate('/login', { state: { from: location.pathname } });
    pujarModal.open();
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, md: 4 }, pb: 10 }}>

      {/* Breadcrumb */}
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: 'background.paper', border: `1px solid ${theme.palette.divider}` }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
          Proyectos / {lote.proyecto?.nombre_proyecto || 'General'} /
        </Typography>
        <Typography variant="body2" fontWeight="bold" color="text.primary">
            {lote.nombre_lote}
        </Typography>
      </Stack>

      {/* GRID PRINCIPAL RESPONSIVE */}
      <Box sx={{ 
        display: 'grid', 
        // 🔥 Responsive clave: 1 columna en móvil, 2 columnas (2/3 + 1/3) en desktop grande
        gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, 
        gap: 4, 
        alignItems: 'start' 
      }}>

        {/* === COLUMNA IZQUIERDA (Visuales + Info) === */}
        <Box component="section" sx={{ minWidth: 0 }}> {/* minWidth 0 evita desbordes en grid */}
          
          {/* IMAGEN PRINCIPAL */}
          <Box sx={{ 
            position: 'relative', 
            height: { xs: 280, sm: 450, md: 550 }, // Altura adaptativa
            borderRadius: 4, 
            overflow: 'hidden', 
            mb: 2, 
            boxShadow: theme.shadows[3], 
            bgcolor: 'action.hover', 
            border: `1px solid ${theme.palette.divider}` 
          }}>
            <Box 
                component="img" 
                src={mainImageUrl} 
                alt={lote.nombre_lote} 
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { (e.target as HTMLImageElement).src = '/assets/placeholder-lote.jpg'; }}
            />
            
            {/* Badges Flotantes */}
            <Box sx={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 1 }}>
              <Chip 
                label={statusConfig.label} 
                color={statusConfig.color} 
                icon={statusConfig.icon} 
                sx={{ fontWeight: 'bold', boxShadow: 2, backdropFilter: 'blur(4px)' }} 
              />
            </Box>
            
            {soyGanador && lote.estado_subasta === 'activa' && (
                <Box sx={{ position: 'absolute', bottom: 16, right: 16 }}>
                  <Chip 
                    label="¡Vas Ganando!" 
                    color="success" 
                    icon={<EmojiEmotions/>} 
                    sx={{ fontWeight: 'bold', boxShadow: 3, py: 0.5, px: 1, fontSize: '0.9rem' }} 
                  />
                </Box>
            )}
          </Box>

          {/* GALERÍA THUMBNAILS */}
          {imagenes.length > 1 && (
            <Stack 
                direction="row" 
                spacing={2} 
                mb={4} 
                sx={{ 
                    overflowX: 'auto', 
                    py: 1, px: 1,
                    // Ocultar scrollbar pero permitir scroll
                    '&::-webkit-scrollbar': { display: 'none' },
                    scrollbarWidth: 'none'
                }}
            >
              {imagenes.map((img, idx) => (
                <Box 
                  key={img.id} 
                  component="img" 
                  src={ImagenService.resolveImageUrl(img.url)} 
                  alt={`Vista ${idx + 1}`} 
                  onClick={() => setSelectedImageIndex(idx)}
                  sx={{ 
                    width: { xs: 70, sm: 100 }, 
                    height: { xs: 50, sm: 70 }, 
                    objectFit: 'cover', 
                    borderRadius: 2, 
                    cursor: 'pointer', 
                    border: selectedImageIndex === idx ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`, 
                    opacity: selectedImageIndex === idx ? 1 : 0.6, 
                    transition: 'all 0.2s', 
                    '&:hover': { opacity: 1, transform: 'scale(1.05)' },
                    flexShrink: 0 
                  }}
                />
              ))}
            </Stack>
          )}

          {/* TARJETA INFORMACIÓN */}
          <Card elevation={0} sx={{ borderRadius: 3, mb: 3, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
              <Typography variant="h5" fontWeight="bold" mb={2} display="flex" alignItems="center" gap={1}>
                <InfoOutlined color="primary" /> Información del Lote
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                Este lote forma parte del proyecto <strong>{lote.proyecto?.nombre_proyecto || 'N/A'}</strong>.
                {lote.proyecto?.descripcion && `\n\n${lote.proyecto.descripcion}`}
              </Typography>
            </CardContent>
          </Card>

          {/* UBICACIÓN */}
          {(lote.latitud || lote.longitud) && (
            <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
                        <Box>
                            <Typography variant="h6" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                                <LocationOn color="error" /> Ubicación
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Coordenadas GPS disponibles para visita.
                            </Typography>
                        </Box>
                        <Button 
                            variant="outlined" 
                            startIcon={<MapIcon />} 
                            onClick={openMap} 
                            sx={{ borderRadius: 2, whiteSpace: 'nowrap' }}
                        >
                            Ver en Mapa
                        </Button>
                    </Stack>
                </CardContent>
            </Card>
          )}
        </Box>

        {/* === COLUMNA DERECHA (STICKY ACTIONS) === */}
        <Box component="aside">
          <Card 
            elevation={0} 
            sx={{ 
                borderRadius: 3, 
                // 🔥 Sticky en desktop para que acompañe el scroll
                position: { lg: 'sticky' }, 
                top: { lg: 100 }, 
                border: `1px solid ${theme.palette.divider}`, 
                boxShadow: theme.shadows[4] 
            }}
          >
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>

              {/* Título y Favorito */}
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box>
                    <Typography variant="h4" fontWeight="800" sx={{ lineHeight: 1.2, mb: 0.5, fontSize: { xs: '1.5rem', md: '2rem' } }}>
                        {lote.nombre_lote}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                        <LocationOn fontSize="small" sx={{ fontSize: 16 }} /> 
                        {lote.proyecto?.nombre_proyecto || 'Sin Proyecto'}
                    </Typography>
                </Box>
                <FavoritoButton loteId={lote.id} size="large" />
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* 🟢 PANEL DE PRECIO DINÁMICO */}
              <Box 
                  mb={4} 
                  p={2} 
                  bgcolor={soyGanador ? alpha(theme.palette.success.main, 0.05) : (hayOfertas ? alpha(theme.palette.warning.main, 0.05) : alpha(theme.palette.primary.main, 0.05))} 
                  borderRadius={2} 
                  border={`1px solid ${soyGanador ? alpha(theme.palette.success.main, 0.3) : (hayOfertas ? alpha(theme.palette.warning.main, 0.3) : alpha(theme.palette.primary.main, 0.1))}`}
              >
                
                <Typography variant="caption" color="text.secondary" fontWeight="bold" display="flex" alignItems="center" gap={0.5} mb={0.5}>
                    {soyGanador ? <VerifiedUser fontSize="small" color="success"/> : (hayOfertas ? <TrendingUp fontSize="small" color="warning"/> : <AttachMoney fontSize="small"/>)}
                    {soyGanador ? 'TU PUJA ACTUAL (GANADORA)' : (hayOfertas ? 'OFERTA MÁS ALTA' : 'PRECIO BASE')}
                </Typography>
                
                <Stack direction="row" alignItems="baseline" spacing={1} flexWrap="wrap">
                    <Typography variant="h3" fontWeight="900" color={soyGanador ? "success.main" : (hayOfertas ? "warning.main" : "primary.main")} sx={{ fontSize: { xs: '2rem', lg: '2.5rem' } }}>
                        {formatCurrency(precioDisplay)}
                    </Typography>
                    <Typography variant="h6" color="text.secondary" fontWeight={500}>ARS</Typography>
                </Stack>
                
                {soyGanador ? (
                    <Typography variant="body2" color="success.main" fontWeight="bold" sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <EmojiEmotions fontSize="small"/> Vas ganando esta subasta.
                    </Typography>
                ) : (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        {hayOfertas ? '¡Oferta más alto para ganar!' : 'Sé el primero en ofertar.'}
                    </Typography>
                )}
              </Box>

              {/* DATOS DE TIEMPO */}
              <Box mb={3}>
                  <Stack spacing={2}>
                    {lote.fecha_inicio && (
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main', width: 36, height: 36 }}><CalendarToday fontSize="small" /></Avatar>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Inicio</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {new Date(lote.fecha_inicio).toLocaleDateString('es-AR')}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    
                    {lote.fecha_fin && (
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ 
                            bgcolor: lote.estado_subasta === 'activa' ? alpha(theme.palette.error.main, 0.1) : alpha(theme.palette.text.secondary, 0.1), 
                            color: lote.estado_subasta === 'activa' ? 'error.main' : 'text.secondary', 
                            width: 36, height: 36 
                        }}>
                            <AccessTime fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Cierre Previsto</Typography>
                          <Typography variant="body2" fontWeight="bold" color={lote.estado_subasta === 'activa' ? 'error.main' : 'text.primary'}>
                            {new Date(lote.fecha_fin).toLocaleDateString('es-AR')} {new Date(lote.fecha_fin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}hs
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Stack>
              </Box>

              {/* BOTONES DE ACCIÓN */}
              {lote.estado_subasta === 'activa' ? (
                <>
                  <Button 
                    variant="contained" size="large" fullWidth startIcon={<Gavel />} onClick={handleOpenPujar}
                    color={soyGanador ? "success" : "primary"}
                    sx={{ py: 1.5, fontSize: '1.1rem', fontWeight: 'bold', mb: 2, boxShadow: theme.shadows[4] }}
                  >
                    {soyGanador ? "Mejorar mi Oferta" : "Realizar Oferta"}
                  </Button>
                  
                  <Alert severity={soyGanador ? "success" : "info"} sx={{ fontSize: '0.875rem', borderRadius: 2 }}>
                    {soyGanador 
                      ? 'Te notificaremos si alguien te supera.' 
                      : 'Al confirmar, se descontará 1 Token si es tu primera oferta.'}
                  </Alert>
                </>
              ) : lote.estado_subasta === 'pendiente' ? (
                <Alert severity="warning" icon={<AccessTime fontSize="inherit" />} sx={{ borderRadius: 2 }}>
                    La subasta aún no ha comenzado.
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