// src/features/client/pages/Lotes/components/LoteCard.tsx

import {
  ArrowForward, BrokenImage, EmojiEmotions,
  Favorite, FavoriteBorder // 🚀 Nuevos iconos
  ,
  Gavel, Lock,
  NavigateBefore, NavigateNext
} from '@mui/icons-material';
import {
  Box, Button, Card, CardContent, CardMedia, Chip, Fade,
  IconButton, keyframes, Skeleton,
  Tooltip,
  Typography, useTheme
} from '@mui/material';
import React, { memo, useEffect, useMemo, useState } from 'react';

import FavoritoService from '@/core/api/services/favorito.service'; // 🚀 Importamos el servicio
import ImagenService from '@/core/api/services/imagen.service';
import { useAuth } from '@/core/context/AuthContext';
import type { LoteDto } from '@/core/types/dto/lote.dto';
import { useCurrencyFormatter } from '@/features/client/hooks/useCurrencyFormatter';
import { useImageLoader } from '@/features/client/hooks/useImageLoader';
import { notifyError, notifySuccess } from '@/shared/utils/snackbarUtils';

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(46, 125, 50, 0.7); }
  70% { box-shadow: 0 0 0 6px rgba(46, 125, 50, 0); }
  100% { box-shadow: 0 0 0 0 rgba(46, 125, 50, 0); }
