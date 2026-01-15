// src/core/theme.ts
import { createTheme, responsiveFontSizes } from "@mui/material/styles";
import type { Components, Theme } from "@mui/material/styles";

// ========== COLORES ==========
export const colors = {
  primary: {
    main: "#CC6333",
    light: "#E07A4D",
    dark: "#A34D26",
    contrastText: "#FFFFFF",
  },
  secondary: {
    main: "#ECECEC",
    light: "#F6F6F6",
    dark: "#D4D4D4",
    contrastText: "#000000",
  },
  text: {
    primary: "#000000",
    secondary: "#333333",
    disabled: "#999999",
  },
  background: {
    default: "#FFFFFF",
    paper: "#ECECEC",
  },
  success: {
    main: "#4CAF50",
    light: "#E8F5E9",
  },
  error: {
    main: "#D32F2F",
    light: "#FFEBEE",
  },
  warning: {
    main: "#F57C00",
    light: "#FFF3E0",
  },
  info: {
    main: "#0288D1",
    light: "#E1F5FE",
  },
} as const;

// ========== TIPOGRAFÍA ESTÁNDAR ==========
const typography = {
  fontFamily: "Inter, sans-serif",
  h1: {
    fontWeight: 700,
    fontSize: "2.5rem",
    lineHeight: 1.2,
    letterSpacing: "-0.01562em",
  },
  h2: {
    fontWeight: 600,
    fontSize: "2rem",
    lineHeight: 1.3,
    letterSpacing: "-0.00833em",
  },
  h3: {
    fontWeight: 600,
    fontSize: "1.75rem",
    lineHeight: 1.35,
    letterSpacing: "0em",
  },
  h4: {
    fontWeight: 600,
    fontSize: "1.5rem",
    lineHeight: 1.4,
    letterSpacing: "0.00735em",
  },
  h5: {
    fontWeight: 500,
    fontSize: "1.25rem",
    lineHeight: 1.5,
    letterSpacing: "0em",
  },
  h6: {
    fontWeight: 500,
    fontSize: "1.125rem",
    lineHeight: 1.6,
    letterSpacing: "0.0075em",
  },
  subtitle1: {
    fontWeight: 500,
    fontSize: "1rem",
    lineHeight: 1.75,
    letterSpacing: "0.00938em",
  },
  subtitle2: {
    fontWeight: 500,
    fontSize: "0.875rem",
    lineHeight: 1.57,
    letterSpacing: "0.00714em",
  },
  body1: {
    fontWeight: 400,
    fontSize: "1rem",
    lineHeight: 1.6,
    letterSpacing: "0.00938em",
  },
  body2: {
    fontWeight: 400,
    fontSize: "0.875rem",
    lineHeight: 1.5,
    letterSpacing: "0.01071em",
  },
  caption: {
    fontWeight: 400,
    fontSize: "0.75rem",
    lineHeight: 1.66,
    letterSpacing: "0.03333em",
    color: "#666666",
  },
  overline: {
    fontWeight: 600,
    fontSize: "0.75rem",
    lineHeight: 2.66,
    letterSpacing: "0.08333em",
    textTransform: "uppercase" as const,
  },
  button: {
    fontWeight: 600,
    fontSize: "0.9375rem",
    lineHeight: 1.75,
    letterSpacing: "0.02857em",
    textTransform: "none" as const,
  },
} as const;


