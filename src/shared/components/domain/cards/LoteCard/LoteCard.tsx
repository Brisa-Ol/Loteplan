import React, { useMemo } from 'react';
import { 
  Box, Card, CardContent, CardMedia, Typography, Button, 
  Chip, Stack, Fade, Tooltip, IconButton, useTheme, alpha 
} from '@mui/material';
import { 
  Gavel, CheckCircle, AccessTime, LocationOn, 
  ArrowForward, Visibility, LocalOffer, CalendarMonth 
} from '@mui/icons-material';
import type { LoteDto } from '../../../types/dto/lote.dto';
import ImagenService from '../../../services/imagen.service';
import { FavoritoButton } from '../../../ui/buttons/BotonFavorito/BotonFavorito';


interface LoteCardProps {
  lote: LoteDto;
  onNavigate: (id: number) => void;
  onPujar: (lote: LoteDto) => void;
  onRemoveFav: (id: number) => void;
}

const LoteCard: React.FC<LoteCardProps> = ({ lote, onNavigate, onPujar, onRemoveFav }) => {
  const theme = useTheme();

  // --- LÓGICA Y DATOS CALCULADOS ---
  const imgUrl = useMemo(() => {
    const img = lote.imagenes?.[0];
    return img ? ImagenService.resolveImageUrl(img.url) : '/assets/placeholder-lote.jpg';
  }, [lote.imagenes]);

  const isActiva = lote.estado_subasta === 'activa';
  const isFinalizada = lote.estado_subasta === 'finalizada';
  const cantidadPujas = lote.pujas?.length || 0; 
  const hayPujas = lote.id_puja_mas_alta !== null;
  const etiquetaPrecio = isActiva && hayPujas ? "Oferta Actual" : "Precio Base";

  const formatPrecio = (valor: string | number) => 
    new Intl.NumberFormat('es-AR', { 
      style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0 
    }).format(Number(valor));

  const fechaInicioStr = lote.fecha_inicio 
    ? new Date(lote.fecha_inicio).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' })
    : null;

  const stopProp = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <Fade in={true} timeout={500}>
      <Card
        variant="outlined"
        onClick={() => onNavigate(lote.id)}
        sx={{
          display: 'flex', flexDirection: 'column', height: '100%', width: '100%', minWidth: 280,
          position: 'relative', cursor: 'pointer', overflow: 'hidden',
          bgcolor: isFinalizada ? 'secondary.light' : 'background.default',
          borderColor: isActiva ? 'primary.light' : 'secondary.dark',
          transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s',
          '&:hover': { 
            transform: 'translateY(-6px)',
            boxShadow: theme.shadows[8],
            borderColor: isActiva ? 'primary.main' : 'text.primary',
          }
        }}
      >
        {/* ... (RESTO DEL CONTENIDO VISUAL IGUAL QUE ANTES) ... */}
        {/* Por brevedad, asumo que el contenido visual interno se mantiene igual */}
        <Box position="relative" sx={{ overflow: 'hidden' }}>
          <CardMedia component="img" image={imgUrl} alt={lote.nombre_lote} sx={{ height: { xs: 200, sm: 220 }, objectFit: 'cover', filter: isFinalizada ? 'grayscale(100%)' : 'none', transition: 'transform 0.6s ease', '&:hover': { transform: 'scale(1.08)' } }} />
          <Box sx={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${alpha(theme.palette.common.black, 0.85)} 0%, transparent 60%)` }} />
          <Box position="absolute" top={12} left={12}>
            {isActiva ? <Chip label="En Curso" color="success" size="small" icon={<CheckCircle sx={{ color: 'white !important' }} />} sx={{ fontWeight: 700 }} /> : !isFinalizada && <Chip label="Próximamente" color="warning" size="small" icon={<AccessTime sx={{ color: 'white !important' }} />} sx={{ fontWeight: 700 }} />}
          </Box>
          <Box position="absolute" top={10} right={10} onClick={(e) => e.stopPropagation()}><FavoritoButton loteId={lote.id} size="small" onRemoveRequest={onRemoveFav} /></Box>
          <Box position="absolute" bottom={12} left={16} right={16}>
             <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
                <Box><Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem' }}>{etiquetaPrecio}</Typography><Typography variant="h5" sx={{ color: 'white', fontWeight: 800, textShadow: '0px 2px 8px rgba(0,0,0,0.6)' }}>{formatPrecio(lote.precio_base)}</Typography></Box>
                {isActiva && <Chip label={cantidadPujas > 0 ? `${cantidadPujas} ofertas` : "Sin ofertas"} size="small" icon={<LocalOffer sx={{ fontSize: '14px !important' }} />} sx={{ bgcolor: 'rgba(255,255,255,0.95)', color: 'text.primary', fontWeight: 'bold', height: 24, fontSize: '0.75rem', '& .MuiChip-icon': { color: theme.palette.primary.main } }} />}
             </Stack>
          </Box>
        </Box>
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1, pt: 2.5 }}> 
          <Typography variant="overline" color="primary.main" fontWeight={800} lineHeight={1} letterSpacing={0.5}>{lote.proyecto?.nombre_proyecto || 'Proyecto'}</Typography>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start"><Typography variant="h6" fontWeight={700} lineHeight={1.2} sx={{ minHeight: '2.4rem' }}>{lote.nombre_lote}</Typography><Chip label={`#${lote.id}`} size="small" variant="outlined" sx={{ borderRadius: 1, height: 20, fontSize: '0.7rem', color: 'text.secondary', borderColor: 'divider' }} /></Stack>
          <Stack direction="row" spacing={0.5} alignItems="center"><LocationOn sx={{ fontSize: 18, color: 'text.secondary' }} /><Typography variant="body2" color="text.secondary" noWrap sx={{ textDecoration: 'underline', cursor: 'pointer' }}>Ver ubicación</Typography></Stack>
          <Box mt={1} minHeight={28}>{isActiva && lote.fecha_fin ? <Chip label="Termina pronto" size="small" color="error" variant="outlined" icon={<AccessTime />} sx={{ bgcolor: alpha(theme.palette.error.main, 0.05), border: 'none', fontWeight: 600 }} /> : !isFinalizada && lote.fecha_inicio ? <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'warning.dark', bgcolor: alpha(theme.palette.warning.main, 0.1), p: 0.5, px: 1, borderRadius: 1, display: 'inline-flex' }}><CalendarMonth sx={{ fontSize: 16 }} /><Typography variant="caption" fontWeight={700}>{fechaInicioStr}</Typography></Stack> : null}</Box>
          <Box flexGrow={1} />
          <Stack direction="row" spacing={1} mt={2} alignItems="center">
            {isActiva ? <>
                <Button variant="contained" fullWidth startIcon={<Gavel />} onClick={(e) => stopProp(e, () => onPujar(lote))} sx={{ boxShadow: 3 }}>Pujar</Button>
                <Tooltip title="Ver detalles"><IconButton onClick={(e) => stopProp(e, () => onNavigate(lote.id))} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, color: 'primary.main', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) } }}><ArrowForward /></IconButton></Tooltip>
              </> : <Button variant="outlined" fullWidth startIcon={<Visibility />} onClick={(e) => stopProp(e, () => onNavigate(lote.id))} disabled={isFinalizada} sx={{ borderWidth: 1.5, '&:hover': { borderWidth: 1.5 } }}>{isFinalizada ? "Subasta Finalizada" : "Ver Detalle"}</Button>}
          </Stack>
        </CardContent>
      </Card>
    </Fade>
  );
};

// ✅ ESTO ES LO QUE SOLUCIONA EL LAG:
// Evita que la tarjeta se renderice de nuevo si sus props no cambian
export default React.memo(LoteCard);