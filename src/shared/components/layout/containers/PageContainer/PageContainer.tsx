// src/components/common/PageContainer/PageContainer.tsx
import React from 'react';
import { Container, type ContainerProps } from '@mui/material';

interface PageContainerProps extends ContainerProps {
  children: React.ReactNode;
  /**
   * Quita el padding vertical (útil para dashboards full-height)
   */
  disableVerticalPadding?: boolean;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  maxWidth = 'lg',
  disableVerticalPadding = false,
  sx,
  ...rest
}) => {
  return (
    <Container
      maxWidth={maxWidth}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1, // Asegura que empuje el footer si está en un layout flex
        py: disableVerticalPadding ? 0 : { xs: 3, md: 4, lg: 5 },
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Container>
  );
};