import React from "react";
import { Box, Typography, Paper, Divider, Stack } from "@mui/material";
import { 
  HomeWork, // Icono para proyectos
  Savings,  // Icono para cuotas
  Key       // Icono para adjudicación
} from "@mui/icons-material";
import { useQuery } from '@tanstack/react-query';

import { PageContainer, PageHeader, SectionTitle } from "../../../components/common";
import { QueryHandler } from "../../../components/common/QueryHandler/QueryHandler";
import { ProjectCard } from "../../../components/common/ProjectCard/ProjectCard"; 
import proyectoService from '../../../Services/proyecto.service'; 

// --- 🎨 COMPONENTE VISUAL: Highlights (Refactorizado con Stack) ---
const ProjectHighlights: React.FC<{ count: number }> = ({ count }) => (
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
          sx={{ display: { xs: 'none', md: 'block' } }} // Ocultar divisor en móvil
        />
      }
    >
      {/* 1. Cantidad Disponible */}
      <Box display="flex" alignItems="center" gap={2} width="100%" justifyContent={{ xs: 'flex-start', md: 'center' }}>
        <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: 'primary.light', color: 'primary.main', display: 'flex' }}>
          <HomeWork fontSize="medium" />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={800} color="text.primary" lineHeight={1}>
            {count}
          </Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing={0.5}>
            Proyectos Activos
          </Typography>
        </Box>
      </Box>

      {/* 2. Beneficio Financiero */}
      <Box display="flex" alignItems="center" gap={2} width="100%" justifyContent={{ xs: 'flex-start', md: 'center' }}>
        <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: 'success.light', color: 'success.dark', display: 'flex' }}>
          <Savings fontSize="medium" />
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={700} color="text.primary" lineHeight={1.2}>
            Cuotas Fijas
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Financiación en pesos sin interés
          </Typography>
        </Box>
      </Box>

      {/* 3. Beneficio Producto */}
      <Box display="flex" alignItems="center" gap={2} width="100%" justifyContent={{ xs: 'flex-start', md: 'center' }}>
        <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: 'warning.light', color: 'warning.dark', display: 'flex' }}>
          <Key fontSize="medium" />
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={700} color="text.primary" lineHeight={1.2}>
            Adjudicación Rápida
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Posesión desde la cuota 12
          </Typography>
        </Box>
      </Box>
    </Stack>
  </Paper>
);

const ProyectosAhorrista: React.FC = () => {
  const { data: proyectos, isLoading, error } = useQuery({
    queryKey: ['proyectosAhorrista'],
    queryFn: async () => (await proyectoService.getAhorristasActive()).data
  });
  const proyectosAhorrista = proyectos || [];

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        title="Proyectos para Ahorristas"
        subtitle="Elegí tu lote, pagá en cuotas a tu medida y hacé realidad el sueño de la casa propia."
      />

      <QueryHandler 
        isLoading={isLoading} 
        error={error as Error | null} 
        loadingMessage="Cargando catálogo..."
        fullHeight={true} 
      >

        {proyectosAhorrista.length === 0 ? (
          <Box textAlign="center" py={8} bgcolor="grey.50" borderRadius={4}>
            <Typography variant="h5" color="text.secondary" fontWeight={500}>
              No se encontraron proyectos disponibles para ahorristas en este momento.
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Vuelve a consultar más tarde para nuevas oportunidades.
            </Typography>
          </Box>
        ) : (
          <>
            {/* ✅ Highlights con Stack */}
            <ProjectHighlights count={proyectosAhorrista.length} />

            <SectionTitle>Catálogo Disponible</SectionTitle>

            {/* Layout de Tarjetas usando CSS Grid nativo (más ligero que MUI Grid) */}
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
              {proyectosAhorrista.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  type="ahorrista"
                />
              ))}
            </Box>
          </>
        )}

      </QueryHandler>
    </PageContainer>
  );
};

export default ProyectosAhorrista;