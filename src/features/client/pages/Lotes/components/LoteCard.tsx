// src/features/client/pages/Lotes/components/LoteCard.tsx

import {
  ArrowForward,
  BookmarkBorder,
  EmojiEmotions,
  Gavel,
  LocationOn,
  Lock,
  NavigateBefore,
  NavigateNext
} from '@mui/icons-material';
import {
  Box, Button, Card, CardContent, CardMedia, Chip, Fade,
  IconButton, keyframes, Skeleton,
  Stack, Typography, useTheme
} from '@mui/material';
import React, { memo, useMemo, useState } from 'react';

import ImagenService from '@/core/api/services/imagen.service';
import { useAuth } from '@/core/context/AuthContext';
import type { LoteDto } from '@/core/types/dto/lote.dto';
import { useAuctionStatus } from '@/features/client/hooks/useAuctionStatus';
import { useCurrencyFormatter } from '@/features/client/hooks/useCurrencyFormatter';
import { useImageLoader } from '@/features/client/hooks/useImageLoader';
import { FavoritoButton } from './BotonFavorito';


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
  const statusConfig = useAuctionStatus(lote.estado_subasta);

  const [currentIdx, setCurrentIdx] = useState(0);
  const { isLoading, hasError, handleLoad, handleError } = useImageLoader();

  // ─────────────────────────────────────────────
  // LÓGICA DE IMAGEN (carrusel)
  // ─────────────────────────────────────────────
  const imagenes = useMemo(() => {
    return lote.imagenes?.filter(img => (img as any).activo !== false) || [];
  }, [lote.imagenes]);

  const hasNoImageRecord = imagenes.length === 0;

  const imgUrl = useMemo(() => {
    if (hasNoImageRecord) return null;
    const imagenActual = imagenes[currentIdx];
    return imagenActual?.url ? ImagenService.resolveImageUrl(imagenActual.url) : null;
  }, [imagenes, currentIdx, hasNoImageRecord]);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIdx(prev => (prev + 1) % imagenes.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIdx(prev => (prev - 1 + imagenes.length) % imagenes.length);
  };

  // ─────────────────────────────────────────────
  // LÓGICA DE SUBASTA
  // ─────────────────────────────────────────────
  const isActiva = lote.estado_subasta === 'activa';

  const soyGanador = useMemo(() => {
    if (!isAuthenticated || !user) return false;
    return isActiva
      ? lote.ultima_puja?.id_usuario === user.id
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
      return soyGanador
        ? { text: "Mejorar", icon: <EmojiEmotions /> }
        : { text: "Pujar", icon: <Gavel /> };
    }
    return { text: "Detalles", icon: <ArrowForward /> };
  }, [isLoadingSub, isAuthenticated, puedePujar, soyGanador]);

  return (
    <Fade in={true} timeout={400}>
      <Card
        variant="outlined"
        sx={{
          display: 'flex', flexDirection: 'column', height: '100%',
          position: 'relative', cursor: 'pointer', overflow: 'hidden', borderRadius: 4,
          borderColor: soyGanador ? 'success.main' : (isActiva ? 'primary.light' : 'divider'),
          borderWidth: soyGanador ? 2 : 1,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: theme.shadows[12],
            '& .nav-arrow': { opacity: 1 }
          }
        }}
        onClick={() => onNavigate(lote.id)}
      >
        {/* ── SECCIÓN DE IMAGEN ── */}
        <Box position="relative" sx={{ paddingTop: '56.25%', bgcolor: '#ECECEC', overflow: 'hidden' }}>

          {/* ❤️ FavoritoButton unificado — usa React Query internamente */}
          <Box position="absolute" top={8} right={8} zIndex={20}
            sx={{ bgcolor: 'rgba(255,255,255,0.9)', borderRadius: '50%', boxShadow: 2 }}
          >
            <FavoritoButton loteId={lote.id} size="small" />
          </Box>

          {/* Imagen / Placeholder */}
          {hasNoImageRecord ? (
            <Stack
              sx={{ position: 'absolute', inset: 0, bgcolor: 'grey.200', color: 'text.disabled' }}
              alignItems="center" justifyContent="center" spacing={1}
            >
              <BookmarkBorder sx={{ fontSize: 40, opacity: 0.4 }} />
              <Typography variant="caption" fontWeight={700}>SIN IMAGEN</Typography>
            </Stack>
          ) : (
            <>
              {isLoading && (
                <Skeleton variant="rectangular" animation="wave"
                  sx={{ position: 'absolute', inset: 0, bgcolor: 'grey.300', zIndex: 1 }} />
              )}
              <CardMedia
                component="img"
                image={hasError ? '/assets/placeholder-lote.jpg' : imgUrl!}
                alt={lote.nombre_lote}
                onLoad={handleLoad}
                onError={handleError}
                sx={{
                  position: 'absolute', inset: 0, objectFit: 'contain',
                  transition: 'opacity 0.3s ease', opacity: isLoading ? 0 : 1, zIndex: 2
                }}
              />
            </>
          )}

          {/* Flechas de carrusel */}
          {!hasNoImageRecord && imagenes.length > 1 && (
            <>
              <IconButton className="nav-arrow" onClick={handlePrev} sx={{
                position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                bgcolor: 'rgba(0,0,0,0.4)', color: 'white', opacity: 0, zIndex: 10
              }}>
                <NavigateBefore />
              </IconButton>
              <IconButton className="nav-arrow" onClick={handleNext} sx={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                bgcolor: 'rgba(0,0,0,0.4)', color: 'white', opacity: 0, zIndex: 10
              }}>
                <NavigateNext />
              </IconButton>
            </>
          )}

          {/* Degradado inferior */}
          <Box sx={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)', zIndex: 3
          }} />

          {/* Chip de estado */}
          <Box position="absolute" top={12} left={12} zIndex={4}>
            <Chip
              label={statusConfig.label}
              color={statusConfig.color}
              size="small"
              sx={{
                fontWeight: 900,
                color: 'white',
                ...(isActiva && { animation: `${pulse} 2s infinite` })
              }}
            />
          </Box>

          {/* Precio sobre la imagen */}
          <Box position="absolute" bottom={12} left={12} zIndex={4}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block', fontWeight: 700 }}>
              {lote.ultima_puja?.monto ? 'OFERTA ACTUAL' : 'PRECIO BASE'}
            </Typography>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 900 }}>
              {formatCurrency(
                lote.ultima_puja?.monto
                  ? Number(lote.ultima_puja.monto)
                  : Number(lote.precio_base)
              )}
            </Typography>
          </Box>
        </Box>

        {/* ── SECCIÓN DE CONTENIDO ── */}
        <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
          <Typography variant="caption" color="primary.main" fontWeight={800}
            display="block" mb={0.5} sx={{ textTransform: 'uppercase' }}>
            {lote.proyecto?.nombre_proyecto || 'General'}
          </Typography>

          <Typography variant="h6" fontWeight={700} sx={{ mb: 1, lineHeight: 1.2, minHeight: '2.4em' }}>
            {lote.nombre_lote}
          </Typography>

          {(lote.latitud || lote.longitud) && (
            <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary" mb={1.5}>
              <LocationOn sx={{ fontSize: 16 }} />
              <Typography variant="body2" noWrap sx={{ fontSize: '0.8rem' }}>
                {lote.latitud ? `${lote.latitud}, ${lote.longitud}` : 'Ubicación pendiente'}
              </Typography>
            </Stack>
          )}

          <Button
            variant="contained"
            fullWidth
            onClick={handleBotonClick}
            disabled={isLoadingSub}
            startIcon={buttonState.icon}
            color={soyGanador ? 'success' : 'primary'}
            sx={{ fontWeight: 800, py: 1.2, borderRadius: 2, mt: 1 }}
          >
            {buttonState.text}
          </Button>
        </CardContent>
      </Card>
    </Fade>
  );
};

export default memo(LoteCard);