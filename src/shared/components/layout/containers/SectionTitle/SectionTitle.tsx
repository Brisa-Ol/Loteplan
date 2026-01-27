// src/components/common/SectionTitle/SectionTitle.tsx

import React from "react";
import { Typography, type TypographyVariant, type TypographyProps, keyframes, Box } from "@mui/material";

// 1. Animación suave para la línea
const expandLine = keyframes`
  from { width: 0; opacity: 0; }
  to { width: 100%; opacity: 1; }
`;

// 2. Animación suave para el subtítulo (Fade In)
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
`;

interface SectionTitleProps extends Omit<TypographyProps, 'align' | 'variant'> {
  children: React.ReactNode;
  /** Texto descriptivo debajo del título principal */
  subtitle?: string; 
  
  align?: "left" | "center" | "right";
  variant?: TypographyVariant; 
  
  /** Ancho de la línea decorativa (px o %). Default: 80px */
  lineWidth?: number | string;
  /** Color de la línea. Default: 'secondary.main' */
  lineColor?: string;
  /** Si es true, usa un gradiente con el color primario del tema */
  useGradient?: boolean;
  
  component?: React.ElementType;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ 
  children, 
  subtitle, // ✨ Nuevo Prop
  align = "center",
  variant = "h2",
  component,
  lineWidth = 80,
  lineColor = "secondary.main",
  useGradient = false,
  sx,
  ...rest
}) => {
  
  // Mapeo seguro de variantes
  const mapVariantToTag = (v: string): React.ElementType => {
    const validTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'div'];
    return validTags.includes(v) ? (v as React.ElementType) : 'h2';
  };

  const semanticTag = component || mapVariantToTag(variant);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
        mb: { xs: 3, sm: 4, md: 1 },
        textAlign: align, // Asegura que el texto del subtítulo también se alinee
        ...sx // Permitimos que sx sobreescriba el margen del contenedor
      }}
    >
      {/* 1. TÍTULO PRINCIPAL */}
      <Typography
        variant={variant}
        component={semanticTag} 
        align={align}
        sx={{
          fontWeight: 700,
          color: "primary.main",
          position: "relative",
          pb: 1.5,
          mb: subtitle ? 0.5 : 0, // Si hay subtítulo, damos un poco de espacio extra abajo
        }}
        {...rest}
      >
        {children}
        
        {/* Línea Decorativa */}
        <Box
            component="span"
            sx={{
                position: "absolute",
                bottom: 0,
                left: align === "center" ? "50%" : align === "right" ? "100%" : 0,
                transform: align === "center" ? "translateX(-50%)" : align === "right" ? "translateX(-100%)" : "none",
                height: 4,
                width: lineWidth,
                maxWidth: '100%',
                borderRadius: 2,
                background: useGradient 
                    ? `linear-gradient(90deg, ${lineColor} 0%, #CC6333 100%)`
                    : (theme) => {
                        const colorParts = lineColor.split('.');
                        if (colorParts.length === 2) {
                            const palette = theme.palette as any;
                            return palette[colorParts[0]]?.[colorParts[1]] || lineColor;
                        }
                        return lineColor;
                    },
                animation: `${expandLine} 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards`,
            }}
        />
      </Typography>

      {/* 2. SUBTÍTULO (Renderizado condicionalmente) */}
      {subtitle && (
        <Typography
          variant="h5" // O 'subtitle1' si prefieres algo más pequeño
          color="text.secondary"
          sx={{
            maxWidth: 'md', // Evita que se estire demasiado en pantallas anchas
            lineHeight: 1.6,
            fontWeight: 400,
            opacity: 0, // Empieza invisible para la animación
            animation: `${fadeIn} 0.5s ease-out 0.3s forwards`, // Aparece 0.3s después del título
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );
};