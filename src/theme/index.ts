import { createTheme } from "@mui/material/styles";
import { colors } from "./colors";
import { typography } from "./Typography";
import { components } from "./Components";


/**
 * Tema único de la aplicación
 * Usa este en lugar de FormTitle o FormButton
 */
export const theme = createTheme({
  palette: colors,
  typography,
  components,
  shape: {
    borderRadius: 8,
  },
  spacing: 8, // 1 unidad = 8px
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
});

export default theme;

// Exportar colores para uso directo
export { colors, typography };