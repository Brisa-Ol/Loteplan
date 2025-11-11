// src/pages/AdminDashboard.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import adminService from '../../Services/admin.service';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Divider,
  Stack,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

// ──────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ──────────────────────────────────────────────────────────

const AdminDashboard: React.FC = () => {
  const {
    data: users,
    isLoading: isLoadingUsers,
    error: errorUsers,
  } = useQuery({
    queryKey: ['users'],
    queryFn: adminService.getAllUsers,
  });

  if (isLoadingUsers) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (errorUsers) {
    return (
      <Box textAlign="center" mt={4}>
        <Typography color="error">⚠️ Error al cargar los usuarios.</Typography>
      </Box>
    );
  }

  // ── Cálculos agregados ──────────────────────────────
  const totalUsers = users?.length ?? 0;
  const confirmedUsers = users?.filter(u => u.email_confirmado).length ?? 0;
  const unconfirmedUsers = totalUsers - confirmedUsers;
  const twoFAEnabled = users?.filter(u => u.is_2fa_enabled).length ?? 0;
  const twoFADisabled = totalUsers - twoFAEnabled;

  // ──────────────────────────────────────────────────────────
  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Panel de Administración
      </Typography>

      <Divider sx={{ mb: 3 }} />

      {/* ────── Estadísticas resumidas ────── */}
      <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          👥 Resumen de Usuarios
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={2}>
          <Typography>Total: {totalUsers}</Typography>
          <Typography color="success.main">Confirmados: {confirmedUsers}</Typography>
          <Typography color="warning.main">Sin confirmar: {unconfirmedUsers}</Typography>
          <Typography color="info.main">2FA activo: {twoFAEnabled}</Typography>
          <Typography color="text.secondary">2FA inactivo: {twoFADisabled}</Typography>
        </Box>
      </Paper>

      {/* ────── Tabla de Usuarios ────── */}
      <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          📋 Lista de Usuarios
        </Typography>

        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Usuario</TableCell>
              <TableCell>Confirmado</TableCell>
              <TableCell>2FA</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {users?.map(user => (
              <TableRow key={user.id} hover>
                <TableCell>{`${user.nombre} ${user.apellido}`}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.nombre_usuario}</TableCell>
                <TableCell>
                  {user.email_confirmado ? '✅' : '❌'}
                </TableCell>
                <TableCell>
                  {user.is_2fa_enabled ? '🔒' : '🔓'}
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Editar usuario">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => console.log('Editar', user.id)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default AdminDashboard;
