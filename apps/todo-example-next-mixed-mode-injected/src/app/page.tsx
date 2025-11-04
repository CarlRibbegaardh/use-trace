import React from "react";
import {
  Container,
  Typography,
  AppBar,
  Toolbar,
  Box,
} from "@mui/material";
import TodoAppClient from "../components/TodoAppClient";

/**
 * Server Component for the main todo application page.
 * Renders static content on the server and includes client components for interactivity.
 */
export default function HomePage(): JSX.Element {
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Todo App - Mixed Mode (SSR + Client Components)
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom data-testid="home-title">
            Todo Application
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" paragraph>
            This is a Server Component that renders static content on the server.
            Interactive components below are Client Components that run in the browser.
          </Typography>
        </Box>

        {/* Client-side interactive components */}
        <TodoAppClient />
      </Container>
    </>
  );
}
