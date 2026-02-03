// src/components/common/ImageCard/ImageCard.tsx

import { Card, CardContent, CardMedia, Typography, useTheme } from "@mui/material";
import React from "react";

interface ImageCardProps {
  title: string;
  description: string;
  image: string;
  imageHeight?: number | string;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  title,
  description,
  image,
  imageHeight = 220, // Un poco más alto para mejor impacto visual
}) => {
  const theme = useTheme();

  return (
    <Card
      elevation={0} // Estilo Flat
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 4, // Bordes redondeados consistentes
        border: "1px solid",
        borderColor: "divider",
        overflow: "hidden",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        backgroundColor: "background.paper",
        "&:hover": {
          transform: "translateY(-5px)",
          boxShadow: theme.shadows[4],
          borderColor: "primary.main",
        },
      }}
    >
      {/* Componente nativo para imágenes */}
      <CardMedia
        component="img"
        height={imageHeight}
        image={image}
        alt={title} // ✅ Importante para accesibilidad
        sx={{
          objectFit: "cover",
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      />

      <CardContent
        sx={{
          flexGrow: 1,
          textAlign: "center",
          p: 3 // Más espacio interno
        }}
      >
        <Typography
          variant="h5"
          color="text.primary" // Mejor contraste que primary.main para lectura prolongada
          fontWeight={800}
          gutterBottom
        >
          {title}
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ lineHeight: 1.7 }}
        >
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
};