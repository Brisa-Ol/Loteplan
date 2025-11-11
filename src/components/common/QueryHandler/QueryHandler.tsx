// src/components/common/QueryHandler/QueryHandler.tsx (CORREGIDO)
import React from 'react';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';

interface QueryHandlerProps {
  isLoading: boolean;
  error: Error | null;
  children: React.ReactNode;
  loadingMessage?: string;
  errorMessage?: string;
  noLoader?: boolean;
  fullHeight?: boolean; // para ocupar toda la pantalla
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
    if (noLoader) return null; // No muestra nada si así se lo pedimos

    // 👇 CORRECCIÓN: Se eliminaron los ``` que estaban aquí
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: fullHeight ? "100vh" : "60vh", // Cambia según prop
        }}
      >
        <CircularProgress />
        <Typography sx={{ mt: 2, color: "text.secondary" }}>
          {loadingMessage}
        </Typography>
      </Box>
    );
    // 👆 CORRECCIÓN: Se eliminaron los ``` que estaban aquí
  }

  // --- 2. Estado de Error ---
  if (error) {
    return (
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <Alert severity="error">
          {errorMessage || error.message || "Ocurrió un error al cargar los datos."}
        </Alert>
      </Box>
    );
  }

  // --- 3. Éxito ---
  // Si no está cargando y no hay error, muestra el contenido
  return <>{children}</>;
};

// No olvides exportarlo si usas 'export const'
// export default QueryHandler;