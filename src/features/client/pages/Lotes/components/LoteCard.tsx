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
import type { LoteDto } from '@/core/types/lote.dto';
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
  const subastaFinalizada = lote.estado_subasta === 'finalizada';

const esLiderActual = useMemo(() => {
    if (!isAuthenticated || !user || !isActiva || !lote.id_puja_mas_alta) return false;
    
    // Verificamos si en el array de pujas de este lote, la puja más alta nos pertenece
    return Array.isArray(lote.pujas) && lote.pujas.some(
      (p: any) => Number(p.id_usuario) === Number(user.id) && Number(p.id) === Number(lote.id_puja_mas_alta)
    );
  }, [isActiva, lote.id_puja_mas_alta, lote.pujas, isAuthenticated, user]);

  const esGanadorDefinitivo = useMemo(() => {
    if (!isAuthenticated || !user || !subastaFinalizada) return false;
    return Number(lote.id_ganador) === Number(user.id);
  }, [subastaFinalizada, lote.id_ganador, isAuthenticated, user]);

  // ✅ NUEVA LÓGICA: Verificar si el usuario ya tiene una puja en este lote 
  // (aunque no sea la ganadora en este momento)
  const yaParticipa = useMemo(() => {
    if (!isAuthenticated || !user || !isActiva) return false;
    return Array.isArray(lote.pujas) && lote.pujas.some((p: any) => Number(p.id_usuario) === Number(user.id) && p.estado_puja === 'activa');
  }, [isActiva, lote.pujas, isAuthenticated, user]);

  const soyGanador = esLiderActual || esGanadorDefinitivo;

  // ✅ CORRECCIÓN: Puede pujar si tiene tokens, si es el líder actual, o si YA PARTICIPA (mejora gratuita)
  const puedePujar = isActiva && isSubscribed && (hasTokens || esLiderActual || yaParticipa);

  const handleBotonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated || puedePujar) {
      if(!isAuthenticated) {
        onNavigate(lote.id);
      } else {
        onPujar(lote);
      }
    } else {
      onNavigate(lote.id);
    }
  };

  const buttonState = useMemo(() => {
    if (isLoadingSub) return { text: "...", icon: null };
    if (!isAuthenticated) return { text: "Ingresar", icon: <Lock /> };
    if (subastaFinalizada) {
      return esGanadorDefinitivo 
        ? { text: "Ver mi Lote", icon: <EmojiEmotions /> } 
        : { text: "Detalles", icon: <ArrowForward /> };
    }
    if (puedePujar) {
      // ✅ Si ya participa o es líder, el botón dice "Mejorar" en lugar de "Pujar"
      return (esLiderActual || yaParticipa)
        ? { text: "Mejorar", icon: <EmojiEmotions /> }
        : { text: "Pujar", icon: <Gavel /> };
    }
    return { text: "Detalles", icon: <ArrowForward /> };
  }, [isLoadingSub, isAuthenticated, subastaFinalizada, esGanadorDefinitivo, puedePujar, esLiderActual, yaParticipa]);

  return (
    <Fade in={true} timeout={400}>
      <Card
        variant="outlined"
        sx={{
          display: 'flex', flexDirection: 'column', height: '100%',
          position: 'relative', cursor: 'pointer', overflow: 'hidden', borderRadius: 2.5,
          borderColor: soyGanador ? 'success.main' : (isActiva ? 'primary.light' : 'divider'),
          borderWidth: soyGanador ? 2 : 1,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-6x)',
            boxShadow: theme.shadows[10],
            '& .nav-arrow': { opacity: 1 }
          }
        }}
        onClick={() => onNavigate(lote.id)}
      >
        {/* ── SECCIÓN DE IMAGEN ── */}
        <Box position="relative" sx={{ paddingTop: '56.25%', bgcolor: '#ECECEC', overflow: 'hidden' }}>

          <Box position="absolute" top={10} right={10} zIndex={20}
            sx={{  bgcolor: '#D4D4D4',
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: '50%',
              width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center', }}
          >
            <FavoritoButton loteId={lote.id} size="small" />
          </Box>

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
{/* ── Flechas carrusel ── */}
          {!hasNoImageRecord && imagenes.length > 1 && (
            <>
              <IconButton className="nav-arrow" onClick={handlePrev} sx={{
                position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                bgcolor: 'rgba(0,0,0,0.3)', // Un fondo un poco más suave por defecto
                color: 'white', 
                opacity: 1,                 // <-- CAMBIO PRINCIPAL: Siempre visible
                zIndex: 10,
                transition: 'background-color 0.2s ease', // Transición suave
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } // Se oscurece al pasar el cursor
              }}>
                <NavigateBefore />
              </IconButton>
              <IconButton className="nav-arrow" onClick={handleNext} sx={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                bgcolor: 'rgba(0,0,0,0.3)', 
                color: 'white', 
                opacity: 1,                
                zIndex: 10,
                transition: 'background-color 0.2s ease',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
              }}>
                <NavigateNext />
              </IconButton>
            </>
          )}

       {/* ── Gradiente solo hacia abajo ── */}
          <Box sx={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.78) 100%)',
            zIndex: 3, pointerEvents: 'none'
          }} />
