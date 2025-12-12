// Card simple con imagen arriba
// ═══════════════════════════════════════════════════════════
import React from "react";
import { Card, CardContent, Box, Typography } from "@mui/material";

interface ImageCardProps {
  title: string;
  description: string;
  image: string;
  imageHeight?: number;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  title,
  description,
  image,
  imageHeight = 200,
}) => {
  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          height: imageHeight,
          backgroundImage: `url(${image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <CardContent sx={{ flexGrow: 1, textAlign: "center" }}>
        <Typography variant="h5" color="primary.main" fontWeight={600} gutterBottom>
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
};