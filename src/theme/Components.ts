import type { Components, Theme } from "@mui/material/styles";


export const components: Components<Theme> = {
  // Botones personalizados
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        padding: "10px 24px",
        fontWeight: 600,
        textTransform: "none",
        transition: "all 0.3s ease",
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
        borderColor: "#CC6333",
        color: "#CC6333",
        "&:hover": {
          backgroundColor: "rgba(204, 99, 51, 0.08)",
          borderColor: "#CC6333",
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

  // Cards con efecto hover
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
        transition: "all 0.3s ease",
        "&:hover": {
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
          transform: "translateY(-4px)",
        },
      },
    },
  },

  // Inputs con bordes redondeados
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

  // AppBar con sombra sutil
  MuiAppBar: {
    styleOverrides: {
      root: {
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
      },
    },
  },
};