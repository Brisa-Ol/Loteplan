import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Button, Stack, Chip, Divider,
  Card, CardContent, Alert, Skeleton, IconButton, useTheme, alpha,
  Avatar, keyframes, Paper
} from '@mui/material';
import {
  ArrowBack, Gavel, AccessTime,
  InfoOutlined, EmojiEvents, EmojiEmotions, Share, Lock,
  BrokenImage
} from '@mui/icons-material';

import { useModal } from '../../../../shared/hooks/useModal';

import { useVerificarSuscripcion } from '../../hooks/useVerificarSuscripcion';

import PujarModal from './components/PujarModal';
import LoteService from '@/core/api/services/lote.service';
import ImagenService from '@/core/api/services/imagen.service';
import { FavoritoButton } from '@/shared/components/ui/buttons/BotonFavorito';

import type { LoteDto } from '@/core/types/dto/lote.dto';
import { useAuth } from '@/core/context/AuthContext';
import { useImageLoader } from '../../hooks/useImageLoader';

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
  const imageLoader = useImageLoader();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const { data: loteData, isLoading, error } = useQuery<LoteDto>({
    queryKey: ['lote', id],
    queryFn: async () => {
      if (!id) throw new Error('ID inválido');
      const res = await LoteService.getByIdActive(Number(id));
      return res.data;
    },
    refetchInterval: 3000,
    retry: false
  });

  const lote = loteData as LoteConPuja;

  const { estaSuscripto, tieneTokens, tokensDisponibles, isLoading: loadingSub } = 
    useVerificarSuscripcion(lote?.id_proyecto ?? undefined);

  const { precioDisplay, soyGanador, hayOfertas, statusConfig } = useMemo(() => {
    let config = { 
      label: 'Cargando...', 
      color: 'default' as any, 
      icon: <AccessTime fontSize="small" />, 
      bgColor: '' 
    };

    if (!lote) return { precioDisplay: 0, soyGanador: false, hayOfertas: false, statusConfig: config };

    const montoGanador = Number(lote.monto_ganador_lote || 0);
    const montoUltimaPuja = Number(lote.ultima_puja?.monto || 0);
    const ofertaActual = Math.max(montoGanador, montoUltimaPuja);
    const precioBase = Number(lote.precio_base);

    const precioDisplay = ofertaActual > 0 ? ofertaActual : precioBase;
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
    }

    return { precioDisplay, soyGanador, hayOfertas: ofertaActual > 0, statusConfig: config };
  }, [lote, isAuthenticated, user, theme]);

  const imagenes = useMemo(() => {
    return lote?.imagenes?.filter(img => (img as any).activo !== false) || [];
  }, [lote]);

  const mainImageUrl = useMemo(() => {
    if (imagenes.length === 0) return '';
    return ImagenService.resolveImageUrl(imagenes[selectedImageIndex]?.url);
  }, [imagenes, selectedImageIndex]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(val);

  const handleBotonAccion = () => {
    if (!isAuthenticated) return navigate('/login', { state: { from: location.pathname } });
    if (!estaSuscripto) return navigate(`/cliente/proyectos/${lote.id_proyecto}`);
    pujarModal.open();
  };

  if (isLoading) return <Box p={4}><Skeleton variant="rectangular" height={500} sx={{ borderRadius: 4 }} /></Box>;
  if (error || !lote) return <Box p={4}><Alert severity="error">No se encontró el lote.</Alert></Box>;

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, md: 4 }, pb: 12 }}>
      
      {/* HEADER */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: 'background.paper', border: `1px solid ${theme.palette.divider}` }}>
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>PROYECTO: {lote.proyecto?.nombre_proyecto || 'GENERAL'}</Typography>
            <Typography variant="h5" fontWeight="800">{lote.nombre_lote}</Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1}>
          <IconButton sx={{ border: `1px solid ${theme.palette.divider}` }}><Share fontSize="small" /></IconButton>
          <FavoritoButton loteId={lote.id} size="large" />
        </Stack>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 4 }}>
        
        {/* IZQUIERDA: IMAGEN Y DETALLES */}
        <Box>
          <Paper elevation={0} sx={{ position: 'relative', overflow: 'hidden', borderRadius: 4, mb: 2, border: `1px solid ${theme.palette.divider}`, bgcolor: 'grey.100', height: { xs: 300, sm: 500 }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {mainImageUrl && !imageLoader.error ? (
              <Box component="img" src={mainImageUrl} alt={lote.nombre_lote} onLoad={imageLoader.handleLoad} onError={imageLoader.handleError} sx={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.5s ease', opacity: imageLoader.loaded ? 1 : 0 }} />
            ) : (
              <Stack alignItems="center" spacing={1} color="text.disabled"><BrokenImage sx={{ fontSize: 64 }} /><Typography variant="caption">Imagen no disponible</Typography></Stack>
            )}
            {!imageLoader.loaded && !imageLoader.error && mainImageUrl && <Skeleton variant="rectangular" width="100%" height="100%" sx={{ position: 'absolute' }} />}
            <Box sx={{ position: 'absolute', top: 20, left: 20 }}>
              <Chip label={statusConfig.label} color={statusConfig.color} icon={statusConfig.icon} sx={{ fontWeight: 800, boxShadow: 3, ...(lote.estado_subasta === 'activa' && { animation: `${pulse} 2s infinite` }) }} />
            </Box>
          </Paper>

          {imagenes.length > 1 && (
            <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 2 }}>
              {imagenes.map((img, idx) => (
                <Box key={img.id} component="img" src={ImagenService.resolveImageUrl(img.url)} onClick={() => { setSelectedImageIndex(idx); imageLoader.reset(); }} sx={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 2, cursor: 'pointer', border: selectedImageIndex === idx ? `2px solid ${theme.palette.primary.main}` : `1px solid transparent` }} />
              ))}
            </Stack>
          )}

          <Card elevation={0} variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom display="flex" alignItems="center" gap={1}><InfoOutlined color="primary" /> Detalles del Lote</Typography>
              <Typography variant="body1" color="text.secondary" paragraph sx={{ whiteSpace: 'pre-line' }}>{lote.proyecto?.descripcion || 'No hay descripción disponible.'}</Typography>
            </CardContent>
          </Card>
        </Box>

        {/* DERECHA: SIDEBAR DE PUJAS */}
        <Box>
          <Card elevation={4} sx={{ borderRadius: 3, position: { lg: 'sticky' }, top: { lg: 100 }, border: `1px solid ${soyGanador ? theme.palette.success.main : theme.palette.divider}` }}>
            {soyGanador && lote.estado_subasta === 'activa' && (
              <Box sx={{ bgcolor: 'success.main', color: 'white', p: 1.5, textAlign: 'center' }}><Typography variant="subtitle2" fontWeight="bold" display="flex" justifyContent="center" alignItems="center" gap={1}><EmojiEmotions /> ¡VAS GANANDO!</Typography></Box>
            )}
            <CardContent sx={{ p: 3 }}>
              <Typography variant="caption" color="text.secondary" fontWeight="bold">{(hayOfertas || soyGanador) ? 'OFERTA ACTUAL' : 'PRECIO BASE'}</Typography>
              <Typography variant="h3" fontWeight="900" color={soyGanador ? 'success.main' : 'text.primary'} sx={{ my: 1 }}>{formatCurrency(precioDisplay)}</Typography>
              
              <Divider sx={{ my: 3 }} />

              <Stack spacing={2} mb={3}>
                <Box display="flex" gap={2}>
                  <Avatar variant="rounded" sx={{ bgcolor: 'action.hover', color: 'text.primary' }}><AccessTime /></Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary">CIERRE PREVISTO</Typography>
                    <Typography variant="body1" fontWeight="600">{lote.fecha_fin ? new Date(lote.fecha_fin).toLocaleDateString() : '--'}</Typography>
                  </Box>
                </Box>
              </Stack>

              {lote.estado_subasta === 'activa' ? (
                <Stack spacing={2}>
                  {!estaSuscripto && isAuthenticated && (
                    <Alert severity="warning" icon={<Lock fontSize="inherit" />}>Requiere suscripción al proyecto.</Alert>
                  )}
                  {estaSuscripto && !tieneTokens && !soyGanador && (
                    <Alert severity="info">Ya estás participando en otro lote.</Alert>
                  )}
                  <Button 
                    variant="contained" fullWidth size="large" onClick={handleBotonAccion}
                    disabled={loadingSub || (estaSuscripto && !tieneTokens && !soyGanador)}
                    color={soyGanador ? "success" : "primary"}
                    sx={{ py: 2, fontWeight: 'bold' }}
                    startIcon={soyGanador ? <EmojiEmotions /> : <Gavel />}
                  >
                    {loadingSub ? "Cargando..." : !estaSuscripto ? "Suscribirse" : soyGanador ? "Mejorar Oferta" : "Ofertar Ahora"}
                  </Button>
                  {estaSuscripto && (
  <Chip 
    label={`${tokensDisponibles || 0} token(s) disponibles`} 
    variant="outlined" 
    sx={{ alignSelf: 'center' }} // <--- Movido a sx
  />
)}
                </Stack>
              ) : (
                <Alert severity="info">Subasta {lote.estado_subasta}.</Alert>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      <PujarModal {...pujarModal.modalProps} lote={lote} soyGanador={!!soyGanador} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['lote', id] })} />
    </Box>
  );
};

export default DetalleLote;