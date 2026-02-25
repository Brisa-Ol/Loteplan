import {
    AttachMoney,
    Close as CloseIcon,
    Inventory as InventoryIcon,
    LocationOn,
    ArrowForwardIos as NextIcon,
    CloudOff as NoImageIcon,
    ArrowBackIosNew as PrevIcon,
    Business as ProjectIcon,
    EmojiEvents as WinnerIcon
} from '@mui/icons-material';
import {
    Avatar, Box, Button,
    CardMedia,
    Chip,
    Dialog, DialogContent, DialogTitle,
    Divider, IconButton, Paper, Stack, Typography, alpha, useTheme
} from '@mui/material';
import React, { useEffect, useState, useMemo } from 'react';

import imagenService from '@/core/api/services/imagen.service';
import type { LoteDto } from '@/core/types/dto/lote.dto';
import type { ProyectoDto } from '@/core/types/dto/proyecto.dto';

interface LoteOverviewModalProps {
    open: boolean;
    onClose: () => void;
    lote: LoteDto | null;
    proyecto: ProyectoDto | null | undefined;
}

const LoteOverviewModal: React.FC<LoteOverviewModalProps> = ({ open, onClose, lote, proyecto }) => {
    const theme = useTheme();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // 1. Limpieza de imágenes: Obtenemos el array y filtramos posibles nulos
    const imagenes = useMemo(() => lote?.imagenes || [], [lote]);
    const hasImages = imagenes.length > 0;

    // Resetear el índice al cambiar de lote o cerrar
    useEffect(() => {
        if (open) setCurrentImageIndex(0);
    }, [open, lote?.id]);

    if (!lote) return null;

    // 2. Resolución de la URL de la imagen principal
    const currentImageUrl = useMemo(() => {
        if (!hasImages) return null;
        return imagenService.resolveImageUrl(imagenes[currentImageIndex]?.url);
    }, [hasImages, imagenes, currentImageIndex]);

    const handlePrevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev === 0 ? imagenes.length - 1 : prev - 1));
    };

    const handleNextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev === imagenes.length - 1 ? 0 : prev + 1));
    };

    const getSubastaColor = (estado: string) => {
        switch (estado) {
            case 'activa': return 'success';
            case 'finalizada': return 'info';
            default: return 'warning';
        }
    };

    const isInversionista = proyecto?.tipo_inversion === 'directo';

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}
        >
            {/* HEADER */}
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ minWidth: 0 }}>
                    <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 48, height: 48 }}>
                        <InventoryIcon />
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h6" fontWeight={800} noWrap>{lote.nombre_lote}</Typography>
                        <Stack direction="row" spacing={1} mt={0.5}>
                            <Chip
                                label={lote.estado_subasta.toUpperCase()}
                                size="small"
                                color={getSubastaColor(lote.estado_subasta) as any}
                                sx={{ fontWeight: 800, fontSize: '0.65rem' }}
                            />
                            {!lote.activo && (
                                <Chip label="OCULTO" size="small" color="error" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
                            )}
                        </Stack>
                    </Box>
                </Stack>
                <IconButton onClick={onClose}><CloseIcon /></IconButton>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ p: 0, bgcolor: 'background.default', overflowX: 'hidden' }}>
                
                {/* 📸 ÁREA DE IMAGEN PRINCIPAL */}
                <Box sx={{
                    position: 'relative',
                    height: { xs: 300, md: 450 },
                    bgcolor: '#ECECEC', // Fondo oscuro para que resalten las fotos
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                }}>
                    {hasImages ? (
                        <>
                            <CardMedia
                                component="img"
                                image={currentImageUrl!}
                                alt={lote.nombre_lote}
                                sx={{ 
                                    maxHeight: '100%', 
                                    maxWidth: '100%', 
                                    objectFit: 'contain',
                                    transition: 'opacity 0.3s ease-in-out'
                                }}
                            />
                            
                            {/* Botones de Navegación (Solo si hay > 1 imagen) */}
                            {imagenes.length > 1 && (
                                <>
                                    <IconButton
                                        onClick={handlePrevImage}
                                        sx={{ 
                                            position: 'absolute', left: 16, 
                                            bgcolor: 'rgba(0,0,0,0.3)', color: 'white', 
                                            backdropFilter: 'blur(4px)',
                                            '&:hover': { bgcolor: 'primary.main' } 
                                        }}
                                    >
                                        <PrevIcon />
                                    </IconButton>
                                    <IconButton
                                        onClick={handleNextImage}
                                        sx={{ 
                                            position: 'absolute', right: 16, 
                                            bgcolor: 'rgba(0,0,0,0.3)', color: 'white', 
                                            backdropFilter: 'blur(4px)',
                                            '&:hover': { bgcolor: 'primary.main' } 
                                        }}
                                    >
                                        <NextIcon />
                                    </IconButton>
                                    
                                    {/* Contador de imágenes */}
                                    <Box sx={{ 
                                        position: 'absolute', bottom: 16, 
                                        px: 1.5, py: 0.5, borderRadius: 10,
                                        bgcolor: 'rgba(0,0,0,0.5)', color: 'white',
                                        typography: 'caption', fontWeight: 700
                                    }}>
                                        {currentImageIndex + 1} / {imagenes.length}
                                    </Box>
                                </>
                            )}
                        </>
                    ) : (
                        <Stack alignItems="center" spacing={1}>
                            <NoImageIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.3 }} />
                            <Typography variant="body2" color="text.secondary" fontWeight={600}>
                                Sin fotos en galería
                            </Typography>
                        </Stack>
                    )}
                </Box>

                {/* 🎞️ MINIATURAS (Thumbnail Strip) */}
                {hasImages && imagenes.length > 1 && (
                    <Box sx={{ p: 2, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Stack
                            direction="row"
                            spacing={1}
                            sx={{
                                overflowX: 'auto',
                                py: 1,
                                '&::-webkit-scrollbar': { height: 4 },
                                '&::-webkit-scrollbar-thumb': { bgcolor: alpha(theme.palette.primary.main, 0.2), borderRadius: 2 }
                            }}
                        >
                            {imagenes.map((img, index) => (
                                <Box
                                    key={img.id || index}
                                    onClick={() => setCurrentImageIndex(index)}
                                    sx={{
                                        minWidth: 70, height: 50, borderRadius: 1.5,
                                        cursor: 'pointer', overflow: 'hidden',
                                        border: '2px solid',
                                        borderColor: currentImageIndex === index ? 'primary.main' : 'transparent',
                                        opacity: currentImageIndex === index ? 1 : 0.5,
                                        transition: '0.2s',
                                        '&:hover': { opacity: 1 }
                                    }}
                                >
                                    <img
                                        src={imagenService.resolveImageUrl(img.url)}
                                        alt="thumb"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                </Box>
                            ))}
                        </Stack>
                    </Box>
                )}

                {/* 📝 PANEL DE INFORMACIÓN */}
                <Stack spacing={3} p={3}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                        {/* Proyecto Card */}
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.01) }}>
                            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                                <ProjectIcon color="action" sx={{ fontSize: 18 }} />
                                <Typography variant="caption" fontWeight={800} color="text.secondary" letterSpacing={1}>PROYECTO</Typography>
                            </Stack>
                            {proyecto ? (
                                <>
                                    <Typography variant="subtitle1" fontWeight={800} color="primary.dark">{proyecto.nombre_proyecto}</Typography>
                                    <Chip 
                                        label={isInversionista ? 'INVERSIÓN DIRECTA' : 'PACK MENSUAL'} 
                                        size="small" 
                                        sx={{ 
                                            mt: 1, height: 20, fontSize: '0.6rem', fontWeight: 900,
                                            bgcolor: isInversionista ? alpha('#0288d1', 0.1) : alpha('#ed6c02', 0.1),
                                            color: isInversionista ? '#0288d1' : '#ed6c02'
                                        }} 
                                    />
                                </>
                            ) : (
                                <Typography variant="body2" color="text.disabled">Sin asignar</Typography>
                            )}
                        </Paper>

                        {/* Finanzas Card */}
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.success.main, 0.01) }}>
                            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                                <AttachMoney color="success" sx={{ fontSize: 18 }} />
                                <Typography variant="caption" fontWeight={800} color="success.main" letterSpacing={1}>VALORACIÓN</Typography>
                            </Stack>
                            <Typography variant="h6" fontWeight={900}>
                                ${Number(lote.precio_base).toLocaleString('es-AR')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">Precio base de subasta</Typography>
                        </Paper>
                    </Box>

                    {/* Ganador (Si existe) */}
                    {lote.ganador && (
                        <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'primary.light', bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                            <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                                <WinnerIcon color="primary" />
                                <Typography variant="subtitle2" fontWeight={800} color="primary.main">ADJUDICACIÓN FINAL</Typography>
                            </Stack>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, fontSize: '1rem', fontWeight: 800 }}>
                                    {lote.ganador.nombre.charAt(0)}
                                </Avatar>
                                <Box>
                                    <Typography variant="body1" fontWeight={800}>{lote.ganador.nombre} {lote.ganador.apellido}</Typography>
                                    <Typography variant="caption" color="text.secondary">{lote.ganador.email}</Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    )}

                    {/* Ubicación */}
                    {lote.latitud && (
                        <Stack direction="row" alignItems="center" spacing={1} p={1} bgcolor="action.hover" borderRadius={2}>
                            <LocationOn color="action" fontSize="small" />
                            <Typography variant="caption" fontWeight={700} color="text.secondary">
                                COORDENADAS: {lote.latitud}, {lote.longitud}
                            </Typography>
                        </Stack>
                    )}
                </Stack>
            </DialogContent>

            <Divider />

            <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'flex-end', bgcolor: 'background.paper' }}>
                <Button onClick={onClose} variant="contained" sx={{ px: 6, py: 1, borderRadius: 3, fontWeight: 700 }}>
                    Cerrar Detalle
                </Button>
            </Box>
        </Dialog>
    );
};

export default LoteOverviewModal;