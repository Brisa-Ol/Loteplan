import { ROUTES } from '@/routes';
import {
  AccountBalance,
  ArrowForward,
  CheckCircle,
  Dashboard as DashboardIcon,
  Home as HomeIcon,
  LaptopMac,
  Map,
  TrendingUp,
} from '@mui/icons-material';
import {
  alpha,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/core/context/AuthContext';

// ─── Types ───────────────────────────────────────────────────────────────────

type AllowedColors = 'primary' | 'secondary' | 'warning' | 'error';

interface ModeData {
  type: string;
  title: string;
  textColor: string;
  subtitle: string;
  icon: React.ElementType;
  color: AllowedColors;
  cardBg: string;
  accentColor: string;
  iconBg: string;
  iconColor: string;
  description: string;
  benefits: string[];
  ctaLabel: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ACCENT = '#CC6333';
const ACCENT_DARK = '#A34D26';
const ACCENT_BG = '#ECDDD5';

const justifyText = { textAlign: { xs: 'left', md: 'justify' } } as const;

const sectionTitle = {
  fontWeight: 700,
  fontFamily: 'Inter, sans-serif',
  color: 'text.primary',
} as const;

const howItWorksSteps = [
  {
    step: '01',
    description: 'Te registrás y elegís tu plan dentro del fideicomiso',
    image: 'public/Comofunciona/Ahorrista/CómofuncionaAhorrista_1a.jpg',
  },
  {
    step: '02',
    description: 'Aportás en cuotas mensuales planificadas',
    image: 'public/Home/Cómo funciona Ahorrista_2b.jpg',
  },
  {
    step: '03',
    description: 'El sistema adquiere el lote y lo adjudica con escritura',
    image: 'public/Home/Cómo funciona Ahorrista_3a.jpg',
  },
];

const twoModes: ModeData[] = [
  {
    type: 'ahorrista',
    title: 'Modo Ahorrista',
    subtitle: 'Accedé al terreno para tu casa propia',
    icon: HomeIcon,
    color: 'primary',
    accentColor: ACCENT,
    iconBg: ACCENT_BG,
    iconColor: ACCENT_DARK,
    cardBg: '#ECECEC',
    textColor: 'text.primary',
    description:
      'Cuando el crédito no alcanza, el ahorro organizado sí. En Loteplan das el primer paso hacia tu casa propia mediante cuotas planificadas, dentro de una plataforma fiduciaria colaborativa diseñada para acompañar durante todo el proceso.',
    benefits: [
      'Cuotas planificadas',
      'Proceso transparente con adjudicación y escritura del lote',
      'Administración fiduciaria',
      'Alternativa real frente al crédito bancario limitado',
    ],
    ctaLabel: 'Da el primer paso para tu casa',
  },
  {
    type: 'inversionista',
    title: 'Modo Inversionista',
    subtitle: 'Participá en oportunidades respaldadas por tierra real',
    icon: TrendingUp,
    color: 'primary',
    accentColor: ACCENT,
    iconBg: ACCENT_BG,
    iconColor: ACCENT_DARK,
    cardBg: '#ECECEC',
    textColor: 'text.primary',
    description:
      'En Modo Inversionista podés acceder a proyectos vinculados al desarrollo de tierra mediante estructuras transparentes y activos inmobiliarios reales.',
    benefits: [
      'Participación en activos inmobiliarios reales',
      'Esquema de entrada y salida planificada',
      'Potencial de valorización asociado a la evolución y comercialización del activo',
      'Trazabilidad digital de cada etapa del proceso',
      'Administración fiduciaria',
    ],
    ctaLabel: 'Conocé oportunidades disponibles',
  },
];

const trustFeatures = [
  {
    icon: LaptopMac,
    title: 'Plataforma digital propia',
    description:
      'Gestiona adhesiones, aportes, adjudicaciones y seguimiento del proceso con trazabilidad en cada etapa.',
  },
  {
    icon: AccountBalance,
    title: 'Modelo fiduciario estandarizado',
    description:
      'Cada grupo opera bajo reglas claras y separación patrimonial, lo que permite replicar el esquema en nuevos desarrollos.',
  },
  {
    icon: Map,
    title: 'Integración progresiva de proveedores de suelo',
    description:
      'Incorporamos lotes urbanizados que cumplan criterios legales y urbanísticos definidos.',
  },
  {
    icon: TrendingUp,
    title: 'Crecimiento por etapas',
    description:
      'El sistema se expande en función de la conformación de grupos y la disponibilidad de activos aptos.',
  },
];

const metrics = [
  { value: '+USD 1,1M', label: 'Estructurados en activos inmobiliarios reales y respaldados' },
  { value: '119', label: 'Lotes urbanizados adjudicados en desarrollos finalizados' },
  { value: '+400', label: 'Lotes proyectados bajo contratos de urbanización vigentes' },
];

const trustPoints = [
  'Administración mediante fideicomiso con separación patrimonial',
  'Lotes urbanizados y escriturables',
  'Reglas claras y proceso transparente',
  'Operaciones registradas y trazables digitalmente',
];

// ─── Component ───────────────────────────────────────────────────────────────

const Home: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  return (
    <Box sx={{ bgcolor: 'background.default', color: 'text.primary' }}>

      {/* ── HERO ── */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'primary.contrastText',
          position: 'relative',
          overflow: 'hidden',
          py: { xs: 8, md: 11 },
        }}
      >
        {/* Decorative background pattern */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.1,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'center',
              gap: { xs: 5, md: 8 },
            }}
          >
            {/* Hero copy */}
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h2"
                component="h1"
                sx={{
                  mb: 3,
                  fontWeight: 800,
                  lineHeight: 1.15,
                  fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' },
                }}
              >
                Accedé a tu lote urbanizado{' '}
                <Box component="br" sx={{ display: { xs: 'none', sm: 'block' } }} />
                <Box component="span" sx={{ color: alpha(theme.palette.common.white, 0.8) }}>
                  sin depender del crédito bancario
                </Box>
              </Typography>

              <Typography
                variant="h6"
                component="p"
                sx={{
                  mb: 5,
                  fontSize: { xs: '0.95rem', sm: '1.05rem', md: '1.25rem' },
                  color: alpha(theme.palette.common.white, 0.9),
                  fontWeight: 400,
                  maxWidth: 650,
                  lineHeight: 1.8,
                  ...justifyText,
                }}
              >
                Loteplan es una plataforma fiduciaria colaborativa que organiza grupos de ahorro e
                inversión para facilitar el acceso progresivo a lotes urbanizados y escriturables,
                con trazabilidad digital en cada etapa del proceso.
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                {isAuthenticated ? (
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<DashboardIcon />}
                    onClick={() => navigate(ROUTES.CLIENT.DASHBOARD)}
                    sx={{
                      bgcolor: 'common.white',
                      color: 'primary.main',
                      fontWeight: 600,
                      px: 4,
                      '&:hover': { bgcolor: alpha(theme.palette.common.white, 0.9) },
                    }}
                  >
                    Ir a mi Panel
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<HomeIcon />}
                      onClick={() => navigate(ROUTES.REGISTER)}
                      sx={{
                        bgcolor: 'common.white',
                        color: 'primary.main',
                        fontWeight: 600,
                        '&:hover': { bgcolor: alpha(theme.palette.common.white, 0.9) },
                      }}
                    >
                      Crear mi cuenta
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      startIcon={<TrendingUp />}
                      onClick={() => navigate(ROUTES.PUBLIC.COMO_FUNCIONA)}
                      sx={{
                        borderColor: 'common.white',
                        color: 'common.white',
                        fontWeight: 600,
                        '&:hover': {
                          borderColor: 'common.white',
                          bgcolor: alpha(theme.palette.common.white, 0.1),
                          borderWidth: '2px',
                        },
                      }}
                    >
                      Cómo funciona
                    </Button>
                  </>
                )}
              </Stack>
            </Box>

            {/* Hero image — desktop only */}
            <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }}>
              <Box sx={{ transform: 'perspective(1000px) rotateY(-5deg)' }}>
                <Box
                  component="img"
                  src="public/Home/Cómo funciona Inversionista_6.jpg"
                  alt="Inversión inmobiliaria Loteplan"
                  sx={{
                    width: '100%',
                    borderRadius: 4,
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                  }}
                />
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ── QUÉ ES LOTEPLAN ── */}
      <Box sx={{ py: { xs: 8, md: 14 }, bgcolor: 'secondary.light' }}>
        <Container maxWidth="lg">
          <Typography
            textAlign="center"
            sx={{
              ...sectionTitle,
              fontSize: { xs: '2rem', md: '2.75rem' },
              lineHeight: 1.2,
              mb: 3,
            }}
          >
            Qué es{' '}
            <Box component="span" sx={{ color: 'primary.main' }}>
              Loteplan
            </Box>
          </Typography>

          <Typography
            color="text.secondary"
            maxWidth={1400}
            mx="auto"
            sx={{ fontSize: { xs: '1rem', md: '1.375rem' }, lineHeight: 1.7, ...justifyText, mb: 4 }}
          >
            <Box component="strong" sx={{ fontWeight: 700 }}>
              Somos un sistema estructurado pensado para ser el primer paso hacia tu casa. Organizamos
              capital bajo fideicomiso para adquirir lotes urbanizados y escriturables.{' '}
            </Box>
            No somos un loteo tradicional, no otorgamos crédito y no vendemos anticipos de
            urbanización futura.
          </Typography>

          {/* Step numbers — desktop connector line */}
          <Box sx={{ position: 'relative', mb: 4 }}>
            <Box
              aria-hidden
              sx={{
                position: 'absolute',
                top: '20px',
                left: 0,
                right: 0,
                height: '2px',
                bgcolor: '#D1D1D1',
                zIndex: 0,
                display: { xs: 'none', md: 'block' },
              }}
            />
            <Box
              sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 4 }}
            >
              {howItWorksSteps.map((step) => (
                <Box key={step.step} sx={{ display: 'flex', justifyContent: 'center', zIndex: 1 }}>
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: '50%',
                      bgcolor: ACCENT,
                      color: 'white',
                      display: { xs: 'none', md: 'flex' },
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.25rem',
                    }}
                  >
                    {step.step}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Step cards */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              gap: { xs: 3, md: 7 },
            }}
          >
            {howItWorksSteps.map((step) => (
              <Card
                key={step.step}
                elevation={0}
                sx={{
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                  borderRadius: 4,
                  overflow: 'hidden',
                  bgcolor: 'background.paper',
                }}
              >
                <Box
                  component="img"
                  src={step.image}
                  alt={step.description}
                  sx={{ width: '100%', height: { xs: 180, md: 190 }, objectFit: 'cover' }}
                />
                <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                  <Typography
                    color="text.secondary"
                    lineHeight={1.6}
                    fontWeight={400}
                    fontSize={{ xs: '0.9rem', md: '1.25rem' }}
                  >
                    {step.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── MODELO FIDUCIARIO ── */}
      <Box sx={{ py: { xs: 8, md: '60px' }, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: { xs: 4, md: '80px' },
              alignItems: 'stretch',
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography
                sx={{
                  ...sectionTitle,
                  fontSize: { xs: '1.75rem', md: '2.75rem' },
                  lineHeight: 1.15,
                  mb: '32px',
                }}
              >
                Un modelo fiduciario que{' '}
                <Box component="span" sx={{ color: 'primary.main' }}>
                  brinda previsibilidad jurídica
                </Box>{' '}
                en cada etapa
              </Typography>

              <Stack spacing="20px" sx={{ mb: '32px' }}>
                {trustPoints.map((item) => (
                  <Stack key={item} direction="row" spacing={1.6} alignItems="center">
                    <CheckCircle sx={{ color: 'primary.main', fontSize: '24px', flexShrink: 0 }} />
                    <Typography
                      color="text.secondary"
                      fontSize={{ xs: '1rem', md: '1.25rem' }}
                      lineHeight={1.7}
                    >
                      {item}
                    </Typography>
                  </Stack>
                ))}
              </Stack>

              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForward />}
                onClick={() => navigate(ROUTES.PUBLIC.COMO_FUNCIONA)}
                sx={{ fontWeight: 600, fontSize: '18px', borderRadius: '10px', textTransform: 'none', alignSelf: 'flex-start' }}
              >
                Ver cómo funciona en detalle
              </Button>
            </Box>

            <Box
              component="img"
              src="public/Home/contrato43.jpeg"
              alt="Confianza y transparencia"
              sx={{
                width: '100%',
                height: { xs: 280, md: '100%' },
                borderRadius: '24px',
                objectFit: 'cover',
                display: 'block',
                order: { xs: -1, md: 0 },
              }}
            />
          </Box>
        </Container>
      </Box>

      {/* ── DE DESARROLLADORES A INFRAESTRUCTURA ── */}
      <Box sx={{ py: { xs: 8, md: 14 }, bgcolor: 'secondary.light' }}>
        <Container maxWidth="lg">
          <Typography
            textAlign="center"
            sx={{
              ...sectionTitle,
              fontSize: { xs: '2rem', md: '3.25rem' },
              lineHeight: 1.1,
              mb: 3,
            }}
          >
            De desarrolladores de suelo a{' '}
            <Box component="span" sx={{ color: 'primary.main', display: 'block' }}>
              infraestructura financiera inmobiliaria
            </Box>
          </Typography>

          <Typography
            color="text.secondary"
            maxWidth={1400}
            mx="auto"
            sx={{ fontSize: { xs: '1rem', md: '1.375rem' }, lineHeight: 1.7, ...justifyText, mb: { xs: 6, md: 4 } }}
          >
            Durante más de 15 años participamos en el desarrollo de suelo urbano, organizando grupos,
            gestionando procesos de urbanización y adjudicando lotes en proyectos concretos y verificables.
            Hoy transformamos esa experiencia en una plataforma tecnológica y fiduciaria que permite
            organizar el acceso progresivo a lotes y activos inmobiliarios de forma clara, ordenada y
            escalable.
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              gap: { xs: 3, md: 5 },
            }}
          >
            {metrics.map((stat) => (
              <Card
                key={stat.label}
                elevation={0}
                sx={{
                  p: { xs: 3, md: 5 },
                  textAlign: 'center',
                  borderRadius: '24px',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.05)}`,
                }}
              >
                <Typography
                  fontWeight={800}
                  color="primary.main"
                  sx={{
                    mb: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: { xs: '60px', md: '90px' },
                    whiteSpace: 'nowrap',
                  }}
                  fontSize={{ xs: '2.25rem', md: stat.value.length > 5 ? '3.2rem' : '3.875rem' }}
                >
                  {stat.value}
                </Typography>
                <Typography
                  color="text.secondary"
                  fontWeight={500}
                  fontSize={{ xs: '1rem', md: '1.375rem' }}
                  lineHeight={1.5}
                >
                  {stat.label}
                </Typography>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── DOS MODOS ── */}
      <Box sx={{ py: { xs: 8, md: 1 }, bgcolor: 'secondary.light' }}>
        <Container maxWidth="lg">
          <Typography
            textAlign="center"
            sx={{ ...sectionTitle, fontSize: { xs: '1.75rem', md: '3.25rem' }, lineHeight: 1.1, mb: '20px' }}
          >
            Dos formas de participar
          </Typography>
          <Typography
            textAlign="center"
            color="text.secondary"
            fontWeight={400}
            lineHeight={1.5}
            fontSize={{ xs: '1rem', md: '1.375rem' }}
            sx={{ mb: { xs: 5, md: '60px' } }}
          >
            Elegí el modo que mejor se adapte a tus objetivos
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: { xs: 3, md: 5 },
            }}
          >
            {[...twoModes].reverse().map((mode) => (
              <Card
                key={mode.type}
                onMouseEnter={() => setHoveredMode(mode.type)}
                onMouseLeave={() => setHoveredMode(null)}
                sx={{
                  minHeight: { xs: 'auto', md: 680 },
                  display: 'flex',
                  flexDirection: 'column',
                  bgcolor: mode.cardBg,
                  color: mode.textColor,
                  border: mode.type === 'ahorrista'
                    ? `1px solid ${alpha(theme.palette.divider, 0.12)}`
                    : 'none',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  transform: hoveredMode === mode.type ? 'translateY(-8px)' : 'none',
                  boxShadow: hoveredMode === mode.type ? theme.shadows[8] : theme.shadows[1],
                }}
              >
                <Box
                  component="img"
                  src={
                    mode.type === 'ahorrista'
                      ? 'public/Home/Home1b_modoahorrista.jpg'
                      : 'public/Home/Home2a_modoinversionista.jpg'
                  }
                  alt={mode.title}
                  sx={{ width: '100%', height: { xs: 220, md: 300 }, objectFit: 'cover', flexShrink: 0 }}
                />

                <CardContent
                  sx={{
                    pt: { xs: 3, md: '30px' },
                    pb: { xs: 4, md: '40px' },
                    px: { xs: 3, md: '40px' },
                    display: 'flex',
                    flexDirection: 'column',
                    flexGrow: 1,
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: '12px' }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: mode.iconBg,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <mode.icon sx={{ fontSize: 26, color: mode.iconColor }} />
                    </Box>
                    <Typography
                      fontWeight={700}
                      color="inherit"
                      fontSize={{ xs: '1.5rem', md: '2.25rem' }}
                      lineHeight={1.2}
                    >
                      {mode.title}
                    </Typography>
                  </Stack>

                  <Typography
                    fontSize={{ xs: '1rem', md: '1.375rem' }}
                    fontWeight={600}
                    sx={{ color: mode.accentColor, mb: '28px' }}
                  >
                    {mode.subtitle}
                  </Typography>

                  <Typography
                    fontSize={{ xs: '0.95rem', md: '1.125rem' }}
                    fontWeight={400}
                    sx={{ mb: '32px', lineHeight: 1.7, ...justifyText }}
                  >
                    {mode.description}
                  </Typography>

                  <Stack spacing="18px" sx={{ mb: '40px', flexGrow: 1 }}>
                    {mode.benefits.map((benefit) => (
                      <Stack key={benefit} direction="row" spacing={1.5} alignItems="flex-start">
                        <CheckCircle fontSize="small" sx={{ color: mode.accentColor, mt: 0.2, flexShrink: 0 }} />
                        <Typography
                          fontWeight={500}
                          fontSize={{ xs: '0.95rem', md: '1.125rem' }}
                          lineHeight={1.6}
                        >
                          {benefit}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>

                  <Button
                    variant="contained"
                    fullWidth
                    endIcon={<ArrowForward />}
                    onClick={() => navigate(ROUTES.PUBLIC.COMO_FUNCIONA)}
                    sx={{
                      mt: 'auto',
                      bgcolor: mode.accentColor,
                      color: '#FFFFFF',
                      fontWeight: 600,
                      fontSize: { xs: '1rem', md: '1.125rem' },
                      '&:hover': { bgcolor: mode.accentColor, opacity: 0.9 },
                    }}
                  >
                    {mode.ctaLabel}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── EVOLUCIÓN ── */}
      <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: 'secondary.light' }}>
        <Container maxWidth="lg">
          <Typography
            textAlign="center"
            sx={{
              ...sectionTitle,
              fontSize: { xs: '1.75rem', md: '52px' },
              lineHeight: 1.1,
              mb: '40px',
            }}
          >
            La experiencia no cambia.{' '}
            <Box component="span" sx={{ color: 'primary.main', display: 'block' }}>
              Evoluciona su forma de organización.
            </Box>
          </Typography>

          <Typography
            color="text.secondary"
            maxWidth="900px"
            mx="auto"
            lineHeight={1.7}
            fontSize={{ xs: '1rem', md: '22px' }}
            textAlign="center"
            sx={{ mb: { xs: 6, md: '80px' } }}
          >
            Loteplan es una estructura jurídica y tecnológica replicable que permite organizar capital
            y adquirir activos inmobiliarios de forma sistemática.
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: { xs: 5, md: '60px 100px' },
            }}
          >
            {trustFeatures.map((feature) => (
              <Box key={feature.title} display="flex" gap="24px" alignItems="flex-start">
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main',
                    width: { xs: 52, md: 64 },
                    height: { xs: 52, md: 64 },
                    flexShrink: 0,
                  }}
                >
                  <feature.icon sx={{ fontSize: { xs: 24, md: 28 } }} />
                </Avatar>
                <Box>
                  <Typography
                    fontWeight={600}
                    fontSize={{ xs: '1.125rem', md: '28px' }}
                    lineHeight={1.3}
                    sx={{ mb: '12px' }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    color="text.secondary"
                    lineHeight={1.65}
                    fontSize={{ xs: '0.95rem', md: '18px' }}
                  >
                    {feature.description}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── CTA FINAL ── */}
      {!isAuthenticated && (
        <Box
          sx={{
            py: { xs: '80px', md: '120px' },
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white',
            textAlign: 'center',
          }}
        >
          <Container maxWidth="md">
            <Typography
              sx={{
                mb: '32px',
                fontWeight: 700,
                fontSize: { xs: '2rem', md: '56px' },
                lineHeight: 1.1,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Accedé ahora al sistema.
            </Typography>

            <Typography
              sx={{
                mb: '48px',
                fontSize: { xs: '1rem', md: '24px' },
                fontWeight: 400,
                lineHeight: 1.6,
                maxWidth: '900px',
                mx: 'auto',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Creá tu cuenta gratis y analizá en detalle su funcionamiento antes de decidir
            </Typography>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing="24px"
              justifyContent="center"
              alignItems="center"
            >
              <Button
                variant="contained"
                size="large"
                startIcon={<HomeIcon sx={{ fontSize: '22px !important' }} />}
                onClick={() => navigate(ROUTES.REGISTER)}
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: { xs: '1rem', md: '20px' },
                  height: { xs: 52, md: '60px' },
                  borderRadius: '12px',
                  px: { xs: 4, md: '40px' },
                  '&:hover': { bgcolor: alpha(theme.palette.common.white, 0.9) },
                }}
              >
                Crear mi cuenta
              </Button>

              <Button
                variant="outlined"
                size="large"
                startIcon={<TrendingUp sx={{ fontSize: '22px !important' }} />}
                onClick={() => navigate(ROUTES.LOGIN)}
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: { xs: '1rem', md: '20px' },
                  height: { xs: 52, md: '60px' },
                  borderRadius: '12px',
                  borderWidth: '2px',
                  px: { xs: 4, md: '40px' },
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: alpha(theme.palette.common.white, 0.1),
                    borderWidth: '2px',
                  },
                }}
              >
                Iniciar Sesión
              </Button>
            </Stack>
          </Container>
        </Box>
      )}
    </Box>
  );
};

export default Home;