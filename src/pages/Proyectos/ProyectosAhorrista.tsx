// src/pages/Proyectos/ProyectosAhorrista.tsx (Optimizado)
// ═══════════════════════════════════════════════════════════
import React from "react";
import { Box, Stack, Chip, Typography } from "@mui/material";
import { PageContainer, PageHeader, SectionTitle } from "../../components/common";
import { QueryHandler } from "../../components/common/QueryHandler/QueryHandler";
// ❗ CAMBIO: Asumimos que la ruta correcta es la común
import { ProjectCard } from "../../components/common/ProjectCard/ProjectCard"; 
import { useQuery } from '@tanstack/react-query';
import type { ProyectoDTO } from "../../types/dto/proyecto.dto";

// ❗ CAMBIO 1: Importamos la función específica
import { getProyectosDeAhorristas } from '../../Services/proyecto.service'; 

const ProyectosAhorrista: React.FC = () => {
  
  // ❗ CAMBIO 2: Usamos la nueva función y un queryKey más limpio
  const { data: proyectos, isLoading, error } = useQuery<ProyectoDTO[], Error>({
    queryKey: ['proyectosAhorrista'],
    queryFn: getProyectosDeAhorristas, // Ya no usamos getAllActiveProyectos
  });

  // ❗ CAMBIO 3: Ya no filtramos. Solo nos aseguramos de que sea un array.
  const proyectosAhorrista = proyectos || [];

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        title="Proyectos para Ahorristas"
        subtitle="Elegí tu lote, pagá en cuotas sin interés y hacé realidad tu casa propia."
      />

      <QueryHandler 
        isLoading={isLoading} 
        error={error as Error | null} 
        loadingMessage="Cargando proyectos..."
        fullHeight={true} 
      >

        {/* ❗ CAMBIO 4: Usamos la nueva variable (ya no se llama 'filteredProjects') */}
        {proyectosAhorrista.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Typography variant="h5" color="text.secondary">
              No se encontraron proyectos disponibles para ahorristas en este momento.
            </Typography>
          </Box>
        ) : (
          <>
            <Stack direction="row" spacing={2} justifyContent="center" mb={4} flexWrap="wrap" sx={{ gap: 1 }}>
              <Chip label={`${proyectosAhorrista.length} proyectos disponibles`} color="primary" />
              <Chip label="Cuotas sin interés" />
              <Chip label="Adjudicación desde cuota 12" />
            </Stack>

            <SectionTitle>Proyectos disponibles</SectionTitle>

            {/* ❗ CAMBIO 5: Limpieza de código. Simplifiqué el doble <Box> por uno solo centrado */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
                gap: 3,
                maxWidth: 1200,
                width: "100%",
                mx: "auto", // <-- Centra el grid
                mb: 8,
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