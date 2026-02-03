// src/features/client/pages/Proyectos/components/ProjectGallery.optimized.tsx

import React, { useMemo, useCallback } from 'react';
import { Box, Card, CardMedia, Alert, useTheme, alpha, Fade, Skeleton } from '@mui/material';
import { useProyectoHelpers } from '@/features/client/hooks/useProyectoHelpers';

import type { ProyectoDto } from '@/core/types/dto/proyecto.dto';
import { useImageLoader } from '@/features/client/hooks/useImageLoader';

// ===================================================
// TYPES
// ===================================================
interface ProjectGalleryProps {
  proyecto: ProyectoDto;
  onImageClick: (url: string) => void;
}

interface GalleryImageProps {
  imgUrl: string;
  index: number;
  onImageClick: (url: string) => void;
}

// ===================================================
// SUB-COMPONENTS
// ===================================================
const GalleryImage = React.memo<GalleryImageProps>(({ imgUrl, index, onImageClick }) => {
  const theme = useTheme();
  const { loaded, error, handleLoad, handleError } = useImageLoader();

  const handleClick = useCallback(() => {
    onImageClick(imgUrl);
  }, [imgUrl, onImageClick]);

  const handleImageError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      (e.target as HTMLImageElement).src = '/assets/placeholder-project.jpg';
      handleError();
    },
    [handleError]
  );

  return (
    <Fade in timeout={300 + index * 100}>
      <Card
        variant="outlined"
        onClick={handleClick}
        sx={{
          borderRadius: 1.5,
          overflow: 'hidden',
          cursor: 'pointer',
          borderColor: 'divider',
          position: 'relative',
          aspectRatio: '16/10',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',

          '&:hover': {
            transform: 'translateY(-6px)',
            boxShadow: `0 12px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
            borderColor: 'primary.main',
            '& img': { transform: 'scale(1.08)' },
            '& .overlay': { opacity: 1 }
          }
        }}
      >
        {/* Loading Skeleton */}
        {!loaded && !error && (
          <Skeleton
            variant="rectangular"
            width="100%"
            height="100%"
            animation="wave"
            sx={{ position: 'absolute', top: 0, left: 0 }}
          />
        )}

        {/* Image */}
        <CardMedia
          component="img"
          image={imgUrl}
          alt={`Galería ${index + 1}`}
          onLoad={handleLoad}
          onError={handleImageError}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: loaded ? 1 : 0
          }}
        />

        {/* Hover Overlay */}
        <Box
          className="overlay"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(180deg, transparent 50%, ${alpha(
              theme.palette.common.black,
              0.6
            )} 100%)`,
            opacity: 0,
            transition: 'opacity 0.3s ease',
            pointerEvents: 'none'
          }}
        />
      </Card>
    </Fade>
  );
});

GalleryImage.displayName = 'GalleryImage';

// ===================================================
// MAIN COMPONENT
// ===================================================
export const ProjectGallery = React.memo<ProjectGalleryProps>(({ proyecto, onImageClick }) => {
  const helpers = useProyectoHelpers(proyecto);

  // ✅ Memoize images to prevent re-renders
  const imagenes = useMemo(() => helpers.imagenes, [helpers.imagenes]);

  // ✅ Empty state
  if (imagenes.length === 0) {
    return (
      <Alert severity="info" variant="outlined" sx={{ width: '100%' }}>
        No hay imágenes disponibles en la galería.
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
      {imagenes.map((imgUrl, idx) => (
        <GalleryImage key={`gallery-img-${idx}`} imgUrl={imgUrl} index={idx} onImageClick={onImageClick} />
      ))}
    </Box>
  );
});

ProjectGallery.displayName = 'ProjectGallery';