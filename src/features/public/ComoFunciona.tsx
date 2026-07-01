import { ROUTES } from '@/routes';
import {
  Assignment,
  Check,
  Close,
  Domain,
  GroupAdd,
  MonetizationOn,
  TrendingUp
} from '@mui/icons-material';
import {
  alpha,
  Box,
  Button,
  Card,
  Container,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ScrollReveal from './components/ScrollReveal';

// ─── Constants & Data ─────────────────────────────────────────────────────────

const ACCENT = '#CC6333';
const ACCENT_DARK = '#A34D26';
const ACCENT_BG = '#ECDDD5';

const commonProcessSteps = [
  {
    step: '1',
    title: 'Elegimos el Proyecto inmobiliario',
    description: 'Analizamos propiedades con potencial de crecimiento y desarrollo',
    icon: Domain,
  },
  {
    step: '2',
    title: 'Estructuramos el Fideicomiso',
    description: 'Proyectamos urbanización y suscribimos acuerdos para su desarrollo',
    icon: Assignment,
  },
  {
    step: '3',
    title: 'Conformamos el Grupo',
    description: 'Agrupamos compradores ahorristas e inversionistas mediante tecnología',
    icon: GroupAdd,
  },
  {
    step: '4',
    title: 'Los participantes realizan sus aportes',
    description: 'Cada suscriptor comienza sus aportes según la modalidad elegida',
    icon: MonetizationOn,
  },
];

const investorSteps = [
  {
    step: '1',
    title: 'Ingresás al Proyecto',
    description: 'Al inicio de cada etapa, los valores pueden ser más convenientes',
  },
  {
    step: '2',
    title: 'El Desarrollo Evoluciona',
    description: 'El valor de la tierra mejora conforme los avances del proyecto y al mercado',
  },
  {
    step: '3',
    title: 'Recibís el lote resultante',
    description: 'Finalizado el proyecto disponés del inmueble para elegir su destino',
  },
];

const saverSteps = [
  {
    step: '1',
    title: 'Participás en Subastas Digitales',
    description: 'Para la Entrega Anticipada del lote según el reglamento del Grupo',
  },
  {
    step: '2',
    title: 'Obtenés la adjudicación',
    description: 'Si resultás ganador de la subasta y accedés al lote que elijas',
  },
  {
    step: '3',
    title: 'Escriturás tu lote',
    description: 'Cumplidos los requisitos del grupo escriturás el inmueble a tu nombre',
  },
];

const administrationCards = [
  {
    title: 'Administración fiduciaria',
    description: 'Los aportes se realizan directamente a cuentas bancarias del fideicomiso',
    image: 'public/Comofunciona/inversionista/CómofuncionaInversionista_1.jpg',
  },
  {
    title: 'Separación patrimonial',
    description: 'Los fondos del Grupo están separados de los costos operativos de la plataforma',
    image: 'public/Comofunciona/Ahorrista/CómofuncionaAhorrista_1a.jpg',
  },
  {
    title: 'Reglas predefinidas',
    description: 'Cada grupo opera bajo condiciones previamente establecidas en los contratos',
    image: 'public/Comofunciona/inversionista/CómofuncionaInversionista_3.jpg',
  },
];

const featureCards = [
  {
    title: 'Ahorro Organizado',
    description: 'Los participantes acceden progresivamente a activos inmobiliarios.',
    image: 'public/Comofunciona/manos.jpeg',
  },
  {
    title: 'Trazabilidad Digital',
    description: 'Cada etapa del proceso puede ser consultada y seguida desde la plataforma',
    image: 'public/nosotros/Nosotros_4.jpg',
  },
  {
    title: 'Entrega Anticipada de Lotes',
    description: 'Mediante subastas digitales conforme al reglamento del grupo',
    image: 'public/nosotros/Nosotros_5.jpg',
  },
];

const comparisonData = {
  traditional: [
    'Requiere evaluación crediticia',
    'Tasa de interés financiera',
    'Relación con un banco',
    'Aprobación sujeta a políticas bancarias',
    'Acceso individual',
  ],
  loteplan: [
    'No requiere scoring bancario',
    'Sin interés bancario',
    'Administración fiduciaria',
    'Adjudicación conforme al reglamento',
    'Acceso organizado en grupo',
  ],
};

// ─── Shared style tokens (mismos que Home.tsx) ────────────────────────────────

const sectionTitle = {
  fontWeight: 700,
  fontFamily: 'Inter, sans-serif',
  color: 'text.primary',
  textAlign: 'center',
} as const;

const justifyText = {
  textAlign: { xs: 'left', sm: 'justify' },
} as const;

// Tamaño de título grande (equivalente a "Qué es Loteplan" / "Modelo fiduciario" en Home)
const bigTitleSize = {
  fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
  lineHeight: 1.2,
} as const;

// Tamaño de párrafo introductorio (equivalente al texto bajo los títulos en Home)
const introTextSize = {
  fontSize: { xs: '0.95rem', sm: '1.0625rem', md: '1.375rem' },
  lineHeight: 1.7,
} as const;

// ── Texto para cards horizontales de "pasos" (icono + texto, alineado a la izquierda) ──
const cardTitleText = {
  fontSize: { xs: '1rem', sm: '1.0625rem', md: '1.375rem' },
  fontWeight: 700,
  lineHeight: 1.3,
} as const;

const cardBodyText = {
  fontSize: { xs: '0.875rem', sm: '0.95rem', md: '1.125rem' },
  lineHeight: 1.6,
  fontWeight: 400,
} as const;

// ── Texto para cards con imagen arriba (título centrado, cuerpo justificado/centrado) ──
const imageCardTitleText = {
  fontWeight: 600,
  fontFamily: 'Inter, sans-serif',
  fontSize: { xs: '1rem', sm: '1.05rem', md: '1.15rem' },
  textAlign: 'center',
} as const;

const imageCardBodyText = {
  fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' },
  lineHeight: 1.6,
  fontWeight: 400,
  textAlign: { xs: 'center', sm: 'justify' },
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

const InformacionLoteplan: React.FC = () => {
  const theme = useTheme();

  const navigate = useNavigate();
  return (
    <Box sx={{ bgcolor: 'background.default', color: 'text.primary' }}>

      {/* ── SECCIÓN 1: ASÍ FUNCIONA (Hero/Intro) ── */}
      <Box sx={{ py: { xs: 7, sm: 9, md: 14 }, bgcolor: 'secondary.light' }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'center',
              gap: { xs: 4, sm: 5, md: 8 },
            }}
          >
            {/* Imagen */}
            <Box sx={{ flex: 1, width: '100%', display: 'flex', justifyContent: 'center' }}>
              <Box
                component="img"
                src="public/Comofunciona/34home1.png"
                alt="Cómo funciona Loteplan"
                sx={{
                  width: '100%',
                  maxWidth: { xs: 240, sm: 380, md: 460 },
                  display: 'block',
                  borderRadius: 5,
                }}
              />
            </Box>

            {/* Texto */}
            <Box sx={{ flex: 1, width: '100%' }}>
              <Typography
                component="h1"
                sx={{
                  ...sectionTitle,
                  ...bigTitleSize,
                  fontSize: { xs: '1.85rem', sm: '2.4rem', md: '3rem' },
                  color: ACCENT,
                  textAlign: { xs: 'center', md: 'left' },
                  mb: { xs: 3, md: 4 },
                }}
              >
                Así funciona Loteplan
              </Typography>

              <Typography
                color="text.secondary"
                sx={{
                  ...introTextSize,
                  ...justifyText,
                  mb: { xs: 2.5, md: 3 },
                }}
              >
                Para comprar un lote no deberías depender únicamente de un crédito bancario. Por eso
                organizamos grupos de ahorro administrados mediante fideicomisos para que más
                personas puedan acceder progresivamente al lote para su casa propia.
              </Typography>

              <Typography
                color="text.secondary"
                fontWeight={600}
                sx={{
                  fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' },
                  lineHeight: 1.6,
                  textAlign: { xs: 'center', md: 'left' },
                }}
              >
                También ofrecemos oportunidades de inversión respaldadas por tierra real.
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ── SECCIÓN 2: EL PROCESO LOTEPLAN ── */}
      <Box sx={{ py: { xs: 7, sm: 9, md: 14 }, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">

          <Typography
            textAlign="center"
            sx={{
              ...sectionTitle,
              fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
              lineHeight: 1.2,
              mb: 3,
            }}
          >
            El PROCESO{' '}
            <Box component="span" sx={{ color: 'primary.main' }}>
              LOTEPLAN
            </Box>
          </Typography>

          <Typography
            textAlign="center"
            color="text.secondary"
            sx={{
              fontSize: { xs: '0.95rem', sm: '1.0625rem', md: '1.375rem' },
              lineHeight: 1.6,
              mb: { xs: 5, md: 6 },
            }}
          >
            Un mismo sistema.{' '}
            <Box component="span" sx={{ color: ACCENT, fontWeight: 700 }}>
              Dos objetivos diferentes.
            </Box>
          </Typography>

          {/* Pasos Comunes */}
          <Stack spacing={{ xs: 2, sm: 2.5, md: 3 }} alignItems="center" sx={{ mb: { xs: 6, md: 8 } }}>
            {commonProcessSteps.map((step, index) => (
              <ScrollReveal key={step.step} delay={index * 100}>
                <Card
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    width: { xs: '100%', sm: 500, md: 600 },
                    p: { xs: 2, md: 2.5 },
                    borderRadius: 3,
                    border: `2px solid ${ACCENT}`,
                    boxShadow: 'none',
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: ACCENT,
                      color: 'white',
                      width: { xs: 38, sm: 44, md: 48 },
                      height: { xs: 38, sm: 44, md: 48 },
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: { xs: '1.1rem', md: '1.5rem' },
                      mr: { xs: 2, md: 3 },
                      flexShrink: 0,
                    }}
                  >
                    {step.step}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={cardTitleText}>{step.title}</Typography>
                    <Typography color="text.secondary" sx={cardBodyText}>
                      {step.description}
                    </Typography>
                  </Box>
                </Card>
              </ScrollReveal>
            ))}
          </Stack>

          {/* Bifurcación de Modos */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: { xs: 3, sm: 4, md: 5 },
            }}
          >
            {/* Modo Inversionista */}
            <Box>
              <Box
                sx={{
                  mb: { xs: 3, md: 4 },
                  textAlign: { xs: 'left', sm: 'center' },
                }}
              >
                <Typography
                  sx={{
                    mb: 1,
                    color: theme.palette.success.dark,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: { xs: 'flex-start', sm: 'center' },
                    gap: 1,
                    fontWeight: 700,
                    fontSize: { xs: '1.15rem', sm: '1.3rem', md: '1.5rem' },
                  }}
                >
                  <TrendingUp sx={{ fontSize: { xs: 22, md: 26 } }} /> MODO INVERSIONISTA
                </Typography>
                <Typography
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: '0.875rem', sm: '0.95rem', md: '1.0625rem' },
                    minHeight: { xs: 'auto', sm: '3em' },
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: { xs: 'flex-start', sm: 'center' },
                    textAlign: { xs: 'left', sm: 'center' },
                  }}
                >
                  Participás desde las primeras etapas del proyecto de urbanización
                </Typography>
              </Box>

              <Stack spacing={{ xs: 2, sm: 2.5, md: 3 }}>
                {investorSteps.map((step) => (
                  <Card
                    key={step.step}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: { xs: 2, md: 2.5 },
                      borderRadius: 3,
                      border: `2px solid ${theme.palette.success.main}`,
                      bgcolor: alpha(theme.palette.success.main, 0.05),
                      boxShadow: 'none',
                    }}
                  >
                    <Box
                      sx={{
                        bgcolor: theme.palette.success.main,
                        color: 'white',
                        width: { xs: 38, sm: 44, md: 48 },
                        height: { xs: 38, sm: 44, md: 48 },
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: { xs: '1.1rem', md: '1.5rem' },
                        mr: { xs: 2, md: 3 },
                        flexShrink: 0,
                      }}
                    >
                      {step.step}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={cardTitleText}>{step.title}</Typography>
                      <Typography color="text.secondary" sx={cardBodyText}>
                        {step.description}
                      </Typography>
                    </Box>
                  </Card>
                ))}
              </Stack>
            </Box>

            {/* Modo Ahorrista */}
            <Box>
              <Box
                sx={{
                  mb: { xs: 3, md: 4 },
                  textAlign: { xs: 'left', sm: 'center' },
                }}
              >
                <Typography
                  sx={{
                    mb: 1,
                    color: ACCENT_DARK,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: { xs: 'flex-start', sm: 'center' },
                    gap: 1,
                    fontWeight: 700,
                    fontSize: { xs: '1.15rem', sm: '1.3rem', md: '1.5rem' },
                  }}
                >
                  <Domain sx={{ fontSize: { xs: 22, md: 26 } }} /> MODO AHORRISTA
                </Typography>
                <Typography
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: '0.875rem', sm: '0.95rem', md: '1.0625rem' },
                    minHeight: { xs: 'auto', sm: '3em' },
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: { xs: 'flex-start', sm: 'center' },
                    textAlign: { xs: 'left', sm: 'center' },
                  }}
                >
                  Ahorrás en grupo para acceder al lote para tu casa propia
                </Typography>
              </Box>

              <Stack spacing={{ xs: 2, sm: 2.5, md: 3 }}>
                {saverSteps.map((step) => (
                  <Card
                    key={step.step}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: { xs: 2, md: 2.5 },
                      borderRadius: 3,
                      border: `2px solid ${ACCENT}`,
                      bgcolor: ACCENT_BG,
                      boxShadow: 'none',
                    }}
                  >
                    <Box
                      sx={{
                        bgcolor: ACCENT,
                        color: 'white',
                        width: { xs: 38, sm: 44, md: 48 },
                        height: { xs: 38, sm: 44, md: 48 },
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: { xs: '1.1rem', md: '1.5rem' },
                        mr: { xs: 2, md: 3 },
                        flexShrink: 0,
                      }}
                    >
                      {step.step}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={cardTitleText}>{step.title}</Typography>
                      <Typography color="text.secondary" sx={cardBodyText}>
                        {step.description}
                      </Typography>
                    </Box>
                  </Card>
                ))}
              </Stack>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 5, md: 6 } }}>
            <Box
              sx={{
                p: { xs: 2.5, md: 3 },
                textAlign: 'center',
                borderRadius: 3,
                border: `1px solid ${ACCENT}`,
                bgcolor: 'background.paper',
                maxWidth: 800,
                width: '100%',
              }}
            >
              <Typography
                fontWeight={700}
                color="text.primary"
                sx={{ fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1.0625rem' } }}
              >
                Transparencia, seguridad y administración fiduciaria son la base de todo el proceso
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ── SECCIÓN 3: ADMINISTRACIÓN Y CARACTERÍSTICAS ── */}
      <Box sx={{ py: { xs: 7, sm: 9, md: 14 }, bgcolor: 'secondary.light' }}>
        <Container maxWidth="lg">

          {/* Administración */}
          <Typography sx={{ ...sectionTitle, ...bigTitleSize, color: ACCENT, mb: { xs: 5, md: 6 } }}>
            Cómo se administran los grupos y fondos
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              gap: { xs: 3, sm: 3, md: 4 },
              mb: { xs: 6, md: 10 },
            }}
          >
            {administrationCards.map((card, index) => (
              <Box key={index}>
                <ScrollReveal delay={index * 150}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 3,
                      overflow: 'hidden',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                    }}
                  >
                    <Box
                      component="img"
                      src={card.image}
                      alt={card.title}
                      sx={{
                        width: '100%',
                        height: { xs: 180, sm: 200, md: 220 },
                        objectFit: 'cover',
                        display: 'block',
                        verticalAlign: 'bottom',
                      }}
                    />
                    <Box
                      sx={{
                        p: { xs: 2.5, sm: 2.5, md: 3 },
                        bgcolor: alpha(theme.palette.text.primary, 0.03),
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        flexGrow: 1,
                      }}
                    >
                      <Typography sx={{ ...imageCardTitleText, mb: { xs: 0.5, md: 1 } }}>
                        {card.title}
                      </Typography>
                      <Typography
                        color="text.secondary"
                        sx={{ ...imageCardBodyText, maxWidth: 320 }}
                      >
                        {card.description}
                      </Typography>
                    </Box>
                  </Card>
                </ScrollReveal>
              </Box>
            ))}
          </Box>

          {/* Características Adicionales */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              gap: { xs: 3, sm: 3, md: 4 },
            }}
          >
            {featureCards.map((card, index) => (
              <Box key={index}>
                <ScrollReveal delay={index * 150}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 3,
                      overflow: 'hidden',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                    }}
                  >
                    <Box
                      component="img"
                      src={card.image}
                      alt={card.title}
                      sx={{
                        width: '100%',
                        height: { xs: 180, sm: 200, md: 220 },
                        objectFit: 'cover',
                        display: 'block',
                        verticalAlign: 'bottom',
                      }}
                    />
                    <Box
                      sx={{
                        p: { xs: 2.5, sm: 2.5, md: 3 },
                        bgcolor: alpha(theme.palette.text.primary, 0.03),
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        flexGrow: 1,
                      }}
                    >
                      <Typography sx={{ ...imageCardTitleText, mb: { xs: 0.5, md: 1 } }}>
                        {card.title}
                      </Typography>
                      <Typography
                        color="text.secondary"
                        sx={{ ...imageCardBodyText, maxWidth: 320 }}
                      >
                        {card.description}
                      </Typography>
                    </Box>
                  </Card>
                </ScrollReveal>
              </Box>
            ))}
          </Box>

          <Box sx={{ textAlign: 'center', mt: { xs: 5, md: 6 } }}>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate(ROUTES.PROYECTOS.SELECCION_ROL)}
              sx={{
                borderColor: ACCENT,
                color: ACCENT,
                fontWeight: 600,
                fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' },
                borderRadius: '10px',
                borderWidth: 2,
                textTransform: 'none',
                px: { xs: 3, md: 4 },
                width: { xs: '100%', sm: 'auto' },
                '&:hover': { borderWidth: 2, bgcolor: ACCENT_BG },
              }}
            >
              Conocé nuestros proyectos
            </Button>
          </Box>
        </Container>
      </Box>

