// src/features/client/pages/Proyectos/components/ProjectHero.tsx

import React, { useState, useEffect } from 'react';
import { Box, Chip, Typography, Stack, IconButton, useTheme, MobileStepper, alpha, Skeleton } from '@mui/material';
import { KeyboardArrowLeft, KeyboardArrowRight, Image as ImageIcon } from '@mui/icons-material';
import type { ProyectoDto } from '@/core/types/dto/proyecto.dto';
import ImagenService from '@/core/api/services/imagen.service';

interface ProjectHeroProps {
  proyecto: ProyectoDto;
}

export const ProjectHero: React.FC<ProjectHeroProps> = ({ proyecto }) => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  // 1. Preparamos las imágenes (o usamos placeholder si no hay)
  const images = proyecto.imagenes && proyecto.imagenes.length > 0
    ? proyecto.imagenes.map(img => ImagenService.resolveImageUrl(img.url))
    : ['/assets/placeholder-project.jpg'];

  const maxSteps = images.length;

  // 2. Pre-carga de la siguiente imagen para UX fluida
  useEffect(() => {
    if (maxSteps > 1) {
      const nextStep = activeStep + 1 < maxSteps ? activeStep + 1 : 0;
      const img = new Image();
      img.src = images[nextStep];
    }
  }, [activeStep, images, maxSteps]);

  const handleNext = () => {
    setImageLoaded(false);
    setActiveStep((prev) => (prev + 1) % maxSteps); // Ciclo infinito
  };

  const handleBack = () => {
    setImageLoaded(false);
    setActiveStep((prev) => (prev - 1 + maxSteps) % maxSteps); // Ciclo infinito
  };

  return (
    <Box sx={{ 
      position: 'relative', 
      height: { xs: 300, sm: 400, md: 500 }, 
      borderRadius: 4, 
      overflow: 'hidden', 
      mb: 4, 
      boxShadow: theme.shadows[6],
      bgcolor: 'black' // Fondo negro mientras carga
    }}>
      
      {/* --- IMAGEN (CARRUSEL) --- */}
      <Box
        component="img"
        src={images[activeStep]}
        onLoad={() => setImageLoaded(true)}
        onError={(e) => { 
            (e.target as HTMLImageElement).src = '/assets/placeholder-project.jpg'; 
            setImageLoaded(true);
        }}
        sx={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover',
          opacity: imageLoaded ? 1 : 0.5,
          transition: 'opacity 0.3s ease'
        }}
      />

      {/* --- CONTROLES DE NAVEGACIÓN (Solo si hay > 1 imagen) --- */}
      {maxSteps > 1 && (
        <>
          <IconButton
            onClick={handleBack}
            sx={{
              position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
              bgcolor: alpha('rgba(0,0,0,0.5)', 0.6), color: 'white',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
              zIndex: 2
            }}
          >
            <KeyboardArrowLeft />
          </IconButton>

          <IconButton
            onClick={handleNext}
            sx={{
              position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
              bgcolor: alpha('rgba(0,0,0,0.5)', 0.6), color: 'white',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
              zIndex: 2
            }}
          >
            <KeyboardArrowRight />
          </IconButton>

          {/* Dots Indicator */}
          <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 2 }}>
             <Chip 
                label={`${activeStep + 1} / ${maxSteps}`} 
                size="small" 
                sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: 'white', fontWeight: 700, backdropFilter: 'blur(4px)' }} 
             />
          </Box>
        </>
      )}

      {/* --- OVERLAY DE INFORMACIÓN (Glassmorphism) --- */}
      <Box sx={{ 
          position: 'absolute', bottom: 24, left: 24, right: 24, maxWidth: 900,
          background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(12px)',
          borderRadius: 3, p: { xs: 2.5, md: 4 }, 
          border: '1px solid rgba(255, 255, 255, 0.15)', color: 'white',
          zIndex: 3
      }}>
        <Stack direction="row" spacing={1} mb={2}>
          <Chip label={proyecto.tipo_inversion === 'mensual' ? 'Plan de Ahorro' : 'Inversión Directa'} color="primary" size="small" sx={{ fontWeight: 700 }} />
          <Chip label={proyecto.estado_proyecto} size="small" sx={{ fontWeight: 600, bgcolor: 'rgba(255,255,255,0.15)', color: 'white' }} />
        </Stack>
        
        <Typography variant="h3" fontWeight={800} sx={{ 
            textShadow: '0 2px 4px rgba(0,0,0,0.5)', 
            fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3rem' }, lineHeight: 1.1 
        }}>
          {proyecto.nombre_proyecto}
        </Typography>
      </Box>
    </Box>
  );
};