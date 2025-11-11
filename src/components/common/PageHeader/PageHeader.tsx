// Header principal de páginas - usado en TODAS las vistas
// ═══════════════════════════════════════════════════════════
import React from "react";
import { Box, Typography } from "@mui/material";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle }) => {
  return (
    <Box textAlign="center" mb={{ xs: 6, md: 8 }}>
      <Typography
        variant="h1"
        sx={{
          color: "primary.main",
          mb: 2,
          fontWeight: 700,
          textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography
          variant="h5"
          color="text.secondary"
          maxWidth="md"
          mx="auto"
          sx={{ lineHeight: 1.9 }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );
};