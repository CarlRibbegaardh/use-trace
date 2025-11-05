"use client";

import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { store } from '../store/store';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

interface ClientProvidersProps {
  children: ReactNode;
}

/**
 * Client-side providers for Redux store and MUI theme.
 * This component wraps the app with necessary providers that require client-side JavaScript.
 */
export default function ClientProviders({ children }: ClientProvidersProps): JSX.Element {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </Provider>
  );
}
