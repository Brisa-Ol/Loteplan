import { createTheme } from "@mui/material/styles";

// Tipografía y Tamaños
export const FormTitle = createTheme({
  palette: {
    primary: {
      main: "#CC6333", // color principal para botones y accents
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#ECECEC", // color de navbar / fondos claros
      contrastText: "#000000",
    },
    text: {
      primary: "#000000",
      secondary: "#333333",
    },
    background: {
      default: "#FFFFFF",
      paper: "#ECECEC",
    },
  },
  typography: {
    fontFamily: "Inter, sans-serif",

    h1: { fontWeight: 700, fontSize: "3rem", lineHeight: 1.2 },
    h2: { fontWeight: 600, fontSize: "2rem", lineHeight: 1.3 },
    h3: { fontWeight: 600, fontSize: "1.5rem", lineHeight: 1.4 },
    h4: { fontWeight: 600, fontSize: "1.25rem", lineHeight: 1.4 },
    h5: { fontWeight: 500, fontSize: "1.125rem", lineHeight: 1.5 },
    h6: { fontWeight: 500, fontSize: "1rem", lineHeight: 1.5 },

    subtitle1: { fontWeight: 500, fontSize: "1.125rem", lineHeight: 1.5 },
    subtitle2: { fontWeight: 500, fontSize: "1rem", lineHeight: 1.5 },

    body1: { fontWeight: 400, fontSize: "1rem", lineHeight: 1.6 },
    body2: { fontWeight: 400, fontSize: "0.875rem", lineHeight: 1.5 },
    caption: { fontWeight: 400, fontSize: "0.75rem", lineHeight: 1.4, color: "#666666" },

    button: { fontWeight: 600, fontSize: "1rem", textTransform: "none" },
  },
});

export default FormTitle;
