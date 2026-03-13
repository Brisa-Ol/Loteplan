// src/App.tsx

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import { AuthProvider } from './core/context/AuthContext';
import { SnackbarProvider } from './core/context/SnackbarContext';
import theme from './core/theme/globalStyles';
import AppRouter from './routes/AppRouter';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <SnackbarProvider>
            <AuthProvider>
              <AppRouter />
            </AuthProvider>
          </SnackbarProvider>
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;