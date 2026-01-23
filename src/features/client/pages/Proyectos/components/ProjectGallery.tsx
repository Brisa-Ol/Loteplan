import React, { useState } from 'react';
import { Box, Card, CardMedia, Alert, useTheme, alpha, Fade, Skeleton } from '@mui/material';
import { useProyectoHelpers } from '@/features/client/hooks/useProyectoHelpers';
import type { ProyectoDto } from '@/core/types/dto/proyecto.dto';

interface ProjectGalleryProps {
  proyecto: ProyectoDto;
  onImageClick: (url: string) => void;
}

export const ProjectGallery: React.FC<ProjectGalleryProps> = ({ proyecto, onImageClick }) => {
  const theme = useTheme();
  const helpers = useProyectoHelpers(proyecto);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  const handleImageLoad = (index: number) => {
    setLoadedImages(prev => new Set(prev).add(index));
  };

  if (helpers.imagenes.length === 0) {
    return (
      <Alert 
        severity="info" 
        variant="outlined"
        // El theme define borderRadius: 12px para Alerts, aquí forzamos consistencia si es necesario
        sx={{ width: '100%' }}
      >
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
      {helpers.imagenes.map((imgUrl, idx) => (
        <Fade in={true} timeout={300 + (idx * 100)} key={idx}>
          <Card 
            variant="outlined"
            onClick={() => onImageClick(imgUrl)}
            sx={{
              // 1.5 * 8px (spacing) = 12px -> Coincide con tu theme.ts
              borderRadius: 1.5, 
              overflow: 'hidden',
              cursor: 'pointer',
              // Usa el color de borde del theme (generalmente secondary.main o divider)
              borderColor: 'divider', 
              position: 'relative',
              aspectRatio: '16/10',
              // Las transiciones ya están en el theme, pero aquí definimos propiedades específicas
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              
              '&:hover': { 
                transform: 'translateY(-6px)',
                // Sombra suave usando el color primario del theme
                boxShadow: `0 12px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
                borderColor: 'primary.main',
                '& img': { transform: 'scale(1.08)' },
                '& .overlay': { opacity: 1 }
              }
            }}
          >
            {/* Skeleton mientras carga */}
            {!loadedImages.has(idx) && (
              <Skeleton 
                variant="rectangular"
                width="100%"
                height="100%"
                animation="wave"
                sx={{ position: 'absolute', top: 0, left: 0 }}
              />
            )}

            <CardMedia
              component="img"
              image={imgUrl}
              alt={`Galería ${idx + 1}`}
              onLoad={() => handleImageLoad(idx)}
              onError={(e) => { 
                (e.target as HTMLImageElement).src = '/assets/placeholder-project.jpg';
                handleImageLoad(idx);
              }}
              sx={{ 
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: loadedImages.has(idx) ? 1 : 0
              }}
            />

            {/* Overlay hover */}
            <Box 
              className="overlay"
              sx={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                // Gradiente sutil
                background: `linear-gradient(180deg, transparent 50%, ${alpha(theme.palette.common.black, 0.6)} 100%)`,
                opacity: 0,
                transition: 'opacity 0.3s ease',
                pointerEvents: 'none'
              }}
            />
          </Card>
        </Fade>
      ))}
    </Box>
  );
};