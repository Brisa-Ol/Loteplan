// Página de información para ahorristas - REFACTORIZADA
// ═══════════════════════════════════════════════════════════
import React from "react";
import { Stack } from "@mui/material";
import { PageContainer } from "../../../components/common/PageContainer/PageContainer";
import { PageHeader } from "../../../components/common/PageHeader/PageHeader";
import { SectionTitle } from "../../../components/common/SectionTitle/SectionTitle";
import { StepsContainer } from "../../../components/common/StepsContainer/StepsContainer";

import { StepCard } from "../../../components/common/StepCard/StepCard";


import { OverlayCard } from "../../../components/common/OverlayCard/OverlayCard";
import { IconCard } from "../../../components/common/IconCard/IconCard";

import { advantageFeatures, modalityFeatures, processSteps } from "./Ahorrista.data";


const Ahorrista: React.FC = () => {
  return (
    <PageContainer>
      {/* Header principal */}
      <PageHeader
        title="Crowdfunding para ahorristas"
        subtitle="La forma más inteligente de ahorrar para tu terreno. Únete a otros ahorristas, paga cuotas sin interés y haz realidad tu casa propia."
      />

      {/* Pasos del proceso */}
      <SectionTitle>¿Cómo funciona?</SectionTitle>
      <StepsContainer>
        {processSteps.map((step, index) => (
          <StepCard
            key={index}
            stepNumber={index + 1}
            title={step.title}
            description={step.description}
            image={step.image}
          />
        ))}
      </StepsContainer>

      {/* Ventajas */}
      <SectionTitle>¿Por qué elegirnos?</SectionTitle>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={4}
        justifyContent="center"
        alignItems="stretch"
        sx={{ mb: { xs: 8, md: 12 } }}
      >
        {advantageFeatures.map((feature, index) => (
          <IconCard
            key={index}
            title={feature.title}
            description={feature.description}
            icon={feature.icon}
          />
        ))}
      </Stack>

      {/* Modalidades */}
      <SectionTitle>Tu futuro comienza aquí</SectionTitle>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={3}
        justifyContent="center"
        alignItems="stretch"
        sx={{ mb: { xs: 8, md: 12 } }}
      >
        {modalityFeatures.map((feature, index) => (
          <OverlayCard
            key={index}
            title={feature.title}
            description={feature.description}
            image={feature.image}
          />
        ))}
      </Stack>

      {/* Cierre */}
      <PageHeader
        title="Con nuestro modelo de crowdfunding, ahorrar para tu terreno es fácil, seguro y colaborativo."
        subtitle="Únete hoy y da el primer paso hacia la casa de tus sueños."
      />
    </PageContainer>
  );
};

export default Ahorrista;