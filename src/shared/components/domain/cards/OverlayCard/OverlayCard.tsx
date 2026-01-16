// src/components/common/OverlayCard/OverlayCard.tsx
import React from "react";
import { Card, Box, Typography, alpha, useTheme } from "@mui/material";

interface OverlayCardProps {
  title: string;
  description: string;
  image: string;
  height?: number | string | Record<string, number>; // ✅ MEJORA: Acepta responsive
}

export const OverlayCard: React.FC<OverlayCardProps> = ({
  title,
  description,
  image,
  height = { xs: 250, sm: 300, md: 350 }, // ✅ MEJORA: Default responsive
}) => {
  const theme = useTheme(); // ✅ Acceso al tema

  return (
    <Card
      elevation={0} // ✅ Usa sistema de elevación
      sx={{
        flex: 1,
        position: "relative",
        height, // ✅ Ahora acepta valores responsive
        backgroundImage: `url(${image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "common.white", // ✅ MEJORA: Usa token del tema
        textAlign: "center",
        borderRadius: 3, // ✅ Usa spacing del tema
        border: "1px solid",
        borderColor: "divider", // ✅ Usa token del tema
        overflow: "hidden",
        transition: "transform 0.3s ease", // ✅ MEJORA: Transición suave
        "&:hover": {
          transform: "scale(1.02)", // ✅ MEJORA: Efecto hover
        },
        // ✅ MEJORA: Usa alpha del tema para overlay
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: alpha(theme.palette.common.black, 0.5), // ✅ Usa alpha del tema
          transition: "background-color 0.3s ease",
        },
        "&:hover::before": {
          backgroundColor: alpha(theme.palette.common.black, 0.4), // ✅ Aclara en hover
        },
      }}
    >
      <Box sx={{ 
        position: "relative", 
        zIndex: 1, 
        px: { xs: 2, sm: 3, md: 4 } // ✅ MEJORA: Padding responsive
      }}>
        <Typography
          variant="h4"
          fontWeight={700}
          gutterBottom
          sx={{ 
            textShadow: "2px 2px 4px rgba(0,0,0,0.6)", // ✅ MEJORA: Sombra más visible
            fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" }, // ✅ MEJORA: Responsive
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="body1"
          sx={{ 
            textShadow: "1px 1px 3px rgba(0,0,0,0.6)",
            fontSize: { xs: "0.875rem", sm: "1rem", md: "1.125rem" }, // ✅ MEJORA: Responsive
          }}
        >
          {description}
        </Typography>
      </Box>
    </Card>
  );
};