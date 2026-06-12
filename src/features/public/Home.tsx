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

const howItWorksSteps = [
  {
    step: '01',
    description: 'Te registrás y elegís tu plan dentro del fideicomiso',
    image: 'public/Comofunciona/Ahorrista/CómofuncionaAhorrista_1a.jpg',
  },
  {
    step: '02',
    description: 'Te registrás y elegís tu plan dentro del fideicomiso',
    image: 'public/Home/Cómo funciona Ahorrista_2b.jpg',
  },
  {
    step: '03',
    description: 'Te registrás y elegís tu plan dentro del fideicomiso',
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
    accentColor: '#CC6333',
    iconBg: '#ECDDD5',
    iconColor: '#A34D26',
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
    accentColor: '#CC6333',
    iconBg: '#ECDDD5',
    iconColor: '#A34D26',
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
  { value: '+USD 1,1M', label: 'Estructurados en activos inmobiliarios reales' },
  { value: '119', label: 'Lotes urbanizados adjudicados en desarrollos finalizados' },
  { value: '+400', label: 'Lotes proyectados bajo contratos de urbanización vigentes' },
];

const trustPoints = [
  'Administración mediante fideicomiso con separación patrimonial',
  'Lotes urbanizados y escriturables',
  'Reglas claras y proceso transparente',
  'Operaciones registradas y trazables digitalmente',
];

const Home: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  return (
    <Box sx={{ bgcolor: 'background.default', color: 'text.primary' }}>

      {/* HERO */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'primary.contrastText',
          position: 'relative',
          overflow: 'hidden',
          py: { xs: 10, md: 11 },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.1,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <Container maxWidth="lg" sx={{ position: 'relative' }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', gap: 8 }}>
            <Box sx={{ flex: 1, width: '100%' }}>
              <Typography
                variant="h2"
                component="h1"
                sx={{ mb: 3, fontWeight: 800, lineHeight: 1.1, fontSize: { xs: '1.75rem', md: '3rem' } }}
              >
                Accedé a tu lote urbanizado <br />
                <Box component="span" sx={{ color: alpha(theme.palette.common.white, 0.8) }}>
                  sin depender del crédito bancario
                </Box>
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  mb: 6,
                  fontSize: { xs: '1rem', md: '1.25rem' },
                  color: alpha(theme.palette.common.white, 0.9),
                  fontWeight: 400,
                  maxWidth: 650,
                  lineHeight: 1.8,
                  textAlign: 'justify',
                }}
              >
                Loteplan es una plataforma fiduciaria colaborativa que organiza grupos de ahorro para facilitar el
                acceso progresivo a lotes urbanizados y escriturables, con trazabilidad digital en cada etapa del
                proceso.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 3 }}>
                {!isAuthenticated ? (
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
                ) : (
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
                )}
              </Stack>
            </Box>
            <Box sx={{ flex: 1, width: '100%', display: { xs: 'none', md: 'block' } }}>
              <Box sx={{ position: 'relative', transform: 'perspective(1000px) rotateY(-5deg)' }}>
                <Box
                  component="img"
                  src="public/Home/Cómo funciona Inversionista_6.jpg"
                  alt="Inversión inmobiliaria Loteplan"
                  sx={{ width: '100%', borderRadius: 4, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
                />
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* QUÉ ES LOTEPLAN */}
      <Box sx={{ py: { xs: 10, md: 14 }, bgcolor: 'secondary.light' }}>
        <Container maxWidth="lg">
          <Typography
            color="text.primary"
            textAlign="center"
            fontSize={{ xs: '1.75rem', md: '3.125rem' }}
            sx={{ mb: 4, fontWeight: 800 }}
          >
            Qué es{' '}
            <Box component="span" fontSize={{ xs: '1.75rem', md: '3.125rem' }} sx={{ color: 'primary.main', fontWeight: 800 }}>
              Loteplan
            </Box>
          </Typography>
          <Typography
            variant="h5"
            color="text.secondary"
            textAlign="justify"
            maxWidth={950}
            mx="auto"
            lineHeight={1.8}
            mb={4}
            fontSize={{ xs: '1rem', md: '1.125rem' }}
          >
            Somos un sistema estructurado pensado para ser el primer paso hacia tu casa. Organizamos capital bajo
            fideicomiso para adquirir lotes urbanizados y escriturables. No somos un loteo tradicional, no otorgamos
            crédito y no vendemos anticipos de urbanización futura.
          </Typography>

          {/* Línea de pasos con números */}
          <Box sx={{ position: 'relative', mb: 4 }}>
            <Box
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
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                gap: 4,
              }}
            >
              {howItWorksSteps.map((step) => (
                <Box key={step.step} sx={{ display: 'flex', justifyContent: 'center', zIndex: 1 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      bgcolor: '#CC6333',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1rem',
                    }}
                  >
                    {step.step}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Cards de pasos */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 4 }}>
            {howItWorksSteps.map((step) => (
              <Card
                key={step.step}
                elevation={0}
                sx={{
                  width: '100%',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                  borderRadius: 4,
                  overflow: 'hidden',
                  bgcolor: 'background.paper',
                }}
              >
                <Box component="img" src={step.image} sx={{ width: '100%', height: 200, objectFit: 'cover' }} />
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" color="text.secondary" lineHeight={1.7} textAlign="justify">
                    {step.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>

      {/* MODELO FIDUCIARIO */}
      <Box sx={{ py: { xs: 10, md: 14 }, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: { xs: 6, md: 10 },
              alignItems: 'center',
            }}
          >
            <Box>
              <Typography
                variant="h5"
                gutterBottom
                fontWeight={800}
                color="text.primary"
                sx={{ mb: 4 }}
                fontSize={{ xs: '1.75rem', md: '2.125rem' }}
              >
                Un modelo fiduciario que{' '}
                <Box component="span" sx={{ color: 'primary.main' }}>
                  brinda previsibilidad jurídica
                </Box>{' '}
                en cada etapa
              </Typography>
              <Stack spacing={2} sx={{ mb: 5 }}>
                {trustPoints.map((item, index) => (
                  <Stack key={index} direction="row" spacing={1.6} alignItems="flex-start">
                    <CheckCircle sx={{ color: 'primary.main', mt: 0.5 }} />
                    <Typography variant="h5" color="text.secondary" fontWeight={500} textAlign="justify">
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
                height: 'auto',
                borderRadius: 4,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                display: 'block',
              }}
            />
          </Box>
        </Container>
      </Box>

      {/* TRACK RECORD */}
      <Box sx={{ py: { xs: 10, md: 14 }, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8, maxWidth: 950, mx: 'auto' }}>
            <Typography
              gutterBottom
              fontWeight={800}
              color="text.primary"
              fontSize={{ xs: '1.75rem', md: '3.125rem' }}
              lineHeight={1.2}
            >
              De desarrolladores de suelo a{' '}
              <Box component="span" sx={{ color: 'primary.main', display: 'block' }}>
                infraestructura financiera inmobiliaria
              </Box>
            </Typography>
            <Typography
              variant="h5"
              color="text.secondary"
              textAlign="justify"
              maxWidth={900}
              mx="auto"
              lineHeight={1.8}
              mb={7}
              fontSize={{ xs: '1rem', md: '1.125rem' }}
            >
              Durante más de 15 años participamos en el desarrollo de suelo urbano, organizando grupos, gestionando
              procesos de urbanización y adjudicando lotes en proyectos concretos y verificables. Hoy transformamos esa
              experiencia en una plataforma tecnológica y fiduciaria que permite organizar el acceso progresivo a lotes
              y activos inmobiliarios de forma clara, ordenada y escalable.
            </Typography>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 5, mb: 10 }}>
            {metrics.map((stat, index) => (
              <Card
                key={index}
                elevation={0}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  borderRadius: 4,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                }}
              >
                <Typography
                  variant="h3"
                  fontWeight={800}
                  color="primary.main"
                  sx={{ mb: 2 }}
                  fontSize={{ xs: '1.75rem', md: '1.5rem' }}
                >
                  {stat.value}
                </Typography>
                <Typography variant="h6" color="text.secondary" fontWeight={600}>
                  {stat.label}
                </Typography>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>

      {/* DOS MODOS */}
      <Box sx={{ py: { xs: 10, md: 14 }, bgcolor: 'secondary.light' }}>
        <Container maxWidth="lg">
          <Typography
            textAlign="center"
            gutterBottom
            fontWeight={800}
            color="text.primary"
            fontSize={{ xs: '1.75rem', md: '3.125rem' }}
          >
            Dos formas de participar
          </Typography>
          <Typography
            variant="subtitle1"
            textAlign="center"
            color="text.secondary"
            sx={{ mb: 8, fontWeight: 400 }}
            fontSize={{ xs: '1.125rem', md: '1.25rem' }}
          >
            Elegí el modo que mejor se adapte a tus objetivos
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 5 }}>
            {[...twoModes].reverse().map((mode) => (
              <Box key={mode.type} sx={{ display: 'flex' }}>
                <Card
                  onMouseEnter={() => setHoveredMode(mode.type)}
                  onMouseLeave={() => setHoveredMode(null)}
                  sx={{
                    width: '100%',
                    minHeight: { xs: 'auto', md: 680 },
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: mode.cardBg,
                    color: mode.textColor,
                    border: mode.type === 'ahorrista' ? `1px solid ${alpha(theme.palette.divider, 0.12)}` : 'none',
                   
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
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
                    sx={{ width: '100%', height: 300, objectFit: 'cover', flexShrink: 0 }}
                  />
                  <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: mode.iconBg,
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <mode.icon sx={{ fontSize: 26, color: mode.iconColor }} />
                      </Box>
                      <Box>
                        <Typography variant="h5" fontWeight={800} color="inherit">
                          {mode.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: mode.type === 'ahorrista' ? mode.accentColor : 'inherit',
                            fontWeight: 600,
                          }}
                        >
                          {mode.subtitle}
                        </Typography>
                      </Box>
                    </Stack>
                    <Typography
                      variant="body2"
                      sx={{ mb: 2, lineHeight: 1.7, textAlign: 'justify' }}
                      color="inherit"
                    >
                      {mode.description}
                    </Typography>
                    <Stack spacing={1.5} sx={{ mb: 4, flexGrow: 1 }}>
                      {mode.benefits.map((benefit, index) => (
                        <Stack direction="row" spacing={1.5} alignItems="center" key={index}>
                          <CheckCircle fontSize="small" sx={{ color: mode.accentColor }} />
                          <Typography variant="body2" color="inherit" fontWeight={500}>
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
                      sx={{ mt: 'auto', bgcolor: mode.accentColor, color: '#FFFFFF', '&:hover': { bgcolor: mode.accentColor } }}
                    >
                      {mode.ctaLabel}
                    </Button>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* EVOLUCIÓN */}
      <Box sx={{ py: { xs: 10, md: 14 }, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Typography
            textAlign="center"
            fontWeight={800}
            mb={2}
            fontSize={{ xs: '1.75rem', md: '3.125rem' }}
            lineHeight={1.2}
          >
            La experiencia no cambia.{' '}
            <Box component="span" sx={{ color: 'primary.main' }}>
              Evoluciona su forma de organización.
            </Box>
          </Typography>
          <Typography
            variant="h5"
            color="text.secondary"
            textAlign="justify"
            maxWidth={900}
            mx="auto"
            lineHeight={1.8}
            mb={7}
            fontSize={{ xs: '1rem', md: '1.125rem' }}
          >
            Loteplan es una estructura jurídica y tecnológica replicable que permite organizar capital y adquirir
            activos inmobiliarios de forma sistemática.
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
            {trustFeatures.map((feature, index) => (
              <Box key={index} display="flex" gap={3} alignItems="flex-start">
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main',
                    width: 56,
                    height: 56,
                  }}
                >
                  <feature.icon />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    lineHeight={1.6}
                    fontSize="1rem"
                    textAlign="justify"
                  >
                    {feature.description}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* CTA FINAL */}
      {!isAuthenticated && (
        <Box
          sx={{
            py: { xs: 12, md: 14 },
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white',
            textAlign: 'center',
          }}
        >
          <Container maxWidth="md">
            <Typography
              variant="h3"
              gutterBottom
              sx={{ mb: 3, fontWeight: 800, fontSize: { xs: '1.75rem', md: '2.25rem' } }}
            >
              Accedé ahora al sistema.
            </Typography>
            <Typography
              variant="h6"
              sx={{
                mb: 6,
                fontSize: { xs: '1rem', md: '1.25rem' },
                color: alpha(theme.palette.common.white, 0.9),
                fontWeight: 400,
                lineHeight: 1.7,
                textAlign: 'justify',
                 textAlignLast: 'center',
              }}
            >
              Creá tu cuenta gratis y analizá en detalle su funcionamiento antes de decidir.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Button
                variant="contained"
                size="large"
                startIcon={<HomeIcon />}
                onClick={() => navigate(ROUTES.REGISTER)}
                sx={{
                  bgcolor: 'white',
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
                onClick={() => navigate(ROUTES.LOGIN)}
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  fontWeight: 600,
                  '&:hover': { borderColor: 'white', bgcolor: alpha(theme.palette.common.white, 0.1) },
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