// src/features/client/pages/Lotes/components/LoteCard.tsx

import { ArrowForward, BrokenImage, Gavel, Lock } from '@mui/icons-material';
import {
  Box, Button, Card, CardContent, CardMedia, Chip, Fade,
  keyframes, Skeleton, Typography, useTheme
} from '@mui/material';
import React, { memo, useMemo } from 'react';

import ImagenService from '@/core/api/services/imagen.service';
import type { LoteDto } from '@/core/types/dto/lote.dto';
import { useCurrencyFormatter } from '@/features/client/hooks/useCurrencyFormatter';
import { useImageLoader } from '@/features/client/hooks/useImageLoader';

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

  // Memoización de la URL de la imagen
  const imgUrl = useMemo(() => {
    const img = lote.imagenes?.[0];
    return img ? ImagenService.resolveImageUrl(img.url) : null;
  }, [lote.imagenes]);

  const isActiva = lote.estado_subasta === 'activa';

  // Lógica principal de interacción
  const handleBotonClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Si no está autenticado o cumple condiciones de subasta, intenta pujar (el padre maneja el login)
    if (!isAuthenticated || (isSubscribed && hasTokens && isActiva)) {
      onPujar(lote);
    } else {
      // Si no, navega al detalle
      onNavigate(lote.id);
    }
  };

  // Determinación de UI del botón
  const getButtonContent = () => {
    if (isLoadingSub) return { text: "...", icon: null };
    if (!isAuthenticated) return { text: "Ingresar para Pujar", icon: <Lock /> };
    if (isSubscribed && hasTokens && isActiva) return { text: "Pujar Ahora", icon: <Gavel /> };
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
          borderColor: isActiva ? 'primary.light' : 'divider',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[10],
            borderColor: isActiva ? 'primary.main' : 'divider',
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

          {/* Precio Base */}
          <Box position="absolute" bottom={12} left={12}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', display: 'block' }}>
              PRECIO BASE
            </Typography>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 800 }}>
              {formatCurrency(lote.precio_base)}
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
            sx={{ fontWeight: 700 }}
          >
            {buttonState.text}
          </Button>

          {/* Estado de Tokens (Solo si aplica) */}
          {isAuthenticated && isSubscribed && isActiva && (
            <Box display="flex" justifyContent="center" mt={2}>
              <Chip
                label={hasTokens ? `${tokensDisponibles} disponible` : 'Token en uso'}
                size="small"
                variant="outlined"
                color={hasTokens ? 'default' : 'warning'}
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </Fade>
  );
};

export default memo(LoteCard);