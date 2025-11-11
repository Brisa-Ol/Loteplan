// Contenedor para pasos con línea horizontal conectora
// ═══════════════════════════════════════════════════════════
import React from "react";
import { Box } from "@mui/material";

interface StepsContainerProps {
  children: React.ReactNode;
}

export const StepsContainer: React.FC<StepsContainerProps> = ({ children }) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        justifyContent: "center",
        alignItems: "flex-start",
        position: "relative",
        mb: 4,
      }}
    >
      {/* Línea horizontal de conexión (solo desktop) */}
      <Box
        sx={{
          position: "absolute",
          top: 35,
          left: 0,
          right: 0,
          height: 2,
          backgroundColor: "secondary.main",
          zIndex: 1,
          display: { xs: "none", md: "block" },
        }}
      />
      {children}
    </Box>
  );
};