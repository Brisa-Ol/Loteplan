import { ROUTES } from '@/routes';
import {
  ArrowForward,
  CheckCircle,
  Home as HomeIcon,
  TrendingUp,
  Dashboard as DashboardIcon // ✅ Nuevo icono para usuario logueado
} from '@mui/icons-material';
import {
  alpha,
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

// ✅ IMPORTAR EL CONTEXTO DE AUTENTICACIÓN
import { useAuth } from '@/core/context/AuthContext';

// ==========================================
// DEFINICIÓN DE TIPOS
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
}

// ==========================================
// DATOS
// ==========================================
const trustIndicators = [
  { value: '+100', label: 'Lotes disponibles' },
  { value: '15,5%', label: 'Rentabilidad anual' },
  { value: '100%', label: 'Seguro y legal' },
];

const twoModes: ModeData[] = [
  {
    type: 'ahorrista',
    title: 'Modo Ahorrista',
    subtitle: 'Para tu casa propia',
    icon: HomeIcon,
    color: 'primary',
    bgGradient: 'linear-gradient(135deg, #ECECEC 0%, #ECECEC 100%)',
    description: 'Comprá tu terreno en cuotas mensuales sin interés. Desde la cuota 12, participá en subastas para adjudicar tu lote anticipadamente.',
    benefits: [
      'Planes de hasta 96 meses',
      'Sin interés ni cargos ocultos',
      'Escritura inmediata al adjudicar',
    ],
  },
  {
    type: 'inversionista',
    title: 'Modo Inversionista',
    subtitle: 'Para hacer crecer tu capital',
    icon: TrendingUp,
    color: 'primary',
    bgGradient: 'linear-gradient(125deg, #ECECEC  0%, #ECECEC 100%)',
    description: 'Invertí en terrenos con alto potencial de revalorización. Sos dueño de una fracción real de tierra, respaldada legalmente.',
    benefits: [
      'Rentabilidad del 15-35% anual',
      'Inversión mínima desde USD 5.000',
      'Protegido por fideicomiso',
    ],
  },
];

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
const Home: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);

  // ✅ OBTENEMOS EL ESTADO DE AUTENTICACIÓN
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
            {/* Left Column - Text */}
            <Box sx={{ flex: 1, width: '100%' }}>
              <Chip
                label="Crowdfunding Inmobiliario"
                sx={{
                  bgcolor: alpha(theme.palette.common.white, 0.2),
                  color: 'inherit',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.common.white, 0.3)}`,
                  mb: 4,
                  fontWeight: 600
                }}
              />

              <Typography
                variant="h2"
                component="h1"
                sx={{
                  mb: 3,
                  fontWeight: 800,
                }}
              >
                Tu terreno propio,
                <br />
                <Box component="span" sx={{ color: alpha(theme.palette.common.white, 0.8) }}>
                  más cerca que nunca
                </Box>
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  mb: 5,
                  color: alpha(theme.palette.common.white, 0.9),
                  fontWeight: 400,
                  maxWidth: 600,
                  lineHeight: 1.7
                }}
              >
                Comprá en cuotas sin interés o invertí con rentabilidad segura.{' '}
                <Box component="span" sx={{ fontWeight: 700 }}>
                  Sin bancos, sin burocracia.
                </Box>
              </Typography>

              {/* ✅ BOTONES DEL HERO: LÓGICA CONDICIONAL */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 7 }}>
                {!isAuthenticated ? (
                  // CASO 1: NO LOGUEADO -> Mostrar Registro y Login
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
                        '&:hover': {
                          bgcolor: alpha(theme.palette.common.white, 0.9),
                        },
                      }}
                    >
                      Registrate
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      startIcon={<TrendingUp />}
                      onClick={() => navigate(ROUTES.LOGIN)}
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
                      Inicia Sesión
                    </Button>
                  </>
                ) : (
                  // CASO 2: LOGUEADO -> Mostrar botón al Dashboard
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
                      '&:hover': {
                        bgcolor: alpha(theme.palette.common.white, 0.9),
                      },
                    }}
                  >
                    Ir a mi Panel
                  </Button>
                )}
              </Stack>

              <Box sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 3
              }}>
                {trustIndicators.map((item, index) => (
                  <Box key={index}>
                    <Typography variant="h4" fontWeight={700}>
                      {item.value}
                    </Typography>
                    <Typography variant="body2" sx={{ color: alpha(theme.palette.common.white, 0.8) }}>
                      {item.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Right Column - Image */}
            <Box sx={{ flex: 1, width: '100%', display: { xs: 'none', md: 'block' } }}>
              <Box sx={{ position: 'relative', transform: 'perspective(1000px) rotateY(-5deg)' }}>
                <Box
                  component="img"
                  src="/nosotros/Nosotros_2a.jpg"
                  alt="Terrenos Loteplan"
                  sx={{
                    width: '100%',
                    borderRadius: 4,
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  }}
                />
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ==========================================
          QUÉ ES NECTÁREA
          ========================================== */}
      <Box sx={{ py: { xs: 10, md: 14 }, bgcolor: 'secondary.light' }}>
        <Container maxWidth="lg">
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: { xs: 6, md: 10 },
            alignItems: 'center'
          }}>
            {/* COLUMNA IZQUIERDA: IMAGEN */}
            <Box
              component="img"
              src="/nosotros/Nosotros_2a.jpg"
              alt="Equipo Loteplan"
              sx={{
                width: '100%',
                height: 'auto',
                borderRadius: 4,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                display: 'block',
              }}
            />

            {/* COLUMNA DERECHA: TEXTO */}
            <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
              <Typography
                variant="h3"
                gutterBottom
                sx={{ mb: 4, fontWeight: 800 }}
                color="text.primary"
              >
                ¿Qué es Loteplan?
              </Typography>

              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ mb: 4, lineHeight: 1.8 }}
              >
                Somos una plataforma de{' '}
                <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>
                  crowdfunding inmobiliario
                </Box>{' '}
                que conecta ahorristas que buscan su terreno con inversionistas que quieren rentabilidad.
              </Typography>

              <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ mb: 4 }}>
                Simple: unimos personas, financiamos proyectos, todos ganan.
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ==========================================
          DOS MODOS
          ========================================== */}
      <Box sx={{ py: { xs: 10, md: 14 } }}>
        <Container maxWidth="lg">
          <Typography variant="h3" textAlign="center" gutterBottom fontWeight={800} color="text.primary">
            Dos formas de participar
          </Typography>
          <Typography variant="subtitle1" textAlign="center" color="text.secondary" sx={{ mb: 8, fontWeight: 400 }}>
            Elegí el modo que mejor se adapte a tus objetivos
          </Typography>

          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 5
          }}>
            {twoModes.map((mode) => (
              <Box key={mode.type} sx={{ display: 'flex' }}>
                <Card
                  onMouseEnter={() => setHoveredMode(mode.type)}
                  onMouseLeave={() => setHoveredMode(null)}
                  sx={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    background: mode.bgGradient,
                    border: `1px solid ${alpha(theme.palette[mode.color].main, 0.2)}`,
                    transition: 'all 0.3s ease',
                    transform: hoveredMode === mode.type ? 'translateY(-8px)' : 'none',
                    boxShadow: hoveredMode === mode.type ? theme.shadows[8] : theme.shadows[1],
                  }}
                >
                  <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          bgcolor: `${mode.color}.main`,
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: `0 8px 16px ${alpha(theme.palette[mode.color].main, 0.24)}`
                        }}
                      >
                        <mode.icon sx={{ fontSize: 28, color: 'white' }} />
                      </Box>
                      <Box>
                        <Typography variant="h5" fontWeight={700} color="text.primary">
                          {mode.title}
                        </Typography>
                        <Typography variant="subtitle2" color={`${mode.color}.dark`} fontWeight={700}>
                          {mode.subtitle}
                        </Typography>
                      </Box>
                    </Stack>

                    <Typography variant="body1" sx={{ mb: 4, lineHeight: 1.7 }} color="text.primary">
                      {mode.description}
                    </Typography>

                    <Stack spacing={2} sx={{ mb: 5, flexGrow: 1 }}>
                      {mode.benefits.map((benefit, index) => (
                        <Stack direction="row" spacing={1.5} alignItems="center" key={index}>
                          <CheckCircle fontSize="small" color={mode.color} />
                          <Typography variant="body2" color="text.primary">{benefit}</Typography>
                        </Stack>
                      ))}
                    </Stack>

                    <Button
                      variant="contained"
                      fullWidth
                      endIcon={<ArrowForward />}
                      color={mode.color}
                      onClick={() => navigate(ROUTES.PUBLIC.COMO_FUNCIONA)}
                      sx={{ fontWeight: 600, mt: 'auto' }}
                    >
                      Conocer más
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
          ✅ SOLO SE MUESTRA SI NO ESTÁ AUTENTICADO
          ========================================== */}
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
            <Typography variant="h3" gutterBottom sx={{ mb: 3, fontWeight: 800 }}>
              ¿Listo para tu terreno propio?
            </Typography>
            <Typography variant="h6" sx={{ mb: 6, color: alpha(theme.palette.common.white, 0.9), fontWeight: 400, lineHeight: 1.7 }}>
              Registrate gratis y explorá todas las oportunidades disponibles. Sin compromiso, sin
              cargos ocultos.
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
                  '&:hover': {
                    bgcolor: alpha(theme.palette.common.white, 0.9),
                  },
                }}
              >
                Registrarme
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
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: alpha(theme.palette.common.white, 0.1),
                  },
                }}
              >
                Iniciar Sesión
              </Button>
            </Stack>

            <Typography variant="body1" sx={{ mt: 5, color: alpha(theme.palette.common.white, 0.8) }}>
              ¿Tenés dudas?{' '}
              <Box
                component="span"
                onClick={() => navigate('/como-funciona')}
                sx={{
                  color: 'white',
                  textDecoration: 'underline',
                  fontWeight: 700,
                  cursor: 'pointer',
                  '&:hover': {
                    color: alpha(theme.palette.common.white, 0.9),
                  },
                }}
              >
                Conocé más sobre cómo funciona
              </Box>
            </Typography>
          </Container>
        </Box>
      )}
    </Box>
  );
};

export default Home;