{/* ── SECCIÓN 4: POR QUÉ ELEGIR LOTEPLAN (Comparativa) ── */}
<Box sx={{ py: { xs: 7, sm: 9, md: 1 }, bgcolor: 'secondary.light' }}>
  <Container maxWidth="lg">
    <Typography sx={{ ...sectionTitle, ...bigTitleSize, mb: { xs: 5, md: 7 } }}>
      ¿Por qué elegir <Box component="span" sx={{ color: ACCENT }}>Loteplan?</Box>
    </Typography>

    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: { xs: 3, sm: 4, md: 5 },
          maxWidth: 950,
          width: '100%',
          alignItems: 'stretch',
        }}
      >
        {/* Card: Crédito Tradicional */}
        <Card
          elevation={0}
          sx={{
            p: { xs: 3, sm: 3.5, md: 4 },
            borderRadius: 4,
            border: `2px solid ${alpha(theme.palette.error.main, 0.25)}`,
            bgcolor: alpha(theme.palette.error.main, 0.04),
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          <Typography
            sx={{
              ...cardTitleText,
              mb: { xs: 2.5, md: 3 },
              color: 'text.primary',
              textAlign: { xs: 'center', sm: 'left' },
            }}
          >
            Crédito Tradicional
          </Typography>
          <Stack spacing={{ xs: 1.75, md: 2.25 }}>
            {comparisonData.traditional.map((item, idx) => (
              <Box key={idx} display="flex" alignItems="center" gap={1.5}>
                <Close
                  sx={{
                    color: 'error.main',
                    fontSize: { xs: 20, md: 22 },
                    flexShrink: 0,
                    bgcolor: alpha(theme.palette.error.main, 0.1),
                    borderRadius: '50%',
                    p: 0.5,
                  }}
                />
                <Typography color="text.secondary" sx={{ ...cardBodyText, fontWeight: 500 }}>
                  {item}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Card>

        {/* Card: Loteplan */}
        <Card
          elevation={0}
          sx={{
            p: { xs: 3, sm: 3.5, md: 4 },
            borderRadius: 4,
            border: `2px solid ${alpha(theme.palette.success.main, 0.4)}`,
            bgcolor: theme.palette.success.light,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            boxShadow: `0 8px 24px ${alpha(theme.palette.success.main, 0.15)}`,
          }}
        >
          <Typography
            sx={{
              ...cardTitleText,
              mb: { xs: 2.5, md: 3 },
              color: theme.palette.success.dark ?? theme.palette.success.main,
              textAlign: { xs: 'center', sm: 'left' },
            }}
          >
            Loteplan
          </Typography>
          <Stack spacing={{ xs: 1.75, md: 2.25 }}>
            {comparisonData.loteplan.map((item, idx) => (
              <Box key={idx} display="flex" alignItems="center" gap={1.5}>
                <Check
                  sx={{
                    color: 'success.main',
                    fontSize: { xs: 20, md: 22 },
                    flexShrink: 0,
                    bgcolor: alpha(theme.palette.success.main, 0.15),
                    borderRadius: '50%',
                    p: 0.5,
                  }}
                />
                <Typography color="text.primary" sx={{ ...cardBodyText, fontWeight: 500 }}>
                  {item}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Card>
      </Box>
    </Box>

    <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 5, md: 7 } }}>
      <Box
        sx={{
          p: { xs: 2.5, sm: 3, md: 4 },
          borderRadius: 4,
          border: `2px solid ${ACCENT}`,
          textAlign: 'center',
          maxWidth: 900,
          width: '100%',
        }}
      >
        <Typography
          fontWeight={700}
          color="text.primary"
          sx={{ fontSize: { xs: '0.9rem', sm: '1rem', md: '1.125rem' }, lineHeight: 1.6 }}
        >
          Cuando el crédito no alcanza, el ahorro organizado te ofrece un camino diferente
          para comprar tu lote en cuotas
        </Typography>
      </Box>
    </Box>
  </Container>
</Box>
    </Box>
  );
};

export default InformacionLoteplan;