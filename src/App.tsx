// src/App.tsx
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';

// Contexts
import { AuthProvider } from './core/context/AuthContext';
import { SnackbarProvider } from './core/context/SnackbarContext';

// Utils & Hooks
import useSnackbar from './shared/hooks/useSnackbar';
import { setGlobalSnackbar } from './shared/utils/snackbarUtils';

// Theme
import theme from './core/theme';

// Router
import AppRouter from './routes/AppRouter';

// Configuración de React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

/**
 * Puente entre Axios interceptors y React Context.
 * Permite que las llamadas API muestren snackbars automáticamente.
 */
const GlobalSnackbarConfigurator: React.FC = () => {
  const { showSuccess, showError, showInfo } = useSnackbar();

  useEffect(() => {
    setGlobalSnackbar((msg, type) => {
      switch (type) {
        case 'success':
          showSuccess(msg);
          break;
        case 'error':
          showError(msg);
          break;
        case 'warning':
        case 'info':
          showInfo(msg);
          break;
        default:
          showInfo(msg);
      }
    });
  }, [showSuccess, showError, showInfo]);

  return null;
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider>
        <GlobalSnackbarConfigurator />
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <AppRouter />
            </AuthProvider>
            {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
          </QueryClientProvider>
        </BrowserRouter>
      </SnackbarProvider>
    </ThemeProvider>
  );
};

export default App;