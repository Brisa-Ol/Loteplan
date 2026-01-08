import React from "react";
import { Box, Typography } from "@mui/material";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action }) => {
  return (
    <Box 
      mb={{ xs: 6, md: 8 }} 
      sx={{ position: 'relative' }} // Necesario para posicionar el botón absolutamente
    >
      
      {/* 1. Contenedor del Título (Siempre Centrado) */}
      <Box textAlign="center" mx="auto" px={2}>
        <Typography
          variant="h2"
          component="h1"
          sx={{
            color: "primary.main",
            mb: 1,
            fontWeight: 700,
            textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          {title}
        </Typography>
        
        {subtitle && (
          <Typography
            variant="h5"
            color="text.secondary"
            maxWidth="md"
            mx="auto"
            sx={{ lineHeight: 1.6 }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      {/* 2. Botón de Acción (Flotante a la derecha en PC, debajo en Móvil) */}
      {action && (
        <Box 
          sx={{ 
            // En Móvil: Bloque normal debajo del texto, centrado
            mt: { xs: 3, md: 0 },
            display: 'flex',
            justifyContent: 'center',
            
            // En Escritorio (md): Posición absoluta a la derecha verticalmente centrado
            position: { xs: 'static', md: 'absolute' },
            right: { md: 0 },
            top: { md: '50%' },
            transform: { md: 'translateY(-50%)' }, // Centra verticalmente respecto al bloque
            zIndex: 1
          }}
        >
          {action}
        </Box>
      )}
    </Box>
  );
};