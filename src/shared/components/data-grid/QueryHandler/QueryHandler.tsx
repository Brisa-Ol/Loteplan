// src/components/common/QueryHandler/QueryHandler.tsx
import React from 'react';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';

// 🔥 CORRECCIÓN 1: Definir la interfaz
interface QueryHandlerProps {
  isLoading: boolean;
  error: Error | null;
  children: React.ReactNode;
  loadingMessage?: string;
  errorMessage?: string;
  noLoader?: boolean;
  fullHeight?: boolean;
}

export const QueryHandler: React.FC<QueryHandlerProps> = ({
  isLoading,
  error,
  children,
  loadingMessage = "Cargando...",
  errorMessage,
  noLoader = false,
  fullHeight = false,
}) => {

  // --- 1. Estado de Carga ---
  if (isLoading) {
    if (noLoader) return null;

    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: fullHeight 
            ? "100vh" 
            : { xs: "40vh", sm: "50vh", md: "60vh" },
          px: { xs: 2, sm: 3 },
        }}
      >
        {/* 🔥 CORRECCIÓN 2: CircularProgress no acepta objetos en size */}
        <CircularProgress 
          sx={{ 
            width: { xs: 40, sm: 48 }, 
            height: { xs: 40, sm: 48 } 
          }} 
        />
        <Typography 
          variant="body2"
          sx={{ 
            mt: 3,
            color: "text.secondary",
            fontSize: { xs: "0.875rem", sm: "1rem" }
          }}
        >
          {loadingMessage}
        </Typography>
      </Box>
    );
  }

  // --- 2. Estado de Error ---
  if (error) {
    return (
      <Box sx={{ 
        textAlign: "center", 
        mt: { xs: 2, sm: 4 },
        px: { xs: 2, sm: 0 },
        maxWidth: "600px",
        mx: "auto"
      }}>
        <Alert 
          severity="error"
          sx={{
            fontSize: { xs: "0.875rem", sm: "1rem" }
          }}
        >
          {errorMessage || error.message || "Ocurrió un error al cargar los datos."}
        </Alert>
      </Box>
    );
  }

  // --- 3. Éxito ---
  return <>{children}</>;
};