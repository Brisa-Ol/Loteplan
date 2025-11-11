import { type FC, useEffect } from 'react';
import { Stack, Typography } from '@mui/material';

// Components
import {
  PageContainer,
  PageHeader,
  SectionTitle,
  StepsContainer,
  StepCard,
  ImageCard,
  HighlightBox,
} from '../../../components/common';

// Data
import { methodologyFeatures, processSteps } from './Inversionista.data';

const Inversionista: FC = () => {
  // 🔍 DEBUG: Verificar si los datos se importan correctamente
  useEffect(() => {
    console.log('📊 processSteps:', processSteps);
    console.log('📊 methodologyFeatures:', methodologyFeatures);
    console.log('📊 processSteps length:', processSteps?.length);
    console.log('📊 methodologyFeatures length:', methodologyFeatures?.length);
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="Crowdfunding para inversionistas"
        subtitle="Invertí en terrenos con alto potencial de revalorización. Uní tu capital con otros inversionistas, diversificá tu cartera y obtené retornos seguros."
      />

      <SectionTitle>¿Cómo funciona?</SectionTitle>
      
      {/* 🔍 DEBUG: Mostrar si el array está vacío */}
      {(!processSteps || processSteps.length === 0) ? (
        <Typography color="error" sx={{ mb: 4 }}>
          ⚠️ No hay datos en processSteps (array vacío o undefined)
        </Typography>
      ) : (
        <StepsContainer>
          {processSteps.map((step, index) => {
            console.log(`Renderizando step ${index}:`, step);
            return (
              <StepCard
                key={`process-step-${index}`}
                stepNumber={index + 1}
                title={step.title}
                description={step.description}
                image={step.image}
              />
            );
          })}
        </StepsContainer>
      )}

      <HighlightBox
        title="Invertís en tierra. Creás valor que crece con vos."
        description="Nuestra tecnología colaborativa conecta inversionistas para urbanizar terrenos con alto potencial de crecimiento. Cada participante es dueño de una fracción del terreno, no un prestamista. Así, la inversión es tangible, compartida y segura."
      />

      <SectionTitle>Nuestra metodología</SectionTitle>
      
      {/* 🔍 DEBUG: Mostrar si el array está vacío */}
      {(!methodologyFeatures || methodologyFeatures.length === 0) ? (
        <Typography color="error" sx={{ mb: 4 }}>
          ⚠️ No hay datos en methodologyFeatures (array vacío o undefined)
        </Typography>
      ) : (
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={4}
          justifyContent="center"
          alignItems="stretch"
          sx={{ mb: { xs: 8, md: 12 }, width: '100%' }}
        >
          {methodologyFeatures.map((feature, index) => {
            console.log(`Renderizando feature ${index}:`, feature);
            return (
              <ImageCard
                key={`methodology-feature-${index}`}
                title={feature.title}
                description={feature.description}
                image={feature.image}
                imageHeight={200}
              />
            );
          })}
        </Stack>
      )}

      <PageHeader
        title="Con nuestro modelo de crowdfunding, invertir en terrenos es seguro, transparente y rentable."
        subtitle="Unite hoy y diversificá tu cartera con activos tangibles y de alto valor."
      />
    </PageContainer>
  );
};

export default Inversionista;