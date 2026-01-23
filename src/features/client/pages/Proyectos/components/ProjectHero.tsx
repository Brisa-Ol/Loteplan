import React, { useState, useEffect } from 'react';
import { 
  Box, Chip, Typography, Stack, IconButton, useTheme, 
  alpha, Tooltip, Fade, Container
} from '@mui/material';
import { 
  KeyboardArrowLeft, KeyboardArrowRight, Share, 
  FavoriteBorder, Favorite 
} from '@mui/icons-material';
import type { ProyectoDto } from '@/core/types/dto/proyecto.dto';
import { useProyectoHelpers } from '@/features/client/hooks/useProyectoHelpers';

interface ProjectHeroProps {
  proyecto: ProyectoDto;
}

export const ProjectHero: React.FC<ProjectHeroProps> = ({ proyecto }) => {
  const theme = useTheme();
  const helpers = useProyectoHelpers(proyecto);
  
  // Estados locales
  const [activeStep, setActiveStep] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);

  const maxSteps = helpers.imagenes.length;
  const BadgeIcon = helpers.badge.icon;

  // ==========================================
  // 🔄 PRELOAD DE IMÁGENES
  // ==========================================
  useEffect(() => {
    if (maxSteps > 1) {
      const nextStep = (activeStep + 1) % maxSteps;
      const img = new Image();
      img.src = helpers.imagenes[nextStep];
    }
  }, [activeStep, helpers.imagenes, maxSteps]);

  // ==========================================
  // 🎯 HANDLERS
  // ==========================================
  const handleNext = () => { 
    setImageLoaded(false); 
    setActiveStep((prev) => (prev + 1) % maxSteps); 
  };

  const handleBack = () => { 
    setImageLoaded(false); 
    setActiveStep((prev) => (prev - 1 + maxSteps) % maxSteps); 
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: proyecto.nombre_proyecto,
          text: proyecto.descripcion,
          url: window.location.href
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setShowShareTooltip(true);
      setTimeout(() => setShowShareTooltip(false), 2000);
    }
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    // TODO: Lógica de backend para favoritos
  };

  return (
    <Box sx={{ 
      position: 'relative', 
      height: { xs: 400, md: 600 },
      // El borde redondeado solo en desktop para encajar con el layout
      borderRadius: { xs: 0, md: 4 }, 
      overflow: 'hidden', 
      mb: 4, 
      bgcolor: 'common.black',
      boxShadow: theme.shadows[10] // Sombra más fuerte del theme
    }}>
      
      {/* ==========================================
          🖼️ IMAGEN PRINCIPAL (CAROUSEL)
      ========================================== */}
      <Fade in={imageLoaded} timeout={600}>
        <Box
          component="img"
          src={helpers.imagenes[activeStep]}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => { 
            (e.target as HTMLImageElement).src = '/assets/placeholder-project.jpg'; 
            setImageLoaded(true); 
          }}
          sx={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: imageLoaded ? 'scale(1)' : 'scale(1.05)'
          }}
        />
      </Fade>

      {/* ==========================================
          🎨 OVERLAYS (GRADIENTES)
      ========================================== */}
      {/* Gradiente Inferior: Para legibilidad de texto */}
      <Box sx={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%',
        background: `linear-gradient(to top, ${alpha(theme.palette.common.black, 0.9)} 0%, ${alpha(theme.palette.common.black, 0.4)} 50%, transparent 100%)`,
        pointerEvents: 'none'
      }} />
      
      {/* Gradiente Superior: Para legibilidad de botones */}
      <Box sx={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '25%',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)',
        pointerEvents: 'none'
      }} />

      {/* ==========================================
          🎯 ACCIONES (TOP RIGHT)
      ========================================== */}
      <Stack 
        direction="row" 
        spacing={1.5} 
        sx={{ position: 'absolute', top: 24, right: 24, zIndex: 10 }}
      >
        {[
          { 
            label: isFavorite ? "Quitar de favoritos" : "Guardar", 
            icon: isFavorite ? <Favorite color="error" /> : <FavoriteBorder />, 
            action: handleFavorite 
          },
          { 
            label: showShareTooltip ? "¡Link copiado!" : "Compartir", 
            icon: <Share />, 
            action: handleShare,
            open: showShareTooltip 
          }
        ].map((btn, idx) => (
          <Tooltip key={idx} title={btn.label} arrow open={btn.open}>
            <IconButton 
              onClick={btn.action}
              sx={{ 
                bgcolor: alpha(theme.palette.background.paper, 0.9),
                backdropFilter: 'blur(8px)',
                transition: theme.transitions.create(['transform', 'background-color']),
                '&:hover': { 
                  bgcolor: theme.palette.background.paper,
                  transform: 'scale(1.1)'
                }
              }}
            >
              {btn.icon}
            </IconButton>
          </Tooltip>
        ))}
      </Stack>

      {/* ==========================================
          ⬅️➡️ NAVEGACIÓN
      ========================================== */}
      {maxSteps > 1 && (
        <>
          <IconButton 
            onClick={handleBack}
            sx={{ 
              position: 'absolute', left: { xs: 8, md: 24 }, top: '50%', transform: 'translateY(-50%)',
              color: 'common.white', 
              bgcolor: alpha(theme.palette.common.black, 0.3),
              '&:hover': { bgcolor: alpha(theme.palette.common.black, 0.6) }
            }}
          >
            <KeyboardArrowLeft fontSize="large" />
          </IconButton>
          
          <IconButton 
            onClick={handleNext}
            sx={{ 
              position: 'absolute', right: { xs: 8, md: 24 }, top: '50%', transform: 'translateY(-50%)',
              color: 'common.white', 
              bgcolor: alpha(theme.palette.common.black, 0.3),
              '&:hover': { bgcolor: alpha(theme.palette.common.black, 0.6) }
            }}
          >
            <KeyboardArrowRight fontSize="large" />
          </IconButton>
          
          {/* Indicadores (Dots) */}
          <Stack
            direction="row"
            spacing={1}
            sx={{
              position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
              bgcolor: alpha(theme.palette.common.black, 0.4),
              backdropFilter: 'blur(4px)',
              px: 2, py: 1, borderRadius: 4, zIndex: 2
            }}
          >
            {helpers.imagenes.map((_, idx) => (
              <Box
                key={idx}
                onClick={() => { setImageLoaded(false); setActiveStep(idx); }}
                sx={{
                  width: idx === activeStep ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  bgcolor: idx === activeStep ? 'common.white' : alpha(theme.palette.common.white, 0.5),
                  cursor: 'pointer',
                  transition: theme.transitions.create(['width', 'background-color'])
                }}
              />
            ))}
          </Stack>
        </>
      )}

      {/* ==========================================
          📝 TEXTO E INFO
      ========================================== */}
      <Box sx={{ 
        position: 'absolute', 
        bottom: { xs: 40, md: 56 }, // Ajustado para no chocar con dots
        left: { xs: 24, md: 48 }, 
        right: { xs: 24, md: 120 }, 
        zIndex: 5,
        color: 'common.white'
      }}>
        {/* Badges */}
        <Stack direction="row" spacing={1} mb={2} flexWrap="wrap" gap={1}>
          <Chip 
            icon={<BadgeIcon sx={{ color: 'white !important', fontSize: '18px !important' }} />}
            label={helpers.badge.label} 
            color="primary"
            // El theme ya define borderRadius y fontWeight
          />
          
          <Chip 
            label={helpers.estadoConfig.label}
            color={helpers.estadoConfig.color as any}
            sx={{ 
               // Override para efecto cristal
               bgcolor: alpha(theme.palette.common.white, 0.2),
               backdropFilter: 'blur(10px)',
               color: 'white',
               border: `1px solid ${alpha(theme.palette.common.white, 0.3)}`
            }} 
          />

          {helpers.esPack && (
            <Chip label="PACK EXCLUSIVO" color="warning" />
          )}
        </Stack>
        
        {/* Título */}
        <Typography 
          variant="h1" 
          sx={{ 
            // Override local para tamaño "Hero" específico
            fontSize: { xs: '2rem', md: '3.5rem' }, 
            lineHeight: 1.1,
            mb: 1,
            textShadow: '0 4px 20px rgba(0,0,0,0.5)'
          }}
        >
          {proyecto.nombre_proyecto}
        </Typography>
        
        {/* Descripción (visible en MD+) */}
        {proyecto.descripcion && (
          <Typography 
            variant="subtitle1"
            sx={{ 
              color: alpha(theme.palette.common.white, 0.9),
              maxWidth: 800,
              display: { xs: 'none', md: 'block' },
              textShadow: '0 2px 10px rgba(0,0,0,0.5)'
            }}
          >
            {proyecto.descripcion.length > 180 
              ? `${proyecto.descripcion.substring(0, 180)}...` 
              : proyecto.descripcion
            }
          </Typography>
        )}
      </Box>
    </Box>
  );
};