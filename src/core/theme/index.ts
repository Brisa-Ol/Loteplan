import { createTheme, responsiveFontSizes, alpha } from "@mui/material/styles";
import type { Components, Theme } from "@mui/material/styles";

export const colors = {
  primary: { main: "#CC6333", light: "#E07A4D", dark: "#A34D26", contrastText: "#FFFFFF" },
  secondary: { main: "#ECECEC", light: "#F6F6F6", dark: "#D4D4D4", contrastText: "#000000" },
  text: { primary: "#000000", secondary: "#333333", disabled: "#999999" },
  background: { default: "#FFFFFF", paper: "#ECECEC" },
  success: { main: "#4CAF50", light: "#E8F5E9" },
  error: { main: "#D32F2F", light: "#FFEBEE" },
  warning: { main: "#F57C00", light: "#FFF3E0" },
  info: { main: "#0288D1", light: "#E1F5FE" },
} as const;

// =============================================================================
// TIPOGRAFÍA
// =============================================================================
// Escala de tamaños (desktop → móvil vía responsiveFontSizes):
//
//   Nivel        | Desktop  | Móvil aprox.  | Uso típico
//   -------------|----------|---------------|------------------------------------------
//   h1           | 2.25rem  | ~1.75rem      | Título principal de página
//   h2           | 1.875rem | ~1.5rem       | Sección importante dentro de una página
//   h3           | 1.5rem   | ~1.25rem      | Sub-sección
//   h4           | 1.25rem  | ~1.125rem     | Título de card o bloque
//   h5           | 1.125rem | ~1rem         | Título pequeño, sidebar, widget
//   h6           | 1rem     | ~0.95rem      | Etiqueta de grupo, label importante
//   subtitle1    | 1rem     |  —            | Subtítulo bajo h1/h2 (no se reduce)
//   subtitle2    | 0.875rem |  —            | Subtítulo secundario
//   body1        | 1rem     |  —            | Texto principal
//   body2        | 0.875rem |  —            | Texto secundario, descripciones
//   caption      | 0.75rem  |  —            | Metadatos, fechas, labels pequeñas
//   button       | 0.875rem |  —            | Texto de botones
//   overline     | 0.75rem  |  —            | Tags, badges, categorías (uppercase)
//
// responsiveFontSizes reduce automáticamente h1–h6 en pantallas pequeñas.
// subtitle, body, caption y button NO se reducen (son ya pequeños y legibles en móvil).

const typography = {
  fontFamily: "Inter, sans-serif",

  // --- Títulos (responsive automáticamente) ---
  h1: { fontWeight: 700, fontSize: "2.25rem", lineHeight: 1.2 },
  h2: { fontWeight: 700, fontSize: "1.875rem", lineHeight: 1.3 },
  h3: { fontWeight: 600, fontSize: "1.5rem", lineHeight: 1.3 },
  h4: { fontWeight: 600, fontSize: "1.25rem", lineHeight: 1.4 },
  h5: { fontWeight: 600, fontSize: "1.125rem", lineHeight: 1.4 },
  h6: { fontWeight: 500, fontSize: "1rem", lineHeight: 1.5 },

  // --- Subtítulos ---
  subtitle1: { fontWeight: 500, fontSize: "1rem", lineHeight: 1.5 },
  subtitle2: { fontWeight: 500, fontSize: "0.875rem", lineHeight: 1.5 },

  // --- Cuerpo ---
  body1: { fontWeight: 400, fontSize: "1rem", lineHeight: 1.6 },
  body2: { fontWeight: 400, fontSize: "0.875rem", lineHeight: 1.5 },

  // --- Otros ---
  caption: { fontWeight: 400, fontSize: "0.75rem", lineHeight: 1.4, color: "#666666" },
  button: { fontWeight: 600, fontSize: "0.875rem", textTransform: "none" as const },
  overline: { fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
} as const;

const components: Components<Theme> = {
  MuiCssBaseline: {
    styleOverrides: `
      *::-webkit-scrollbar { width: 8px; height: 8px; }
      *::-webkit-scrollbar-thumb { background-color: #E07A4D; border-radius: 4px; }
      * { scrollbar-width: thin; scrollbar-color: #E07A4D #F6F6F6; }
    `,
  },
  MuiSkeleton: {
    styleOverrides: {
      root: {
        backgroundColor: alpha(colors.primary.main, 0.08),
        borderRadius: 12,
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": { transform: "translateY(-2px)" },
      },
      contained: { boxShadow: "none" },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: { 
        borderRadius: 12, 
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
        transition: "all 0.3s ease" 
      },
    },
  },
  MuiChip: { styleOverrides: { root: { fontWeight: 600, borderRadius: 8 } } },
};

let theme = createTheme({
  palette: colors,
  typography,
  components,
  shape: { borderRadius: 8 },
  spacing: 8,
});

// Reduce automáticamente h1–h6 en pantallas pequeñas.
// factor: 3 es agresivo (reduce bastante en móvil). Si te parece que
// los títulos quedan muy chicos, bajarlo a 2.
theme = responsiveFontSizes(theme, { factor: 3 });

export default theme;