// src/components/common/PageHeader/PageHeader.tsx

import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { SectionTitle } from "../containers/SectionTitle/SectionTitle";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  /**
   * Opcional: Permite controlar si el título usa gradiente
   * Default: true (para que los headers de página resalten)
   */
  useGradient?: boolean; 
}

export const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  subtitle, 
  action,
  useGradient = true // Por defecto activamos el modo "premium" en los headers
}) => {
  const theme = useTheme();

  return (
    <Box 
      component="header"
      sx={{ 
        mb: { xs: 4, md: 6, lg: 8 },
        display: "grid",
        // Grid de 3 columnas: [Espacio] [Centro] [Botón]
        gridTemplateColumns: { xs: "1fr", md: "1fr minmax(auto, 60%) 1fr" },
        gap: { xs: 3, md: 2 },
        alignItems: "start", 
      }}
    >
      
      {/* 1. ESPACIO IZQUIERDO (Equilibrio visual en desktop) */}
      <Box sx={{ display: { xs: "none", md: "block" } }} aria-hidden="true" />

      {/* 2. CONTENIDO CENTRAL */}
      <Box sx={{ textAlign: "center", width: "100%" }}>
        
        {/* ✨ AQUÍ LA MEJORA: Reemplazamos Typography por SectionTitle */}
        <SectionTitle
          variant="h2"
          component="h1" // Importante para SEO
          align="center"
          useGradient={useGradient}
          lineWidth={100} // Un poco más ancha para títulos de página
          sx={{ mb: 2 }}  // Margen inferior para separarlo del subtítulo
        >
          {title}
        </SectionTitle>

        {subtitle && (
          <Typography
            variant="h5"
            color="text.secondary"
            sx={{ 
              maxWidth: "md",
              mx: "auto",
              lineHeight: 1.6,
              // Animación de entrada suave para el subtítulo (opcional)
              animation: "fadeIn 0.5s ease-in",
              "@keyframes fadeIn": {
                 "0%": { opacity: 0, transform: "translateY(5px)" },
                 "100%": { opacity: 1, transform: "translateY(0)" }
              }
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      {/* 3. ACCIÓN (Botón) */}
      {action && (
        <Box 
          sx={{ 
            display: "flex",
            justifyContent: { xs: "center", md: "flex-end" },
            "& > *": { width: { xs: "100%", sm: "auto" } } 
          }}
        >
          {action}
        </Box>
      )}
    </Box>
  );
};