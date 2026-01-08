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

// Servicios y DTOs
import LoteService from '../../../services/lote.service';
import ImagenService from '../../../services/imagen.service';
import type { LoteDto } from '../../../types/dto/lote.dto';

// Contextos y Hooks
import { useAuth } from '../../../context/AuthContext';
import { useModal } from '../../../hooks/useModal';

// Componentes
import { FavoritoButton } from '../../../components/common/BotonFavorito/BotonFavorito';
import PujarModal from './components/PujarModal';

// ✅ INTERFAZ CORREGIDA:
// No redefinimos 'monto_ganador_lote' (ya está en LoteDto).
// Solo agregamos 'ultima_puja' que suele venir de la query.
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

  // 1. QUERY REAL-TIME (Polling)
  const { data: loteData, isLoading, error } = useQuery<LoteDto>({
    queryKey: ['lote', id],
    queryFn: async () => {
      if (!id) throw new Error('ID inválido');
      const res = await LoteService.getByIdActive(Number(id));
      return res.data;
    },
    // Actualiza cada 3 segundos para ver precios y ganador en tiempo real
    refetchInterval: 3000, 
    refetchIntervalInBackground: true,
    retry: false
  });

  const lote = loteData as LoteConPuja;

  // --- LÓGICA DE NEGOCIO (MEMOIZED) ---
  const { precioDisplay, soyGanador, hayOfertas, statusConfig } = useMemo(() => {
    // Definición de tipos para evitar el error de "success not assignable to default"
    type ChipColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
    
    // Configuración inicial por defecto
    let config: { 
        label: string; 
        color: ChipColor; 
        icon?: React.ReactElement; // ✅ Importante: ReactElement | undefined
    } = { 
        label: '', 
        color: 'default', 
        icon: undefined 
    };

    if (!lote) return { 
        precioDisplay: 0, soyGanador: false, hayOfertas: false, 
        statusConfig: config 
    };

    // 1. Calcular Precio Actual
    // Convertimos strings a números para operar
    const montoGanador = lote.monto_ganador_lote ? Number(lote.monto_ganador_lote) : 0;
    const montoUltimaPuja = lote.ultima_puja?.monto ? Number(lote.ultima_puja.monto) : 0;
    
    // La oferta más alta es la mayor entre el campo cacheado y la relación directa
    const ofertaActual = Math.max(montoGanador, montoUltimaPuja);
    const precioBase = Number(lote.precio_base);
    
    const precioDisplay = ofertaActual > 0 ? ofertaActual : precioBase;
    const hayOfertas = ofertaActual > 0;

    // 2. Verificar si el usuario logueado es el ganador
    const soyGanador = isAuthenticated && (lote.id_ganador === user?.id);

    // 3. Configuración de Estado Visual (Switch)
    // Forzamos el label a string para evitar conflictos con tipos literales
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
        break;
    }

    return { precioDisplay, soyGanador, hayOfertas, statusConfig: config };
  }, [lote, isAuthenticated, user]);


  // --- RENDERS DE CARGA Y ERROR ---
  if (isLoading) {
    return (
      <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3 }}>
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
        <Box mt={3} display="grid" gridTemplateColumns={{ md: "2fr 1fr" }} gap={4}>
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

  // --- VARIABLES VISUALES ---
  const imagenes = lote.imagenes || [];
  const mainImageUrl = imagenes.length > 0
    ? ImagenService.resolveImageUrl(imagenes[selectedImageIndex].url)
    : '/assets/placeholder-lote.jpg';

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(val);

  // --- HANDLERS ---
  const openMap = () => {
    if (lote.latitud && lote.longitud) {
      window.open(`http://googleusercontent.com/maps.google.com/?q=${lote.latitud},${lote.longitud}`, '_blank');
    }
  };

  const handleOpenPujar = () => {
    if (!isAuthenticated) return navigate('/login', { state: { from: location.pathname } });
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

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 4, alignItems: 'start' }}>

        {/* === COLUMNA IZQUIERDA (Visuales) === */}
        <Box component="section">
          <Box sx={{ position: 'relative', height: { xs: 300, md: 500 }, borderRadius: 4, overflow: 'hidden', mb: 2, boxShadow: theme.shadows[2], bgcolor: 'grey.100', border: `1px solid ${theme.palette.divider}` }}>
            <Box component="img" src={mainImageUrl} alt={lote.nombre_lote} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            
            <Box sx={{ position: 'absolute', top: 20, left: 20 }}>
              <Chip 
                label={statusConfig.label} 
                color={statusConfig.color} 
                icon={statusConfig.icon} // ✅ Pasamos el icono o undefined
                sx={{ fontWeight: 'bold', boxShadow: 2 }} 
              />
            </Box>
            
            {soyGanador && lote.estado_subasta === 'activa' && (
                <Box sx={{ position: 'absolute', bottom: 20, right: 20 }}>
                  <Chip label="¡Vas Ganando!" color="success" icon={<EmojiEmotions/>} sx={{ fontWeight: 'bold', boxShadow: 3, py: 1, px: 2, fontSize: '1rem', height: 'auto' }} />
                </Box>
            )}
          </Box>

          {/* Galería */}
          {imagenes.length > 1 && (
            <Stack direction="row" spacing={2} mb={4} sx={{ overflowX: 'auto', py: 1 }}>
              {imagenes.map((img, idx) => (
                <Box key={img.id} component="img" src={ImagenService.resolveImageUrl(img.url)} alt={`Vista ${idx + 1}`} onClick={() => setSelectedImageIndex(idx)}
                  sx={{ width: 100, height: 70, objectFit: 'cover', borderRadius: 2, cursor: 'pointer', border: selectedImageIndex === idx ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`, opacity: selectedImageIndex === idx ? 1 : 0.7, transition: 'all 0.2s', '&:hover': { opacity: 1, transform: 'scale(1.05)' } }}
                />
              ))}
            </Stack>
          )}

          {/* Información */}
          <Card elevation={0} sx={{ borderRadius: 3, mb: 3, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" fontWeight="bold" mb={2} display="flex" alignItems="center" gap={1}>
                <InfoOutlined color="primary" /> Información del Lote
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                Este lote forma parte del proyecto <strong>{lote.proyecto?.nombre_proyecto || 'N/A'}</strong>.
                {lote.proyecto?.descripcion && <><br /><br />{lote.proyecto.descripcion}</>}
              </Typography>
            </CardContent>
          </Card>

          {(lote.latitud || lote.longitud) && (
            <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                <CardContent sx={{ p: 4 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                        <Box>
                            <Typography variant="h6" fontWeight="bold" mb={1} display="flex" alignItems="center" gap={1}><LocationOn color="error" /> Ubicación</Typography>
                            <Typography variant="body2" color="text.secondary">Coordenadas GPS exactas disponibles.</Typography>
                        </Box>
                        <Button variant="outlined" startIcon={<MapIcon />} onClick={openMap} sx={{ borderRadius: 2 }}>Ver en Google Maps</Button>
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
                    <Typography variant="h4" fontWeight="800" sx={{ lineHeight: 1.2, mb: 0.5 }}>{lote.nombre_lote}</Typography>
                    <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                        <LocationOn fontSize="small" /> {lote.proyecto?.nombre_proyecto || 'Sin Proyecto'}
                    </Typography>
                </Box>
                <FavoritoButton loteId={lote.id} size="large" />
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* 🟢 PANEL DE PRECIO DINÁMICO */}
              <Box mb={4} p={2} 
                  bgcolor={soyGanador ? alpha(theme.palette.success.main, 0.05) : (hayOfertas ? alpha(theme.palette.warning.main, 0.05) : alpha(theme.palette.primary.main, 0.05))} 
                  borderRadius={2} 
                  border={`1px solid ${soyGanador ? alpha(theme.palette.success.main, 0.3) : (hayOfertas ? alpha(theme.palette.warning.main, 0.3) : alpha(theme.palette.primary.main, 0.1))}`}>
                
                <Typography variant="caption" color="text.secondary" fontWeight="bold" display="flex" alignItems="center" gap={0.5}>
                    {soyGanador ? <VerifiedUser fontSize="small" color="success"/> : (hayOfertas ? <TrendingUp fontSize="small" color="warning"/> : <AttachMoney fontSize="small"/>)}
                    {soyGanador ? 'TU PUJA ACTUAL (GANADORA)' : (hayOfertas ? 'OFERTA MÁS ALTA' : 'PRECIO BASE')}
                </Typography>
                
                <Stack direction="row" alignItems="baseline" spacing={1}>
                    <Typography variant="h3" fontWeight="800" color={soyGanador ? "success.main" : (hayOfertas ? "warning.main" : "primary.main")}>
                        {formatCurrency(precioDisplay)}
                    </Typography>
                    <Typography variant="h6" color="text.secondary" fontWeight={500}>ARS</Typography>
                </Stack>
                
                {soyGanador ? (
                    <Typography variant="body2" color="success.main" fontWeight="bold" sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <EmojiEmotions fontSize="small"/> Vas ganando esta subasta.
                    </Typography>
                ) : hayOfertas ? (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    La oferta actual supera el precio base. ¡Oferta más alto para ganar!
                  </Typography>
                ) : (
                   <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Sé el primero en ofertar por este lote.
                  </Typography>
                )}
              </Box>

              <Box mb={3}>
                  <Stack spacing={2}>
                    {lote.fecha_inicio && (
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main', width: 32, height: 32 }}><CalendarToday fontSize="small" /></Avatar>
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
                            width: 32, height: 32 
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
                      ? 'Tu oferta es la más alta actualmente. Te notificaremos si alguien te supera.' 
                      : 'Al confirmar, se descontará 1 Token de tu suscripción si es tu primera oferta.'}
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
        open={pujarModal.isOpen}       // Required
        onClose={pujarModal.close}     // Required
        lote={lote}                    // Required (Ensure 'lote' is not null/undefined when passed, or handle inside modal)
        soyGanador={!!soyGanador}      // Optional but good practice
        onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['lote', id] });
        }}
      />
    </Box>
  );
};

export default DetalleLote;