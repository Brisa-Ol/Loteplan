// src/features/client/pages/Proyectos/components/ProjectGallery.optimized.tsx

import { Alert, alpha, Box, Card, CardMedia, Fade, Skeleton, Stack, Typography, useTheme } from '@mui/material';
import { BookmarkBorder } from '@mui/icons-material'; // 👈 Ícono para consistencia
import React, { useCallback, useMemo } from 'react';

import { useImageLoader } from '@/features/client/hooks/useImageLoader';
import ImagenService from '@/core/api/services/imagen.service';

// ===================================================
// TYPES
// ===================================================
interface ProjectGalleryProps {
  // Asumimos que proyecto.imagenes es un array de objetos con { url }
  proyecto: any; 
  onImageClick: (url: string) => void;
}

interface GalleryImageProps {
  rawUrl: string | undefined;
  index: number;
  onImageClick: (url: string) => void;
}

// ===================================================
// SUB-COMPONENTS
// ===================================================
const GalleryImage = React.memo<GalleryImageProps>(({ rawUrl, index, onImageClick }) => {
  const theme = useTheme();
  
  // ✅ Usando tu hook con la nueva nomenclatura
  const { isLoading, hasError, handleLoad, handleError } = useImageLoader();

  // 1. DETERMINAR SI EXISTE IMAGEN PREVENTIVAMENTE
  const hasNoImageRecord = !rawUrl || rawUrl.trim() === '';

  const imgUrl = useMemo(() => {
    if (hasNoImageRecord) return null;
    return ImagenService.resolveImageUrl(rawUrl);
  }, [rawUrl, hasNoImageRecord]);

  const handleClick = useCallback(() => {
    if (imgUrl) onImageClick(imgUrl);
  }, [imgUrl, onImageClick]);

  return (
    <Fade in timeout={300 + index * 100}>
      <Card
        variant="outlined"
        onClick={hasNoImageRecord ? undefined : handleClick}
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          cursor: hasNoImageRecord ? 'default' : 'pointer',
          borderColor: 'divider',
          position: 'relative',
          aspectRatio: '16/10',
          bgcolor: 'grey.100',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': !hasNoImageRecord ? {
            transform: 'translateY(-6px)',
            boxShadow: `0 12px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
            borderColor: 'primary.main',
            '& img': { transform: 'scale(1.08)' },
            '& .overlay': { opacity: 1 }
          } : {}
        }}
      >
        {/* 2. MOSTRAR ICONO SI NO HAY IMAGEN (Sin tag <img>) */}
        {hasNoImageRecord ? (
          <Stack alignItems="center" justifyContent="center" height="100%" spacing={1} sx={{ color: 'text.disabled', opacity: 0.6 }}>
            <BookmarkBorder sx={{ fontSize: 32 }} />
            <Typography variant="caption" fontWeight={700}>SIN FOTO</Typography>
          </Stack>
        ) : (
          <>
            {/* Loading Skeleton */}
            {isLoading && (
              <Skeleton
                variant="rectangular"
                width="100%"
                height="100%"
                animation="wave"
                sx={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
              />
            )}

            {/* Image Real o Fallback si falla el servidor */}
            <CardMedia
              component="img"
              image={hasError ? '/assets/placeholder-project.jpg' : imgUrl!}
              alt={`Galería ${index + 1}`}
              onLoad={handleLoad}
              onError={handleError}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: isLoading ? 0 : 1
              }}
            />

            {/* Hover Overlay */}
            <Box
              className="overlay"
              sx={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(180deg, transparent 50%, ${alpha(theme.palette.common.black, 0.5)} 100%)`,
                opacity: 0,
                transition: 'opacity 0.3s ease',
                pointerEvents: 'none',
                zIndex: 2
              }}
            />
          </>
        )}
      </Card>
    </Fade>
  );
});

GalleryImage.displayName = 'GalleryImage';

// ===================================================
// MAIN COMPONENT
// ===================================================
export const ProjectGallery = React.memo<ProjectGalleryProps>(({ proyecto, onImageClick }) => {
  
  // Extraemos las imágenes activas del proyecto
  const imagenes = useMemo(() => {
    return proyecto?.imagenes?.filter((img: any) => img.activo !== false) || [];
  }, [proyecto.imagenes]);

  if (imagenes.length === 0) {
    return (
      <Alert severity="info" variant="outlined" sx={{ width: '100%', borderRadius: 2 }}>
        No hay imágenes registradas para este proyecto todavía.
      </Alert>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
        '& > *': {
          flex: {
            xs: '1 1 100%',
            sm: '1 1 calc(50% - 8px)',
            md: '1 1 calc(33.333% - 11px)'
          }
        }
      }}
    >
      {imagenes.map((img: any, idx: number) => (
        <GalleryImage 
            key={img.id || `gallery-img-${idx}`} 
            rawUrl={img.url} 
            index={idx} 
            onImageClick={onImageClick} 
        />
      ))}
    </Box>
  );
});

ProjectGallery.displayName = 'ProjectGallery';