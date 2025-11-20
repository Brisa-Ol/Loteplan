// src/pages/Admin/AdminDashboard.tsx
// (CORREGIDO: Se eliminan las tarjetas de stats de usuarios)

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Avatar,
  Stack,
  Snackbar,
  Alert,
  LinearProgress,
  useTheme,
  Chip,
} from '@mui/material';
import {
  PendingActions as PendingActionsIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';


// Se elimina import de User
import type { KycDTO } from '../../types/dto/kyc.dto';
import { PageContainer } from '../../components/common/PageContainer/PageContainer';
import { PageHeader } from '../../components/common/PageHeader/PageHeader';
import { QueryHandler } from '../../components/common/QueryHandler/QueryHandler';
import proyectoService from '../../Services/proyecto.service';
import kycService from '../../Services/kyc.service';

// ════════════════════════════════════════════════════════════
// TIPOS DE MÉTRICAS
// ════════════════════════════════════════════════════════════

interface CompletionRateDTO {
  tasa_culminacion: string;
  total_finalizados: number;
  total_iniciados: number;
}

interface MonthlyProgressItem {
  id: number;
  nombre: string;
  estado: 'En proceso' | 'En Espera' | 'Finalizado';
  meta_suscripciones: number;
  suscripciones_actuales: number;
  porcentaje_avance: string;
}

// ════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  // ══════════════════════════════════════════════════════════
  // QUERIES - (Se elimina la query de usuarios)
  // ══════════════════════════════════════════════════════════

  const {
    data: pendingKYC = [],
    isLoading: loadingKYC,
    error: kycError,
  } = useQuery<KycDTO[], Error>({
    queryKey: ['pendingKYC'],
    queryFn: kycService.getPendingVerifications,
  });

  const {
    data: completionRate,
    isLoading: isLoadingCompletion,
    error: errorCompletion,
  } = useQuery<CompletionRateDTO, Error>({
    queryKey: ['completionRate'],
    queryFn: proyectoService.getCompletionRate,
  });

  const {
    data: monthlyProgress = [],
    isLoading: isLoadingProgress,
    error: errorProgress,
  } = useQuery<MonthlyProgressItem[], Error>({
    queryKey: ['monthlyProgress'],
    queryFn: proyectoService.getMonthlyProgress,
  });

  const isLoading =
    loadingKYC || isLoadingCompletion || isLoadingProgress;
  const queryError = kycError || errorCompletion || errorProgress;

  // ══════════════════════════════════════════════════════════
  // DATOS PROCESADOS (Se eliminan stats de usuarios)
  // ══════════════════════════════════════════════════════════

  const RECHART_COLORS = [
    theme.palette.primary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
  ];

  const stats = {
    pendingKYC: pendingKYC.length,
    proyectosEnProceso: monthlyProgress.filter((p) => p.estado === 'En proceso')
      .length,
    proyectosEnEspera: monthlyProgress.filter((p) => p.estado === 'En Espera')
      .length,
    totalFinalizados: completionRate?.total_finalizados ?? 0,
  };

  const chartDataSuscripciones = monthlyProgress.map((p) => ({
    nombre: p.nombre.length > 15 ? p.nombre.substring(0, 15) + '...' : p.nombre,
    avance: parseFloat(p.porcentaje_avance),
    meta: p.meta_suscripciones,
    actuales: p.suscripciones_actuales,
  }));

  const estadosData = [
    { name: 'En Proceso', value: stats.proyectosEnProceso },
    { name: 'En Espera', value: stats.proyectosEnEspera },
    { name: 'Finalizados', value: stats.totalFinalizados },
  ].filter((item) => item.value > 0);

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════

  return (
    <PageContainer maxWidth="xl" sx={{ py: 4 }}>
      <PageHeader
        title="Panel de Administración"
        subtitle="Métricas de KPIs, Proyectos y Usuarios."
      />

      {/* Tarjetas de Estadísticas (Solo queda KYC) */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', mx: -1.5, mb: 4 }}>
        <Box sx={{ width: { xs: '100%', sm: '50%', md: '20%' }, p: 1.5 }}>
          <Card
            elevation={2}
            sx={{
              cursor: 'pointer',
              '&:hover': { boxShadow: 4 },
              height: '100%',
            }}
            onClick={() => navigate('/admin/kyc')}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'error.main' }}>
                  <PendingActionsIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.pendingKYC}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    KYC Pendientes
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <QueryHandler
        isLoading={isLoading}
        error={queryError as Error | null}
        fullHeight
      >
        <Stack spacing={3}>
          {/* Gráficos */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', lg: 'row' },
              gap: 3,
            }}
          >
            {/* Gráfico de Barras */}
            <Box sx={{ width: { xs: '100%', lg: 'calc(66.66% - 12px)' } }}>
              <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}
                >
                  <AssessmentIcon color="primary" />
                  <Typography variant="h6" fontWeight="bold">
                    Avance de Suscripciones (KPI 5)
                  </Typography>
                </Box>
                {monthlyProgress.length === 0 ? (
                  <Alert severity="info">
                    No hay proyectos mensuales activos para mostrar.
                  </Alert>
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
                                <Typography variant="body2" fontWeight="bold">
                                  {data.nombre}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Avance: {data.avance.toFixed(2)}%
                                </Typography>
                                <br />
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Suscripciones: {data.actuales} / {data.meta}
                                </Typography>
                              </Paper>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="avance"
                        fill={theme.palette.primary.main}
                        name="% Avance"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Paper>
            </Box>

            {/* Gráfico de Torta */}
            <Box sx={{ width: { xs: '100%', lg: 'calc(33.33% - 12px)' } }}>
              <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}
                >
                  <TrendingUpIcon color="primary" />
                  <Typography variant="h6" fontWeight="bold">
                    Distribución de Estados
                  </Typography>
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
                        label={({ name, percent }) =>
                          `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {estadosData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={RECHART_COLORS[index % RECHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Paper>
            </Box>
          </Box>

          {/* Detalle de Proyectos */}
          <Box>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Detalle de Proyectos Mensuales
              </Typography>
              {monthlyProgress.length === 0 ? (
                <Alert severity="info">
                  No hay proyectos mensuales activos.
                </Alert>
              ) : (
                <Stack spacing={2} sx={{ mt: 2 }}>
                  {monthlyProgress.map((proyecto) => {
                    const porcentaje = parseFloat(proyecto.porcentaje_avance);
                    const color =
                      porcentaje >= 100
                        ? 'success'
                        : porcentaje >= 50
                          ? 'primary'
                          : porcentaje >= 25
                            ? 'warning'
                            : 'error';
                    return (
                      <Box key={proyecto.id}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{ mb: 0.5 }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <Typography variant="body1" fontWeight={600}>
                              {proyecto.nombre}
                            </Typography>
                            <Chip
                              label={proyecto.estado}
                              size="small"
                              color={
                                proyecto.estado === 'En proceso'
                                  ? 'success'
                                  : 'warning'
                              }
                            />
                          </Box>
                          <Typography variant="body2" fontWeight={500}>
                            {proyecto.suscripciones_actuales} /{' '}
                            {proyecto.meta_suscripciones} suscripciones
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(porcentaje, 100)}
                          color={color}
                          sx={{ height: 8, borderRadius: 1 }}
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 0.5 }}
                        >
                          {porcentaje.toFixed(2)}% completado
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Paper>
          </Box>
        </Stack>
      </QueryHandler>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
};

export default AdminDashboard;