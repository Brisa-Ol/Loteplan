// src/components/Proyectos/ProjectImageCarousel.tsx
import React, { useState } from 'react';
import { Box, IconButton, MobileStepper } from '@mui/material';
import {
  KeyboardArrowLeft,
  KeyboardArrowRight,
} from '@mui/icons-material';

interface ProjectImageCarouselProps {
  images: string[]; // Array de URLs de imágenes
  projectName: string; // Para el alt text
  height?: { xs: number; md: number }; // Altura responsive
}

export const ProjectImageCarousel: React.FC<ProjectImageCarouselProps> = ({
  images,
  projectName,
  height = { xs: 250, md: 400 },
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const maxSteps = images.length;

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Si no hay imágenes, mostrar placeholder
  if (!images || images.length === 0) {
    return (
      <Box
        component="img"
        src="/images/placeholder.jpg"
        alt="Sin imagen"
        sx={{
          width: "100%",
          height: height,
          objectFit: "cover",
          borderRadius: 2,
          mb: 3,
        }}
      />
    );
  }

  // Si solo hay una imagen, mostrarla sin controles
  if (images.length === 1) {
    return (
      <Box
        component="img"
        src={images[0]}
        alt={projectName}
        sx={{
          width: "100%",
          height: height,
          objectFit: "cover",
          borderRadius: 2,
          mb: 3,
        }}
      />
    );
  }

  // Carrusel completo para múltiples imágenes
  return (
    <Box sx={{ position: 'relative', mb: 3 }}>
      {/* Imagen principal */}
      <Box
        component="img"
        src={images[activeStep]}
        alt={`${projectName} - Imagen ${activeStep + 1}`}
        sx={{
          width: "100%",
          height: height,
          objectFit: "cover",
          borderRadius: 2,
          display: 'block',
        }}
      />

      {/* Botones de navegación */}
      <IconButton
        onClick={handleBack}
        disabled={activeStep === 0}
        sx={{
          position: 'absolute',
          left: 8,
          top: '50%',
          transform: 'translateY(-50%)',
          bgcolor: 'rgba(255, 255, 255, 0.8)',
          '&:hover': {
            bgcolor: 'rgba(255, 255, 255, 0.95)',
          },
          '&.Mui-disabled': {
            bgcolor: 'rgba(255, 255, 255, 0.4)',
          },
        }}
      >
        <KeyboardArrowLeft />
      </IconButton>

      <IconButton
        onClick={handleNext}
        disabled={activeStep === maxSteps - 1}
        sx={{
          position: 'absolute',
          right: 8,
          top: '50%',
          transform: 'translateY(-50%)',
          bgcolor: 'rgba(255, 255, 255, 0.8)',
          '&:hover': {
            bgcolor: 'rgba(255, 255, 255, 0.95)',
          },
          '&.Mui-disabled': {
            bgcolor: 'rgba(255, 255, 255, 0.4)',
          },
        }}
      >
        <KeyboardArrowRight />
      </IconButton>

      {/* Indicadores de posición (dots) */}
      <MobileStepper
        steps={maxSteps}
        position="static"
        activeStep={activeStep}
        sx={{
          position: 'absolute',
          bottom: 8,
          left: '50%',
          transform: 'translateX(-50%)',
          bgcolor: 'rgba(0, 0, 0, 0.5)',
          borderRadius: 2,
          maxWidth: '200px',
          '& .MuiMobileStepper-dot': {
            bgcolor: 'rgba(255, 255, 255, 0.5)',
          },
          '& .MuiMobileStepper-dotActive': {
            bgcolor: 'white',
          },
        }}
        nextButton={<Box sx={{ display: 'none' }} />}
        backButton={<Box sx={{ display: 'none' }} />}
      />

      {/* Contador de imágenes */}
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          bgcolor: 'rgba(0, 0, 0, 0.6)',
          color: 'white',
          px: 1.5,
          py: 0.5,
          borderRadius: 1,
          fontSize: '0.875rem',
          fontWeight: 500,
        }}
      >
        {activeStep + 1} / {maxSteps}
      </Box>
    </Box>
  );
};