import React, { useState } from 'react';
import { Skeleton, Box } from '@mui/material';
import { BrokenImage as BrokenIcon } from '@mui/icons-material';

interface OptimizedImageProps {
  src: string;
  alt: string;
  height?: number | string; // Permitimos strings como '100%'
  width?: number | string;
  style?: React.CSSProperties;
  priority?: boolean; // true = eager (carga inmediata), false = lazy
  borderRadius?: number | string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  height = 200,
  width = '100%',
  style,
  priority = false,
  borderRadius = 3 // Usamos el radio de borde estándar de tu tema
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <Box 
      position="relative" 
      width={width} 
      height={height} 
      sx={{ 
        overflow: 'hidden', 
        borderRadius: borderRadius,
        bgcolor: 'action.hover' // Fondo sutil por si la imagen es transparente
      }}
    >
      {/* 1. SKELETON: Se muestra mientras NO esté cargada y NO haya error */}
      {(!isLoaded && !hasError) && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          animation="wave"
          sx={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
        />
      )}

      {/* 2. ESTADO DE ERROR: Si falla la carga */}
      {hasError && (
        <Box 
          sx={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            bgcolor: 'action.selected',
            color: 'text.disabled'
          }}
        >
          <BrokenIcon />
        </Box>
      )}

      {/* 3. IMAGEN REAL */}
      {!hasError && (
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            setHasError(true);
            setIsLoaded(false);
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isLoaded ? 1 : 0, // Transición de opacidad
            transition: 'opacity 0.4s ease-in-out',
            ...style
          }}
        />
      )}
    </Box>
  );
};