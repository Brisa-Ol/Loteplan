// src/components/common/SectionTitle/SectionTitle.tsx

import React from "react";
import { Typography, type TypographyVariant } from "@mui/material";

interface SectionTitleProps {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
  variant?: TypographyVariant; // Permite cambiar el tamaño (h2, h3, h4)
  lineWidth?: number | string; // Permite personalizar el ancho de la línea
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ 
  children, 
  align = "center",
  variant = "h2", // Por defecto sigue siendo h2
  lineWidth = 80
}) => {
  return (
    <Typography
      variant={variant}
      component="h2" // Semánticamente siempre un h2 (bueno para SEO), aunque visualmente cambie
      align={align}
      mb={{ xs: 4, md: 6 }}
      sx={{
        fontWeight: 700,
        color: "primary.main",
        position: "relative",
        
        // Pseudo-elemento (la línea)
        "&::after": {
          content: '""',
          position: "absolute",
          bottom: -8,
          
          // Lógica de alineación
          left: align === "center" ? "50%" : align === "right" ? "100%" : 0,
          transform: align === "center" ? "translateX(-50%)" : align === "right" ? "translateX(-100%)" : "none",
          
          width: lineWidth,
          height: 3,
          backgroundColor: "secondary.main",
          borderRadius: 1 // Suaviza los bordes de la línea
        },
      }}
    >
      {children}
    </Typography>
  );
};