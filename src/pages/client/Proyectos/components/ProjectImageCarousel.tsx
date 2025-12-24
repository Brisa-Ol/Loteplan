import React, { useState, useEffect } from 'react';
import { Box, IconButton, MobileStepper, useTheme, alpha } from '@mui/material';
import { KeyboardArrowLeft, KeyboardArrowRight, Image as ImageIcon } from '@mui/icons-material';

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
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const maxSteps = images?.length || 0;

  // Pre-carga inteligente
  useEffect(() => {
    if (maxSteps > 1) {
      const nextStep = activeStep + 1 < maxSteps ? activeStep + 1 : 0;
      const img = new Image();
      img.src = images[nextStep];
    }
  }, [activeStep, images, maxSteps]);

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  // Case 0: No images (Placeholder)
  if (!images || images.length === 0) {
    return (
      <Box
        sx={{
          width: "100%",
          height: height,
          borderRadius: 3,
          mb: 3,
          bgcolor: 'action.hover',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          color: 'text.disabled',
          border: `1px solid ${theme.palette.divider}`
        }}
      >
        <ImageIcon sx={{ fontSize: 60, opacity: 0.5, mb: 1 }} />
        <Box component="span" fontWeight={500}>Sin imagen disponible</Box>
      </Box>
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
          borderRadius: 3,
          mb: 3,
          boxShadow: theme.shadows[2],
          bgcolor: 'grey.100'
        }}
      />
    );
  }

  // Case 2: Multiple images (Carousel)
  return (
    <Box 
        sx={{ 
            position: 'relative', 
            mb: 3, 
            overflow: 'hidden', 
            borderRadius: 3,
            boxShadow: theme.shadows[4],
            bgcolor: 'black' // Fondo negro para evitar flashes blancos
        }}
    >
      
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
          transition: 'opacity 0.3s ease-in-out',
        }}
      />

      {/* Controles de Navegación */}
      <IconButton
        onClick={handleBack}
        disabled={activeStep === 0}
        size="small"
        sx={{
          position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
          bgcolor: alpha(theme.palette.background.paper, 0.8),
          color: theme.palette.text.primary,
          boxShadow: theme.shadows[2],
          '&:hover': { bgcolor: 'background.paper', color: 'primary.main' },
          '&.Mui-disabled': { opacity: 0, pointerEvents: 'none' }, // Ocultar si disabled
          transition: 'all 0.2s'
        }}
      >
        <KeyboardArrowLeft fontSize="medium" />
      </IconButton>

      <IconButton
        onClick={handleNext}
        disabled={activeStep === maxSteps - 1}
        size="small"
        sx={{
          position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
          bgcolor: alpha(theme.palette.background.paper, 0.8),
          color: theme.palette.text.primary,
          boxShadow: theme.shadows[2],
          '&:hover': { bgcolor: 'background.paper', color: 'primary.main' },
          '&.Mui-disabled': { opacity: 0, pointerEvents: 'none' },
          transition: 'all 0.2s'
        }}
      >
        <KeyboardArrowRight fontSize="medium" />
      </IconButton>

      {/* Indicadores (Dots) */}
      <Box
        sx={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          display: 'flex', justifyContent: 'center', pb: 1.5, pt: 4,
          background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
        }}
      >
        <MobileStepper
          steps={maxSteps}
          position="static"
          activeStep={activeStep}
          sx={{
            bgcolor: 'transparent',
            '& .MuiMobileStepper-dot': { 
                bgcolor: 'rgba(255, 255, 255, 0.4)',
                width: 8, height: 8, mx: 0.5 
            },
            '& .MuiMobileStepper-dotActive': { 
                bgcolor: 'white',
                transform: 'scale(1.2)' 
            },
          }}
          nextButton={null}
          backButton={null}
        />
      </Box>

      {/* Contador numérico */}
      <Box
        sx={{
          position: 'absolute', top: 16, right: 16,
          bgcolor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          color: 'white',
          px: 1.5, py: 0.5,
          borderRadius: 10,
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: 0.5
        }}
      >
        {activeStep + 1} / {maxSteps}
      </Box>
    </Box>
  );
};