// src/components/common/PageContainer/PageContainer.tsx
import React from "react";
import { Container, type ContainerProps } from "@mui/material";

interface PageContainerProps extends ContainerProps {
  children: React.ReactNode;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  maxWidth = "lg",
  ...rest
}) => {
  return (
    <Container
      maxWidth={maxWidth}
      sx={{
        py: { xs: 4, md: 6 },
        px: { xs: 2, md: 3 },
        width: "100%",
        margin: "0 auto",
      }}
      {...rest} // <-- Esto permite pasar sx, className, etc.
    >
      {children}
    </Container>
  );
};
