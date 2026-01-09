// src/components/common/HighlightBox/HighlightBox.tsx

import React from "react";
import { Box, Typography, useTheme, alpha } from "@mui/material";

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
        bgcolor: "background.paper", // O alpha(theme.palette.primary.main, 0.05) para un tinte suave
        borderRadius: 4, // Bordes un poco más suaves
        p: { xs: 3, md: 6 }, // Padding responsive (correcto)
        mb: { xs: 8, md: 12 }, // Margen inferior responsive (correcto)
        boxShadow: theme.shadows[4],
        textAlign: "center",
        
        // ✅ MEJORA CLAVE:
        maxWidth: "800px", // Evita que el texto se estire demasiado en monitores anchos
        mx: "auto",        // Centra la caja horizontalmente
        border: `1px solid ${theme.palette.divider}` // Toque sutil de definición
      }}
    >
      <Typography
        variant="h3" // Subimos a h3 pero controlamos el tamaño
        component="h2"
        sx={{ 
            fontWeight: 800, 
            mb: 2, 
            color: "primary.main",
            // Ajuste fino del tamaño de fuente
            fontSize: { xs: "1.75rem", md: "2.5rem" } 
        }}
      >
        {title}
      </Typography>
      
      <Typography 
        variant="body1" 
        color="text.secondary" 
        sx={{ 
            lineHeight: 1.8, // Un poco más de altura de línea para mejor lectura
            fontSize: { xs: "1rem", md: "1.125rem" } // Texto ligeramente más grande en escritorio
        }}
      >
        {description}
      </Typography>
    </Box>
  );
};