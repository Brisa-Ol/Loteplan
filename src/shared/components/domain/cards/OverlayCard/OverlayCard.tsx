// Card con imagen de fondo y texto superpuesto
// ═══════════════════════════════════════════════════════════
import React from "react";
import { Card, Box, Typography } from "@mui/material";

interface OverlayCardProps {
  title: string;
  description: string;
  image: string;
  height?: number;
}

export const OverlayCard: React.FC<OverlayCardProps> = ({
  title,
  description,
  image,
  height = 300,
}) => {
  return (
    <Card
      sx={{
        flex: 1,
        position: "relative",
        height,
        backgroundImage: `url(${image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        textAlign: "center",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          borderRadius: 3,
        },
      }}
    >
      <Box sx={{ position: "relative", zIndex: 1, px: 3 }}>
        <Typography
          variant="h4"
          fontWeight={700}
          gutterBottom
          sx={{ textShadow: "1px 1px 2px rgba(0,0,0,0.5)" }}
        >
          {title}
        </Typography>
        <Typography
          variant="body1"
          sx={{ textShadow: "1px 1px 2px rgba(0,0,0,0.5)" }}
        >
          {description}
        </Typography>
      </Box>
    </Card>
  );
};