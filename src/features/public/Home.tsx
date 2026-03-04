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
// DATOS (ACTUALIZADOS CON EL NUEVO COPY)
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
    subtitle: 'Accedé al terreno para tu casa propia',
    icon: HomeIcon,
    color: 'primary',
    bgGradient: 'linear-gradient(135deg, #ECECEC 0%, #ECECEC 100%)',
    description: 'Cuando el crédito no alcanza, el ahorro organizado sí. Pagá tu lote en cuotas mensuales dentro de un sistema estructurado, con respaldo fiduciario y posibilidad de articular posteriormente con programas públicos de construcción vigentes.',
    benefits: [
      'Cuotas planificadas',
      'Proceso transparente',
      'Administración fiduciaria',
      'Alternativa real frente al crédito bancario limitado',
    ],
  },
  {
    type: 'inversionista',
    title: 'Modo Inversionista',
    subtitle: 'Invertí en tierra con rentabilidad proyectada',
    icon: TrendingUp,
    color: 'primary',
    bgGradient: 'linear-gradient(125deg, #ECECEC  0%, #ECECEC 100%)',
    description: 'Participá en operaciones estructuradas de adquisición de activos inmobiliarios bajo fideicomiso de administración.',
    benefits: [
      'Participación en activos inmobiliarios reales',
      'Esquema de entrada y salida planificada',
      'Rentabilidad estimada vinculada a la comercialización',
      'Trazabilidad digital de cada etapa del proceso',
      'Administración fiduciaria',
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
                  fontWeight: 600
                }}
              />

              <Typography variant="h2" component="h1" sx={{ mb: 3, fontWeight: 800, lineHeight: 1.1 }}>
                Accedé a tu lote urbanizado <br />
                <Box component="span" sx={{ color: alpha(theme.palette.common.white, 0.8) }}>
                  sin depender del crédito bancario
                </Box>
              </Typography>

              <Typography variant="h6" sx={{ mb: 5, color: alpha(theme.palette.common.white, 0.9), fontWeight: 400, maxWidth: 650, lineHeight: 1.7 }}>
                Loteplan es una plataforma con infraestructura que organiza ahorro colaborativo mediante fideicomiso de administración para facilitar el acceso a terrenos legales y escriturables.
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
                  src="/nosotros/Nosotros_2a.jpg"
                  alt="Terrenos Loteplan"
                  sx={{ width: '100%', borderRadius: 4, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
                />
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ==========================================
          QUÉ ES LOTEPLAN 
          ========================================== */}
      <Box sx={{ py: { xs: 10, md: 14 }, bgcolor: 'secondary.light' }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1.1fr' }, gap: { xs: 6, md: 10 }, alignItems: 'center' }}>
            <Box
              component="img"
              src="/nosotros/Nosotros_2a.jpg"
              alt="Equipo Loteplan"
              sx={{ width: '100%', height: 'auto', borderRadius: 4, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)', display: 'block' }}
            />
            <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
              <Typography variant="h3" gutterBottom sx={{ mb: 3, fontWeight: 800 }} color="text.primary">
                Qué es Loteplan
              </Typography>

              <Typography variant="h6" color="text.secondary" sx={{ mb: 4, lineHeight: 1.8 }}>
                Somos un sistema estructurado pensado para ser <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>el primer paso hacia tu casa</Box>. Organizamos capital bajo fideicomiso para adquirir lotes urbanizados y escriturables.
              </Typography>

              <Box
                sx={{
                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                  borderLeft: `4px solid ${theme.palette.warning.main}`,
                  p: 3,
                  borderRadius: '0 8px 8px 0',
                  textAlign: 'left'
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <InfoOutlined color="warning" sx={{ mt: 0.5 }} />
                  <Box>
                    <Typography variant="subtitle1" fontWeight={800} color="text.primary" gutterBottom>
                      Lo que NO somos
                    </Typography>
                    <Typography variant="body1" color="text.secondary" lineHeight={1.6}>
                      No somos un loteo tradicional, <strong>no otorgamos crédito</strong> y <strong>no vendemos anticipos</strong> de urbanización futura. Adquirís tierra real, con reglas claras.
                    </Typography>
                  </Box>
                </Stack>
              </Box>

            </Box>
          </Box>
        </Container>
      </Box>

      {/* ==========================================
          TRACK RECORD Y EVOLUCIÓN
          ========================================== */}
      <Box sx={{ py: { xs: 10, md: 14 }, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">

          <Box sx={{ textAlign: 'center', mb: 8, maxWidth: 900, mx: 'auto' }}>
            <Typography variant="h3" gutterBottom fontWeight={800} color="text.primary">
              De desarrolladores de suelo a <Box component="span" sx={{ color: 'primary.main', display: 'block' }}>infraestructura financiera inmobiliaria</Box>
            </Typography>
            <Typography variant="h6" color="text.secondary" lineHeight={1.8} mt={3}>
              Durante más de 15 años estructuramos y desarrollamos suelo urbano, organizando grupos, gestionando procesos de urbanización y adjudicando lotes en proyectos concretos y verificables. Hoy transformamos nuestra experiencia en una plataforma tecnológica que replica ese modelo bajo una arquitectura fiduciaria clara, ordenada y escalable.
            </Typography>
          </Box>

          {/* Métricas Reales */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 4, mb: 10 }}>
            <Card elevation={0} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`, textAlign: 'center', p: 4, borderRadius: 4 }}>
              <Typography variant="h3" color="primary.main" fontWeight={900} gutterBottom>+USD 1,1M</Typography>
              <Typography variant="body1" fontWeight={600} color="text.secondary">estructurados en activos inmobiliarios reales.</Typography>
            </Card>
            <Card elevation={0} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`, textAlign: 'center', p: 4, borderRadius: 4 }}>
              <Typography variant="h3" color="primary.main" fontWeight={900} gutterBottom>119</Typography>
              <Typography variant="body1" fontWeight={600} color="text.secondary">lotes urbanizados adjudicados en desarrollos finalizados.</Typography>
            </Card>
            <Card elevation={0} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`, textAlign: 'center', p: 4, borderRadius: 4 }}>
              <Typography variant="h3" color="primary.main" fontWeight={900} gutterBottom>600</Typography>
              <Typography variant="body1" fontWeight={600} color="text.secondary">lotes proyectados bajo contratos de urbanización vigentes.</Typography>
            </Card>
          </Box>

          {/* Evolución del Modelo */}
          <Box>
            <Typography variant="h4" textAlign="center" fontWeight={800} mb={2}>
              La experiencia no cambia. <Box component="span" sx={{ color: 'primary.main' }}>Evoluciona su forma de organización.</Box>
            </Typography>
            <Typography variant="h6" textAlign="center" color="text.secondary" mb={8} maxWidth={800} mx="auto" fontWeight={400}>
              Loteplan es una estructura jurídica y tecnológica replicable que permite organizar capital y adquirir activos inmobiliarios de forma sistemática.
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
              <Box display="flex" gap={3} alignItems="flex-start">
                <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 56, height: 56 }}>
                  <LaptopMac />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>Plataforma digital propia</Typography>
                  <Typography variant="body2" color="text.secondary" lineHeight={1.6} fontSize="1rem">Gestiona adhesiones, aportes y seguimiento del proceso con trazabilidad en cada etapa.</Typography>
                </Box>
              </Box>

              <Box display="flex" gap={3} alignItems="flex-start">
                <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 56, height: 56 }}>
                  <AccountBalance />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>Modelo fiduciario estandarizado</Typography>
                  <Typography variant="body2" color="text.secondary" lineHeight={1.6} fontSize="1rem">Cada grupo opera bajo reglas claras y separación patrimonial, permitiendo replicar el esquema.</Typography>
                </Box>
              </Box>

              <Box display="flex" gap={3} alignItems="flex-start">
                <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 56, height: 56 }}>
                  <Map />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>Integración progresiva de suelo</Typography>
                  <Typography variant="body2" color="text.secondary" lineHeight={1.6} fontSize="1rem">Incorporamos lotes urbanizados que cumplan criterios legales y urbanísticos estrictos definidos.</Typography>
                </Box>
              </Box>

              <Box display="flex" gap={3} alignItems="flex-start">
                <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 56, height: 56 }}>
                  <TrendingUp />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>Crecimiento por etapas</Typography>
                  <Typography variant="body2" color="text.secondary" lineHeight={1.6} fontSize="1rem">El sistema se expande orgánicamente en función de la conformación de grupos y activos aptos.</Typography>
                </Box>
              </Box>
            </Box>
          </Box>

        </Container>
      </Box>

      {/* ==========================================
          DOS MODOS (ACTUALIZADO)
          ========================================== */}
      <Box sx={{ py: { xs: 10, md: 14 }, bgcolor: 'secondary.light' }}>
        <Container maxWidth="lg">
          <Typography variant="h3" textAlign="center" gutterBottom fontWeight={800} color="text.primary">
            Dos formas de participar
          </Typography>
          <Typography variant="subtitle1" textAlign="center" color="text.secondary" sx={{ mb: 8, fontWeight: 400 }}>
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
                  <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
                      <Box sx={{ width: 56, height: 56, bgcolor: `${mode.color}.main`, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 16px ${alpha(theme.palette[mode.color].main, 0.24)}` }}>
                        <mode.icon sx={{ fontSize: 28, color: 'white' }} />
                      </Box>
                      <Box>
                        <Typography variant="h5" fontWeight={700} color="text.primary">{mode.title}</Typography>
                        <Typography variant="subtitle2" color={`${mode.color}.dark`} fontWeight={700}>{mode.subtitle}</Typography>
                      </Box>
                    </Stack>

                    <Typography variant="body1" sx={{ mb: 4, lineHeight: 1.7 }} color="text.primary">
                      {mode.description}
                    </Typography>

                    <Stack spacing={2} sx={{ mb: 5, flexGrow: 1 }}>
                      {mode.benefits.map((benefit, index) => (
                        <Stack direction="row" spacing={1.5} alignItems="center" key={index}>
                          <CheckCircle fontSize="small" color={mode.color} />
                          <Typography variant="body2" color="text.primary" fontWeight={500}>{benefit}</Typography>
                        </Stack>
                      ))}
                    </Stack>

                    <Button variant="contained" fullWidth endIcon={<ArrowForward />} color={mode.color} onClick={() => navigate(ROUTES.PUBLIC.COMO_FUNCIONA)} sx={{ fontWeight: 600, mt: 'auto' }}>
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
          MODELO FIDUCIARIO (SEGURIDAD Y CONFIANZA)
          ========================================== */}
      <Box sx={{ py: { xs: 10, md: 14 }, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Typography variant="h3" textAlign="center" gutterBottom fontWeight={800} color="text.primary">
            Un modelo fiduciario que brinda <Box component="span" sx={{ color: 'primary.main' }}>previsibilidad jurídica</Box> en cada etapa
          </Typography>
          <Typography variant="subtitle1" textAlign="center" color="text.secondary" sx={{ mb: 8, fontWeight: 400 }}>
            Tu capital respaldado por marcos legales sólidos y transparentes.
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 4 }}>
            <Box textAlign="center">
              <Avatar sx={{ mx: 'auto', mb: 3, width: 64, height: 64, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}><AccountBalance fontSize="large" /></Avatar>
              <Typography variant="subtitle1" fontWeight={800} gutterBottom>Fideicomiso Seguro</Typography>
              <Typography variant="body2" color="text.secondary" lineHeight={1.6}>Administración mediante fideicomiso con separación patrimonial para proteger tu inversión.</Typography>
            </Box>
            <Box textAlign="center">
              <Avatar sx={{ mx: 'auto', mb: 3, width: 64, height: 64, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}><Landscape fontSize="large" /></Avatar>
              <Typography variant="subtitle1" fontWeight={800} gutterBottom>Lotes Reales</Typography>
              <Typography variant="body2" color="text.secondary" lineHeight={1.6}>Proyectos con lotes urbanizados y 100% escriturables.</Typography>
            </Box>
            <Box textAlign="center">
              <Avatar sx={{ mx: 'auto', mb: 3, width: 64, height: 64, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}><GppGood fontSize="large" /></Avatar>
              <Typography variant="subtitle1" fontWeight={800} gutterBottom>Transparencia Total</Typography>
              <Typography variant="body2" color="text.secondary" lineHeight={1.6}>Reglas claras y procesos documentados a disposición de todos los participantes.</Typography>
            </Box>
            <Box textAlign="center">
              <Avatar sx={{ mx: 'auto', mb: 3, width: 64, height: 64, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}><Devices fontSize="large" /></Avatar>
              <Typography variant="subtitle1" fontWeight={800} gutterBottom>Trazabilidad Digital</Typography>
              <Typography variant="body2" color="text.secondary" lineHeight={1.6}>Todas las operaciones y pagos quedan registrados y son trazables digitalmente.</Typography>
            </Box>
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
              Registrate gratis y explorá todas las oportunidades disponibles. Sin compromiso, sin cargos ocultos.
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
    </Box>
  );
};

export default Home;