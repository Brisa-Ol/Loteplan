// OPTIMIZADO: Todas las secciones con márgenes consistentes
// ═══════════════════════════════════════════════════════════
import React from "react";
import { Box, Stack, Card, Typography } from "@mui/material";
import { CheckCircle as CheckCircleIcon } from "@mui/icons-material";
import {
  PageContainer,
  PageHeader,
  SectionTitle,
  ImageCard,
  IconCard,
} from "../../components/common";
import { features, steps, benefits } from "./Home.data";

const Home: React.FC = () => {
  return (
    <PageContainer maxWidth="lg">
      {/* Hero principal */}
      <PageHeader
        title="Invertí en terreno de manera sencilla y segura"
        subtitle="La forma más inteligente de invertir o ahorrar para tu terreno. Únete a otros usuarios, paga cuotas sin interés o diversificá tu inversión y obtené retornos seguros."
      />

      {/* Modalidades - Cards con imagen */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mb: 10,
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={4}
          sx={{
            maxWidth: 850,
            width: "100%",
          }}
        >
          {features.map((feature) => (
            <Box
              key={feature.title}
              sx={{
                flex: 1,
                maxWidth: { md: 400 },
              }}
            >
              <ImageCard
                title={feature.title}
                description={feature.description}
                image={feature.image}
                imageHeight={200}
              />
            </Box>
          ))}
        </Stack>
      </Box>

      {/* Pasos para invertir - 3 columnas centradas */}
      <SectionTitle>¿Cómo invertir?</SectionTitle>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mb: { xs: 8, md: 12 },
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
          sx={{
            maxWidth: 900,
            width: "100%",
          }}
        >
          {steps.map((step, index) => (
            <Box
              key={index}
              sx={{
                flex: 1,
                minWidth: 0,
                maxWidth: { md: 280 },
              }}
            >
              <IconCard
                title={`${index + 1}. ${step.title}`}
                description=""
                icon={step.icon}
              />
            </Box>
          ))}
        </Stack>
      </Box>

      {/* Beneficios - 2 columnas centradas con márgenes */}
      <SectionTitle>¿Por qué invertir en Loteplan?</SectionTitle>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mb: { xs: 8, md: 12 },
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 4,
            maxWidth: 1000,
            width: "100%",
          }}
        >
          {benefits.map((text, index) => (
            <Card
              key={index}
              sx={{
                p: 3,
                display: "flex",
                alignItems: "flex-start",
                gap: 2,
                height: "100%",
              }}
            >
              <CheckCircleIcon
                sx={{
                  color: "primary.main",
                  fontSize: 34,
                  mt: 0.4,
                  flexShrink: 0,
                }}
              />
              <Typography variant="body1" color="text.secondary">
                {text}
              </Typography>
            </Card>
          ))}
        </Box>
      </Box>

      {/* Cierre */}
      <PageHeader
        title="Con nuestro modelo de crowdfunding, invertir en terrenos es seguro, transparente y rentable."
        subtitle="Unite hoy y diversificá tu billetera con activos tangibles y de alto valor."
      />
    </PageContainer>
  );
};

export default Home;