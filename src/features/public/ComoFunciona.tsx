import { ROUTES } from '@/routes';
import {
  BarChart,
  Business,
  CheckCircle, // Nuevo icono para trazabilidad
  EventAvailable // Nuevo icono para cuotas planificadas
  ,
  Gavel,
  Home,
  Home as HomeIcon,
  Security as Shield,
  Timeline,
  TrendingUp
} from '@mui/icons-material';
import {
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Container,
  Paper,
  Stack,
  Typography,
  useTheme
} from '@mui/material';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ✅ IMPORTAR EL CONTEXTO DE AUTENTICACIÓN
import { useAuth } from '@/core/context/AuthContext';

// ==========================================
// CONTENIDO AHORRISTA
// ==========================================
const AhorristaContent: React.FC = () => {
  const theme = useTheme();

  const steps = [
    {
      title: 'Te suscribís para comprar tu lote',
      description: 'Nuestra plataforma te ofrece cupos disponibles en proyectos inmobiliarios con respaldo fiduciario.',
      image: '/Comofunciona/Ahorrista/CómofuncionaAhorrista_1a.jpg',
    },
    {
      title: 'Pagás en cuotas planificadas',
      description: 'Abonás tu terreno dentro de un sistema estructurado, transparente y sin interés bancario.',
      image: '/Comofunciona/Ahorrista/CómofuncionaAhorrista_2b.jpg',
    },
    {
      title: 'Adjudicás y obtenés tu terreno',
      description: 'Nos aseguramos de la entrega de tu lote 100% escriturable para que inicies tu proyecto de vida.',
      image: '/Comofunciona/Ahorrista/CómofuncionaAhorrista_3a.jpg',
    },
  ];

  const benefits = [
    { icon: EventAvailable, title: 'Cuotas Planificadas', description: 'Sistema estructurado y previsible frente al crédito bancario limitado.' },
    { icon: Shield, title: 'Administración Fiduciaria', description: 'Tu inversión protegida legalmente con separación patrimonial.' },
    { icon: CheckCircle, title: 'Proceso Transparente', description: 'Reglas claras desde el primer día y seguimiento en tiempo real.' },
    { icon: Home, title: 'Terrenos Reales', description: 'Posibilidad de articular con programas públicos de construcción vigentes.' },
  ];

  return (
    <Stack spacing={10}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 5, md: 7 },
          textAlign: 'center',
          bgcolor: 'background.paper',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 3
        }}
      >
        <Typography variant="h3" gutterBottom fontWeight={800} color="text.primary">
          El primer paso hacia tu casa
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto', fontWeight: 400, lineHeight: 1.6 }}>
          Cuando el crédito no alcanza, el{' '}
          <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>
            ahorro organizado sí
          </Box>
          . Pagá tu lote en cuotas mensuales dentro de un sistema estructurado y con respaldo fiduciario.
        </Typography>
      </Paper>

      <Card
        sx={{
          p: { xs: 5, md: 7 },
          bgcolor: alpha(theme.palette.primary.main, 0.04),
          border: `2px solid ${alpha(theme.palette.primary.main, 0.15)}`,
          borderRadius: 3,
          boxShadow: 'none'
        }}
      >
        <Typography variant="h4" gutterBottom textAlign="center" fontWeight={700} color="text.primary">
          ¿Cómo funciona nuestra plataforma?
        </Typography>
        <Box sx={{ maxWidth: 'md', mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3, mt: 4 }}>
          <Typography variant="body1" fontSize="1.1rem" color="text.primary" sx={{ lineHeight: 1.8 }}>
            <Box component="span" fontWeight={700} color="primary.main">Paso inicial:</Box> Te registrás en nuestra plataforma, analizás los proyectos activos que cumplan con tus necesidades, y <strong>te suscribís</strong> al fideicomiso.
          </Typography>
          <Typography variant="body1" fontSize="1.1rem" color="text.primary" sx={{ lineHeight: 1.8 }}>
            <Box component="span" fontWeight={700} color="primary.main">Subasta de adjudicación:</Box> ¿Querés el terreno antes de terminar de pagarlo? Desde la cuota 12 podés participar en pujas transparentes para obtener la entrega anticipada de tu lote.
          </Typography>
          <Typography variant="body1" fontSize="1.1rem" color="text.primary" sx={{ lineHeight: 1.8 }}>
            <Box component="span" fontWeight={700} color="primary.main">Capitalización inteligente:</Box> Si ganás la subasta con una oferta mayor al precio base, todo el excedente ofertado se aplica automáticamente para cancelar tus cuotas futuras.
          </Typography>
        </Box>
      </Card>

      <Box>
        <Typography variant="h4" textAlign="center" fontWeight={700} gutterBottom sx={{ mb: 7 }} color="text.primary">
          El proceso paso a paso
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 4 }}>
          {steps.map((step, index) => (
            <Box key={index}>
              <Card sx={{ height: '100%', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-8px)', boxShadow: theme.shadows[8] } }}>
                <Box sx={{ position: 'relative', height: 240 }}>
                  <CardMedia component="img" height="100%" image={step.image} alt={step.title} sx={{ objectFit: 'cover' }} />
                  <Box sx={{ position: 'absolute', top: 16, left: 16, width: 48, height: 48, bgcolor: 'primary.main', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 700, boxShadow: theme.shadows[4] }}>
                    {index + 1}
                  </Box>
                </Box>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom color="text.primary">{step.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{step.description}</Typography>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      </Box>

      <Box>
        <Typography variant="h4" textAlign="center" fontWeight={700} gutterBottom sx={{ mb: 7 }} color="text.primary">
          Ventajas del Modelo Ahorrista
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3 }}>
          {benefits.map((benefit, index) => (
            <Box key={index}>
              <Paper elevation={0} sx={{ p: 3, height: '100%', textAlign: 'center', transition: 'all 0.3s ease', border: `1px solid ${theme.palette.divider}`, borderRadius: 3, '&:hover': { transform: 'translateY(-4px)', boxShadow: theme.shadows[4], borderColor: alpha(theme.palette.primary.main, 0.3) } }}>
                <Box sx={{ width: 64, height: 64, background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2, color: 'white' }}>
                  <benefit.icon fontSize="large" />
                </Box>
                <Typography variant="subtitle1" fontWeight={800} gutterBottom color="text.primary">{benefit.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{benefit.description}</Typography>
              </Paper>
            </Box>
          ))}
        </Box>
      </Box>
    </Stack>
  );
};

// ==========================================
// CONTENIDO INVERSIONISTA
// ==========================================
const InversionistaContent: React.FC = () => {
  const theme = useTheme();

  const steps = [
    {
      title: 'Evaluación y selección de activos',
      description: 'Analizás las operaciones estructuradas de adquisición de activos inmobiliarios disponibles.',
      image: '/Comofunciona/inversionista/CómofuncionaInversionista_1.jpg',
    },
    {
      title: 'Fideicomiso de administración',
      description: 'El capital se organiza bajo reglas claras, garantizando la seguridad jurídica y separación patrimonial.',
      image: '/Comofunciona/inversionista/CómofuncionaInversionista_2.jpg',
    },
    {
      title: 'Rentabilidad y salida planificada',
      description: 'Obtenés un retorno vinculado a la comercialización del suelo, con trazabilidad digital en cada etapa.',
      image: '/Comofunciona/inversionista/CómofuncionaInversionista_3.jpg',
    },
  ];

  const methodology = [
    {
      icon: Business,
      title: 'Activos Reales',
      description: 'Participación directa en tierra física urbanizada, alejándote de la volatilidad del mercado financiero.',
    },
    {
      icon: Timeline,
      title: 'Entrada y Salida Planificada',
      description: 'Esquemas estructurados con tiempos definidos para maximizar la eficiencia de tu capital.',
    },
    {
      icon: BarChart,
      title: 'Rentabilidad Estimada',
      description: 'Retornos sólidos y verificables vinculados directamente a la comercialización del activo.',
    },
    {
      icon: Gavel,
      title: 'Trazabilidad Digital',
      description: 'Auditoría en tiempo real de cada etapa del proceso administrativo y legal del fideicomiso.',
    }
  ];

  return (
    <Stack spacing={10}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 5, md: 7 },
          textAlign: 'center',
          bgcolor: 'background.paper',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 3
        }}
      >
        <Typography variant="h3" gutterBottom fontWeight={800} color="text.primary">
          Invertí en tierra con rentabilidad proyectada
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto', fontWeight: 400, lineHeight: 1.6 }}>
          Participá en operaciones estructuradas de adquisición de activos inmobiliarios.{' '}
          <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>
            Sos dueño de una fracción real
          </Box>
          , protegido bajo un esquema fiduciario de administración.
        </Typography>
      </Paper>

      <Card
        sx={{
          p: { xs: 5, md: 7 },
          bgcolor: alpha(theme.palette.primary.main, 0.04),
          border: `2px solid ${alpha(theme.palette.primary.main, 0.15)}`,
          borderRadius: 3,
          boxShadow: 'none'
        }}
      >
        <Typography variant="h4" gutterBottom textAlign="center" fontWeight={700} color="text.primary">
          La mecánica de inversión
        </Typography>
        <Box sx={{ maxWidth: 'md', mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3, mt: 4 }}>
          <Typography variant="body1" fontSize="1.1rem" color="text.primary" sx={{ lineHeight: 1.8 }}>
            <Box component="span" fontWeight={700} color="primary.main">1. Agrupamiento de Capital:</Box> Los inversionistas fondean el proyecto mediante un contrato claro y estandarizado, reuniendo el capital necesario para la adquisición del suelo.
          </Typography>
          <Typography variant="body1" fontSize="1.1rem" color="text.primary" sx={{ lineHeight: 1.8 }}>
            <Box component="span" fontWeight={700} color="primary.main">2. Respaldo Fiduciario:</Box> Una vez completado el fondo, los terrenos se transfieren formalmente a un Fideicomiso, conformando un patrimonio autónomo y separado.
          </Typography>
          <Typography variant="body1" fontSize="1.1rem" color="text.primary" sx={{ lineHeight: 1.8 }}>
            <Box component="span" fontWeight={700} color="primary.main">3. Liquidación Transparente:</Box> A medida que los lotes son comercializados y adquiridos por el grupo ahorrista, se distribuyen los retornos proyectados con total trazabilidad digital.
          </Typography>
        </Box>
      </Card>

      <Box>
        <Typography variant="h4" textAlign="center" fontWeight={700} gutterBottom sx={{ mb: 7 }} color="text.primary">
          El proceso paso a paso
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 4 }}>
          {steps.map((step, index) => (
            <Box key={index}>
              <Card sx={{ height: '100%', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-8px)', boxShadow: theme.shadows[8] } }}>
                <Box sx={{ position: 'relative', height: 240 }}>
                  <CardMedia component="img" height="100%" image={step.image} alt={step.title} sx={{ objectFit: 'cover' }} />
                  <Box sx={{ position: 'absolute', top: 16, left: 16, width: 48, height: 48, bgcolor: 'primary.main', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 700, boxShadow: theme.shadows[4] }}>
                    {index + 1}
                  </Box>
                </Box>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom color="text.primary">{step.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{step.description}</Typography>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      </Box>

      <Box>
        <Typography variant="h4" textAlign="center" fontWeight={700} gutterBottom sx={{ mb: 7 }} color="text.primary">
          Metodología y Ventajas Clave
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3 }}>
          {methodology.map((item, index) => (
            <Box key={index}>
              <Paper elevation={0} sx={{ p: 3, height: '100%', textAlign: 'center', transition: 'all 0.3s ease', border: `1px solid ${theme.palette.divider}`, borderRadius: 3, '&:hover': { transform: 'translateY(-4px)', boxShadow: theme.shadows[4], borderColor: alpha(theme.palette.primary.main, 0.3) } }}>
                <Box sx={{ width: 64, height: 64, background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2, color: 'white' }}>
                  <item.icon fontSize="large" />
                </Box>
                <Typography variant="subtitle1" fontWeight={800} gutterBottom color="text.primary">{item.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{item.description}</Typography>
              </Paper>
            </Box>
          ))}
        </Box>
      </Box>

    </Stack>
  );
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
const ComoFunciona: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const theme = useTheme();

  // ✅ OBTENEMOS EL ESTADO DE AUTENTICACIÓN
  const { isAuthenticated } = useAuth();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero Section */}
      <Box sx={{
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        color: 'white',
        py: { xs: 10, md: 12 },
        textAlign: 'center',
        mb: 0,
        borderBottomLeftRadius: { xs: 24, md: 48 },
        borderBottomRightRadius: { xs: 24, md: 48 },
        boxShadow: "0 10px 30px " + alpha(theme.palette.primary.dark, 0.3)
      }}>
        <Container maxWidth="lg">
          <Typography variant="h3" component="h1" fontWeight={800} gutterBottom>
            Accedé a tu lote urbanizado <br /> sin depender del crédito bancario
          </Typography>
          <Typography variant="h6" sx={{ maxWidth: 'md', mx: 'auto', opacity: 0.85, fontWeight: 400, lineHeight: 1.6, mt: 2 }}>
            Conocé cómo la infraestructura financiera de Loteplan organiza el ahorro y la inversión para hacer posibles tus objetivos.
          </Typography>
        </Container>
      </Box>

      {/* Tabs Navigation */}
      <Container maxWidth="md" sx={{ mt: -5, mb: 8, position: 'relative', zIndex: 10 }}>
        <Paper elevation={0} sx={{ p: 0.6, borderRadius: 10, display: 'flex', bgcolor: '#F2F2F2', border: `1px solid ${theme.palette.divider}`, boxShadow: theme.shadows[3] }}>
          <Button onClick={() => setActiveTab(0)} fullWidth startIcon={<Home fontSize="medium" />} sx={{ borderRadius: 8, py: 1.5, textTransform: 'none', fontSize: '1rem', fontWeight: 700, transition: 'all 0.3s ease', ...(activeTab === 0 ? { bgcolor: 'primary.main', color: 'white', boxShadow: '0 4px 12px ' + alpha(theme.palette.primary.main, 0.3), border: `1px solid ${theme.palette.primary.dark}`, '&:hover': { bgcolor: 'primary.dark' } } : { color: 'text.primary', '&:hover': { bgcolor: alpha(theme.palette.common.black, 0.04) } }) }}>Modo Ahorrista</Button>
          <Button onClick={() => setActiveTab(1)} fullWidth startIcon={<TrendingUp fontSize="medium" />} sx={{ borderRadius: 8, py: 1.5, textTransform: 'none', fontSize: '1rem', fontWeight: 700, transition: 'all 0.3s ease', ...(activeTab === 1 ? { bgcolor: 'primary.main', color: 'white', boxShadow: '0 4px 12px ' + alpha(theme.palette.primary.main, 0.3), border: `1px solid ${theme.palette.primary.dark}`, '&:hover': { bgcolor: 'primary.dark' } } : { color: 'text.primary', '&:hover': { bgcolor: alpha(theme.palette.common.black, 0.04) } }) }}>Modo Inversionista</Button>
        </Paper>
      </Container>

      {/* Content */}
      <Container maxWidth="lg" sx={{ py: 8, pb: 12 }}>
        {activeTab === 0 ? <AhorristaContent /> : <InversionistaContent />}
      </Container>

      {/* FOOTER CONDICIONAL */}
      {!isAuthenticated && (
        <Box
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white',
            py: 7,
            textAlign: 'center',
          }}
        >
          <Container maxWidth="md">
            <Typography variant="h4" fontWeight={700} gutterBottom sx={{ mb: 1 }}>
              ¿Listo para empezar?
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, opacity: 0.9 }}>
              Únete a nuestra plataforma y da el primer paso hacia tu objetivo
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<HomeIcon />}
              onClick={() => navigate(ROUTES.REGISTER)}
              sx={{
                bgcolor: 'common.white',
                color: 'primary.main',
                fontWeight: 700,
                px: 5,
                '&:hover': {
                  bgcolor: alpha(theme.palette.common.white, 0.9),
                  transform: 'scale(1.02)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              Crear mi cuenta
            </Button>
          </Container>
        </Box>
      )}
    </Box>
  );
};

export default ComoFunciona;