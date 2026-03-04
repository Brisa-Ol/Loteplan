import { Alert, Box, CircularProgress, Skeleton, Stack, Typography, Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import React from 'react';

// ✅ SKELETON PARA TABLAS (Admin)
export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
    <Table>
      <TableHead sx={{ bgcolor: 'action.hover' }}>
        <TableRow>
          {[...Array(5)].map((_, i) => (
            <TableCell key={i}><Skeleton variant="text" width="80%" height={25} /></TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {[...Array(rows)].map((_, i) => (
          <TableRow key={i}>
            {[...Array(5)].map((_, j) => (
              <TableCell key={j}><Skeleton variant="text" width="60%" /></TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

// ✅ tu ProjectCardSkeleton (Inversores)
export const ProjectCardSkeleton: React.FC = () => (
  <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
    <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2, mb: 2 }} animation="wave" />
    <Skeleton variant="text" height={30} width="80%" sx={{ mb: 1 }} animation="wave" />
    <Skeleton variant="text" height={20} width="100%" animation="wave" />
    <Skeleton variant="text" height={20} width="60%" sx={{ mb: 2 }} animation="wave" />
    <Stack direction="row" justifyContent="space-between">
      <Skeleton variant="circular" width={30} height={30} />
      <Skeleton variant="rectangular" width={100} height={30} sx={{ borderRadius: 1 }} />
    </Stack>
  </Box>
);

interface QueryHandlerProps {
  isLoading: boolean;
  error: Error | null;
  children: React.ReactNode;
  loadingMessage?: string;
  errorMessage?: string;
  noLoader?: boolean;
  fullHeight?: boolean;
  useSkeleton?: boolean;
  skeletonCount?: number;
  // ✅ NUEVA MEJORA: Variante del skeleton
  skeletonVariant?: 'card' | 'table';
}

export const QueryHandler: React.FC<QueryHandlerProps> = ({
  isLoading,
  error,
  children,
  loadingMessage = "Cargando datos...",
  errorMessage,
  noLoader = false,
  fullHeight = false,
  useSkeleton = false,
  skeletonCount = 6,
  skeletonVariant = 'card'
}) => {

  if (isLoading) {
    if (noLoader) return null;

    if (useSkeleton) {
      if (skeletonVariant === 'table') return <TableSkeleton rows={skeletonCount} />;
      
      return (
        <Box sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
          gap: 3, width: "100%"
        }}>
          {[...Array(skeletonCount)].map((_, index) => <ProjectCardSkeleton key={index} />)}
        </Box>
      );
    }

    return (
      <Box sx={{
        display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
        minHeight: fullHeight ? "100vh" : "40vh",
      }}>
        <CircularProgress size={40} thickness={4} />
        <Typography variant="body2" sx={{ mt: 2, color: "text.secondary", fontWeight: 500 }}>
          {loadingMessage}
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 4, px: 2, maxWidth: 600, mx: "auto" }}>
        <Alert severity="error" variant="filled" sx={{ borderRadius: 2 }}>
          {errorMessage || error.message || "No se pudieron cargar los datos."}
        </Alert>
      </Box>
    );
  }

  return <>{children}</>;
};