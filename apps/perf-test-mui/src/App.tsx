import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, AppBar, Toolbar, Typography, Box, Tabs, Tab, Container } from '@mui/material';
import { store } from './store/store';
import { UsersDashboard } from './pages/UsersDashboard';
import { StressTest } from './pages/StressTest';

/**
 * MUI theme configuration
 */
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

/**
 * Navigation tabs component
 */
function NavigationTabs() {
  const location = useLocation();

  return (
    <Tabs value={location.pathname} textColor="inherit" indicatorColor="secondary">
      <Tab label="Users Dashboard" value="/" component={Link} to="/" />
      <Tab label="Stress Test" value="/stress" component={Link} to="/stress" />
    </Tabs>
  );
}

/**
 * Main app layout with navigation
 */
function AppLayout() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            AutoTracer Performance Test
          </Typography>
          <NavigationTabs />
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ flexGrow: 1, mt: 2, mb: 2 }}>
        <Routes>
          <Route path="/" element={<UsersDashboard />} />
          <Route path="/stress" element={<StressTest />} />
        </Routes>
      </Container>
    </Box>
  );
}

/**
 * Root App component with providers
 */
export function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}
