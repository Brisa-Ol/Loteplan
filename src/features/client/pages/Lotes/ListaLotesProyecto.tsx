// src/features/client/pages/Lotes/components/LoteCard.tsx

import { BookmarkBorder, Gavel, LocationOn } from '@mui/icons-material';
import {
  Box,
  Button,
  Card, CardContent, CardMedia,
  Chip, Skeleton,
  Stack,
  Typography,
  useTheme
} from '@mui/material';
import React, { useMemo } from 'react';


import ImagenService from '@/core/api/services/imagen.service';
import type { LoteDto } from '@/core/types/dto/lote.dto';
import { useAuctionStatus } from '@/features/client/hooks/useAuctionStatus';
import { useCurrencyFormatter } from '@/features/client/hooks/useCurrencyFormatter';
import { useImageLoader } from '../../hooks';

interface LoteCardProps {
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
  lote, onNavigate, onPujar, isSubscribed, isAuthenticated
}) => {
  const theme = useTheme();
  const formatCurrency = useCurrencyFormatter();
  const statusConfig = useAuctionStatus(lote.estado_subasta);
  const { isLoading, hasError, handleLoad, handleError } = useImageLoader();

  // ─────────────────────────────────────────────
  // LÓGICA DE IMAGEN PREVENTIVA (Evita 404 en consola)
  // ─────────────────────────────────────────────
  const rawUrl = lote.imagenes?.[0]?.url;
  const hasNoImageRecord = !rawUrl || rawUrl.trim() === '';

  const imagenUrl = useMemo(() => {
    if (hasNoImageRecord) return null;
    return ImagenService.resolveImageUrl(rawUrl);
  }, [rawUrl, hasNoImageRecord]);

  return (
    <Card
      elevation={0}
      onClick={() => onNavigate(lote.id)}
      sx={{
        height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 4,
        border: `1px solid ${theme.palette.divider}`, cursor: 'pointer',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        '&:hover': { transform: 'translateY(-4px)', boxShadow: theme.shadows[4] }
      }}
    >
      {/* Contenedor de Imagen / Placeholder */}
      <Box sx={{ position: 'relative', height: 200, bgcolor: 'grey.100', overflow: 'hidden' }}>

        {hasNoImageRecord ? (
          // ESTADO: SIN IMAGEN (Sin tag <img> para no ensuciar la consola)
          <Stack alignItems="center" justifyContent="center" height="100%" spacing={1} sx={{ color: 'text.disabled', bgcolor: 'grey.200' }}>
            <BookmarkBorder sx={{ fontSize: 40, opacity: 0.4 }} />
            <Typography variant="caption" fontWeight={700}>SIN IMAGEN</Typography>
          </Stack>
        ) : (
          <>
            {isLoading && (
              <Skeleton
                variant="rectangular" width="100%" height="100%"
                sx={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
              />
            )}
            <CardMedia
              component="img"
              height="200"
              image={hasError ? '/assets/placeholder-lote.jpg' : imagenUrl!}
              alt={lote.nombre_lote}
              onLoad={handleLoad}
              onError={handleError}
              sx={{
                objectFit: 'cover', opacity: isLoading ? 0 : 1,
                transition: 'opacity 0.3s ease'
              }}
            />
          </>
        )}

        <Chip
          label={statusConfig.label}
          color={statusConfig.color}
          size="small"
          sx={{ position: 'absolute', top: 12, right: 12, fontWeight: 700, color: 'white' }}
        />
      </Box>

      <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
        <Typography variant="h6" fontWeight={800} noWrap>{lote.nombre_lote}</Typography>

        <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary" mb={2}>
          <LocationOn sx={{ fontSize: 16 }} />
          <Typography variant="body2" noWrap sx={{ fontSize: '0.8rem' }}>
            {lote.latitud ? `${lote.latitud}, ${lote.longitud}` : 'Ubicación pendiente'}
          </Typography>
        </Stack>

        <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">PRECIO BASE</Typography>
        <Typography variant="h6" color="primary.main" fontWeight={900}>
          {formatCurrency(Number(lote.precio_base))}
        </Typography>

        {/* Botón de acción rápida dentro de la card */}
        <Stack mt={2}>
          <Button
            variant="contained"
            size="small"
            startIcon={<Gavel />}
            disabled={!isAuthenticated || !isSubscribed || lote.estado_subasta !== 'activa'}
            onClick={(e) => {
              e.stopPropagation();
              onPujar(lote);
            }}
            sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
          >
            Pujar ahora
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default LoteCard;