// ========== COMPONENTES ==========
const components: Components<Theme> = {
  
  // 🔥 ESTA ES LA CORRECCIÓN MAESTRA 🔥
  MuiCssBaseline: {
    styleOverrides: `
      /* ESTILOS GLOBALES DEL SCROLLBAR (Para Chrome, Edge, Safari) */
      
      /* 1. El selector universal '*' asegura que CUALQUIER elemento con scroll tenga este estilo */
      *::-webkit-scrollbar {
        width: 8px;              /* Ancho vertical más fino y elegante */
        height: 8px;             /* Alto horizontal */
      }

      /* 2. El fondo del carril (Track) */
      *::-webkit-scrollbar-track {
        background: #F6F6F6;     /* Tu color secondary.light */
        border-radius: 4px;
      }

      /* 3. La barra que se mueve (Thumb) */
      *::-webkit-scrollbar-thumb {
        background-color: #E07A4D; /* Tu color primary.light */
        border-radius: 4px;
        border: 2px solid #F6F6F6; /* Borde blanco para efecto "flotante" */
      }

      /* 4. Al pasar el mouse por encima */
      *::-webkit-scrollbar-thumb:hover {
        background-color: #CC6333; /* Tu color primary.main */
      }

      /* 5. Esquina donde se cruzan */
      *::-webkit-scrollbar-corner {
        background-color: transparent;
      }

      /* ESTILOS PARA FIREFOX (Soporte limitado) */
      * {
        scrollbar-width: thin;
        scrollbar-color: #E07A4D #F6F6F6;
      }
    `,
  },

  // --- TUS OTROS COMPONENTES (Los dejo igual que los tenías) ---
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        padding: "10px 24px",
        fontWeight: 600,
        textTransform: "none" as const,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": { transform: "translateY(-2px)" },
      },
      contained: {
        boxShadow: "none",
        "&:hover": { boxShadow: "0 4px 12px rgba(204, 99, 51, 0.25)" },
      },
      outlined: {
        borderWidth: "2px",
        "&:hover": { backgroundColor: "rgba(204, 99, 51, 0.08)", borderWidth: "2px" },
      },
      sizeLarge: { padding: "12px 32px", fontSize: "1rem" },
      sizeSmall: { padding: "6px 16px", fontSize: "0.8125rem" },
    },
  },
  MuiTableContainer: {
    styleOverrides: {
      root: {
        borderRadius: 16,
        border: `1px solid ${colors.secondary.main}`,
        boxShadow: "none",
        backgroundImage: "none",
        backgroundColor: colors.background.default,
        overflowX: "auto",
      },
    },
  },
  MuiTableHead: {
    styleOverrides: {
      root: { backgroundColor: colors.secondary.light },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      head: {
        color: colors.text.secondary,
        fontWeight: 700,
        fontSize: "0.875rem",
        borderBottom: `1px solid ${colors.secondary.main}`,
        padding: "12px 16px",
        "@media (max-width: 600px)": { padding: "8px 12px", fontSize: "0.8125rem" },
      },
      root: {
        borderBottom: `1px solid ${colors.secondary.main}`,
        padding: "16px",
        "@media (max-width: 600px)": { padding: "12px", fontSize: "0.875rem" },
      },
    },
  },
  MuiTablePagination: {
    styleOverrides: {
      root: { borderTop: `1px solid ${colors.secondary.main}` },
      toolbar: { "@media (max-width: 600px)": { paddingLeft: "8px", paddingRight: "8px" } },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": { boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)", transform: "translateY(-4px)" },
        "@media (max-width: 600px)": { borderRadius: 8 },
      },
    },
  },
  MuiCardContent: {
    styleOverrides: {
      root: {
        padding: "24px",
        "@media (max-width: 600px)": { padding: "16px" },
        "&:last-child": {
          paddingBottom: "24px",
          "@media (max-width: 600px)": { paddingBottom: "16px" },
        },
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      rounded: {
        borderRadius: 12,
        "@media (max-width: 600px)": { borderRadius: 8 },
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        "& .MuiOutlinedInput-root": {
          borderRadius: 8,
          "&:hover fieldset": { borderColor: "#CC6333" },
        },
        "& .MuiInputLabel-root": { "@media (max-width: 600px)": { fontSize: "0.9375rem" } },
      },
    },
  },
  MuiInputBase: {
    styleOverrides: {
      root: { "@media (max-width: 600px)": { fontSize: "1rem" } },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        fontWeight: 600,
        borderRadius: 8,
        "@media (max-width: 600px)": { height: "28px", fontSize: "0.8125rem" },
      },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        "@media (max-width: 600px)": { borderRadius: 8, fontSize: "0.875rem" },
      },
    },
  },
  MuiBottomNavigation: {
    styleOverrides: {
      root: {
        height: 64,
        borderTop: "1px solid #ECECEC",
        "@media (max-width: 600px)": { height: 56 },
      },
    },
  },
  MuiBottomNavigationAction: {
    styleOverrides: {
      root: {
        minWidth: "auto",
        padding: "6px 12px",
        "&.Mui-selected": { color: "#CC6333" },
        "@media (max-width: 600px)": { padding: "6px 8px", minWidth: "64px" },
      },
      label: {
        fontSize: "0.75rem",
        fontWeight: 600,
        "&.Mui-selected": { fontSize: "0.75rem", fontWeight: 700 },
        "@media (max-width: 600px)": { fontSize: "0.6875rem" },
      },
    },
  },
  MuiContainer: {
    styleOverrides: {
      root: {
        "@media (max-width: 600px)": { paddingLeft: "16px", paddingRight: "16px" },
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        margin: "32px",
        "@media (max-width: 600px)": { margin: "16px", maxHeight: "calc(100% - 32px)" },
      },
    },
  },
  MuiDialogTitle: {
    styleOverrides: {
      root: {
        padding: "24px",
        "@media (max-width: 600px)": { padding: "16px", fontSize: "1.25rem" },
      },
    },
  },
  MuiDialogContent: {
    styleOverrides: {
      root: {
        padding: "24px",
        "@media (max-width: 600px)": { padding: "16px" },
      },
    },
  },
  MuiDialogActions: {
    styleOverrides: {
      root: {
        padding: "16px 24px",
        "@media (max-width: 600px)": { padding: "12px 16px" },
      },
    },
  },
};

// ========== BREAKPOINTS OPTIMIZADOS ==========
const breakpoints = {
  values: {
    xs: 0,
    sm: 600,
    md: 900,
    lg: 1200,
    xl: 1536,
  },
};

// ========== TEMA PRINCIPAL ==========
let theme = createTheme({
  palette: colors,
  typography,
  components,
  shape: {
    borderRadius: 8,
  },
  spacing: 8, 
  breakpoints,
});

theme = responsiveFontSizes(theme, {
  factor: 3,
  breakpoints: ["xs", "sm", "md", "lg", "xl"],
  disableAlign: false,
});

export default theme;