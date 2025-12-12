// src/components/common/AuthFormContainer/AuthFormContainer.tsx

import React from "react";
import { Paper, Box, Typography } from "@mui/material";

interface AuthFormContainerProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  maxWidth?: number;
}

/**
 * Contenedor compartido para formularios de autenticación
 * Usado en Login, Register, ForgotPassword, etc.
 */
const AuthFormContainer: React.FC<AuthFormContainerProps> = ({
  title,
  subtitle,
  children,
  maxWidth = 420,
}) => {
  return (
    <Paper
      elevation={3}
      sx={{
        maxWidth,
        mx: "auto",
        mt: { xs: 4, md: 8 },
        p: 4,
        borderRadius: 3,
      }}
    >
      <Box textAlign="center" mb={3}>
        <Typography variant="h2" color="primary.main" gutterBottom>
          {title}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {subtitle}
        </Typography>
      </Box>
      {children}
    </Paper>
  );
};

export default AuthFormContainer;