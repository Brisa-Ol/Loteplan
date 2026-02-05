// src/features/client/pages/Lotes/components/LoteCard.tsx
import { BrokenImage, Gavel, Lock, ArrowForward } from '@mui/icons-material';
import {
  Box, Button, Card, CardContent, CardMedia, Chip, Fade, keyframes, Skeleton, Stack, Typography, useTheme, alpha
} from '@mui/material';
import React, { useMemo } from 'react';
import ImagenService from '@/core/api/services/imagen.service';
import type { LoteDto } from '@/core/types/dto/lote.dto';
import { useCurrencyFormatter } from '@/features/client/hooks/useCurrencyFormatter';
import { useImageLoader } from '@/features/client/hooks/useImageLoader';

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(46, 125, 50, 0.7); }
  70% { box-shadow: 0 0 0 6px rgba(46, 125, 50, 0); }
  100% { box-shadow: 0 0 0 0 rgba(46, 125, 50, 0); }
`;

export interface LoteCardProps {
  lote: LoteDto;
  onNavigate: (id: number) => void;
  onPujar: (lote: LoteDto) => void;
  onRemoveFav: (id: number) => void;
  isSubscribed: boolean;
  hasTokens: boolean;
  tokensDisponibles: number;
  isLoadingSub: boolean;
  isAuthenticated: boolean; // ✅ Prop añadida para seguridad
}

const LoteCard: React.FC<LoteCardProps> = ({
  lote, onNavigate, onPujar, onRemoveFav,
  isSubscribed, hasTokens, tokensDisponibles, isLoadingSub, isAuthenticated
}) => {
  const theme = useTheme();
  const formatCurrency = useCurrencyFormatter();
  const { loaded, error, handleLoad, handleError } = useImageLoader();

  const imgUrl = useMemo(() => {
    const img = lote.imagenes?.[0];
    return img ? ImagenService.resolveImageUrl(img.url) : null;
  }, [lote.imagenes]);

  const isActiva = lote.estado_subasta === 'activa';

  const handleBotonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // La lógica de redirección al login la maneja el componente padre vía onPujar
    if (!isAuthenticated) {
      onPujar(lote); 
    } else if (isSubscribed && hasTokens && isActiva) {
      onPujar(lote);
    } else {
      onNavigate(lote.id);
    }
  };

  return (
    <Fade in={true} timeout={400}>
      <Card
        variant="outlined"
        onClick={() => onNavigate(lote.id)}
        sx={{
          display: 'flex', flexDirection: 'column', height: '100%',
          position: 'relative', cursor: 'pointer', overflow: 'hidden',
          borderRadius: 3,
          borderColor: isActiva ? 'primary.light' : 'divider',
          '&:hover': {
            transform: 'translateY(-4px)', boxShadow: theme.shadows[10],
            '& .lote-img': { transform: 'scale(1.05)' }
          }
        }}
      >
        <Box position="relative" sx={{ paddingTop: '65%', bgcolor: 'grey.100' }}>
          {!loaded && !error && imgUrl && (
            <Skeleton variant="rectangular" animation="wave" sx={{ position: 'absolute', inset: 0 }} />
          )}
          {imgUrl && !error ? (
            <CardMedia className="lote-img" component="img" image={imgUrl} onLoad={handleLoad} onError={handleError} sx={{ position: 'absolute', inset: 0, objectFit: 'cover', transition: 'all 0.6s ease', opacity: loaded ? 1 : 0 }} />
          ) : (
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BrokenImage sx={{ fontSize: 48, color: 'grey.400' }} /></Box>
          )}
          <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)' }} />
          <Box position="absolute" top={12} left={12}>
            {isActiva && <Chip label="EN VIVO" color="success" size="small" sx={{ fontWeight: 800, animation: `${pulse} 2s infinite` }} />}
          </Box>
          <Box position="absolute" bottom={12} left={12}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', display: 'block' }}>PRECIO BASE</Typography>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 800 }}>{formatCurrency(lote.precio_base)}</Typography>
          </Box>
        </Box>

        <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
          <Typography variant="caption" color="primary.main" fontWeight={800}>{lote.proyecto?.nombre_proyecto}</Typography>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>{lote.nombre_lote}</Typography>

          <Button
            variant="contained"
            fullWidth
            onClick={handleBotonClick}
            disabled={isLoadingSub}
            // ✅ Candado visual si no hay sesión
            startIcon={!isAuthenticated ? <Lock /> : (isSubscribed && hasTokens && isActiva ? <Gavel /> : <ArrowForward />)}
            sx={{ fontWeight: 700 }}
          >
            {isLoadingSub ? "..." : (
              !isAuthenticated 
                ? "Ingresar para Pujar" 
                : (isSubscribed && hasTokens && isActiva ? "Pujar Ahora" : "Ver Detalles")
            )}
          </Button>

          {isAuthenticated && isSubscribed && isActiva && (
            <Box display="flex" justifyContent="center" mt={2}>
              <Chip label={hasTokens ? `${tokensDisponibles} disponible` : 'Token en uso'} size="small" variant="outlined" />
            </Box>
          )}
        </CardContent>
      </Card>
    </Fade>
  );
};

export default React.memo(LoteCard);