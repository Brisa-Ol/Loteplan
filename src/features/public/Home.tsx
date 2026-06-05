import { ROUTES } from '@/routes';
import {
  AccountBalance,
  ArrowForward,
  CheckCircle,
  Dashboard as DashboardIcon,
  Devices,
  GppGood,
  Home as HomeIcon,
  InfoOutlined,
  Landscape,
  LaptopMac,
  Map,
  TrendingUp
} from '@mui/icons-material';
import {
  alpha,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/core/context/AuthContext';

// ==========================================
// TIPOS
// ==========================================
type AllowedColors = 'primary' | 'secondary' | 'warning' | 'error';

interface ModeData {
  type: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: AllowedColors;
  bgGradient: string;
  description: string;
  benefits: string[];
  ctaLabel: string;
}

// ==========================================
// DATOS
// ==========================================
const trustIndicators = [
  { value: '+USD 1,1M', label: 'estructurados en activos reales' },
  { value: '119', label: 'lotes adjudicados' },
  { value: '15,5%', label: 'Rentabilidad anual estimada' },
];

// 3 pasos del proceso (nuevo en PPT)
const howItWorksSteps = [
  {
    step: '01',
    title: 'Te registrás y elegís',
    description: 'Creás tu cuenta y elegís la alternativa que mejor se adapte a tus objetivos: Modo Ahorrista o Modo Inversionista.',
    image: "public/Home/Cómo funciona Ahorrista_1a.jpg",
  },
  {
    step: '02',
    title: 'Aportás en cuotas mensuales',
    description: 'Realizás aportes planificados dentro de una estructura fiduciaria transparente para avanzar progresivamente hacia tu lote.',
    image: 'public/Home/Cómo funciona Ahorrista_2b.jpg',
  },
  {
    step: '03',
    title: 'Seguís hasta tu adjudicación',
    description: 'Hacés seguimiento de todo el proceso en la plataforma hasta la adjudicación y escritura de tu lote.',
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
    bgGradient: 'linear-gradient(135deg, #ECECEC 0%, #ECECEC 100%)',
    description: 'Cuando el crédito no alcanza, el ahorro organizado sí. En Loteplan das el primer paso hacia tu casa propia mediante cuotas planificadas, dentro de una plataforma fiduciaria colaborativa diseñada para acompañarte durante todo el proceso.',
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
    bgGradient: 'linear-gradient(125deg, #ECECEC 0%, #ECECEC 100%)',
    description: 'En Modo Inversionista podés acceder a proyectos vinculados al desarrollo de tierra mediante estructuras transparentes y activos inmobiliarios reales.',
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

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
const Home: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);

  const { isAuthenticated } = useAuth();

  return (
    <Box sx={{ bgcolor: 'background.default', color: 'text.primary' }}>

      {/* ==========================================
          HERO SECTION
          ========================================== */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'primary.contrastText',
          position: 'relative',
          overflow: 'hidden',
          py: { xs: 10, md: 14 },
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
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            gap: 8
          }}>
            <Box sx={{ flex: 1, width: '100%' }}>
              <Chip
                label="Crowdfunding Inmobiliario"
                sx={{
                  bgcolor: alpha(theme.palette.common.white, 0.2),
                  color: 'inherit',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.common.white, 0.3)}`,
                  mb: 4,
                  fontWeight: 600,
                  fontSize: '1.25rem',
                }}
              />

              <Typography variant="h2" component="h1" sx={{ mb: 3, fontWeight: 800, lineHeight: 1.1, fontSize: { md: '3rem' }}}>
                Accedé a tu lote urbanizado <br />
                <Box component="span" sx={{ color: alpha(theme.palette.common.white, 0.8) }}>
                  sin depender del crédito bancario
                </Box>
              </Typography>

              <Typography variant="h6" sx={{ mb: 5, color: alpha(theme.palette.common.white, 0.9), fontWeight: 400, maxWidth: 650, lineHeight: 1.7 }}>
                Loteplan es una plataforma fiduciaria colaborativa que organiza grupos de ahorro para facilitar el acceso progresivo a lotes urbanizados y escriturables, con trazabilidad digital en cada etapa del proceso.
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 7 }}>
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

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
                {trustIndicators.map((item, index) => (
                  <Box key={index}>
                    <Typography variant="h4" fontWeight={700}>{item.value}</Typography>
                    <Typography variant="body2" sx={{ color: alpha(theme.palette.common.white, 0.8) }}>{item.label}</Typography>
                  </Box>
                ))}
              </Box>
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

     {/* ==========================================
          QUÉ ES LOTEPLAN Y CÓMO FUNCIONA
          ========================================== */}
      <Box sx={{ py: { xs: 10, md: 14 }, bgcolor: 'secondary.light' }}>
        <Container maxWidth="lg">
          
          {/* Parte 1: Introducción (Qué es Loteplan) */}
          <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "center", gap: { xs: 6, md: 8 }, alignItems: 'center', mb: { xs: 10, md: 6} }}>
            <Box
              component="img"
              src="public/Home/contrato43.jpeg"
              alt="Fideicomiso Loteplan"
              sx={{ width: 280, height: 230, borderRadius: 4, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)', ml: { xs: 0, md: 6 } }}
            />
            <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
              <Typography variant="h2" gutterBottom sx={{ mb: 3, fontWeight: 800 }} color="text.primary">
                Qué es Loteplan
              </Typography>

              <Typography variant="h6" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                Somos una plataforma fiduciaria colaborativa pensada para ser <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>el primer paso hacia tu casa</Box>. Organizamos grupos de ahorro que permiten acceder progresivamente a lotes urbanizados y escriturables mediante reglas claras y procesos transparentes. No somos un loteo tradicional, no otorgamos crédito y no comercializamos promesas de urbanización futura.
              </Typography>
            </Box>
          </Box>

          {/* Parte 2: Tarjetas (Así funciona el proceso) */}
          <Typography variant="h3" textAlign="center" gutterBottom fontWeight={800} color="text.primary">
            Así funciona el proceso
          </Typography>
          <Typography variant="subtitle1" textAlign="center" color="text.secondary" sx={{ mb: 8, fontWeight: 400 }}>
            Simple, transparente y con trazabilidad digital en cada etapa
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 4 }}>
            {howItWorksSteps.map((step) => (
              <Card
                key={step.step}
                elevation={0}
                sx={{
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                  borderRadius: 4,
                  overflow: 'hidden',
                  bgcolor: 'background.paper', // Asegura el contraste de la tarjeta sobre el fondo secondary.light
                  transition: 'box-shadow 0.3s',
                  '&:hover': { boxShadow: theme.shadows[6] },
                }}
              >
                <Box
                  component="img"
                  src={step.image}
                  alt={step.title}
                  sx={{ width: '100%', height: 180, objectFit: 'cover' }}
                />
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" spacing={2} alignItems="center" mb={1.5}>
                    <Box sx={{
                      width: 40, height: 40, borderRadius: '50%',
                      bgcolor: 'primary.main', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '1rem',
                    }}>
                      {step.step}
                    </Box>
                    <Typography variant="h6" fontWeight={700} color="text.primary">{step.title}</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
                    {step.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

        </Container>
      </Box>

    
      {/* ==========================================
          TRACK RECORD Y EVOLUCIÓN
          ========================================== */}
      <Box sx={{ py: { xs: 10, md: 14 }, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">

          <Box sx={{ textAlign: 'center', mb: 8, maxWidth: 950, mx: 'auto' }} >
            <Typography  gutterBottom fontWeight={800} color="text.primary" fontSize="3.125rem" >
              De desarrolladores de suelo a <Box component="span" sx={{ color: 'primary.main', display: 'block' }}>infraestructura financiera inmobiliaria</Box>
            </Typography>
            <Typography variant="h6" color="text.secondary" lineHeight={1.8} mt={3}>
              Durante más de 15 años participamos en el desarrollo de suelo urbano, organizando grupos, gestionando procesos de urbanización y adjudicando lotes en proyectos concretos y verificables. Hoy transformamos esa experiencia en una plataforma tecnológica y fiduciaria que permite organizar el acceso progresivo a lotes y activos inmobiliarios de forma clara, ordenada y escalable.
            </Typography>
          </Box>

          {/* Métricas Reales */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 4, mb: 10 }}>
            <Card elevation={0} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`, textAlign: 'center', p: 4, borderRadius: 4 }}>
              <Typography variant="h3" color="primary.main" fontWeight={900} gutterBottom>+USD 1,1M</Typography>
              <Typography variant="body1" fontWeight={600} color="text.secondary" fontSize="1.125rem">estructurados en activos inmobiliarios reales.</Typography>
            </Card>
            <Card elevation={0} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`, textAlign: 'center', p: 4, borderRadius: 4 }}>
              <Typography variant="h3" color="primary.main" fontWeight={900} gutterBottom>119</Typography>
              <Typography variant="body1" fontWeight={600} color="text.secondary" fontSize="1.125rem">
                lotes urbanizados adjudicados en desarrollos finalizados.
              </Typography>
            </Card>
            <Card elevation={0} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`, textAlign: 'center', p: 4, borderRadius: 4 }}>
              <Typography variant="h3" color="primary.main" fontWeight={900} gutterBottom>+400</Typography>
              <Typography variant="body1" fontWeight={600} color="text.secondary">lotes proyectados bajo contratos de urbanización vigentes.</Typography>
            </Card>
          </Box>

          {/* Evolución del Modelo */}
          <Box>
            <Typography  textAlign="center" fontWeight={800} mb={2} fontSize="3.125rem">
              La experiencia no cambia. <Box component="span" sx={{ color: 'primary.main' }}>Evoluciona su forma de organización.</Box>
            </Typography>
            <Typography variant="h4" textAlign="center" color="text.secondary" mb={8} maxWidth={800} mx="auto" fontWeight={400}>
              Loteplan es una estructura jurídica y tecnológica replicable que permite organizar capital y adquirir activos inmobiliarios de forma sistemática.
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
              <Box display="flex" gap={3} alignItems="flex-start">
                <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 56, height: 56 }}>
                  <LaptopMac />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>Plataforma digital propia</Typography>
                  <Typography variant="body2" color="text.secondary" lineHeight={1.6} fontSize="1rem">Gestiona adhesiones, aportes, adjudicaciones y seguimiento del proceso con trazabilidad en cada etapa.</Typography>
                </Box>
              </Box>

              <Box display="flex" gap={3} alignItems="flex-start">
                <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 56, height: 56 }}>
                  <AccountBalance />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>Modelo fiduciario estandarizado</Typography>
                  <Typography variant="body2" color="text.secondary" lineHeight={1.6} fontSize="1rem">Cada grupo opera bajo reglas claras y separación patrimonial, lo que permite replicar el esquema en nuevos desarrollos.</Typography>
                </Box>
              </Box>

              <Box display="flex" gap={3} alignItems="flex-start">
                <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 56, height: 56 }}>
                  <Map />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>Integración progresiva de proveedores de suelo</Typography>
                  <Typography variant="body2" color="text.secondary" lineHeight={1.6} fontSize="1rem">Incorporamos lotes urbanizados que cumplan criterios legales y urbanísticos definidos.</Typography>
                </Box>
              </Box>

              <Box display="flex" gap={3} alignItems="flex-start">
                <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 56, height: 56 }}>
                  <TrendingUp />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>Crecimiento por etapas</Typography>
                  <Typography variant="body2" color="text.secondary" lineHeight={1.6} fontSize="1rem">El sistema se expande en función de la conformación de grupos y la disponibilidad de activos aptos.</Typography>
                </Box>
              </Box>
            </Box>
          </Box>

        </Container>
      </Box>

                  {/* ==========================================
                      MODELO FIDUCIARIO
                      ========================================== */}
                  <Box sx={{ py: { xs: 10, md: 14 }, bgcolor: 'background.paper' }}>
                    <Container maxWidth="lg">
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 6, md: 10 }, alignItems: 'center', mb: 10 }}>
                        <Box>
                          <Typography variant="h3" gutterBottom fontWeight={800} color="text.primary">
                            Un sistema diseñado para brindar <Box component="span" sx={{ color: 'primary.main' }}>transparencia y confianza</Box> en cada etapa
                          </Typography>
                          <Typography variant="body1" color="text.secondary" lineHeight={1.8} mb={4}>
                            Tu capital respaldado por marcos legales sólidos, separación patrimonial y procesos documentados accesibles para todos los participantes.
                          </Typography>
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
                          src="public/Home/Cómo funciona Inversionista_6.jpg"
                          alt="Confianza y transparencia"
                          sx={{ width: '100%', height: 'auto', borderRadius: 4, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)', display: 'block' }}
                        />
                      </Box>
            
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 4 }}>
                        <Box textAlign="center">
                          <Avatar sx={{ mx: 'auto', mb: 3, width: 64, height: 64, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}><AccountBalance fontSize="large" /></Avatar>
                          <Typography variant="subtitle1" fontWeight={800} gutterBottom>Fideicomiso Seguro</Typography>
                          <Typography variant="body2" color="text.secondary" lineHeight={1.6}>Administración mediante fideicomiso con separación patrimonial para proteger tu capital.</Typography>
                        </Box>
                        <Box textAlign="center">
                          <Avatar sx={{ mx: 'auto', mb: 3, width: 64, height: 64, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}><Landscape fontSize="large" /></Avatar>
                          <Typography variant="subtitle1" fontWeight={800} gutterBottom fontSize="1.25rem">
                            Lotes Reales
                          </Typography>
                          <Typography variant="body1" color="text.secondary" lineHeight={1.6}>
                            Proyectos con lotes urbanizados y 100% escriturables.
                          </Typography>
                        </Box>
                        <Box textAlign="center">
                          <Avatar sx={{ mx: 'auto', mb: 3, width: 64, height: 64, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}><GppGood fontSize="large" /></Avatar>
                          <Typography variant="subtitle1" fontWeight={800} gutterBottom fontSize="1.25rem">
                            Transparencia Total
                          </Typography>
                          <Typography variant="body1" color="text.secondary" lineHeight={1.6}>
                            Reglas claras y procesos documentados a disposición de todos los participantes.
                          </Typography>
                        </Box>
                        <Box textAlign="center">
                          <Avatar sx={{ mx: 'auto', mb: 3, width: 64, height: 64, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}><Devices fontSize="large" /></Avatar>
                          <Typography variant="subtitle1" fontWeight={800} gutterBottom>Trazabilidad Digital</Typography>
                          <Typography variant="body2" color="text.secondary" lineHeight={1.6}>Todas las operaciones y aportes quedan registrados y son trazables digitalmente.</Typography>
                        </Box>
                      </Box>
                    </Container>
                  </Box>

      {/* ==========================================
          DOS MODOS
          ========================================== */}
      <Box sx={{ py: { xs: 10, md: 14 }, bgcolor: 'secondary.light' }}>
        <Container maxWidth="lg">
          <Typography textAlign="center" gutterBottom fontWeight={800} color="text.primary" fontSize="3.125rem">
            Dos formas de participar
          </Typography>
          <Typography variant="subtitle1" textAlign="center" color="text.secondary" sx={{ mb: 8, fontWeight: 400 }} fontSize="1.125rem">
            Elegí el modo que mejor se adapte a tus objetivos
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 5 }}>
            {twoModes.map((mode) => (
              <Box key={mode.type} sx={{ display: 'flex' }}>
                <Card
                  onMouseEnter={() => setHoveredMode(mode.type)}
                  onMouseLeave={() => setHoveredMode(null)}
                  sx={{
                    width: '100%', display: 'flex', flexDirection: 'column',
                    background: mode.bgGradient, border: `1px solid ${alpha(theme.palette[mode.color].main, 0.2)}`,
                    transition: 'all 0.3s ease', transform: hoveredMode === mode.type ? 'translateY(-8px)' : 'none',
                    boxShadow: hoveredMode === mode.type ? theme.shadows[8] : theme.shadows[1],
                  }}
                >
                  {/* Imagen representativa del modo */}
                  <Box
                    component="img"
                    src={mode.type === 'ahorrista' ? 'public/Home/Home1b_modoahorrista.jpg' : 'public/Home/Home2a_modoinversionista.jpg'}
                    alt={mode.title}
                    sx={{ width: 555, height: 350, objectFit: 'cover' }}
                  />
                  <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                      <Box sx={{ width: 56, height: 56, bgcolor: `${mode.color}.main`, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 16px ${alpha(theme.palette[mode.color].main, 0.24)}` }}>
                        <mode.icon sx={{ fontSize: 28, color: 'white' }} />
                      </Box>
                      <Box>
                        <Typography variant="h3" fontWeight={800} color="text.primary">{mode.title}</Typography>
                        <Typography variant="subtitle2" color={`${mode.color}.dark`} fontWeight={700} fontSize="1.125rem">
                          {mode.subtitle}
                        </Typography>
                      </Box>
                    </Stack>

                    <Typography variant="body1" sx={{ mb: 4, lineHeight: 1.7 }} color="text.primary" fontSize="1rem">
                      {mode.description}
                    </Typography>

                    <Stack spacing={2} sx={{ mb: 5, flexGrow: 1 }}>
                      {mode.benefits.map((benefit, index) => (
                        <Stack direction="row" spacing={1.5} alignItems="center" key={index}>
                          <CheckCircle fontSize="small" color={mode.color} />
                          <Typography variant="body1" color="text.primary" fontWeight={500}>{benefit}</Typography>
                        </Stack>
                      ))}
                    </Stack>

                    <Button
                      variant="contained"
                      fullWidth
                      endIcon={<ArrowForward />}
                      color={mode.color}
                      onClick={() => {
                        sessionStorage.setItem('proyectosPerfil', mode.type);
                        navigate(ROUTES.PROYECTOS.SELECCION_ROL)
                      }}
                      sx={{ fontWeight: 600, mt: 'auto' }}
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

      {/* ==========================================
          CTA FINAL
          ========================================== */}
      {!isAuthenticated && (
        <Box sx={{ py: { xs: 12, md: 14 }, background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`, color: 'white', textAlign: 'center' }}>
          <Container maxWidth="md">
            <Typography variant="h3" gutterBottom sx={{ mb: 3, fontWeight: 800 }}>
              ¿Listo para tu terreno propio?
            </Typography>
            <Typography variant="h6" sx={{ mb: 6, color: alpha(theme.palette.common.white, 0.9), fontWeight: 400, lineHeight: 1.7 }}>
              Registrate gratis y analizá en detalle su funcionamiento antes de decidir. Sin compromiso, sin cargos ocultos.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Button variant="contained" size="large" startIcon={<HomeIcon />} onClick={() => navigate(ROUTES.REGISTER)} sx={{ bgcolor: 'white', color: 'primary.main', fontWeight: 600, '&:hover': { bgcolor: alpha(theme.palette.common.white, 0.9) } }}>
                Crear mi cuenta
              </Button>
              <Button variant="outlined" size="large" startIcon={<TrendingUp />} onClick={() => navigate(ROUTES.LOGIN)} sx={{ borderColor: 'white', color: 'white', fontWeight: 600, '&:hover': { borderColor: 'white', bgcolor: alpha(theme.palette.common.white, 0.1) } }}>
                Iniciar Sesión
              </Button>
            </Stack>
            <Typography variant="body1" sx={{ mt: 5, color: alpha(theme.palette.common.white, 0.8) }}>
              ¿Tenés dudas?{' '}
              <Box component="span" onClick={() => navigate('/como-funciona')} sx={{ color: 'white', textDecoration: 'underline', fontWeight: 700, cursor: 'pointer', '&:hover': { color: alpha(theme.palette.common.white, 0.9) } }}>
                Conocé más sobre cómo funciona
              </Box>
            </Typography>
          </Container>
        </Box>
      )}

      {/* ==========================================
          DISCLAIMER LEGAL
          ========================================== */}
      <Box sx={{ py: 4, bgcolor: alpha(theme.palette.text.primary, 0.03), borderTop: `1px solid ${alpha(theme.palette.text.primary, 0.08)}` }}>
        <Container maxWidth="lg">
          <Typography variant="caption" color="text.disabled" lineHeight={1.8} display="block" textAlign="center">
            Loteplan no otorga créditos ni garantiza la adjudicación de programas públicos. La postulación a dichos programas se realiza de manera individual y conforme a sus condiciones de vigencia. La administración de los fondos se realiza a través de un fideicomiso de administración, en el cual cada adherente efectúa sus aportes directamente en la cuenta bancaria del fideicomiso, desde donde se instrumentan las adquisiciones correspondientes. El fideicomiso no constituye un fideicomiso financiero en los términos de la Ley de Mercado de Capitales N° 26.831, ni un fondo de inversión regulado por la Comisión Nacional de Valores (CNV). Todos los derechos reservados. Nectárea S.A. 2026.
          </Typography>
        </Container>
      </Box>

    </Box>
  );
};

export default Home;