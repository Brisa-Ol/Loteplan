import { createTheme } from "@mui/material/styles";
import FormTitle from "../theme/FormTitle";

// Tema de botones con tipografía heredada
export const FormButton = createTheme({
  ...FormTitle,
  palette: {
    ...FormTitle.palette,
    primary: { main: "#CC6333", contrastText: "#ffffff" }, // Botones naranjas
    secondary: { main: "#F6F6F6", contrastText: "#000000" }, // Navbar y fondos
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: "10px 24px",
          fontWeight: 600,
          transition: "all 0.2s ease-in-out",
          textTransform: "none",
        },
        contained: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0 4px 12px rgba(204, 99, 51, 0.25)",
            backgroundColor: "#CC6333",
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
        sizeLarge: { padding: "12px 32px", fontSize: "1.125rem" },
        sizeSmall: { padding: "6px 16px", fontSize: "0.875rem" },
      },
    },
  },
});

export default FormButton;
