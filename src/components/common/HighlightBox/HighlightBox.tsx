// Caja destacada con fondo gris
// ═══════════════════════════════════════════════════════════
import React from "react";
import { Box, Typography } from "@mui/material";

interface HighlightBoxProps {
  title: string;
  description: string;
}

export const HighlightBox: React.FC<HighlightBoxProps> = ({
  title,
  description,
}) => {
  return (
    <Box
      mb={{ xs: 8, md: 12 }}
      sx={{
        bgcolor: "background.paper",
        borderRadius: 3,
        p: { xs: 3, md: 6 },
        boxShadow: 3,
        textAlign: "center",
      }}
    >
      <Typography
        variant="h4"
        sx={{ fontWeight: 700, mb: 2, color: "primary.main" }}
      >
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
        {description}
      </Typography>
    </Box>
  );
};