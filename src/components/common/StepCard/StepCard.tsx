// src/components/common/StepCard/StepCard.tsx

import React from "react";
import { Card, CardContent, Box, Typography, useTheme } from "@mui/material";

interface StepCardProps {
  stepNumber: number;
  title: string;
  description: string;
  image: string;
  imageHeight?: number | string;
}

export const StepCard: React.FC<StepCardProps> = ({
  stepNumber,
  title,
  description,
  image,
  imageHeight = 200,
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        // Lógica Responsive:
        // - En móvil (xs): Sin margen lateral, margen abajo para apilar.
        // - En escritorio (md): Margen lateral para separar columnas, sin margen abajo.
        mx: { xs: 0, md: 2 },
        mb: { xs: 6, md: 0 },
        zIndex: 1,
        flex: 1, // Ocupa el espacio disponible del padre
        width: "100%",
      }}
    >
      {/* Círculo con número de paso */}
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          backgroundColor: "primary.main",
          color: "primary.contrastText", // Asegura legibilidad (blanco o negro según el tema)
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          fontSize: "1.5rem",
          margin: "0 auto 16px", // Centrado y con margen inferior
          boxShadow: theme.shadows[4],
          position: "relative",
          zIndex: 2,
        }}
      >
        {stepNumber}
      </Box>

      {/* Card */}
      <Card
        elevation={0} // Estilo moderno: sin sombra base, con borde
        sx={{
          width: "100%",
          height: "100%", // Asegura que todas las cards en una fila tengan la misma altura
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            transform: "translateY(-5px)",
            boxShadow: theme.shadows[6],
            borderColor: "primary.main",
          },
        }}
      >
        {/* Imagen de fondo */}
        <Box
          role="img"
          aria-label={title}
          sx={{
            height: imageHeight,
            width: "100%",
            backgroundImage: `url('${image}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        />
        
        <CardContent
          sx={{
            flexGrow: 1,
            textAlign: "center",
            p: 3,
          }}
        >
          <Typography
            variant="h5"
            component="h3"
            sx={{ fontWeight: 700, mb: 2, color: "primary.main" }}
          >
            {title}
          </Typography>
          
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ lineHeight: 1.6 }}
          >
            {description}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};