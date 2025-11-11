// Página institucional - IMPORTS CORREGIDOS
// ═══════════════════════════════════════════════════════════
import React from "react";
import { Stack, Box, Typography } from "@mui/material";
import { PageContainer, PageHeader, SectionTitle } from "../../components/common";
import { features, steps } from "./Nosotros.data";
import { FeatureCard } from "./components/FeatureCard";
import { StepCard } from "./components/StepCard";


const Nosotros: React.FC = () => {
  return (
    <PageContainer maxWidth="xl">
      {/* Header */}
      <PageHeader title="Acerca de Nosotros" />

      {/* Features principales */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={{ xs: 3, md: 4 }}
        justifyContent="center"
        alignItems="stretch"
        sx={{ mb: { xs: 5, md: 8 } }}
      >
        {features.map((f, i) => (
          <FeatureCard key={i} feature={f} />
        ))}
      </Stack>

      {/* Qué encontrás */}
      <SectionTitle>
        ¿Qué encontrás en nuestra plataforma de crowdfunding?
      </SectionTitle>

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={{ xs: 3, md: 4 }}
        justifyContent="center"
        alignItems="stretch"
        sx={{ mb: { xs: 8, md: 10 } }}
      >
        {steps.map((s, i) => (
          <StepCard key={i} step={s} />
        ))}
      </Stack>

      {/* Cierre con credibilidad */}
      <Box
        sx={{
          textAlign: "center",
          py: { xs: 4, md: 6 },
          borderRadius: 4,
        }}
      >
        <Typography variant="h3" color="primary.main" sx={{ mb: 2 }}>
          +400 hectáreas en desarrollo
        </Typography>
        <Typography variant="h5" color="text.secondary">
          Cientos de familias ya forman parte del crecimiento urbano junto a nosotros.
        </Typography>
      </Box>
    </PageContainer>
  );
};

export default Nosotros;