// ==========================================
// theme/index.ts - ÚNICO PUNTO DE ENTRADA
// ==========================================

import { createTheme } from "@mui/material/styles";
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

// ========== TIPOGRAFÍA ==========
const typography = {
  fontFamily: "Inter, sans-serif",
  h1: {
    fontWeight: 700,
    fontSize: "3rem", // 48px
    lineHeight: 1.2,
  },
  h2: {
    fontWeight: 600,
    fontSize: "2rem", // 32px
    lineHeight: 1.3,
  },
  h3: {
    fontWeight: 600,
    fontSize: "1.5rem", // 24px
    lineHeight: 1.4,
  },
  h4: {
    fontWeight: 600,
    fontSize: "1.25rem", // 20px
    lineHeight: 1.4,
  },
  h5: {
    fontWeight: 500,
    fontSize: "1.125rem", // 18px
    lineHeight: 1.5,
  },
  h6: {
    fontWeight: 500,
    fontSize: "1rem", // 16px
    lineHeight: 1.5,
  },
  subtitle1: {
    fontWeight: 500,
    fontSize: "1.125rem", // 18px
    lineHeight: 1.5,
  },
  subtitle2: {
    fontWeight: 500,
    fontSize: "1rem", // 16px
    lineHeight: 1.5,
  },
  body1: {
    fontWeight: 400,
    fontSize: "1rem", // 16px
    lineHeight: 1.6,
  },
  body2: {
    fontWeight: 400,
    fontSize: "0.875rem", // 14px
    lineHeight: 1.5,
  },
  caption: {
    fontWeight: 400,
    fontSize: "0.75rem", // 12px
    lineHeight: 1.4,
    color: "#666666",
  },
  button: {
    fontWeight: 600,
    fontSize: "1rem",
    textTransform: "none" as const,
  },
} as const;

// ========== COMPONENTES ==========
const components: Components<Theme> = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        padding: "10px 24px",
        fontWeight: 600,
        textTransform: "none" as const,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          transform: "translateY(-2px)",
        },
      },
      contained: {
        boxShadow: "none",
        "&:hover": {
          boxShadow: "0 4px 12px rgba(204, 99, 51, 0.25)",
        },
      },
      outlined: {
        borderWidth: "2px",
        "&:hover": {
          backgroundColor: "rgba(204, 99, 51, 0.08)",
          borderWidth: "2px",
        },
      },
      sizeLarge: {
        padding: "12px 32px",
        fontSize: "1.125rem",
      },
      sizeSmall: {
        padding: "6px 16px",
        fontSize: "0.875rem",
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
          transform: "translateY(-4px)",
        },
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      rounded: {
        borderRadius: 12,
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        "& .MuiOutlinedInput-root": {
          borderRadius: 8,
          "&:hover fieldset": {
            borderColor: "#CC6333",
          },
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        fontWeight: 600,
        borderRadius: 8,
      },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: 12,
      },
    },
  },
  MuiBottomNavigation: {
    styleOverrides: {
      root: {
        height: 64,
        borderTop: '1px solid #ECECEC'
      }
    }
  },
  MuiBottomNavigationAction: {
    styleOverrides: {
      root: {
        minWidth: 'auto',
        padding: '6px 12px',
        '&.Mui-selected': {
          color: '#CC6333',
        }
      },
      label: {
        fontSize: '0.75rem',
        fontWeight: 600,
        '&.Mui-selected': {
          fontSize: '0.75rem',
          fontWeight: 700
        }
      }
    }
  },
};

// ========== TEMA PRINCIPAL ==========
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

// ==========================================
// CÓMO USAR EN TU APP
// ==========================================
/*
// App.tsx
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { theme } from './theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <YourComponent />
    </ThemeProvider>
  );
}
*/