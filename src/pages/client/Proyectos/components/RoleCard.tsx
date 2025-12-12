// src/components/common/RoleCard/RoleCard.tsx (Componente Extraído)
import React from "react";
import { Box, Typography, Card, Button } from "@mui/material";

// 1. Definimos la 'shape' de las props que SÍ necesita la tarjeta
interface RoleDisplay {
  title: string;
  description: string;
  icon: React.ReactNode;
  isPrimary: boolean;
}

interface RoleCardProps {
  role: RoleDisplay;
  onCardClick: () => void; // 2. Recibe la lógica de click desde el padre
}

// 3. Exportamos el componente (no es 'default')
export const RoleCard: React.FC<RoleCardProps> = ({ role, onCardClick }) => {
  return (
    <Card
      sx={{
        width: { xs: 260, sm: 300 },
        minHeight: 360,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        p: 3,
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-8px)",
          boxShadow: "0 12px 24px rgba(0,0,0,0.2)",
        },
      }}
    >
      {/* Icono */}
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: role.isPrimary ? "primary.main" : "secondary.main",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          mb: 2,
        }}
      >
        {role.icon}
      </Box>

      {/* Título */}
      <Typography
        variant="h5"
        sx={{
          textTransform: "uppercase",
          letterSpacing: 1.2,
          textAlign: "center",
          fontWeight: 800,
          color: "primary.main",
          mb: 2,
        }}
      >
        {role.title}
      </Typography>

      {/* Descripción */}
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          textAlign: "center",
          lineHeight: 1.6,
          flexGrow: 1,
          mb: 3,
        }}
      >
        {role.description}
      </Typography>

      {/* Botón */}
      <Button
        variant="contained"
        fullWidth
        onClick={onCardClick} // 4. Usa la prop del padre
        sx={{
          mt: "auto",
          transition: "all 0.3s",
          "&:hover": {
            transform: "scale(1.05)",
          },
        }}
      >
        Empezar ahora
      </Button>
    </Card>
  );
};