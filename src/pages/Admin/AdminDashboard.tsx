// src/pages/Admin/AdminDashboard.tsx (Fusionado y Corregido)
import React, { useState } from 'react';
import {
  Container, Box, Typography, Grid, Paper, Tabs, Tab,
  Card, CardContent, Avatar, Stack, TextField, Button,
  InputAdornment, TableContainer, Table, TableHead, TableRow,
  TableCell, TableBody, Chip, Tooltip, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, MenuItem,
  CircularProgress, Snackbar, Alert, DialogContentText,
  LinearProgress // ❗ Añadido
} from '@mui/material';
import {
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  VerifiedUser as VerifiedUserIcon,
  Security as SecurityIcon,
  PendingActions as PendingActionsIcon,
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LockOpen as LockOpenIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  Assessment as AssessmentIcon, // ❗ Añadido
  TrendingUp as TrendingUpIcon  // ❗ Añadido
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
         Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'; // ❗ Añadido

import { PageContainer, PageHeader, SectionTitle } from '../../components/common';
import { QueryHandler } from '../../components/common/QueryHandler/QueryHandler';

// 1. Importamos TODOS los servicios necesarios
import * as usuarioService from '../../Services/usuario.service';
import kycService from '../../Services/kyc.service';
import proyectoService from '../../Services/proyecto.service'; // ❗ Añadido

// 2. Importamos DTOs y Modales
import type { UpdateUserByAdminDTO, CreateUsuarioDTO } from '../../types/dto/usuario.dto';
import type { KycDTO, RejectKYCDTO } from '../../types/dto/kyc.dto';
// ❗ Importamos TODOS los tipos de User y Métricas
import type { User, CompletionRateDTO, MonthlyProgressItem } from '../../types/auth.types';
import { AdminBreadcrumbs } from '../../components/layout/AdminBreadcrumbs';
import CreateUserModal from '../../components/Admin/Users/CreateUserModal';
import EditUserModal from '../../components/Admin/Users/EditUserModal';
import KYCDetailsModal from '../../components/Admin/KYC/KYCDetailsModal';
import { useNavigate } from 'react-router-dom';

// Colores para gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

// Componente de Barra de Progreso (para KPIs)
interface LinearProgressWithLabelProps {
  value: number;
}
const LinearProgressWithLabel: React.FC<LinearProgressWithLabelProps> = ({ value }) => (
  <Box sx={{ display: 'flex', alignItems: 'center' }}>
    <Box sx={{ width: '100%', mr: 1 }}>
      <LinearProgress variant="determinate" value={value} sx={{ height: 8, borderRadius: 5 }} />
    </Box>
    <Box sx={{ minWidth: 35 }}>
      <Typography variant="body2" color="text.secondary">{`${Math.round(value)}%`}</Typography>
    </Box>
  </Box>
);

// ════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0); // ❗ Pestaña 0 por defecto (Dashboard)
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modales de Usuario
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Modal de KYC
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [selectedKyc, setSelectedKyc] = useState<KycDTO | null>(null);
  
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });
  
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // ══════════════════════════════════════════════════════════
  // QUERIES (Fusionadas)
  // ══════════════════════════════════════════════════════════
  
  // Query para Usuarios (Estadísticas y Pestaña 1)
  const { data: users = [], isLoading: loadingUsers, error: usersError } = useQuery<User[], Error>({
    queryKey: ['adminAllUsers'],
    queryFn: usuarioService.getAllUsuarios
  });
  
  // Query para KYC (Estadísticas y Pestaña 2)
  const { data: pendingKYC = [], isLoading: loadingKYC, error: kycError } = useQuery<KycDTO[], Error>({
    queryKey: ['pendingKYC'],
    queryFn: kycService.getPendingVerifications
  });

  // Query para Tasa de Culminación (Pestaña 0 - KPIs)
  const { data: completionRate, isLoading: isLoadingCompletion, error: errorCompletion } = useQuery<CompletionRateDTO, Error>({
    queryKey: ['completionRate'],
    queryFn: proyectoService.getCompletionRate, // ❗ Usa el servicio de proyecto
  });

  // Query para Avance Mensual (Pestaña 0 - KPIs)
  const { data: monthlyProgress = [], isLoading: isLoadingProgress, error: errorProgress } = useQuery<MonthlyProgressItem[], Error>({
    queryKey: ['monthlyProgress'],
    queryFn: proyectoService.getMonthlyProgress, // ❗ Usa el servicio de proyecto
  });

  const isLoading = loadingUsers || loadingKYC || isLoadingCompletion || isLoadingProgress;
  const queryError = usersError || kycError || errorCompletion || errorProgress;
  
  // ══════════════════════════════════════════════════════════
  // MUTACIONES (Usuarios y KYC)
  // ══════════════════════════════════════════════════════════

  const createMutation = useMutation({
    mutationFn: (data: CreateUsuarioDTO) => usuarioService.createUsuario(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllUsers'] });
      setSnackbar({ open: true, message: 'Usuario creado correctamente', severity: 'success' });
      setCreateModalOpen(false);
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error?.response?.data?.error || 'Error al crear usuario', severity: 'error' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserByAdminDTO }) => 
      usuarioService.updateUsuarioByAdmin(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllUsers'] });
      setSnackbar({ open: true, message: 'Usuario actualizado correctamente', severity: 'success' });
      setEditModalOpen(false);
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error?.response?.data?.error || 'Error al actualizar usuario', severity: 'error' });
    }
  });
  
  const deleteMutation = useMutation({
    mutationFn: (id: string) => usuarioService.deleteUsuario(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllUsers'] });
      setSnackbar({ open: true, message: 'Usuario desactivado correctamente', severity: 'success' });
      setDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error?.response?.data?.error || 'Error al desactivar usuario', severity: 'error' });
    }
  });
  
  const reset2FAMutation = useMutation({
    mutationFn: (id: string) => usuarioService.reset2FA(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminAllUsers'] });
      setSnackbar({ open: true, message: data.message || '2FA reiniciado', severity: 'success' });
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error?.response?.data?.error || 'Error al reiniciar 2FA', severity: 'error' });
    }
  });

  const approveKycMutation = useMutation({
    mutationFn: (id: number) => kycService.approveVerification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingKYC'] });
      setSnackbar({ open: true, message: 'KYC Aprobado', severity: 'success' });
      setKycModalOpen(false);
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error?.response?.data?.error || 'Error al aprobar KYC', severity: 'error' });
    }
  });

  const rejectKycMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: RejectKYCDTO }) => 
      kycService.rejectVerification(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingKYC'] });
      setSnackbar({ open: true, message: 'KYC Rechazado', severity: 'warning' });
      setKycModalOpen(false);
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error?.response?.data?.error || 'Error al rechazar KYC', severity: 'error' });
    }
  });
  
  // ══════════════════════════════════════════════════════════
  // DATOS PROCESADOS (Filtrado y Estadísticas)
  // ══════════════════════════════════════════════════════════
  
  const filteredUsers = users.filter(user =>
    user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.nombre_usuario.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.activo).length,
    confirmedEmails: users.filter(u => u.confirmado_email).length,
    with2FA: users.filter(u => u.is_2fa_enabled).length,
    pendingKYC: pendingKYC.length,
    // Métricas de Proyecto
    tasaCulminacion: completionRate?.tasa_culminacion ?? "0",
    totalFinalizados: completionRate?.total_finalizados ?? 0,
    totalIniciados: completionRate?.total_iniciados ?? 0,
    proyectosMensuales: monthlyProgress.length,
    proyectosEnProceso: monthlyProgress.filter(p => p.estado === 'En proceso').length,
    proyectosEnEspera: monthlyProgress.filter(p => p.estado === 'En Espera').length
  };

  // Datos para gráficos
  const chartDataSuscripciones = monthlyProgress.map(p => ({
    nombre: p.nombre.length > 15 ? p.nombre.substring(0, 15) + '...' : p.nombre,
    avance: parseFloat(p.porcentaje_avance),
    meta: p.meta_suscripciones,
    actuales: p.suscripciones_actuales,
  }));

  const estadosData = [
    { name: 'En Proceso', value: stats.proyectosEnProceso },
    { name: 'En Espera', value: stats.proyectosEnEspera },
    { name: 'Finalizados', value: stats.totalFinalizados },
  ].filter(item => item.value > 0);
  
  // ══════════════════════════════════════════════════════════
  // HANDLERS (Modales)
  // ══════════════════════════════════════════════════════════
  
  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };
  
  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (selectedUser) {
      deleteMutation.mutate(selectedUser.id.toString());
    }
  };

  const handleCreateSubmit = async (data: CreateUsuarioDTO) => {
    await createMutation.mutateAsync(data);
  };

  const handleEditSubmit = async (id: number, data: UpdateUserByAdminDTO) => {
    await updateMutation.mutateAsync({ id: id.toString(), data });
  };

  const handleViewKyc = (kyc: KycDTO) => {
    setSelectedKyc(kyc);
    setKycModalOpen(true);
  };
  
  const handleApproveKyc = async (id: number) => {
    await approveKycMutation.mutateAsync(id);
  };
  
  const handleRejectKyc = async (id: number, data: RejectKYCDTO) => {
    await rejectKycMutation.mutateAsync({ id, data });
  };
  
  return (
    <PageContainer maxWidth="xl" sx={{ py: 4 }}>
      <AdminBreadcrumbs />
      <PageHeader
        title="Panel de Administración"
        subtitle="Gestión completa de usuarios, KYC y métricas de proyectos."
      />
      
      {/* ❗ Tarjetas de Estadísticas (SIN Grid item) */}
      <Grid container sx={{ mb: 4 }}>
        <Box sx={{ width: { xs: '100%', sm: '50%', md: '20%' }, p: 1.5 }}>
          <Card elevation={2} sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 }, height: '100%' }} onClick={() => setActiveTab(1)}>
            <CardContent><Stack direction="row" alignItems="center" spacing={2}><Avatar sx={{ bgcolor: 'primary.main' }}><PersonIcon /></Avatar><Box><Typography variant="h4" fontWeight="bold">{stats.totalUsers}</Typography><Typography variant="body2" color="text.secondary">Total Usuarios</Typography></Box></Stack></CardContent>
          </Card>
        </Box>
        <Box sx={{ width: { xs: '100%', sm: '50%', md: '20%' }, p: 1.5 }}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent><Stack direction="row" alignItems="center" spacing={2}><Avatar sx={{ bgcolor: 'success.main' }}><CheckCircleIcon /></Avatar><Box><Typography variant="h4" fontWeight="bold">{stats.activeUsers}</Typography><Typography variant="body2" color="text.secondary">Activos</Typography></Box></Stack></CardContent>
          </Card>
        </Box>
        <Box sx={{ width: { xs: '100%', sm: '50%', md: '20%' }, p: 1.5 }}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent><Stack direction="row" alignItems="center" spacing={2}><Avatar sx={{ bgcolor: 'info.main' }}><VerifiedUserIcon /></Avatar><Box><Typography variant="h4" fontWeight="bold">{stats.confirmedEmails}</Typography><Typography variant="body2" color="text.secondary">Email Confirmado</Typography></Box></Stack></CardContent>
          </Card>
        </Box>
        <Box sx={{ width: { xs: '100%', sm: '50%', md: '20%' }, p: 1.5 }}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent><Stack direction="row" alignItems="center" spacing={2}><Avatar sx={{ bgcolor: 'warning.main' }}><SecurityIcon /></Avatar><Box><Typography variant="h4" fontWeight="bold">{stats.with2FA}</Typography><Typography variant="body2" color="text.secondary">Con 2FA</Typography></Box></Stack></CardContent>
          </Card>
        </Box>
        <Box sx={{ width: { xs: '100%', sm: '50%', md: '20%' }, p: 1.5 }}>
          <Card elevation={2} sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 }, height: '100%' }} onClick={() => setActiveTab(2)}>
            <CardContent><Stack direction="row" alignItems="center" spacing={2}><Avatar sx={{ bgcolor: 'error.main' }}><PendingActionsIcon /></Avatar><Box><Typography variant="h4" fontWeight="bold">{stats.pendingKYC}</Typography><Typography variant="body2" color="text.secondary">KYC Pendientes</Typography></Box></Stack></CardContent>
          </Card>
        </Box>
      </Grid>
      
      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="fullWidth">
          <Tab label="Dashboard (KPIs)" />
          <Tab label="Gestión de Usuarios" />
          <Tab label={`Verificaciones KYC (${stats.pendingKYC})`} />
        </Tabs>
      </Paper>
      
      <QueryHandler isLoading={isLoading} error={queryError as Error | null} fullHeight>
        <>
          {/* ═══════════════════════════════════════════ */}
          {/* TAB 0: DASHBOARD (MÉTRICAS) */}
          {/* ═══════════════════════════════════════════ */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} lg={8}>
                <Paper elevation={2} sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <AssessmentIcon color="primary" />
                    <Typography variant="h6" fontWeight="bold">
                      Avance de Suscripciones por Proyecto (KPI 5)
                    </Typography>
                  </Box>
                  {monthlyProgress.length === 0 ? (
                    <Alert severity="info">No hay proyectos mensuales activos para mostrar.</Alert>
                  ) : (
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={chartDataSuscripciones}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="nombre" />
                        <YAxis />
                        <RechartsTooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <Paper sx={{ p: 1.5, border: '1px solid #ccc' }}>
                                  <Typography variant="body2" fontWeight="bold">{data.nombre}</Typography>
                                  <Typography variant="caption" color="text.secondary">Avance: {data.avance.toFixed(2)}%</Typography>
                                  <br />
                                  <Typography variant="caption" color="text.secondary">
                                    Suscripciones: {data.actuales} / {data.meta}
                                  </Typography>
                                </Paper>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend />
                        <Bar dataKey="avance" fill="#0088FE" name="% Avance" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12} lg={4}>
                <Paper elevation={2} sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <TrendingUpIcon color="primary" />
                    <Typography variant="h6" fontWeight="bold">Distribución de Estados</Typography>
                  </Box>
                  {estadosData.length === 0 ? (
                    <Alert severity="info">No hay datos disponibles.</Alert>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={estadosData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {estadosData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper elevation={2} sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Detalle de Proyectos Mensuales
                  </Typography>
                  {monthlyProgress.length === 0 ? (
                    <Alert severity="info">No hay proyectos mensuales activos.</Alert>
                  ) : (
                    <Stack spacing={2} sx={{ mt: 2 }}>
                      {monthlyProgress.map((proyecto) => {
                        const porcentaje = parseFloat(proyecto.porcentaje_avance);
                        const color = porcentaje >= 100 ? 'success' : porcentaje >= 50 ? 'primary' : porcentaje >= 25 ? 'warning' : 'error';
                        return (
                          <Box key={proyecto.id}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body1" fontWeight={600}>{proyecto.nombre}</Typography>
                                <Chip label={proyecto.estado} size="small" color={proyecto.estado === 'En proceso' ? 'success' : 'warning'} />
                              </Box>
                              <Typography variant="body2" fontWeight={500}>
                                {proyecto.suscripciones_actuales} / {proyecto.meta_suscripciones} suscripciones
                              </Typography>
                            </Stack>
                            <LinearProgress variant="determinate" value={Math.min(porcentaje, 100)} color={color} sx={{ height: 8, borderRadius: 1 }} />
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                              {porcentaje.toFixed(2)}% completado
                            </Typography>
                          </Box>
                        );
                      })}
                    </Stack>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}
          
          {/* ═══════════════════════════════════════════ */}
          {/* TAB 1: GESTIÓN DE USUARIOS */}
          {/* ═══════════════════════════════════════════ */}
          {activeTab === 1 && (
            <Paper elevation={2} sx={{ p: 3, overflow: 'hidden' }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  placeholder="Buscar por nombre, email o usuario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>)
                  }}
                />
                <Button 
                  variant="contained" 
                  startIcon={<PersonAddIcon />} 
                  sx={{ minWidth: 180 }}
                  onClick={() => setCreateModalOpen(true)}
                >
                  Nuevo Usuario
                </Button>
              </Stack>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Usuario</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Rol</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>2FA</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} hover>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Avatar sx={{ width: 32, height: 32 }}>{user.nombre[0]}</Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">{user.nombre} {user.apellido}</Typography>
                              <Typography variant="caption" color="text.secondary">@{user.nombre_usuario}</Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell><Chip label={user.rol} size="small" color={user.rol === 'admin' ? 'secondary' : 'default'} /></TableCell>
                        <TableCell><Chip icon={user.activo ? <CheckCircleIcon /> : <CancelIcon />} label={user.activo ? 'Activo' : 'Inactivo'} size="small" color={user.activo ? 'success' : 'default'} /></TableCell>
                        <TableCell>{user.confirmado_email ? '✅' : '❌'}</TableCell>
                        <TableCell>{user.is_2fa_enabled ? '🔒' : '🔓'}</TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0} justifyContent="center">
                            <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => handleEdit(user)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                            {user.is_2fa_enabled && (
                              <Tooltip title="Resetear 2FA"><IconButton size="small" color="warning" onClick={() => reset2FAMutation.mutate(user.id.toString())} disabled={reset2FAMutation.isPending}><LockOpenIcon fontSize="small" /></IconButton></Tooltip>
                            )}
                            <Tooltip title="Desactivar"><IconButton size="small" color="error" onClick={() => handleDelete(user)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
          
          {/* ═══════════════════════════════════════════ */}
          {/* TAB 2: VERIFICACIONES KYC */}
          {/* ═══════════════════════════════════════════ */}
          {activeTab === 2 && (
            <Paper elevation={2} sx={{ p: 3, overflow: 'hidden' }}>
              <Typography variant="h6" gutterBottom>
                Verificaciones KYC Pendientes
              </Typography>
              
              {pendingKYC.length === 0 ? (
                <Alert severity="info">No hay verificaciones pendientes</Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Nombre</TableCell>
                        <TableCell>Tipo Doc</TableCell>
                        <TableCell>Número</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell align="center">Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pendingKYC.map((kyc: KycDTO) => (
                        <TableRow key={kyc.id} hover>
                          <TableCell>{kyc.nombre_completo}</TableCell>
                          <TableCell>{kyc.tipo_documento}</TableCell>
                          <TableCell>{kyc.numero_documento}</TableCell>
                          <TableCell><Chip label={kyc.estado_verificacion} size="small" color="warning" /></TableCell>
                          <TableCell align="center">
                            <Button 
                              size="small" 
                              variant="outlined" 
                              sx={{ mr: 1 }}
                              startIcon={<VisibilityIcon />}
                              onClick={() => handleViewKyc(kyc)}
                            >
                              Ver Detalles
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          )}
        </>
      </QueryHandler>
        
      {/* ═══════════════════════════════════════════════ */}
      {/* MODALES */}
      {/* ═══════════════════════════════════════════════ */}
        
      <CreateUserModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
        isLoading={createMutation.isPending}
      />
      
      <EditUserModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        user={selectedUser}
        onSubmit={handleEditSubmit}
        isLoading={updateMutation.isPending}
      />

      <KYCDetailsModal
        open={kycModalOpen}
        onClose={() => setKycModalOpen(false)}
        kyc={selectedKyc}
        onApprove={handleApproveKyc}
        onReject={handleRejectKyc}
        isLoading={approveKycMutation.isPending || rejectKycMutation.isPending}
      />
      
      {/* Dialog de eliminación */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Desactivación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas desactivar al usuario 
            <strong> {selectedUser?.nombre} {selectedUser?.apellido}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={confirmDelete} variant="contained" color="error" disabled={deleteMutation.isPending}>
             {deleteMutation.isPending ? <CircularProgress size={24} /> : 'Desactivar'}
          </Button>
        </DialogActions>
      </Dialog>
        
      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
};

export default AdminDashboard;