<Box position="absolute" top={12} left={12} zIndex={4}>
            <Chip
              label={
                esGanadorDefinitivo ? "¡GANASTE EL LOTE!" : 
                esLiderActual ? "¡VAS GANANDO!" : 
                statusConfig.label
              }
              color={soyGanador ? "success" : undefined}
              size="small"
              sx={{
                fontWeight: 900,
                color: soyGanador ? 'white' : statusConfig.hexColor,
                backgroundColor: soyGanador ? undefined : statusConfig.bgColor,
                textShadow: soyGanador ? '0px 1px 2px rgba(0,0,0,0.3)' : statusConfig.textShadow,
                ...((isActiva && esLiderActual) && { animation: `${pulse} 2s infinite` }),
                ...(soyGanador && { boxShadow: 4 })
              }}
            />
          </Box>

          {/* ✅ Precios sincronizados visualmente */}
         {/* ✅ Nombre del lote sobre la imagen */}
          <Box position="absolute" bottom={12} left={12} right={12} zIndex={4}>
            <Typography 
              variant="h5" 
              sx={{ 
                color: 'white', 
                fontWeight: 900,
                textShadow: '0px 2px 4px rgba(0,0,0,0.6)', // Sombra para que destaque sobre cualquier foto
                display: '-webkit-box',
                WebkitLineClamp: 2, // Por si el nombre es muy largo, máximo 2 renglones
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {lote.nombre_lote}
            </Typography>
          </Box>
          
        </Box>

        {/* ── SECCIÓN DE CONTENIDO ── */}
       <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
      
          {/* ✅ Precio Base / Oferta Líder movido aquí abajo */}
          <Box sx={{ mb: 1.5, minHeight: '3em' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 700 }}>
              {lote.ultima_puja?.monto ? 'OFERTA ACTUAL LÍDER' : 'PRECIO BASE INICIAL'}
            </Typography>
            <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 900 }}>
              {formatCurrency(
                lote.ultima_puja?.monto
                  ? Number(lote.ultima_puja.monto)
                  : Number(lote.precio_base)
              )}
            </Typography>
          </Box>

          <Button
            variant="contained"
            fullWidth
            onClick={handleBotonClick}
            disabled={isLoadingSub}
            startIcon={buttonState.icon}
            color={soyGanador ? 'success' : 'primary'}
            sx={{ 
              fontWeight: 800, 
              py: 1.2, 
              borderRadius: 2, 
              mt: 1,
              boxShadow: 'none', // Quitar sombra estática
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                boxShadow: 4,
                transform: 'translateY(-2px)' // Se eleva sutilmente
              }
            }}
          >
            {buttonState.text}
          </Button>
        </CardContent>
      </Card>
    </Fade>
  );
};

export default memo(LoteCard);