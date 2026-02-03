import {
  BrokenImage,
  Gavel,
  Lock
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card, CardContent, CardMedia,
  Chip,
  Fade,
  keyframes, Skeleton,
  Stack,
  Typography,
  useTheme
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

interface LoteCardProps {
  lote: LoteDto;
  onNavigate: (id: number) => void;
  onPujar: (lote: LoteDto) => void;
  onRemoveFav: (id: number) => void;
  isSubscribed: boolean;
  hasTokens: boolean;
  tokensDisponibles: number;
  isLoadingSub: boolean;
}

const LoteCard: React.FC<LoteCardProps> = ({
  lote, onNavigate, onPujar, onRemoveFav,
  isSubscribed, hasTokens, tokensDisponibles, isLoadingSub
}) => {
  const theme = useTheme();
  const formatCurrency = useCurrencyFormatter();
  const { loaded, error, handleLoad, handleError } = useImageLoader();

  const imgUrl = useMemo(() => {
    const img = lote.imagenes?.[0];
    return img ? ImagenService.resolveImageUrl(img.url) : null;
  }, [lote.imagenes]);

  const isActiva = lote.estado_subasta === 'activa';
  const isFinalizada = lote.estado_subasta === 'finalizada';

  const handleBotonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSubscribed && hasTokens) onPujar(lote);
    else onNavigate(lote.id);
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
          {/* ✅ Skeleton de carga */}
          {!loaded && !error && imgUrl && (
            <Skeleton
              variant="rectangular"
              animation="wave"
              sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            />
          )}

          {imgUrl && !error ? (
            <CardMedia
              className="lote-img"
              component="img"
              image={imgUrl}
              onLoad={handleLoad}
              onError={handleError}
              sx={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                objectFit: 'cover', transition: 'all 0.6s ease',
                opacity: loaded ? 1 : 0
              }}
            />
          ) : (
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BrokenImage sx={{ fontSize: 48, color: 'grey.400' }} />
            </Box>
          )}

          <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)' }} />

          <Box position="absolute" top={12} left={12}>
            {isActiva && <Chip label="EN VIVO" color="success" size="small" sx={{ fontWeight: 800, animation: `${pulse} 2s infinite` }} />}
          </Box>

          <Box position="absolute" bottom={12} left={12} right={12}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', display: 'block' }}>PRECIO BASE</Typography>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 800 }}>{formatCurrency(lote.precio_base)}</Typography>
          </Box>
        </Box>

        <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
          <Typography variant="caption" color="primary.main" fontWeight={800}>{lote.proyecto?.nombre_proyecto}</Typography>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>{lote.nombre_lote}</Typography>

          <Stack direction="row" spacing={1.5}>
            <Button
              variant="contained"
              fullWidth
              onClick={handleBotonClick}
              disabled={isLoadingSub}
              startIcon={isSubscribed && hasTokens ? <Gavel /> : <Lock />}
              sx={{ fontWeight: 700 }}
            >
              {isLoadingSub ? "..." : (isSubscribed && hasTokens ? "Pujar Ahora" : "Ver Requisitos")}
            </Button>
          </Stack>

          {isSubscribed && isActiva && (
            <Box display="flex" justifyContent="center" mt={2}>
              <Chip
                label={hasTokens ? `${tokensDisponibles} disponible` : 'Token en uso'}
                size="small"
                variant="outlined"
                sx={{ alignSelf: 'center' }} // ✅ CORRECCIÓN: sx para evitar error de tipos
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </Fade>
  );
};

export default React.memo(LoteCard);