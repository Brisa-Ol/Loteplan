import React, { useEffect, useState } from 'react';
import { Skeleton, Box } from '@mui/material';

interface OptimizedImageProps {
  src: string;
  alt: string;
  height?: number;
  width?: string;
  style?: React.CSSProperties;
  priority?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  height = 200,
  width = '100%',
  style,
  priority = false
}) => {
  const [isLoading, setIsLoading] = useState(!priority);
  const [imageSrc, setImageSrc] = useState<string | undefined>(priority ? src : undefined);

  useEffect(() => {
    if (!priority) {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setImageSrc(src);
        setIsLoading(false);
      };
    }
  }, [src, priority]);

  const imageStyle: React.CSSProperties = {
    width,
    height,
    objectFit: 'cover',
    borderRadius: 8,
    opacity: isLoading ? 0 : 1,
    transition: 'opacity 0.3s ease-in-out',
    ...style
  };

  return (
    <Box position="relative" width={width} height={height}>
      {isLoading && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height={height}
          sx={{ 
            position: 'absolute',
            borderRadius: 2,
            zIndex: 1
          }}
        />
      )}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          style={imageStyle}
          loading={priority ? 'eager' : 'lazy'}
          aria-hidden={isLoading}
        />
      )}
    </Box>
  );
};