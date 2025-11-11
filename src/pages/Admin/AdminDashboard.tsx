// src/pages/Admin/AdminDashboard.tsx
import React from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Tooltip,
  Chip,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { PageContainer, PageHeader, SectionTitle } from "../../components/common";
import { QueryHandler } from "../../components/common/QueryHandler/QueryHandler";
import FolderIcon from "@mui/icons-material/Folder";
import PeopleIcon from "@mui/icons-material/People";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import { useNavigate } from "react-router-dom";
import adminService from "../../Services/admin.service";

// ────────────────────────────────
// Interfaces locales
// ────────────────────────────────
interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  color?: string;
}

interface LinearProgressWithLabelProps {
  value: number;
}

interface MonthlyProgressItem {
  id: number;
  nombre: string;
  estado: string;
  suscripciones_actuales: number;
  meta_suscripciones: number;
  porcentaje_avance: string;
}

// ────────────────────────────────
// Componente KPI Card (sin Grid)
// ────────────────────────────────
const KpiCard: React.FC<KpiCardProps> = ({ title, value, subtitle, color = "text.primary" }) => (
  <Paper
    elevation={3}
    sx={{
      p: 3,
      borderRadius: 3,
      height: "100%",
      flex: "1 1 300px",
      minWidth: 250,
    }}
  >
    <Typography variant="overline" color="text.secondary">
      {title}
    </Typography>
    <Typography variant="h3" fontWeight={700} color={color} gutterBottom>
      {value}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {subtitle}
    </Typography>
  </Paper>
);

// ────────────────────────────────
// Componente Progreso con Label
// ────────────────────────────────
const LinearProgressWithLabel: React.FC<LinearProgressWithLabelProps> = ({ value }) => (
  <Box sx={{ display: "flex", alignItems: "center" }}>
    <Box sx={{ width: "100%", mr: 1 }}>
      <LinearProgress variant="determinate" value={value} sx={{ height: 8, borderRadius: 5 }} />
    </Box>
    <Box sx={{ minWidth: 35 }}>
      <Typography variant="body2" color="text.secondary">
        {`${Math.round(value)}%`}
      </Typography>
    </Box>
  </Box>
);

// ────────────────────────────────
// Componente Principal
// ────────────────────────────────
const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["adminAllUsers"],
    queryFn: adminService.getAllUsers,
  });

  const { data: projectsData, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["adminAllProjects"],
    queryFn: adminService.getAllProjects,
  });

  const { data: completionData, isLoading: isLoadingCompletion } = useQuery({
    queryKey: ["adminCompletionRate"],
    queryFn: adminService.getCompletionRate,
  });

  const { data: progressData, isLoading: isLoadingProgress, error } = useQuery<MonthlyProgressItem[]>({
    queryKey: ["adminMonthlyProgress"],
    queryFn: adminService.getMonthlyProgress,
  });

  const isLoading = isLoadingUsers || isLoadingProjects || isLoadingCompletion || isLoadingProgress;

  return (
    <PageContainer maxWidth="lg">
      <PageHeader
        title="Dashboard de Administración"
        subtitle="Resumen del estado y métricas clave de la plataforma."
      />

      <QueryHandler isLoading={isLoading} error={error as Error | null} fullHeight>
        <>
          {/* SECCIÓN 1: KPIs */}
          <SectionTitle>Métricas Clave</SectionTitle>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 3,
              mb: 4,
              justifyContent: "space-between",
            }}
          >
            <KpiCard
              title="Usuarios Totales"
              value={usersData?.length ?? 0}
              subtitle={`${usersData?.filter((u) => u.activo).length ?? 0} usuarios activos`}
            />
            <KpiCard
              title="Proyectos Totales"
              value={projectsData?.length ?? 0}
              subtitle={`${projectsData?.filter((p) => p.estado_proyecto === "En proceso").length ?? 0
                } proyectos en proceso`}
            />
            <KpiCard
              title="Tasa de Culminación"
              value={`${completionData?.tasa_culminacion ?? 0}%`}
              subtitle={`${completionData?.total_finalizados ?? 0} de ${completionData?.total_iniciados ?? 0
                } proyectos iniciados`}
              color="primary.main"
            />
          </Box>

          {/* SECCIÓN 2: Accesos Directos */}
          <SectionTitle>Accesos Directos</SectionTitle>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 4 }}>
            <Button
              variant="contained"
              startIcon={<FolderIcon />}
              onClick={() => navigate("/admin/proyectos")}
              sx={{ py: 2 }}
            >
              Gestionar Proyectos
            </Button>
            <Button
              variant="contained"
              startIcon={<PeopleIcon />}
              onClick={() => navigate("/admin/users")}
              sx={{ py: 2 }}
            >
              Gestionar Usuarios
            </Button>
            <Button
              variant="contained"
              startIcon={<VerifiedUserIcon />}
              onClick={() => navigate("/admin/kyc")}
              sx={{ py: 2 }}
            >
              Gestionar KYC
            </Button>
          </Stack>

          {/* SECCIÓN 3: Progreso Mensual */}
          <SectionTitle>Progreso de Proyectos (Ahorristas)</SectionTitle>
          <Paper elevation={3} sx={{ p: 0, borderRadius: 3, overflow: "hidden" }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Proyecto</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="right">Suscripciones</TableCell>
                    <TableCell>Progreso</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {progressData && progressData.length > 0 ? (
                    progressData.map((proyecto) => (
                      <TableRow key={proyecto.id} hover>
                        <TableCell>
                          <Typography variant="body1" fontWeight={600}>
                            {proyecto.nombre}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={proyecto.estado}
                            color={proyecto.estado === "En proceso" ? "success" : "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title={`Meta: ${proyecto.meta_suscripciones}`}>
                            <Typography variant="body2">
                              {proyecto.suscripciones_actuales} / {proyecto.meta_suscripciones}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <LinearProgressWithLabel
                            value={parseFloat(proyecto.porcentaje_avance)}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography color="text.secondary" sx={{ py: 4 }}>
                          No hay proyectos mensuales activos para mostrar.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      </QueryHandler>
    </PageContainer>
  );
};

export default AdminDashboard;
