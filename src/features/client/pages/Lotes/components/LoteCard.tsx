import React, { useMemo, useRef, useCallback } from 'react';
import {
  Box, Card, CardContent, CardMedia, Typography, Button,
  Chip, Stack, Fade, Tooltip, IconButton, useTheme, alpha, keyframes
} from '@mui/material';
import {
  Gavel, AccessTime, LocationOn,
  ArrowForward, LocalOffer, CalendarMonth,
  Timelapse, Lock, BrokenImage
} from '@mui/icons-material';

import type { LoteDto } from '@/core/types/dto/lote.dto';
import ImagenService from '@/core/api/services/imagen.service';
import { FavoritoButton } from '@/shared/components/ui/buttons/BotonFavorito';

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

  // ✅ OPTIMIZACIÓN: useRef para estado de imagen (no causa re-renders innecesarios)
  const imageState = useRef<{ loaded: boolean; error: boolean }>({ 
    loaded: false, 
    error: false 
  });

  const imgUrl = useMemo(() => {
    const img = lote.imagenes?.[0];
    return img ? ImagenService.resolveImageUrl(img.url) : null;
  }, [lote.imagenes]);

  // ✅ Handlers memoizados
  const handleImageLoad = useCallback(() => {
    imageState.current.loaded = true;
  }, []);

  const handleImageError = useCallback(() => {
    imageState.current.error = true;
  }, []);

  const isActiva = lote.estado_subasta === 'activa';
  const isFinalizada = lote.estado_subasta === 'finalizada';
  const cantidadPujas = lote.pujas?.length || 0;
  const hayPujas = lote.id_puja_mas_alta !== null;
  
  const etiquetaPrecio = isActiva ? (hayPujas ? "Oferta ganadora actual" : "Precio inicial") : "Precio base";

  const formatPrecio = (valor: string | number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(valor));

  const stopProp = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  const handleBotonClick = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (isSubscribed && hasTokens) {
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
          display: 'flex', flexDirection: 'column', height: '100%', width: '100%', minWidth: 280,
          position: 'relative', cursor: 'pointer', overflow: 'hidden',
          borderRadius: 3, bgcolor: 'background.paper',
          borderColor: isActiva ? 'primary.light' : 'divider',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)', boxShadow: theme.shadows[10],
            borderColor: isActiva ? 'primary.main' : 'text.primary',
            '& .lote-img': { transform: 'scale(1.05)' },
            '& .nav-arrow': { transform: 'translateX(4px)', bgcolor: alpha(theme.palette.primary.main, 0.1) }
          }
        }}
      >
        {/* HEADER CON GESTIÓN DE IMAGEN OPTIMIZADA */}
        <Box position="relative" sx={{ overflow: 'hidden', paddingTop: '65%', bgcolor: 'grey.100' }}>
          
          {imgUrl && !imageState.current.error ? (
            <CardMedia 
              className="lote-img" 
              component="img" 
              image={imgUrl} 
              alt={lote.nombre_lote} 
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading="lazy"
              sx={{ 
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                objectFit: 'cover', 
                filter: isFinalizada ? 'grayscale(100%)' : 'none', 
                transition: 'transform 0.6s ease, opacity 0.5s ease',
                opacity: 1
              }} 
            />
          ) : (
            <Box sx={{ 
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.200' 
            }}>
              <BrokenImage sx={{ fontSize: 48, color: 'grey.400' }} />
            </Box>
          )}

          {/* GRADIENTES Y BADGES */}
          <Box sx={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${alpha(theme.palette.common.black, 0.9)} 0%, ${alpha(theme.palette.common.black, 0.4)} 25%, transparent 60%)`, pointerEvents: 'none' }} />

          <Box position="absolute" top={12} left={12} zIndex={2}>
            {isActiva ? (
              <Chip label="EN VIVO" color="success" size="small" icon={<Timelapse sx={{ color: 'white !important', animation: 'spin 2s linear infinite' }} />} sx={{ fontWeight: 800, letterSpacing: 0.5, animation: `${pulse} 2s infinite` }} />
            ) : !isFinalizada && (
              <Chip label="Próximamente" color="warning" size="small" icon={<AccessTime sx={{ color: 'white !important' }} />} sx={{ fontWeight: 700 }} />
            )}
          </Box>

          <Box position="absolute" top={8} right={8} onClick={(e) => e.stopPropagation()} zIndex={2}>
            <FavoritoButton loteId={lote.id} size="small" onRemoveRequest={onRemoveFav} />
          </Box>

          <Box position="absolute" bottom={0} left={0} right={0} p={2} zIndex={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
              <Box>
                <Typography variant="caption" sx={{ color: alpha('#fff', 0.8), fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase' }}>{etiquetaPrecio}</Typography>
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 800, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{formatPrecio(lote.precio_base)}</Typography>
              </Box>
              {isActiva && (
                <Chip label={cantidadPujas > 0 ? `${cantidadPujas} ofertas` : "Sin ofertas"} size="small" variant="filled" icon={<LocalOffer sx={{ fontSize: '14px !important', color: theme.palette.primary.main }} />} sx={{ bgcolor: 'background.paper', color: 'text.primary', fontWeight: 700, boxShadow: 2 }} />
              )}
            </Stack>
          </Box>
        </Box>

        {/* BODY */}
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1.5, p: 2.5 }}>
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
               <Typography variant="caption" color="primary.main" fontWeight={800} letterSpacing={0.5}>{lote.proyecto?.nombre_proyecto || 'PROYECTO'}</Typography>
               <Typography variant="caption" color="text.disabled" fontWeight={600}>LOTE #{lote.id}</Typography>
            </Stack>
            <Typography variant="h6" fontWeight={700} lineHeight={1.2} sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.4em' }}>{lote.nombre_lote}</Typography>
          </Box>

          <Stack direction="row" alignItems="center" gap={0.5}>
            <LocationOn fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'underline', cursor: 'pointer' }}>Ver ubicación en mapa</Typography>
          </Stack>

          <Box flexGrow={1} display="flex" alignItems="flex-end">
             {isActiva ? (
                <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%', bgcolor: alpha(theme.palette.error.main, 0.08), p: 1, borderRadius: 1.5 }}>
                    <AccessTime color="error" fontSize="small" />
                    <Box>
                        <Typography variant="caption" color="error.main" fontWeight={700} display="block" lineHeight={1}>Cierra el {new Date(lote.fecha_fin || '').toLocaleDateString('es-AR', {day: 'numeric', month: 'short'})}</Typography>
                        <Typography variant="caption" color="text.secondary" fontSize="0.7rem">A las {new Date(lote.fecha_fin || '').toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} hs</Typography>
                    </Box>
                </Stack>
             ) : !isFinalizada && lote.fecha_inicio ? (
                <Stack direction="row" spacing={1} alignItems="center" sx={{ bgcolor: alpha(theme.palette.info.main, 0.08), p: 1, borderRadius: 1.5, width: '100%' }}>
                    <CalendarMonth color="info" fontSize="small" />
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>Inicia: <strong>{new Date(lote.fecha_inicio).toLocaleDateString()}</strong></Typography>
                </Stack>
             ) : null}
          </Box>

          {/* BOTONES DINÁMICOS */}
          <Stack direction="row" spacing={1.5} mt={1}>
            {isActiva ? (
              <>
                <Button
                  variant="contained"
                  fullWidth
                  color={isSubscribed && hasTokens ? "primary" : "inherit"}
                  startIcon={isLoadingSub ? <Timelapse /> : (isSubscribed && hasTokens ? <Gavel /> : <Lock />)}
                  onClick={handleBotonClick}
                  disabled={isLoadingSub}
                  sx={{ borderRadius: 2, fontWeight: 700, boxShadow: 3, textTransform: 'none', fontSize: '1rem' }}
                >
                  {isLoadingSub ? "Cargando..." : (
                    isSubscribed && hasTokens ? "Pujar Ahora" : 
                    isSubscribed && !hasTokens ? "Token en Uso" :
                    "Ver Requisitos"
                  )}
                </Button>

                <Tooltip title="Ver todos los detalles">
                  <IconButton className="nav-arrow" onClick={(e) => stopProp(e, () => onNavigate(lote.id))} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, color: 'text.secondary', transition: 'all 0.2s', '&:hover': { color: 'primary.main', borderColor: 'primary.main' } }}>
                    <ArrowForward />
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <Button variant="outlined" fullWidth endIcon={<ArrowForward />} onClick={(e) => stopProp(e, () => onNavigate(lote.id))} disabled={isFinalizada} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                {isFinalizada ? "Subasta Finalizada" : "Ver Detalles"}
              </Button>
            )}
          </Stack>

          {/* BADGE DE TOKENS */}
          {isSubscribed && isActiva && (
            <Box display="flex" justifyContent="center" mt={0.5}>
              <Chip 
                label={hasTokens ? `${tokensDisponibles} token disponible` : 'Token en uso'}
                size="small"
                color={hasTokens ? "success" : "default"}
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </Fade>
  );
};

export default React.memo(LoteCard);