// src/components/common/IconCard/IconCard.tsx

import React from "react";
import { Card, CardContent, Typography, Avatar, alpha, useTheme } from "@mui/material";
import type { SvgIconComponent } from "@mui/icons-material";

interface IconCardProps {
  title: string;
  description: string | React.ReactNode;
  icon: SvgIconComponent;
}

export const IconCard: React.FC<IconCardProps> = ({
  title,
  description,
  icon: Icon,
}) => {
  const theme = useTheme();

  return (
    <Card
      elevation={0} // Estilo flat
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        p: 4, // Un poco más de aire
        textAlign: "center",
        height: "100%",
        borderRadius: 4,
        border: "1px solid",
        borderColor: "divider",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        backgroundColor: "background.paper",
        "&:hover": {
          transform: "translateY(-8px)", // Efecto de levitación
          boxShadow: theme.shadows[4],
          borderColor: "primary.main",
        },
      }}
    >
      {/* Círculo decorativo para el icono */}
      <Avatar
        sx={{
          width: 80,
          height: 80,
          mb: 3,
          bgcolor: alpha(theme.palette.primary.main, 0.1), // Fondo suave
          color: "primary.main",
        }}
      >
        <Icon sx={{ fontSize: 40 }} />
      </Avatar>

      <CardContent sx={{ flexGrow: 1, p: 0 }}>
        <Typography 
            variant="h5" 
            color="text.primary" // Mejor contraste que primary.main para lectura
            fontWeight={800} 
            gutterBottom
        >
          {title}
        </Typography>
        
        <Typography 
            variant="body1" 
            color="text.secondary" 
            sx={{ lineHeight: 1.7 }}
        >
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
};