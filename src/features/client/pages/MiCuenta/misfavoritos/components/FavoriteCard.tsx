import React, { useMemo } from 'react';
import {
    Box, Card, CardActions, CardContent, CardMedia, Chip, Divider,
    IconButton, Skeleton, Stack, Tooltip, Typography, useTheme, alpha,
    Button
} from '@mui/material';
import {
    Favorite as FavoriteIcon, LocationOn, Visibility as VisibilityIcon,
    BookmarkBorder, DeleteOutline
} from '@mui/icons-material';
import ImagenService from '@/core/api/services/imagen.service';
import { useAuctionStatus, useCurrencyFormatter, useImageLoader } from '@/features/client/hooks';
import type { LoteDto } from '@/core/types/lote.dto';


interface Props {
    lote: LoteDto;
    onRemove: (id: number) => void;
    onVerDetalle: (id: number) => void;
    isRemoving: boolean;
}

const FavoriteCard: React.FC<Props> = React.memo(({ lote, onRemove, onVerDetalle, isRemoving }) => {
    const theme = useTheme();
    const formatCurrency = useCurrencyFormatter();
    const statusConfig = useAuctionStatus(lote.estado_subasta);
    const { isLoading, hasError, handleLoad, handleError } = useImageLoader();

    const rawUrl = lote.imagenes?.[0]?.url;
    const hasNoImage = !rawUrl || rawUrl.trim() === '';

    const imagenUrl = useMemo(() =>
        hasNoImage ? null : ImagenService.resolveImageUrl(rawUrl),
        [rawUrl, hasNoImage]);

    const ubicacionLabel = useMemo(() => {
        if (lote.latitud == null || lote.longitud == null) return 'Ubicación no especificada';
        return `${Number(lote.latitud).toFixed(4)}, ${Number(lote.longitud).toFixed(4)}`;
    }, [lote.latitud, lote.longitud]);

    return (
        <Card elevation={0} sx={{
            height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 4,
            border: `1px solid ${theme.palette.divider}`, transition: 'all 0.3s ease',
            '&:hover': { transform: 'translateY(-6px)', boxShadow: theme.shadows[6] }
        }}>
            <Box sx={{ position: 'relative', height: 220, overflow: 'hidden', bgcolor: 'grey.100' }}>
                {hasNoImage ? (
                    <Stack alignItems="center" justifyContent="center" height="100%" sx={{ color: 'text.disabled', bgcolor: 'grey.200' }}>
                        <BookmarkBorder sx={{ fontSize: 40, opacity: 0.4 }} />
                        <Typography variant="caption" fontWeight={700}>SIN IMAGEN</Typography>
                    </Stack>
                ) : (
                    <>
                        {isLoading && <Skeleton variant="rectangular" width="100%" height="100%" sx={{ position: 'absolute', zIndex: 1 }} />}
                        <CardMedia
                            component="img" height="220"
                            image={hasError ? '/assets/placeholder-lote.jpg' : imagenUrl!}
                            sx={{ objectFit: 'cover', opacity: isLoading ? 0 : 1, transition: 'opacity 0.3s' }}
                            onLoad={handleLoad} onError={handleError}
                        />
                    </>
                )}
                <Chip label={statusConfig.label} color={statusConfig.color} size="small" sx={{ position: 'absolute', top: 12, right: 12, fontWeight: 700, color: 'white' }} />
                <Tooltip title="Dejar de seguir">
                    <IconButton
                        onClick={() => onRemove(lote.id)} disabled={isRemoving} size="small"
                        sx={{ position: 'absolute', top: 12, left: 12, bgcolor: 'white', color: 'error.main', boxShadow: 2, '&:hover': { bgcolor: 'error.main', color: 'white' } }}
                    >
                        {isRemoving ? <DeleteOutline fontSize="small" /> : <FavoriteIcon fontSize="small" />}
                    </IconButton>
                </Tooltip>
            </Box>

            <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                <Typography variant="h6" fontWeight={800} noWrap>{lote.nombre_lote}</Typography>
                <Stack direction="row" spacing={0.5} alignItems="center" mb={2} color="text.secondary">
                    <LocationOn sx={{ fontSize: 16 }} />
                    <Typography variant="body2" noWrap>{ubicacionLabel}</Typography>
                </Stack>
                <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />
                <Typography variant="caption" color="text.secondary" fontWeight={700}>PRECIO BASE</Typography>
                <Typography variant="h6" color="primary.main" fontWeight={800}>{formatCurrency(Number(lote.precio_base))}</Typography>
            </CardContent>

            <CardActions sx={{ p: 2.5, pt: 0 }}>
                <Button
                    fullWidth variant="contained" startIcon={<VisibilityIcon />}
                    onClick={() => onVerDetalle(lote.id)}
                    sx={{ borderRadius: 2, fontWeight: 700, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}
                >
                    Ver Oportunidad
                </Button>
            </CardActions>
        </Card>
    );
});

export default FavoriteCard;