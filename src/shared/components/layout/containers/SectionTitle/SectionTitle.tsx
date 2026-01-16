// src/components/common/SectionTitle/SectionTitle.tsx

import React from "react";
import { Typography, type TypographyVariant, type TypographyProps } from "@mui/material";

interface SectionTitleProps extends Omit<TypographyProps, 'align' | 'variant'> {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
  variant?: TypographyVariant; 
  /**
   * Ancho de la línea decorativa. 
   * Puede ser número (px) o string (%, rem).
   * Default: 80
   */
  lineWidth?: number | string;
  /**
   * Color de la línea.
   * Default: 'secondary.main'
   */
  lineColor?: string;
  /**
   * Tag HTML semántico.
   * Si no se define, intentará usar el mismo que el 'variant' o caerá en 'h2'.
   */
  component?: React.ElementType;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ 
  children, 
  align = "center",
  variant = "h2",
  component,
  lineWidth = 80,
  lineColor = "secondary.main",
  sx,
  ...rest
}) => {
  
  // Lógica inteligente: Si no me pasas 'component', uso el 'variant' como tag.
  // Ejemplo: si variant="h3", el HTML será <h3>.
  const semanticTag = component || (variant as React.ElementType) || 'h2';

  return (
    <Typography
      variant={variant}
      component={semanticTag} 
      align={align}
      // ✅ RESPONSIVE: Margen vertical adaptable (menos en móvil)
      mb={{ xs: 3, sm: 4, md: 6 }}
      sx={{
        fontWeight: 700,
        color: "primary.main",
        position: "relative",
        
        // Pseudo-elemento (la línea)
        "&::after": {
          content: '""',
          position: "absolute",
          bottom: -8, // Distancia del texto
          
          // Lógica de alineación
          left: align === "center" ? "50%" : align === "right" ? "100%" : 0,
          transform: align === "center" ? "translateX(-50%)" : align === "right" ? "translateX(-100%)" : "none",
          
          // ✅ MEJORA: Max-width para evitar que la línea se salga en pantallas diminutas si pones un width muy grande
          width: lineWidth,
          maxWidth: '100%', 
          
          height: 3,
          backgroundColor: lineColor, // Ahora es personalizable
          borderRadius: 2, // Ligeramente más suave
        },
        ...sx
      }}
      {...rest}
    >
      {children}
    </Typography>
  );
};