// src/features/admin/pages/Lotes/modals/LoteOverviewModal.tsx

import {
  AttachMoney,
  Inventory as InventoryIcon,
  LocationOn,
  ArrowForwardIos as NextIcon,
  CloudOff as NoImageIcon,
  ArrowBackIosNew as PrevIcon,
  Business as ProjectIcon,
  EmojiEvents as WinnerIcon
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  CardMedia,
  Chip,
  IconButton,
  Paper,
  Stack,
  Typography,
  alpha,
  useTheme
} from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';

import imagenService from '@/core/api/services/imagen.service';
import type { LoteDto } from '@/core/types/lote.dto';
import type { ProyectoDto } from '@/core/types/proyecto.dto';
import { BaseModal } from '@/shared';

// ============================================================================
// INTERFACES
// ============================================================================
interface LoteOverviewModalProps {
  open: boolean;
  onClose: () => void;
  lote: LoteDto | null;
  proyecto: ProyectoDto | null | undefined;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
const LoteOverviewModal: React.FC<LoteOverviewModalProps> = ({ open, onClose, lote, proyecto }) => {
  const theme = useTheme();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // --- Lógica de Galería ---
  const imagenes = useMemo(() => lote?.imagenes || [], [lote]);
  const hasImages = imagenes.length > 0;

  useEffect(() => {
    if (open) setCurrentImageIndex(0);
  }, [open, lote?.id]);

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

  // --- Estilos Memorizados ---
  const styles = useMemo(() => ({
    galleryBox: {
      position: 'relative',
      height: { xs: 250, md: 400 },
      bgcolor: theme.palette.action.hover,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 3,
      overflow: 'hidden',
      mb: 3,
      border: `1px solid ${theme.palette.divider}`,
    },
    navButton: {
      position: 'absolute',
      bgcolor: alpha(theme.palette.background.paper, 0.8),
      color: theme.palette.primary.main,
      backdropFilter: 'blur(4px)',
      '&:hover': { bgcolor: theme.palette.primary.main, color: theme.palette.common.white },
      zIndex: 2,
    },
    imageCounter: {
      position: 'absolute',
      bottom: 16,
      px: 1.5,
      py: 0.5,
      borderRadius: 10,
      bgcolor: alpha(theme.palette.common.black, 0.6),
      color: theme.palette.common.white,
      typography: 'caption',
      fontWeight: 800,
      zIndex: 2,
    },
    dataCard: {
      flex: 1,
      p: 2,
      borderRadius: 3,
      border: '1px solid',
      borderColor: theme.palette.divider,
      bgcolor: alpha(theme.palette.background.paper, 0.5),
    },
    labelCaption: {
      fontWeight: 800,
      fontSize: '0.65rem',
      color: 'text.secondary',
      textTransform: 'uppercase',
      letterSpacing: 1,
    }
  }), [theme]);

  if (!lote) return null;

  const isInversionista = proyecto?.tipo_inversion === 'directo';

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={lote.nombre_lote}
      subtitle={`Expediente técnico del lote #${lote.id}`}
      icon={<InventoryIcon />}
      maxWidth="md"
      headerExtra={
        <Chip
          label={lote.estado_subasta.toUpperCase()}
          size="small"
          color={lote.estado_subasta === 'activa' ? 'success' : 'info'}
          sx={{ fontWeight: 900, fontSize: '0.6rem', borderRadius: 1.5 }}
        />
      }
    >
      <Stack spacing={0}>
        {/* 📸 GALERÍA DE IMÁGENES */}
        <Box sx={styles.galleryBox}>
          {hasImages ? (
            <>
              <CardMedia
                component="img"
                image={currentImageUrl!}
                alt={lote.nombre_lote}
                sx={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', transition: 'all 0.3s ease' }}
              />

              {imagenes.length > 1 && (
                <>
                  <IconButton onClick={handlePrevImage} sx={{ ...styles.navButton, left: 16 }}>
                    <PrevIcon fontSize="small" />
                  </IconButton>
                  <IconButton onClick={handleNextImage} sx={{ ...styles.navButton, right: 16 }}>
                    <NextIcon fontSize="small" />
                  </IconButton>
                  <Box sx={styles.imageCounter}>
                    {currentImageIndex + 1} / {imagenes.length}
                  </Box>
                </>
              )}
            </>
          ) : (
            <Stack alignItems="center" spacing={1}>
              <NoImageIcon sx={{ fontSize: 64, color: 'text.disabled', opacity: 0.3 }} />
              <Typography variant="body2" color="text.disabled" fontWeight={800}>
                SIN REGISTRO FOTOGRÁFICO
              </Typography>
            </Stack>
          )}
        </Box>

        {/* 📝 BLOQUES DE DATOS */}
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
            {/* Proyecto Card */}
            <Paper elevation={0} sx={styles.dataCard}>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <ProjectIcon color="primary" sx={{ fontSize: 16 }} />
                <Typography sx={styles.labelCaption}>PROYECTO ASOCIADO</Typography>
              </Stack>
              {proyecto ? (
                <>
                  <Typography variant="subtitle1" fontWeight={800} noWrap>
                    {proyecto.nombre_proyecto}
                  </Typography>
                  <Chip
                    label={isInversionista ? 'INVERSIÓN DIRECTA' : 'PACK MENSUAL'}
                    size="small"
                    sx={{
                      mt: 1, height: 18, fontSize: '0.55rem', fontWeight: 900,
                      bgcolor: isInversionista ? alpha(theme.palette.info.main, 0.1) : alpha(theme.palette.warning.main, 0.1),
                      color: isInversionista ? 'info.main' : 'warning.main'
                    }}
                  />
                </>
              ) : (
                <Typography variant="body2" color="text.disabled" fontWeight={600}>No asignado</Typography>
              )}
            </Paper>

            {/* Finanzas Card */}
            <Paper elevation={0} sx={{ ...styles.dataCard, bgcolor: alpha(theme.palette.success.main, 0.02), borderColor: alpha(theme.palette.success.main, 0.1) }}>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <AttachMoney color="success" sx={{ fontSize: 16 }} />
                <Typography sx={{ ...styles.labelCaption, color: 'success.main' }}>VALORACIÓN BASE</Typography>
              </Stack>
              <Typography variant="h5" fontWeight={900} sx={{ fontFamily: 'monospace' }}>
                ${Number(lote.precio_base).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </Typography>
              {Number(lote.excedente_visualizacion) > 0 && (
                <Typography variant="caption" color="success.main" fontWeight={800} sx={{ display: 'block', mt: 0.5 }}>
                  +${Number(lote.excedente_visualizacion).toLocaleString('es-AR', { minimumFractionDigits: 2 })} (Excedente)
                </Typography>
              )}
            </Paper>
          </Box>

          {/* Ganador adjudicado */}
          {lote.ganador && (
            <Paper elevation={0} sx={{
              p: 2.5, borderRadius: 3,
              border: '1px solid',
              borderColor: alpha(theme.palette.primary.main, 0.2),
              bgcolor: alpha(theme.palette.primary.main, 0.03)
            }}>
              <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                <WinnerIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography variant="subtitle2" fontWeight={900} color="primary.main">GANADOR ADJUDICADO</Typography>
              </Stack>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{
                  bgcolor: 'primary.main',
                  width: 48, height: 48,
                  fontWeight: 900,
                  boxShadow: `0 4px 10px ${alpha(theme.palette.primary.main, 0.3)}`
                }}>
                  {lote.ganador.nombre.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="body1" fontWeight={800}>{lote.ganador.nombre} {lote.ganador.apellido}</Typography>
                  <Typography variant="caption" color="text.secondary" display="block">{lote.ganador.email}</Typography>
                  {lote.ganador.nombre_usuario && (
                    <Typography variant="caption" color="primary.dark" fontWeight={800}>@{lote.ganador.nombre_usuario}</Typography>
                  )}
                </Box>
              </Stack>
            </Paper>
          )}

          {/* Ubicación GPS */}
          {lote.latitud && (
            <Paper elevation={0} sx={{ ...styles.dataCard, bgcolor: theme.palette.action.hover, display: 'flex', alignItems: 'center', gap: 2, p: 1.5 }}>
              <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 36, height: 36 }}>
                <LocationOn fontSize="small" />
              </Avatar>
              <Box>
                <Typography sx={styles.labelCaption}>COORDENADAS GEORREFERENCIADAS</Typography>
                <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace', letterSpacing: 0.5 }}>
                  {Number(lote.latitud).toFixed(8)}, {Number(lote.longitud).toFixed(8)}
                </Typography>
              </Box>
            </Paper>
          )}
        </Stack>
      </Stack>
    </BaseModal>
  );
};

export default LoteOverviewModal;