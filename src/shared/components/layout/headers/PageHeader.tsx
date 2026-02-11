// src/components/common/PageHeader/PageHeader.tsx

import React from "react";
import { Box, Typography } from "@mui/material";
import { SectionTitle } from "../containers/SectionTitle/SectionTitle";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  /**
   * Controla si el título usa gradiente (Default: true)
   */
  useGradient?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  action,
  useGradient = true
}) => {
  return (
    <Box
      component="header"
      sx={{
        mb: { xs: 4, md: 6, lg: 8 },
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1fr minmax(auto, 60%) 1fr" },
        gap: { xs: 3, md: 2 },
        alignItems: "start",
      }}
    >
      {/* 1. Espaciador Izquierdo (Desktop) */}
      <Box sx={{ display: { xs: "none", md: "block" } }} aria-hidden="true" />

      {/* 2. Contenido Central */}
      <Box sx={{ textAlign: "center", width: "100%" }}>
        <SectionTitle
          variant="h2"
          component="h1"
          align="center"
          useGradient={useGradient}
          lineWidth={100}
          sx={{ mb: 2 }}
        >
          {title}
        </SectionTitle>

        {subtitle && (
          <Typography
            variant="h5"
            color="text.secondary"
            sx={{
              maxWidth: "md",
              mx: "auto",
              lineHeight: 1.6,
              animation: "fadeIn 0.5s ease-in",
              "@keyframes fadeIn": {
                "0%": { opacity: 0, transform: "translateY(5px)" },
                "100%": { opacity: 1, transform: "translateY(0)" }
              }
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      {/* 3. Acción (Botón) */}
      {action && (
        <Box
          sx={{
            display: "flex",
            justifyContent: { xs: "center", md: "flex-end" },
            "& > *": { width: { xs: "100%", sm: "auto" } }
          }}
        >
          {action}
        </Box>
      )}
    </Box>
  );
};