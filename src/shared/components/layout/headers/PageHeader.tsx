// src/components/common/PageHeader/PageHeader.tsx
import React from "react";
import { Box, Typography, Stack, useTheme } from "@mui/material";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action }) => {
  const theme = useTheme();

  return (
    <Box 
      component="header"
      sx={{ 
        mb: { xs: 4, md: 6, lg: 8 },
        // ✅ LAYOUT INTELIGENTE (Grid):
        // Mobile: 1 sola columna (todo apilado).
        // Desktop: 3 columnas [Espacio Vacío] [Contenido Central] [Botón Derecha].
        // La magia de '1fr auto 1fr' es que el centro siempre queda en el medio.
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1fr minmax(auto, 60%) 1fr" },
        gap: { xs: 3, md: 2 },
        alignItems: "start", // Alineación vertical superior para evitar saltos raros
      }}
    >
      
      {/* 1. ESPACIO IZQUIERDO (Solo visible en Desktop para equilibrar la grid) */}
      <Box sx={{ display: { xs: "none", md: "block" } }} aria-hidden="true" />

      {/* 2. CONTENIDO CENTRAL (Título y Subtítulo) */}
      <Box sx={{ textAlign: "center", width: "100%" }}>
        <Typography
          variant="h2"
          component="h1" // Semántica correcta para SEO
          sx={{
            color: "primary.main",
            fontWeight: 800, // Un poco más grueso para destacar
            mb: 2,
            // Eliminamos textShadow manual para un look más limpio/moderno,
            // pero si tu diseño lo exige, puedes descomentarlo.
            // textShadow: "0px 4px 12px rgba(0,0,0,0.05)",
            wordBreak: "break-word",
          }}
        >
          {title}
        </Typography>

        {subtitle && (
          <Typography
            variant="h5"
            color="text.secondary"
            sx={{ 
              maxWidth: "md",
              mx: "auto", // Centrado horizontal del bloque de texto
              lineHeight: 1.6,
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
            // Mobile: Centrado. Desktop: Justificado a la derecha.
            justifyContent: { xs: "center", md: "flex-end" },
            // Mobile: Botón ancho completo (opcional, mejora UX).
            "& > *": { width: { xs: "100%", sm: "auto" } } 
          }}
        >
          {action}
        </Box>
      )}
    </Box>
  );
};