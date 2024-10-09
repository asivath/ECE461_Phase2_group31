import { ThemeOptions, createTheme } from "@mui/material/styles";

const themeOptions: ThemeOptions = {
  palette: {
    mode: "light",
    primary: {
      main: "#234380"
    },
    secondary: {
      main: "#805f23"
    },
    error: {
      main: "#d32f2f"
    },
    warning: {
      main: "#ed6c02"
    },
    info: {
      main: "#0288d1"
    },
    success: {
      main: "#2e7d32"
    },
    divider: "rgba(0, 0, 0, 0.12)"
  }
};

export const theme = createTheme(themeOptions);
