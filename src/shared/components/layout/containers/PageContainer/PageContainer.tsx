// src/components/common/PageContainer/PageContainer.tsx
import React from "react";
import { Container, type ContainerProps, useTheme } from "@mui/material";

interface PageContainerProps extends ContainerProps {
  children: React.ReactNode;
  /**
   * Permite quitar el padding vertical si la página lo requiere
   * (Ej: Dashboards que ocupan 100% de alto)
   */
  disableVerticalPadding?: boolean;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  maxWidth = "lg",
  disableVerticalPadding = false,
  sx,
  ...rest
}) => {
  const theme = useTheme();

  return (
    <Container
      maxWidth={maxWidth}
      sx={{
        // ✅ RESPONSIVE: Padding Vertical escalonado
        // En móvil (xs) damos menos aire, en escritorio (lg) más espacio.
        // Si disableVerticalPadding es true, lo dejamos en 0.
        py: disableVerticalPadding ? 0 : { 
          xs: 3,    // 24px - Un poco más de aire que el borde
          md: 4,    // 32px 
          lg: 5     // 40px - Elegante en pantallas grandes
        },

        // ✅ CLEAN CODE:
        // 1. Eliminamos 'width: 100%' y 'margin: 0 auto' (MUI lo trae por defecto).
        // 2. Eliminamos 'px' manual. Tu theme.ts ya define:
        //    paddingLeft/Right: 16px en móvil via MuiContainer override.
        //    MUI por defecto ya pone 24px en escritorio.
        //    No hace falta re-escribirlo aquí a menos que quieras forzar algo distinto.

        // 3. MinHeight opcional:
        // Si usas un Layout con Flexbox (recomendado), esto no es necesario.
        // Pero si quieres asegurar que el footer no suba en páginas vacías:
        flex: 1, 
        display: 'flex',
        flexDirection: 'column',
        
        // Merge con estilos custom
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Container>
  );
};