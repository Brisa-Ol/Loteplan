// src/components/common/PageHeader/PageHeader.tsx
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
      mb={{ xs: 3, sm: 4, md: 6, lg: 8 }} 
      sx={{ position: 'relative' }} 
    >
      
      {/* Contenedor del Título (Siempre Centrado) */}
      <Box 
        textAlign="center" 
        mx="auto" 
        px={{ xs: 2, sm: 3, md: 4 }}
      >
        <Typography
          variant="h2"
          component="h1"
          sx={{
            color: "primary.main",
            mb: { xs: 1, sm: 1.5, md: 2 },
            fontWeight: 700,
            textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
            // El theme ya maneja la responsividad con responsiveFontSizes
            // pero podemos ajustar si necesitamos control específico
            wordBreak: "break-word", // Evita desbordamiento de palabras largas
            hyphens: "auto", // Añade guiones automáticos si es necesario
          }}
        >
          {title}
        </Typography>
        
        {subtitle && (
          <Typography
            variant="h5"
            color="text.secondary"
            maxWidth={{ xs: "100%", sm: "md", md: "lg" }}
            mx="auto"
            sx={{ 
              lineHeight: { xs: 1.5, md: 1.6 },
              px: { xs: 1, sm: 2 },
              wordBreak: "break-word",
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      {/* Botón de Acción (Flotante en Desktop, Centrado en Mobile) */}
      {action && (
        <Box 
          sx={{ 
            // Mobile y Tablet: Centrado debajo del contenido
            mt: { xs: 2, sm: 2.5, md: 0 },
            display: 'flex',
            justifyContent: { xs: 'center', md: 'flex-end' },
            px: { xs: 2, sm: 3, md: 0 },
            
            // Desktop: Posición absoluta a la derecha
            position: { xs: 'static', md: 'absolute' },
            right: { md: 0 },
            top: { md: '50%' },
            transform: { md: 'translateY(-50%)' }, 
            zIndex: 1,
            
            // Asegura que los botones dentro se adapten
            '& > *': {
              width: { xs: '100%', sm: 'auto' },
              maxWidth: { xs: '100%', sm: '300px', md: 'none' }
            }
          }}
        >
          {action}
        </Box>
      )}
    </Box>
  );
};