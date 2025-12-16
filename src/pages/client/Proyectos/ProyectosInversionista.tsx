import React, { useState } from "react";
import { Box, Typography, Paper, Divider, Stack, Tabs, Tab, Avatar } from "@mui/material";
import { 
  TrendingUp, 
  Security, 
  MonetizationOn 
} from "@mui/icons-material";
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

import { PageContainer, PageHeader, SectionTitle } from "../../../components/common";
import { QueryHandler } from "../../../components/common/QueryHandler/QueryHandler";
import proyectoService from '../../../Services/proyecto.service'; 
import { ProjectCard } from "./components/ProjectCard";

// --- 🎨 1. COMPONENTE VISUAL: Highlights (Diseño Nuevo) ---
const InvestorHighlights: React.FC = () => (
  <Paper 
    elevation={0} 
    sx={{ 
      p: 3, 
      mb: 4, 
      borderRadius: 4, 
      bgcolor: 'grey.100', // Fondo gris claro consistente
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
      {/* Elemento 1: Alta Rentabilidad */}
      <Box display="flex" alignItems="center" gap={2}>
        <Avatar sx={{ bgcolor: 'success.light', color: 'success.dark', width: 48, height: 48 }}>
          <TrendingUp fontSize="medium" />
        </Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight={800} color="text.primary" lineHeight={1.2}>
            Alta Rentabilidad
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Retornos estimados en USD
          </Typography>
        </Box>
      </Box>

      {/* Elemento 2: Respaldo Real */}
      <Box display="flex" alignItems="center" gap={2}>
        <Avatar sx={{ bgcolor: 'info.light', color: 'info.dark', width: 48, height: 48 }}>
          <Security fontSize="medium" />
        </Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight={800} color="text.primary" lineHeight={1.2}>
            Respaldo Real
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Activos inmobiliarios tangibles
          </Typography>
        </Box>
      </Box>
    </Stack>
  </Paper>
);

const ProyectosInversionista: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  // ✅ Estado para el filtro (Frontend)
  const [tabValue, setTabValue] = useState<'activos' | 'finalizados'>('activos');

  // Pedimos TODOS los proyectos
  const { data: todosLosProyectos, isLoading, error } = useQuery({
    queryKey: ['proyectosInversionista'],
    queryFn: async () => (await proyectoService.getInversionistasActive()).data
  });
  
  const rawProjects = todosLosProyectos || [];

  // ✅ Lógica de filtrado en el cliente
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
      <PageHeader
        title="Oportunidades de Inversión"
        subtitle="Diversificá tu portafolio con proyectos inmobiliarios de alto potencial."
      />

      <QueryHandler 
        isLoading={isLoading} 
        error={error as Error | null} 
        loadingMessage="Buscando oportunidades..."
        fullHeight={true}
      >
        <>
          {/* 1. Highlights */}
          <InvestorHighlights />

          {/* 2. Filtros (Tabs) */}
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

          {/* 3. Título de Sección */}
          <SectionTitle>
            {tabValue === 'activos' ? 'Oportunidades Abiertas' : 'Historial de Éxito'}
          </SectionTitle>

          {/* 4. Grid o Mensaje Vacío */}
          {proyectosFiltrados.length === 0 ? (
            <Box textAlign="center" py={8} bgcolor="grey.50" borderRadius={4}>
              <MonetizationOn sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h5" color="text.secondary" fontWeight={500}>
                {tabValue === 'activos' 
                  ? "No se encontraron oportunidades abiertas." 
                  : "No hay proyectos completados aún."}
              </Typography>
              {tabValue === 'activos' && (
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Nuestros expertos están analizando nuevos proyectos.
                </Typography>
              )}
            </Box>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
                gap: 5, width: "80%", mx: "auto", mb: 9,
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