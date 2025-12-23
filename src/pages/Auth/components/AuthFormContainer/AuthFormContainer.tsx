// src/pages/Auth/components/AuthFormContainer/AuthFormContainer.tsx

import React from "react";
import { Card, CardContent, Box, Typography } from "@mui/material";

interface AuthFormContainerProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  maxWidth?: number;
}

/**
 * Contenedor compartido para formularios de autenticación.
 * * Se alinea con el theme global usando <Card>, pero desactiva
 * las animaciones de hover (transform) para evitar que el formulario
 * se mueva mientras el usuario interactúa con él.
 */
const AuthFormContainer: React.FC<AuthFormContainerProps> = ({
  title,
  subtitle,
  children,
  maxWidth = 450, // Un poco más ancho por defecto para mejor aire
}) => {
  return (
    <Card
      sx={{
        maxWidth,
        mx: "auto",
        mt: { xs: 4, md: 8 }, // Margen superior responsivo
        width: '100%',
        // Importante: Sobrescribimos el comportamiento hover del theme para formularios
        // Mantenemos la sombra pero evitamos que la tarjeta "salte"
        "&:hover": {
          transform: "none",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)", // Mantiene la sombra base
        },
      }}
    >
      <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
        <Box textAlign="center" mb={4}>
          {/* Usamos h3 o h4 para el título, h2 (32px) puede ser muy grande para móviles */}
          <Typography 
            variant="h3" 
            component="h1" 
            color="primary.main" 
            gutterBottom
            fontWeight={700}
          >
            {title}
          </Typography>
          
          <Typography variant="body1" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>
        
        {children}
      </CardContent>
    </Card>
  );
};

export default AuthFormContainer;