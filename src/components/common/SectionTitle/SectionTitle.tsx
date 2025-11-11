// Título de sección con línea decorativa
// ═══════════════════════════════════════════════════════════
import React from "react";
import { Typography } from "@mui/material";

interface SectionTitleProps {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ 
  children, 
  align = "center" 
}) => {
  return (
    <Typography
      variant="h2"
      align={align}
      mb={{ xs: 4, md: 6 }}
      sx={{
        fontWeight: 700,
        color: "primary.main",
        position: "relative",
        "&::after": {
          content: '""',
          position: "absolute",
          bottom: -8,
          left: align === "center" ? "50%" : align === "right" ? "100%" : 0,
          transform: align === "center" ? "translateX(-50%)" : align === "right" ? "translateX(-100%)" : "none",
          width: 80,
          height: 3,
          backgroundColor: "secondary.main",
        },
      }}
    >
      {children}
    </Typography>
  );
};