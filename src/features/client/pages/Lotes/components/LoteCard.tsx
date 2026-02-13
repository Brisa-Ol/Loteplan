// src/features/client/pages/Lotes/components/LoteCard.tsx

import { ArrowForward, BrokenImage, EmojiEmotions, Gavel, Lock } from '@mui/icons-material';
import {
  Box, Button, Card, CardContent, CardMedia, Chip, Fade,
  keyframes, Skeleton, Typography, useTheme
} from '@mui/material';
import React, { memo, useMemo } from 'react';

import ImagenService from '@/core/api/services/imagen.service';
import type { LoteDto } from '@/core/types/dto/lote.dto';
import { useCurrencyFormatter } from '@/features/client/hooks/useCurrencyFormatter';
import { useImageLoader } from '@/features/client/hooks/useImageLoader';

// ✅ NUEVO: Importamos el contexto de autenticación
import { useAuth } from '@/core/context/AuthContext';

// Animación para estado "En Vivo"
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
  lote,
  onNavigate,
  onPujar,
  isSubscribed,
  hasTokens,
  tokensDisponibles,
  isLoadingSub,
  isAuthenticated
}) => {
  const theme = useTheme();
  const formatCurrency = useCurrencyFormatter();
  const { loaded, error, handleLoad, handleError } = useImageLoader();

  // ✅ Obtenemos el usuario actual
  const { user } = useAuth();

  // Memoización de la URL de la imagen
  const imgUrl = useMemo(() => {
    const img = lote.imagenes?.[0];
    return img ? ImagenService.resolveImageUrl(img.url) : null;
  }, [lote.imagenes]);

  const isActiva = lote.estado_subasta === 'activa';

  // ✅ LÓGICA CLAVE: Determinamos si el usuario va ganando
  const soyGanador = useMemo(() => {
    if (!isAuthenticated || !user) return false;
    return isActiva
      ? (lote as any).ultima_puja?.id_usuario === user.id
      : lote.id_ganador === user.id;
  }, [isActiva, lote, isAuthenticated, user]);

  // ✅ CONDICIÓN CORREGIDA: Puede pujar si tiene tokens O si ya es el ganador
  const puedePujar = isSubscribed && isActiva && (hasTokens || soyGanador);

  // Lógica principal de interacción
  const handleBotonClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Si no está autenticado o tiene permisos para pujar, abre el modal/login
    if (!isAuthenticated || puedePujar) {
      onPujar(lote);
    } else {
      // Si no, navega al detalle (ej. si no tiene tokens y no es el ganador)
      onNavigate(lote.id);
    }
  };

  // Determinación de UI del botón
  const getButtonContent = () => {
    if (isLoadingSub) return { text: "...", icon: null };
    if (!isAuthenticated) return { text: "Ingresar para Pujar", icon: <Lock /> };

    if (puedePujar) {
      // ✅ Si va ganando, le mostramos un botón para defender su posición
      if (soyGanador) return { text: "Mejorar Oferta", icon: <EmojiEmotions /> };
      return { text: "Pujar Ahora", icon: <Gavel /> };
    }

    return { text: "Ver Detalles", icon: <ArrowForward /> };
  };

  const buttonState = getButtonContent();

  return (
    <Fade in={true} timeout={400}>
      <Card
        variant="outlined"
        onClick={() => onNavigate(lote.id)}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          position: 'relative',
          cursor: 'pointer',
          overflow: 'hidden',
          borderRadius: 3,
          // ✅ Feedback visual si va ganando
          borderColor: soyGanador ? 'success.main' : (isActiva ? 'primary.light' : 'divider'),
          borderWidth: soyGanador ? 2 : 1,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[10],
            borderColor: soyGanador ? 'success.main' : (isActiva ? 'primary.main' : 'divider'),
            '& .lote-img': { transform: 'scale(1.05)' }
          }
        }}
      >
        {/* --- SECCIÓN IMAGEN --- */}
        <Box position="relative" sx={{ paddingTop: '65%', bgcolor: 'grey.100' }}>
          {!loaded && !error && imgUrl && (
            <Skeleton variant="rectangular" animation="wave" sx={{ position: 'absolute', inset: 0 }} />
          )}

          {imgUrl && !error ? (
            <CardMedia
              className="lote-img"
              component="img"
              image={imgUrl}
              onLoad={handleLoad}
              onError={handleError}
              sx={{
                position: 'absolute', inset: 0, objectFit: 'cover',
                transition: 'transform 0.6s ease', opacity: loaded ? 1 : 0
              }}
            />
          ) : (
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BrokenImage sx={{ fontSize: 48, color: 'grey.400' }} />
            </Box>
          )}

          <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)' }} />

          {/* Badge Estado */}
          <Box position="absolute" top={12} left={12}>
            {isActiva && (
              <Chip
                label="EN VIVO"
                color="success"
                size="small"
                sx={{ fontWeight: 800, animation: `${pulse} 2s infinite` }}
              />
            )}
          </Box>

          {/* Precio Base / Oferta Actual */}
          <Box position="absolute" bottom={12} left={12}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', display: 'block' }}>
              {/* ✅ Muestra "OFERTA ACTUAL" si ya hay una puja */}
              {(lote as any).ultima_puja?.monto ? 'OFERTA ACTUAL' : 'PRECIO BASE'}
            </Typography>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 800 }}>
              {formatCurrency(
                (lote as any).ultima_puja?.monto
                  ? Number((lote as any).ultima_puja.monto)
                  : lote.precio_base
              )}
            </Typography>
          </Box>
        </Box>

        {/* --- SECCIÓN CONTENIDO --- */}
        <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
          <Typography variant="caption" color="primary.main" fontWeight={800} display="block" mb={0.5}>
            {lote.proyecto?.nombre_proyecto}
          </Typography>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2, lineHeight: 1.2 }}>
            {lote.nombre_lote}
          </Typography>

          <Button
            variant="contained"
            fullWidth
            onClick={handleBotonClick}
            disabled={isLoadingSub}
            startIcon={buttonState.icon}
            // ✅ Botón verde si va ganando
            color={soyGanador ? 'success' : 'primary'}
            sx={{ fontWeight: 700 }}
          >
            {buttonState.text}
          </Button>

          {/* Estado de Tokens (Solo si aplica) */}
          {isAuthenticated && isSubscribed && isActiva && (
            <Box display="flex" justifyContent="center" mt={2}>
              {soyGanador ? (
                // ✅ Chip especial si es el líder de la subasta
                <Chip
                  label="¡Vas Ganando!"
                  size="small"
                  color="success"
                  sx={{ fontWeight: 'bold' }}
                />
              ) : (
                <Chip
                  label={hasTokens ? `${tokensDisponibles} disponible` : 'Token en uso'}
                  size="small"
                  variant="outlined"
                  color={hasTokens ? 'default' : 'warning'}
                />
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Fade>
  );
};

export default memo(LoteCard);