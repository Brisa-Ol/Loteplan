import React from 'react';
import { Box, CircularProgress, Typography, Alert, Skeleton, Stack } from '@mui/material';

interface QueryHandlerProps {
  isLoading: boolean;
  error: Error | null;
  children: React.ReactNode;
  loadingMessage?: string;
  errorMessage?: string;
  noLoader?: boolean;
  fullHeight?: boolean;
  // ✅ MEJORA 1: Opción para usar skeleton en lugar de spinner
  useSkeleton?: boolean;
  skeletonCount?: number;
}

// ✅ MEJORA 2: Componente Skeleton reutilizable para ProjectCard
export const ProjectCardSkeleton: React.FC = () => (
  <Box>
    {/* Imagen */}
    <Skeleton 
      variant="rectangular" 
      height={200} 
      sx={{ borderRadius: 2, mb: 2 }} 
      animation="wave"
    />
    
    {/* Título */}
    <Skeleton 
      variant="text" 
      height={32} 
      width="90%" 
      sx={{ mb: 1 }} 
      animation="wave"
    />
    
    {/* Descripción (2 líneas) */}
    <Skeleton 
      variant="text" 
      height={20} 
      width="100%" 
      animation="wave"
    />
    <Skeleton 
      variant="text" 
      height={20} 
      width="75%" 
      sx={{ mb: 2 }} 
      animation="wave"
    />
    
    {/* Barra de progreso o chips */}
    <Skeleton 
      variant="rectangular" 
      height={40} 
      sx={{ borderRadius: 2, mb: 2 }} 
      animation="wave"
    />
    
    {/* Precio y botón */}
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Skeleton variant="text" width={100} height={32} animation="wave" />
      <Skeleton variant="text" width={80} height={32} animation="wave" />
    </Stack>
    
    {/* Botón CTA */}
    <Skeleton 
      variant="rectangular" 
      height={42} 
      sx={{ borderRadius: 25, mt: 2 }} 
      animation="wave"
    />
  </Box>
);

export const QueryHandler: React.FC<QueryHandlerProps> = ({
  isLoading,
  error,
  children,
  loadingMessage = "Cargando...",
  errorMessage,
  noLoader = false,
  fullHeight = false,
  useSkeleton = false,
  skeletonCount = 6,
}) => {

  // --- 1. Estado de Carga ---
  if (isLoading) {
    if (noLoader) return null;

    // ✅ MEJORA 3: Skeleton loading para mejor UX
    if (useSkeleton) {
      return (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { 
              xs: "1fr", 
              sm: "repeat(2, 1fr)", 
              md: "repeat(3, 1fr)" 
            },
            gap: 4,
            width: "100%",
            px: { xs: 2, md: 0 }
          }}
        >
          {[...Array(skeletonCount)].map((_, index) => (
            <ProjectCardSkeleton key={index} />
          ))}
        </Box>
      );
    }

    // Spinner clásico (fallback)
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
        <CircularProgress size={48} />
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