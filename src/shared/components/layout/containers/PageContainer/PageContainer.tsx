// src/components/common/PageContainer/PageContainer.tsx
import React from "react";
import { Container, type ContainerProps } from "@mui/material";

interface PageContainerProps extends ContainerProps {
  children: React.ReactNode;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl" | false;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  maxWidth = "lg",
  sx,
  ...rest
}) => {
  return (
    <Container
      maxWidth={maxWidth}
      sx={{
        // Padding vertical adaptativo siguiendo el theme
        py: { 
          xs: 2,    // 16px - Mobile
          sm: 3,    // 24px - Tablet pequeña
          md: 4,    // 32px - Tablet
          lg: 6     // 48px - Desktop
        },
        // Padding horizontal adaptativo
        px: { 
          xs: 2,    // 16px - Mobile (ya definido en theme pero lo reforzamos)
          sm: 3,    // 24px - Tablet
          md: 4     // 32px - Desktop+
        },
        width: "100%",
        margin: "0 auto",
        // Altura mínima para evitar contenedores muy pequeños
        minHeight: { xs: "calc(100vh - 200px)", md: "auto" },
        // Merge con sx adicional del usuario
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Container>
  );
};