`;

export interface LoteCardProps {
  lote: LoteDto;
  onNavigate: (id: number) => void;
  onPujar: (lote: LoteDto) => void;
  isSubscribed: boolean;
  hasTokens: boolean;
  tokensDisponibles: number;
  isLoadingSub: boolean;
  isAuthenticated: boolean;
}

const LoteCard: React.FC<LoteCardProps> = ({
  lote, onNavigate, onPujar, isSubscribed, hasTokens,
  isLoadingSub, isAuthenticated
}) => {
  const theme = useTheme();
  const formatCurrency = useCurrencyFormatter();
  const { user } = useAuth();

  const [currentIdx, setCurrentIdx] = useState(0);
  const { loaded, error, handleLoad, handleError } = useImageLoader();

  // ❤️ ESTADO DE FAVORITO
  const [esFavorito, setEsFavorito] = useState(false);
  const [isTogglingFavorito, setIsTogglingFavorito] = useState(false);

  // 1. Verificar si es favorito al cargar
  useEffect(() => {
    if (isAuthenticated && lote.id) {
      FavoritoService.checkEsFavorito(lote.id).then(res => {
        setEsFavorito(res.data.es_favorito);
      }).catch(() => { });
    }
  }, [lote.id, isAuthenticated]);

  // 2. Lógica para alternar favorito
  const handleToggleFavorito = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita navegar al detalle

    if (!isAuthenticated) return notifyError("Debes iniciar sesión.");
    if (!isSubscribed) return notifyError("Debes estar suscripto al proyecto para marcar favoritos.");

    try {
      setIsTogglingFavorito(true);
      const res = await FavoritoService.toggle(lote.id);
      setEsFavorito(res.data.agregado);
      notifySuccess(res.data.mensaje);
    } catch (err: any) {
      notifyError(err.message || "Error al actualizar favorito");
    } finally {
      setIsTogglingFavorito(false);
    }
  };

  const imagenes = useMemo(() => {
    return lote.imagenes?.filter(img => (img as any).activo !== false) || [];
  }, [lote.imagenes]);

  const imgUrl = useMemo(() => {
    const imagenActual = imagenes[currentIdx];
    return imagenActual?.url ? ImagenService.resolveImageUrl(imagenActual.url) : null;
  }, [imagenes, currentIdx]);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIdx((prev) => (prev + 1) % imagenes.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIdx((prev) => (prev - 1 + imagenes.length) % imagenes.length);
  };

  const isActiva = lote.estado_subasta === 'activa';
  const soyGanador = useMemo(() => {
    if (!isAuthenticated || !user) return false;
    return isActiva
      ? (lote as any).ultima_puja?.id_usuario === user.id
      : lote.id_ganador === user.id;
  }, [isActiva, lote, isAuthenticated, user]);

  const puedePujar = isSubscribed && isActiva && (hasTokens || soyGanador);

  const handleBotonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated || puedePujar) onPujar(lote);
    else onNavigate(lote.id);
  };

  const buttonState = useMemo(() => {
    if (isLoadingSub) return { text: "...", icon: null };
    if (!isAuthenticated) return { text: "Ingresar", icon: <Lock /> };
    if (puedePujar) {
      return soyGanador ? { text: "Mejorar", icon: <EmojiEmotions /> } : { text: "Pujar", icon: <Gavel /> };
    }
    return { text: "Detalles", icon: <ArrowForward /> };
  }, [isLoadingSub, isAuthenticated, puedePujar, soyGanador]);

  return (
    <Fade in={true} timeout={400}>
      <Card
        variant="outlined"
        sx={{
          display: 'flex', flexDirection: 'column', height: '100%', position: 'relative',
          cursor: 'pointer', overflow: 'hidden', borderRadius: 4,
          borderColor: soyGanador ? 'success.main' : (isActiva ? 'primary.light' : 'divider'),
          borderWidth: soyGanador ? 2 : 1,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': { transform: 'translateY(-8px)', boxShadow: theme.shadows[12], '& .nav-arrow': { opacity: 1 } }
        }}
        onClick={() => onNavigate(lote.id)}
      >
        <Box position="relative" sx={{ paddingTop: '56.25%', bgcolor: '#ECECEC', overflow: 'hidden' }}>

          {/* ❤️ BOTÓN DE FAVORITO */}
          <Box position="absolute" top={8} right={8} zIndex={20}>
            <Tooltip title={!isSubscribed ? "Requiere suscripción" : (esFavorito ? "Quitar de favoritos" : "Agregar a favoritos")}>
              <IconButton
                onClick={handleToggleFavorito}
                disabled={isTogglingFavorito}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.9)',
                  boxShadow: 2,
                  '&:hover': { bgcolor: 'white', transform: 'scale(1.1)' },
                  color: esFavorito ? 'error.main' : 'grey.400',
                  transition: 'all 0.2s'
                }}
              >
                {esFavorito ? <Favorite /> : <FavoriteBorder />}
              </IconButton>
            </Tooltip>
          </Box>

          {!loaded && !error && imgUrl && (
            <Skeleton variant="rectangular" animation="wave" sx={{ position: 'absolute', inset: 0, bgcolor: 'grey.900', zIndex: 1 }} />
          )}

          {imgUrl ? (
            <CardMedia
              component="img"
              image={imgUrl}
              onLoad={handleLoad}
              onError={handleError}
              sx={{
                position: 'absolute', inset: 0, objectFit: 'contain',
                transition: 'opacity 0.3s ease', opacity: error ? 0 : 1, zIndex: 2
              }}
            />
          ) : (
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'grey.700', gap: 1 }}>
              <BrokenImage sx={{ fontSize: 40 }} />
              <Typography variant="caption">Imagen no disponible</Typography>
            </Box>
          )}

          {imagenes.length > 1 && (
            <>
              <IconButton className="nav-arrow" onClick={handlePrev}
                sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(0,0,0,0.4)', color: 'white', opacity: 0, zIndex: 10 }}>
                <NavigateBefore />
              </IconButton>
              <IconButton className="nav-arrow" onClick={handleNext}
                sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(0,0,0,0.4)', color: 'white', opacity: 0, zIndex: 10 }}>
                <NavigateNext />
              </IconButton>
            </>
          )}

          <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)', zIndex: 3 }} />
          <Box position="absolute" top={12} left={12} zIndex={4}>
            {isActiva && <Chip label="EN VIVO" color="success" size="small" sx={{ fontWeight: 900, animation: `${pulse} 2s infinite` }} />}
          </Box>
          <Box position="absolute" bottom={12} left={12} zIndex={4}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block', fontWeight: 700 }}>
              {(lote as any).ultima_puja?.monto ? 'OFERTA ACTUAL' : 'PRECIO BASE'}
            </Typography>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 900 }}>
              {formatCurrency((lote as any).ultima_puja?.monto ? Number((lote as any).ultima_puja.monto) : Number(lote.precio_base))}
            </Typography>
          </Box>
        </Box>

        <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
          <Typography variant="caption" color="primary.main" fontWeight={800} display="block" mb={0.5} sx={{ textTransform: 'uppercase' }}>
            {lote.proyecto?.nombre_proyecto || 'General'}
          </Typography>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2, lineHeight: 1.2, minHeight: '2.4em' }}>{lote.nombre_lote}</Typography>
          <Button variant="contained" fullWidth onClick={handleBotonClick} disabled={isLoadingSub} startIcon={buttonState.icon} color={soyGanador ? 'success' : 'primary'} sx={{ fontWeight: 800, py: 1.2, borderRadius: 2 }}>
            {buttonState.text}
          </Button>
        </CardContent>
      </Card>
    </Fade>
  );
};

export default memo(LoteCard);