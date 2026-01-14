// src/pages/Auth/components/AuthFormContainer/AuthFormContainer.tsx

import React from "react";
import { 
  Box, 
  Container, 
  Paper, 
  Typography, 
  useTheme, 
  alpha 
} from "@mui/material";

interface AuthFormContainerProps {
  title: string;
  subtitle?: string | React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Contenedor Layout para páginas de Autenticación.
 * * Implementa el patrón "Hero Header + Card Overlap":
 * 1. Fondo naranja con gradiente y títulos.
 * 2. Tarjeta blanca superpuesta con efecto "pull up" (margen negativo).
 */
const AuthFormContainer: React.FC<AuthFormContainerProps> = ({
  title,
  subtitle,
  children,
  maxWidth = "sm",
}) => {
  const theme = useTheme();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      
      {/* ==========================================
          1. HERO HEADER (Fondo Gradiente)
          ========================================== */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'primary.contrastText',
          py: { xs: 6, md: 8 },
          textAlign: 'center',
          // Este margen negativo es clave para el efecto de superposición
          mb: { xs: -4, md: -6 } 
        }}
      >
        <Container maxWidth="lg">
          <Typography 
            variant="h3" 
            component="h1" 
            fontWeight={800} 
            gutterBottom
          >
            {title}
          </Typography>
          
          {subtitle && (
            <Typography 
              variant="h6" 
              sx={{ 
                maxWidth: 'md', 
                mx: 'auto', 
                opacity: 0.9, 
                fontWeight: 400 
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Container>
      </Box>

      {/* ==========================================
          2. CARD CONTAINER (Formulario)
          ========================================== */}
      <Container maxWidth={maxWidth} sx={{ pb: 8, position: 'relative', zIndex: 1 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            bgcolor: 'background.paper',
            // Bordes y sombras sutiles consistentes con el resto de la app
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)',
            // Evitamos animaciones de movimiento en el contenedor principal para no marear en formularios
            transition: 'none' 
          }}
        >
          {children}
        </Paper>
      </Container>

    </Box>
  );
};

export default AuthFormContainer;