// src/components/common/StepsContainer/StepsContainer.tsx

import React from "react";
import { Box, useTheme } from "@mui/material";

interface StepsContainerProps {
  children: React.ReactNode;
}

export const StepsContainer: React.FC<StepsContainerProps> = ({ children }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        // Lógica Responsive: Columna en móvil, Fila en escritorio
        flexDirection: { xs: "column", md: "row" },
        justifyContent: "center",
        // 'stretch' asegura que todas las cards tengan la misma altura
        alignItems: "stretch", 
        position: "relative",
        mb: 4,
        gap: { xs: 4, md: 0 } // Espacio extra en móvil entre pasos si el margen de la card no es suficiente
      }}
    >
      {/* Línea horizontal conectora (Solo Desktop) */}
      <Box
        sx={{
          position: "absolute",
          // El círculo mide 56px, el centro es 28px
          top: 28, 
          // Márgenes laterales para que la línea no toque los bordes de la pantalla
          left: { md: 40, lg: 80 }, 
          right: { md: 40, lg: 80 },
          height: 2,
          // Usamos un color gris suave o secundario
          backgroundColor: theme.palette.divider, 
          zIndex: 0, // Debe estar detrás de las cards (que tienen zIndex 1 o 2)
          display: { xs: "none", md: "block" },
        }}
      />
      
      {children}
    </Box>
  );
};