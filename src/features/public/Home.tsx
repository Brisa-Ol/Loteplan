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

// textAlign justify solo en desktop; en mobile queda mal con líneas cortas
const justifyText = { textAlign: { xs: 'left', md: 'justify' } } as const;

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
          py: { xs: 8, md: 11 },
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
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'center',
              gap: { xs: 5, md: 8 },
            }}
          >
            <Box sx={{ flex: 1, width: '100%' }}>
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
                Accedé a tu lote urbanizado <br />
                <Box component="span" sx={{ color: alpha(theme.palette.common.white, 0.8) }}>
                  sin depender del crédito bancario
                </Box>
              </Typography>
              <Typography
                variant="h6"
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
                Loteplan es una plataforma fiduciaria colaborativa que organiza grupos de ahorro e inversión para facilitar el
                acceso progresivo a lotes urbanizados y escriturables, con trazabilidad digital en cada etapa del
                proceso.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
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
                  sx={{ width: '100%', borderRadius: 4, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
                />
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* QUÉ ES LOTEPLAN */}
      <Box sx={{ py: { xs: 8, md: 14 }, bgcolor: 'secondary.light' }}>
        <Container maxWidth="lg">
          <Typography
            color="text.primary"
            textAlign="center"
            fontWeight={700} // Inter Bold suele equivaler a fontWeight: 700
            fontSize="2.75rem" // 44px
            sx={{
              mb: 3,
              lineHeight: 1.2, // Interlineado 120%
              fontFamily: 'Inter, sans-serif' // Fuente Inter
            }}
          >
            Qué es{' '}
            <Box
              component="span"
              sx={{
                color: 'primary.main',
                fontWeight: 700,
                fontSize: 'inherit'
              }}
            >
              Loteplan
            </Box>
          </Typography>
          <Typography

            color="text.secondary"
            maxWidth={1400}
            mx="auto"
            sx={{
              fontSize: '1.375rem',
              lineHeight: 1.7,
              textAlign: 'justify',
              mb: 4
            }}
          >
            <Box component="strong" sx={{ fontWeight: 700 }}>
              Somos un sistema estructurado pensado para ser el primer paso hacia tu casa.
              Organizamos capital bajo fideicomiso para adquirir lotes urbanizados y escriturables.
            </Box>
            No somos un loteo tradicional, no otorgamos crédito y no vendemos anticipos
            de urbanización futura.
          </Typography>

          {/* Numeración de pasos */}
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
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 4 }}>
              {howItWorksSteps.map((step) => (
                <Box key={step.step} sx={{ display: 'flex', justifyContent: 'center', zIndex: 1 }}>
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: '60%',
                      bgcolor: '#CC6333',
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

          {/* Cards de pasos */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: { xs: 3, md: 7 } }}>
            {howItWorksSteps.map((step) => (
              <Card
                key={step.step}
                elevation={0}
                sx={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: '22px',
                  width: '100%',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                  borderRadius: 4,
                  overflow: 'hidden',
                  bgcolor: 'background.paper',
                }}
              >
                <Box component="img" src={step.image} sx={{ width: '100%', height: { xs: 180, md: 190 }, objectFit: 'cover' }} />
                <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                  <Typography color="text.secondary" lineHeight={1.6} fontSize={{ xs: '0.9rem', md: '1.25rem' }}>
                    {step.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>

      <Box sx={{ py: '60px', bgcolor: 'background.paper' }}>
  <Container maxWidth="lg">
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        gap: '80px',
        alignItems: 'stretch', // <-- 1. Cambiado de 'center' a 'stretch'
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Typography
          fontWeight={700}
          color="text.primary"
          textAlign="left"
          sx={{
            mb: '32px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '2.75rem', 
            lineHeight: 1.15,    
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          Un modelo fiduciario que{' '}
          <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>
            brinda previsibilidad jurídica
          </Box>{' '}
          en cada etapa
        </Typography>

        {/* Lista de Beneficios */}
        <Stack spacing="20px" sx={{ mb: '32px' }}>
          {trustPoints.map((item, index) => (
            <Stack key={index} direction="row" spacing={1.6} alignItems="center">
              <CheckCircle sx={{ color: 'primary.main', fontSize: '24px' }} />
              <Typography
                color="text.secondary"
                fontWeight={400} 
                fontSize="1.25rem" 
                lineHeight={1.7}   
              >
                {item}
              </Typography>
            </Stack>
          ))}
        </Stack>

        <Box>
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForward />}
            onClick={() => navigate(ROUTES.PUBLIC.COMO_FUNCIONA)}
            sx={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,      
              fontSize: '18px',     
              borderRadius: '10px', 
              textTransform: 'none'
            }}
          >
            Ver cómo funciona en detalle
          </Button>
        </Box>
      </Box>

      <Box
        component="img"
        src="public/Home/contrato43.jpeg"
        alt="Confianza y transparencia"
        sx={{
          width: '100%',
          height: { xs: 'auto', md: '100%' }, 
          borderRadius: '24px', 
          objectFit: 'cover',
          display: 'block',
          order: { xs: -1, md: 0 },
        }}
      />
    </Box>
  </Container>
</Box>

      <Box sx={{ py: { xs: 8, md: 14 }, bgcolor: 'secondary.light' }}>
        <Container maxWidth="lg">
          
            <Typography
              color="text.primary"
            textAlign="center"
            fontWeight={700} // Inter Bold suele equivaler a fontWeight: 700
            fontSize="3.25rem" // 52px
            sx={{
              mb: 3,
              lineHeight: 1.1,
              fontFamily: 'Inter, sans-serif' 
            }}
            >
              De desarrolladores de suelo a{' '}
              <Box component="span" sx={{ color: 'primary.main', display: 'block',
                fontFamily: 'Inter, sans-serif', lineHeight: 1.1, mb: 3}}>
                infraestructura financiera inmobiliaria
              </Box>
            </Typography>
            
            <Typography
              color="text.secondary"
            maxWidth={1400}
            mx="auto"
            sx={{
              fontSize: '1.375rem',
              lineHeight: 1.7,
              textAlign: 'justify',
              mb: 4
            }}
            >
              Durante más de 15 años participamos en el desarrollo de suelo urbano, organizando grupos, gestionando
              procesos de urbanización y adjudicando lotes en proyectos concretos y verificables. Hoy transformamos esa
              experiencia en una plataforma tecnológica y fiduciaria que permite organizar el acceso progresivo a lotes
              y activos inmobiliarios de forma clara, ordenada y escalable.
            </Typography>
            
        
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 5 }}>
            {metrics.map((stat, index) => (
              <Card
                key={index}
                elevation={0}
                sx={{
                  p: 5,
                  textAlign: 'center',
                  borderRadius: '24px',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.05)}`,
                  height: '100%',
                }}
              >
                <Typography
                  fontWeight={800}
                  color="primary.main"
                  sx={{
                    mb: 4,
                    whiteSpace: 'nowrap',
                    display: 'flex',           // <-- Agregamos flexbox
                    alignItems: 'center',      // <-- Centramos verticalmente
                    justifyContent: 'center',  // <-- Centramos horizontalmente
                    minHeight: { xs: '60px', md: '90px' } // <-- Altura fija para igualar los 3 contenedores
                  }}
                  fontSize={{
                    xs: '2.5rem',
                    md: stat.value.length > 5 ? '3.2rem' : '3.875rem'
                  }}
                >
                  {stat.value}
                </Typography>

                <Typography color="text.secondary" fontWeight={500} fontSize="1.375rem" lineHeight={1.5}>
                  {stat.label}
                </Typography>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>

      {/* DOS MODOS */}
      <Box sx={{ py: { xs: 8, md: 1 }, bgcolor: 'secondary.light' }}>
        <Container maxWidth="lg">
          <Typography
            textAlign="center"
            fontWeight={700}
            color="text.primary"
            fontSize={{ xs: '1.75rem', md: '3.25rem' }}
            lineHeight={1.1}
            sx={{ mb: '20px' }}
          >
            Dos formas de participar
          </Typography>
          <Typography
            textAlign="center"
            color="text.secondary"
            variant="h6"
            fontWeight={400}
            lineHeight={1.5}
            sx={{ mb: '60px' }}
            fontSize="1.375rem"
          >
            Elegí el modo que mejor se adapte a tus objetivos
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 3, md: 5 } }}>
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
                    border: mode.type === 'ahorrista'
                      ? `1px solid ${alpha(theme.palette.divider, 0.12)}`
                      : 'none',
                    borderRadius: '20px',
                    overflow: 'hidden',
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
                    sx={{ width: '100%', height: { xs: 220, md: 300 }, objectFit: 'cover', flexShrink: 0 }}
                  />
                  <CardContent
                    sx={{
                      pt: '30px',
                      pb: '40px',
                      pl: '40px',
                      pr: '40px',
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
                      <Typography fontWeight={700} color="inherit" fontSize="2.25rem" lineHeight={1.2}>
                        {mode.title}
                      </Typography>
                    </Stack>

                    <Typography
                      color="inherit"
                      fontSize="1.375rem"
                      fontWeight={600}
                      sx={{ color: mode.accentColor, mb: '28px' }}
                    >
                      {mode.subtitle}
                    </Typography>

                    <Typography
                      color="inherit"
                      fontSize="1.125rem"
                      fontWeight={400}
                      sx={{ mb: '32px', lineHeight: 1.7, ...justifyText }}
                    >
                      {mode.description}
                    </Typography>

                    <Stack spacing="18px" sx={{ mb: '40px', flexGrow: 1 }}>
                      {mode.benefits.map((benefit, index) => (
                        <Stack direction="row" spacing={1.5} alignItems="flex-start" key={index}>
                          <CheckCircle fontSize="small" sx={{ color: mode.accentColor, mt: 0.2 }} />
                          <Typography
                            color="inherit"
                            fontWeight={500}
                            fontSize="1.125rem"
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
                        fontSize: '1.125rem',
                        '&:hover': { bgcolor: mode.accentColor, opacity: 0.9 },
                      }}
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
      <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: 'secondary.light' }}>
        <Container maxWidth="lg">
          {/* Título Principal (H2) */}
          <Typography
            textAlign="center"
            fontWeight={700} // Inter Bold
            color="text.primary"
            fontSize="52px"
            lineHeight={1.1} // 110%
            sx={{ mb: '40px' }} // Separación título -> párrafo: 40px
          >
            La experiencia no cambia.{' '}
            <Box component="span" sx={{ color: 'primary.main', display: 'block' }}>
              Evoluciona su forma de organización.
            </Box>
          </Typography>

          {/* Texto Descriptivo Central */}
          <Typography
            color="text.secondary"
            maxWidth="900px" // Ancho máximo 900px
            mx="auto"
            lineHeight={1.7} // 170%
            fontSize="22px" // 22px
            textAlign="center"
            sx={{ mb: '80px' }} // Separación párrafo -> características: 80px
          >
            Loteplan es una estructura jurídica y tecnológica replicable que permite organizar capital y adquirir activos inmobiliarios de forma sistemática.
          </Typography>

          {/* Bloque de características */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: '60px 100px' // Separación filas: 60px, columnas: 100px
            }}
          >
            {trustFeatures.map((feature, index) => (
              <Box key={index} display="flex" gap="24px" alignItems="flex-start"> {/* Separación icono-bloque: 24px */}
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main',
                    width: 64, // Total circulo: 64px
                    height: 64,
                    flexShrink: 0,
                  }}
                >
                  <feature.icon sx={{ fontSize: 28 }} /> {/* Icono interior: 28px */}
                </Avatar>
                <Box>
                  <Typography
                    fontWeight={600} // Inter SemiBold
                    fontSize="28px" // 28px
                    lineHeight={1.3} // 130%
                    sx={{ mb: '12px' }} // Separación título -> texto: 12px
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    color="text.secondary"
                    lineHeight={1.65} // 165%
                    fontSize="18px" // 18px
                    fontWeight={400} // Inter Regular
                    textAlign="left"
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
            py: '120px', // Padding vertical del bloque: 120px superior e inferior
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white',
            textAlign: 'center',
          }}
        >
          <Container maxWidth="md">
            {/* Título: Inter Bold, 56px, Peso 700 */}
            <Typography
              sx={{
                mb: '32px', // Título -> Subtítulo: 32px
                fontWeight: 700,
                fontSize: '56px',
                lineHeight: 1.1, // 110%
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Accedé ahora al sistema.
            </Typography>

            {/* Subtítulo: Inter Regular, 24px, Peso 400, Max-width 900px */}
            <Typography
              sx={{
                mb: '48px', // Subtítulo -> Botones: 48px
                fontSize: '24px',
                fontWeight: 400,
                lineHeight: 1.6, // 160%
                maxWidth: '900px',
                mx: 'auto',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Creá tu cuenta gratis y analizá en detalle su funcionamiento antes de decidir
            </Typography>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing="24px" // Entre botones: 24px
              justifyContent="center"
            >
              {/* Botón Principal: Inter SemiBold, 20px, Peso 600 */}
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
                  fontSize: '20px',
                  height: '60px',
                  borderRadius: '12px',
                  px: '40px', // Aproximadamente 15% más de ancho
                  '&:hover': { bgcolor: alpha(theme.palette.common.white, 0.9) },
                }}
              >
                Crear mi cuenta
              </Button>

              {/* Botón Secundario: Inter SemiBold, 20px, Peso 600 */}
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
                  fontSize: '20px',
                  height: '60px',
                  borderRadius: '12px',
                  borderWidth: '2px',
                  px: '40px',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: alpha(theme.palette.common.white, 0.1),
                    borderWidth: '2px'
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