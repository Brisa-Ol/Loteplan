import React from "react";
import { Box, Typography, Paper, Divider, Stack } from "@mui/material";
import { 
  TrendingUp, // Rentabilidad
  Security,   // Seguridad
  Business,   // Proyectos
  MonetizationOn // Dólares/Valor
} from "@mui/icons-material";
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from "react-router-dom"; // 👈 Importado
import { useAuth } from "../../../context/AuthContext"; // 👈 Importado

import { PageContainer, PageHeader, SectionTitle } from "../../../components/common";
import { ProjectCard } from "../../../components/common/ProjectCard/ProjectCard";
import { QueryHandler } from "../../../components/common/QueryHandler/QueryHandler";
import proyectoService from '../../../Services/proyecto.service'; 

// --- 🎨 HIGHLIGHTS PARA INVERSORES ---
const InvestorHighlights: React.FC<{ count: number }> = ({ count }) => (
  <Paper 
    elevation={0} 
    variant="outlined"
    sx={{ 
      p: 3, 
      mb: 6, 
      borderRadius: 3,
      bgcolor: 'background.paper',
      borderColor: 'divider'
    }}
  >
    <Stack 
      direction={{ xs: 'column', md: 'row' }} 
      spacing={{ xs: 4, md: 0 }}
      justifyContent="space-around"
      alignItems={{ xs: 'flex-start', md: 'center' }}
      divider={
        <Divider 
          orientation="vertical" 
          flexItem 
          sx={{ display: { xs: 'none', md: 'block' } }} 
        />
      }
    >
      {/* 1. Oportunidades */}
      <Box display="flex" alignItems="center" gap={2} width="100%" justifyContent={{ xs: 'flex-start', md: 'center' }}>
        <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: 'primary.light', color: 'primary.main', display: 'flex' }}>
          <Business fontSize="medium" />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={800} color="text.primary" lineHeight={1}>{count}</Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing={0.5}>
            Oportunidades
          </Typography>
        </Box>
      </Box>

      {/* 2. Rentabilidad */}
      <Box display="flex" alignItems="center" gap={2} width="100%" justifyContent={{ xs: 'flex-start', md: 'center' }}>
        <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: 'success.light', color: 'success.dark', display: 'flex' }}>
          <TrendingUp fontSize="medium" />
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={700} color="text.primary" lineHeight={1.2}>Alta Rentabilidad</Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Retornos estimados en USD
          </Typography>
        </Box>
      </Box>

      {/* 3. Seguridad */}
      <Box display="flex" alignItems="center" gap={2} width="100%" justifyContent={{ xs: 'flex-start', md: 'center' }}>
        <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: 'info.light', color: 'info.dark', display: 'flex' }}>
          <Security fontSize="medium" />
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={700} color="text.primary" lineHeight={1.2}>Respaldo Real</Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Activos inmobiliarios tangibles
          </Typography>
        </Box>
      </Box>
    </Stack>
  </Paper>
);

const ProyectosInversionista: React.FC = () => {
  const navigate = useNavigate(); // 👈 Hook de navegación
  const { isAuthenticated } = useAuth(); // 👈 Estado de autenticación

  const { data: proyectos, isLoading, error } = useQuery({
    queryKey: ['proyectosInversionista'],
    queryFn: async () => (await proyectoService.getInversionistasActive()).data
  });
  const proyectosInversionista = proyectos || [];

  // 🧠 LÓGICA DE REDIRECCIÓN INTELIGENTE
  const handleProjectClick = (projectId: number | string) => {
    const targetPath = `/proyectos/${projectId}`;

    if (isAuthenticated) {
      navigate(targetPath);
    } else {
      // Redirigir a login, guardando el destino
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
        
        {proyectosInversionista.length === 0 ? (
          <Box textAlign="center" py={8} bgcolor="grey.50" borderRadius={4}>
            <MonetizationOn sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h5" color="text.secondary" fontWeight={500}>
              No se encontraron oportunidades de inversión en este momento.
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Nuestros expertos están analizando nuevos proyectos.
            </Typography>
          </Box>
        ) : (
          <>
            <InvestorHighlights count={proyectosInversionista.length} />

            <SectionTitle>Oportunidades Abiertas</SectionTitle>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
                gap: 5,
                width: "80%",
                mx: "auto",
                mb: 9,
              }}
            >
              {proyectosInversionista.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  type="inversionista"
                  // 👇 Pasamos la lógica de click condicional
                  onClick={() => handleProjectClick(project.id)}
                />
              ))}
            </Box>
          </>
        )}

      </QueryHandler>
    </PageContainer>
  );
};

export default ProyectosInversionista;