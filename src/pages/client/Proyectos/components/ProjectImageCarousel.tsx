import React, { useState, useEffect } from 'react';
import { Box, IconButton, MobileStepper } from '@mui/material';
import {
  KeyboardArrowLeft,
  KeyboardArrowRight,
} from '@mui/icons-material';

interface ProjectImageCarouselProps {
  images: string[];
  projectName: string;
  height?: { xs: number; md: number };
}

export const ProjectImageCarousel: React.FC<ProjectImageCarouselProps> = ({
  images,
  projectName,
  height = { xs: 250, md: 400 },
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const maxSteps = images?.length || 0;

  // Pre-carga inteligente de imágenes
  useEffect(() => {
    if (maxSteps > 1) {
      // Pre-cargar la siguiente imagen
      const nextStep = activeStep + 1 < maxSteps ? activeStep + 1 : 0;
      const img = new Image();
      img.src = images[nextStep];
    }
  }, [activeStep, images, maxSteps]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Case 0: No images
  if (!images || images.length === 0) {
    return (
      <Box
        component="img"
        src="/assets/placeholder-project.jpg" // Asegúrate de tener este placeholder
        alt="Sin imagen"
        sx={{
          width: "100%",
          height: height,
          objectFit: "cover",
          borderRadius: 2,
          mb: 3,
          bgcolor: 'grey.100'
        }}
      />
    );
  }

  // Case 1: Single image
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

  // Case 2: Multiple images (Carousel)
  return (
    <Box sx={{ position: 'relative', mb: 3, overflow: 'hidden', borderRadius: 2 }}>
      
      {/* Imagen Principal */}
      <Box
        component="img"
        src={images[activeStep]}
        alt={`${projectName} - Imagen ${activeStep + 1}`}
        sx={{
          width: "100%",
          height: height,
          objectFit: "cover",
          display: 'block',
          transition: 'opacity 0.3s ease-in-out', // Suavizar cambio
        }}
      />

      {/* Controles de Navegación */}
      <IconButton
        onClick={handleBack}
        disabled={activeStep === 0}
        sx={{
          position: 'absolute',
          left: 8,
          top: '50%',
          transform: 'translateY(-50%)',
          bgcolor: 'rgba(255, 255, 255, 0.8)',
          '&:hover': { bgcolor: 'white' },
          '&.Mui-disabled': { opacity: 0.5, bgcolor: 'rgba(255, 255, 255, 0.3)' },
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
          '&:hover': { bgcolor: 'white' },
          '&.Mui-disabled': { opacity: 0.5, bgcolor: 'rgba(255, 255, 255, 0.3)' },
        }}
      >
        <KeyboardArrowRight />
      </IconButton>

      {/* Indicadores (Dots) */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          pb: 1,
          background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)', // Mejor legibilidad
        }}
      >
        <MobileStepper
          steps={maxSteps}
          position="static"
          activeStep={activeStep}
          sx={{
            bgcolor: 'transparent',
            '& .MuiMobileStepper-dot': { bgcolor: 'rgba(255, 255, 255, 0.5)' },
            '& .MuiMobileStepper-dotActive': { bgcolor: 'white' },
          }}
          nextButton={null}
          backButton={null}
        />
      </Box>

      {/* Contador numérico (Opcional, estilo YouTube) */}
      <Box
        sx={{
          position: 'absolute',
          top: 12,
          right: 12,
          bgcolor: 'rgba(0, 0, 0, 0.6)',
          color: 'white',
          px: 1.2,
          py: 0.4,
          borderRadius: 4,
          fontSize: '0.75rem',
          fontWeight: 600,
        }}
      >
        {activeStep + 1} / {maxSteps}
      </Box>
    </Box>
  );
};