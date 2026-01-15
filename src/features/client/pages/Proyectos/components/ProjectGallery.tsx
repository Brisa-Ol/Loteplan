import React from 'react';
import { Box, Card, CardMedia, Alert, useTheme } from '@mui/material';
import ImagenService from '@/core/api/services/imagen.service';

interface ProjectGalleryProps {
  imagenes?: { id: number; url: string }[];
  onImageClick: (url: string) => void;
}

export const ProjectGallery: React.FC<ProjectGalleryProps> = ({ imagenes, onImageClick }) => {
  const theme = useTheme();

  if (!imagenes || imagenes.length === 0) {
    return <Alert severity="info" variant="outlined">No hay imágenes disponibles en la galería.</Alert>;
  }

  return (
    <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }} gap={2}>
      {imagenes.map((img) => {
        const imgUrl = ImagenService.resolveImageUrl(img.url);
        return (
          <Card 
            key={img.id} variant="outlined" onClick={() => onImageClick(imgUrl)}
            sx={{
              borderRadius: 3, overflow: 'hidden', cursor: 'pointer', borderColor: theme.palette.divider,
              transition: 'all 0.3s ease',
              '&:hover': { 
                transform: 'translateY(-4px)', boxShadow: theme.shadows[8], borderColor: 'primary.main',
                '& img': { transform: 'scale(1.05)' }
              }
            }}
          >
            <CardMedia
              component="img" image={imgUrl} alt="Galería"
              sx={{ height: 200, objectFit: 'cover', width: '100%', transition: 'transform 0.5s ease' }}
              onError={(e) => { (e.target as HTMLImageElement).src = '/assets/placeholder-project.jpg'; }}
            />
          </Card>
        );
      })}
    </Box>
  );
};