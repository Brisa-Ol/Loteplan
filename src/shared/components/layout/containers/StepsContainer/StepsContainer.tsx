// src/components/common/StepsContainer/StepsContainer.tsx

import { Box, useTheme } from "@mui/material";
import React from "react";

interface StepsContainerProps {
  children: React.ReactNode;
  /**
   * Altura en píxeles donde se ubicará la línea conectora (desde arriba).
   * Debe coincidir con la mitad de la altura del ícono/avatar de los pasos.
   * Default: 28 (para un ícono de 56px)
   */
  lineOffsetTop?: number;
}

export const StepsContainer: React.FC<StepsContainerProps> = ({
  children,
  lineOffsetTop = 28
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        position: "relative",
        // ✅ RESPONSIVE: Columna en móvil, Fila en escritorio
        flexDirection: { xs: "column", md: "row" },
        // Distribución equitativa
        justifyContent: "space-between",
        // ✅ UX: 'stretch' hace que todas las cajas tengan la misma altura (bueno para bordes)
        alignItems: "stretch",

        // Espaciado vertical en móvil
        gap: { xs: 4, md: 2 },
        mb: { xs: 4, md: 6 },
        width: "100%",
      }}
    >
      {/* LÍNEA CONECTORA (Solo Desktop)
        Se renderiza como un elemento decorativo absoluto detrás de los hijos.
      */}
      <Box
        sx={{
          position: "absolute",
          top: lineOffsetTop, // ✅ Configurable via prop
          height: 2,
          backgroundColor: theme.palette.divider,

          // Ajuste de capas: Detrás del contenido
          zIndex: 0,

          // ✅ Lógica de márgenes laterales:
          // Dejamos un margen del 5-10% para asegurar que la línea 
          // nazca desde el centro del primer item y muera en el último,
          // no desde el borde de la pantalla.
          left: { md: '10%', lg: '8%' },
          right: { md: '10%', lg: '8%' },

          // Solo visible en desktop
          display: { xs: "none", md: "block" },
        }}
      />

      {/* Renderizamos los hijos con un zIndex superior para que tapen la línea 
        si tienen fondo sólido, creando el efecto de "conexión".
      */}
      {React.Children.map(children, (child) => (
        <Box sx={{ zIndex: 1, flex: 1, display: 'flex', justifyContent: 'center' }}>
          {child}
        </Box>
      ))}
    </Box>
  );
};