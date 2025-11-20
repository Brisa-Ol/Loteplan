// src/pages/Proyectos/ProyectosInversionista.tsx (Optimizado y Corregido)
// ═══════════════════════════════════════════════════════════
import React from "react";
import { Box, Stack, Chip, Typography } from "@mui/material";
import { PageContainer, PageHeader, SectionTitle } from "../../../components/common";
import { ProjectCard } from "../../../components/common/ProjectCard/ProjectCard";
import { useQuery } from '@tanstack/react-query';
import { QueryHandler } from "../../../components/common/QueryHandler/QueryHandler";


// ❗ CORRECCIÓN 1: Importamos el servicio por DEFECTO (sin llaves)
import proyectoService from '../../../Services/proyecto.service'; 

const ProyectosInversionista: React.FC = () => {
  const { data: proyectos, isLoading, error } = useQuery({
    queryKey: ['proyectosInversionista'],
    // ⚠️ CORRECCIÓN AQUÍ
    queryFn: async () => {
       const res = await proyectoService.getInversionistasActive();
       return res.data;
    }
  });

  const proyectosInversionista = proyectos || [];

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        title="Oportunidades de Inversión"
        subtitle="Invertí en proyectos inmobiliarios con alta rentabilidad y respaldo."
      />

      <QueryHandler 
        isLoading={isLoading} 
        error={error as Error | null} 
        loadingMessage="Cargando oportunidades..."
        fullHeight={true}
      >
        
        {proyectosInversionista.length === 0 ? (
          // Estado vacío
          <Box textAlign="center" py={8}>
            <Typography variant="h5" color="text.secondary">
              No se encontraron oportunidades de inversión en este momento.
            </Typography>
          </Box>
        ) : (
          // Estado con contenido
          <>
            <Stack direction="row" spacing={2} justifyContent="center" mb={4} flexWrap="wrap" sx={{ gap: 1 }}>
              <Chip label={`${proyectosInversionista.length} oportunidades disponibles`} color="primary" />
              <Chip label="Inversión segura" />
              <Chip label="Alta rentabilidad" />
            </Stack>

            <SectionTitle>Oportunidades de inversión</SectionTitle>

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
              {proyectosInversionista.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  type="inversionista"
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