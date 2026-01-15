import React, { useState } from "react";
import { Box, Typography, Paper, Divider, Stack, Tabs, Tab, Avatar } from "@mui/material";
import { 
  TrendingUp, 
  Business, 
  MonetizationOn 
} from "@mui/icons-material";
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from "react-router-dom";

import { QueryHandler } from "../../../../shared/components/data-grid/QueryHandler/QueryHandler";


import { ProjectCard } from "./components/ProjectCard";
import proyectoService from "@/core/api/services/proyecto.service";
import { useAuth } from "@/core/context/AuthContext";
import { PageContainer } from "@/shared/components/layout/containers/PageContainer/PageContainer";
import { SectionTitle } from "@/shared/components/layout/containers/SectionTitle/SectionTitle";
import { PageHeader } from "@/shared/components/layout/headers/PageHeader/PageHeader";

// --- 🎨 COMPONENTE VISUAL: Investor Highlights ---
const InvestorHighlights: React.FC = () => (
  <Paper 
    elevation={0} 
    sx={{ 
      p: 3, 
      mb: 4, 
      borderRadius: 4, 
      bgcolor: 'grey.100', 
      border: 'none'
    }}
  >
    <Stack 
      direction={{ xs: 'column', md: 'row' }} 
      spacing={{ xs: 4, md: 8 }} 
      justifyContent="center"
      alignItems={{ xs: 'flex-start', md: 'center' }}
      divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' }, borderColor: 'grey.300' }} />}
    >
      <Box display="flex" alignItems="center" gap={2}>
        <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.dark', width: 48, height: 48 }}>
          <TrendingUp fontSize="medium" />
        </Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight={800} color="text.primary" lineHeight={1.2}>
            Alta Rentabilidad
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Retornos superiores al mercado
          </Typography>
        </Box>
      </Box>

      <Box display="flex" alignItems="center" gap={2}>
        <Avatar sx={{ bgcolor: 'info.light', color: 'info.dark', width: 48, height: 48 }}>
          <Business fontSize="medium" />
        </Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight={800} color="text.primary" lineHeight={1.2}>
            Respaldo Inmobiliario
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Activos reales y tangibles
          </Typography>
        </Box>
      </Box>

      <Box display="flex" alignItems="center" gap={2}>
        <Avatar sx={{ bgcolor: 'success.light', color: 'success.dark', width: 48, height: 48 }}>
          <MonetizationOn fontSize="medium" />
        </Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight={800} color="text.primary" lineHeight={1.2}>
            Capitalización
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Protege tu valor en USD
          </Typography>
        </Box>
      </Box>
    </Stack>
  </Paper>
);

const ProyectosInversionista: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [tabValue, setTabValue] = useState<'activos' | 'finalizados'>('activos');

  const { data: todosLosProyectos, isLoading, error } = useQuery({
    queryKey: ['proyectosInversionista'],
    queryFn: async () => (await proyectoService.getInversionistasActive()).data
  });
  
  const rawProjects = todosLosProyectos || [];

  const proyectosFiltrados = rawProjects.filter(project => {
    if (tabValue === 'activos') {
      return project.estado_proyecto !== 'Finalizado';
    } else {
      return project.estado_proyecto === 'Finalizado';
    }
  });

  const handleProjectClick = (projectId: number | string) => {
    const targetPath = `/proyectos/${projectId}`;
    if (isAuthenticated) {
      navigate(targetPath);
    } else {
      navigate("/login", { state: { from: targetPath } });
    }
  };

  return (
    <PageContainer maxWidth="xl">
      {/* ✅ HEADER ACTUALIZADO: Persuasivo + Rol */}
      <PageHeader
        title="Cartera de Inversión Estratégica"
        subtitle="Oportunidades de alto rendimiento para el perfil Inversionista. Maximiza tu capital."
      />

      <QueryHandler 
        isLoading={isLoading} 
        error={error as Error | null} 
        loadingMessage="Buscando oportunidades..."
        fullHeight={true} 
      >
        <>
          <InvestorHighlights />

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4, display: 'flex', justifyContent: 'center' }}>
            <Tabs 
              value={tabValue} 
              onChange={(_, newVal) => setTabValue(newVal)} 
              centered 
              indicatorColor="primary"
              textColor="primary"
              sx={{ '& .MuiTab-root': { textTransform: 'none', fontSize: '1rem', fontWeight: 500 } }}
            >
              <Tab label="Oportunidades Abiertas" value="activos" />
              <Tab label="Proyectos Completados" value="finalizados" />
            </Tabs>
          </Box>

          <SectionTitle>
            {tabValue === 'activos' ? 'Oportunidades de Inversión' : 'Track Record (Historial)'}
          </SectionTitle>

          {proyectosFiltrados.length === 0 ? (
            <Box textAlign="center" py={8} bgcolor="grey.50" borderRadius={4}>
              <Typography variant="h5" color="text.secondary" fontWeight={500}>
                {tabValue === 'activos' 
                  ? "No hay oportunidades para Inversionistas activas en este momento." 
                  : "Aún no hay proyectos finalizados en el historial."}
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { 
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(3, 1fr)"
                },
                gap: 4,
                width: "100%",
                maxWidth: "1400px",
                mx: "auto", 
                mb: 9,
              }}
            >
              {proyectosFiltrados.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  type="inversionista"
                  onClick={() => handleProjectClick(project.id)}
                />
              ))}
            </Box>
          )}
        </>
      </QueryHandler>
    </PageContainer>
  );
};

export default ProyectosInversionista;