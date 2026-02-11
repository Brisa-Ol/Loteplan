// src/components/common/HighlightBox/HighlightBox.tsx

import React from "react";
// ✅ CORRECCIÓN: Se eliminó 'alpha' de los imports porque no se usa
import { Box, Typography, useTheme } from "@mui/material";

interface HighlightBoxProps {
  title: string;
  description: string;
}

export const HighlightBox: React.FC<HighlightBoxProps> = ({
  title,
  description,
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        borderRadius: 4,
        p: { xs: 3, md: 6 },
        mb: { xs: 8, md: 12 },
        boxShadow: theme.shadows[4],
        textAlign: "center",

        maxWidth: "800px",
        mx: "auto",
        border: `1px solid ${theme.palette.divider}`
      }}
    >
      <Typography
        variant="h3"
        component="h2"
        sx={{
          fontWeight: 800,
          mb: 2,
          color: "primary.main",
          fontSize: { xs: "1.75rem", md: "2.5rem" }
        }}
      >
        {title}
      </Typography>

      <Typography
        variant="body1"
        color="text.secondary"
        sx={{
          lineHeight: 1.8,
          fontSize: { xs: "1rem", md: "1.125rem" }
        }}
      >
        {description}
      </Typography>
    </Box>
  );
};