import React from "react";
import {
  Container,
  Typography,
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Box,
} from "@mui/material";
import { BuiltCounter as BuiltCounterDep } from "todo-example-monorepo-lib-built-dep-vite5-react18";
import { BuiltCounter as BuiltCounterNoDep } from "todo-example-monorepo-lib-built-nodep-vite5-react18";
import { SourceGreeting } from "todo-example-monorepo-lib-source-vite5-react18";

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
});

const ExampleApp: React.FC = () => {
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div">
            Monorepo Workspace Libraries Demo
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom textAlign="center">
          Workspace Libraries Demo
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          textAlign="center"
          sx={{ mb: 4 }}
        >
          This app demonstrates using components from both built and source
          workspace libraries.
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <BuiltCounterDep />
          <BuiltCounterNoDep />
          <SourceGreeting />
        </Box>
      </Container>
    </>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ExampleApp />
    </ThemeProvider>
  );
}

export default App;
