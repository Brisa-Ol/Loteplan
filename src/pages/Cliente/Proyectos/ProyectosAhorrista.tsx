// src/pages/Proyectos/ProyectosAhorrista.tsx (Optimizado y Corregido)
// ═══════════════════════════════════════════════════════════
import React from "react";
import { Box, Stack, Chip, Typography } from "@mui/material";
import { PageContainer, PageHeader, SectionTitle } from "../../../components/common";
import { QueryHandler } from "../../../components/common/QueryHandler/QueryHandler";
import { ProjectCard } from "../../../components/common/ProjectCard/ProjectCard"; 
import { useQuery } from '@tanstack/react-query';
import type { ProyectoDTO } from "../../../types/dto/proyecto.dto";
import { proyectoService } from "../../../Services/proyecto.service";



const ProyectosAhorrista: React.FC = () => {
  
  // ❗ CORRECCIÓN 2: Usamos el objeto importado y el nombre correcto de la función
  const { data: proyectos, isLoading, error } = useQuery<ProyectoDTO[], Error>({
    queryKey: ['proyectosAhorrista'],
    queryFn: proyectoService.getProyectosAhorristas, // 👈 Nombre corregido
  });

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

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
                gap: 3,
                maxWidth: 1200,
                width: "100%",
                mx: "auto",
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