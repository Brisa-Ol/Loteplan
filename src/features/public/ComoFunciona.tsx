import {
  AttachMoney,
  BarChart,
  Business,
  CheckCircle,
  ChevronRight,
  EmojiEvents,
  Gavel,
  Group,
  Handshake,
  Home,
  Security as Shield,
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

// ==========================================
// CONTENIDO AHORRISTA
// ==========================================
const AhorristaContent: React.FC = () => {
  const theme = useTheme();

  const steps = [
    {
      title: 'Te suscribís para comprar tu lote',
      description:
        'Nuestra plataforma te ofrece más de cien cupos disponibles en nuestros proyectos inmobiliarios asociados.',
      image: '/Comofunciona/Ahorrista/CómofuncionaAhorrista_1a.jpg',
    },
    {
      title: 'Comenzás tu plan en cuotas sin interés',
      description:
        'Ya desde la cuota 12 podés participar de la subasta de entrega anticipada y planificar el inicio de la construcción.',
      image: '/Comofunciona/Ahorrista/CómofuncionaAhorrista_2b.jpg',
    },
    {
      title: 'Elegís el lote que te gusta y adjudicás',
      description:
        'Nos aseguramos de que tengas la entrega inmediata de tu terreno con escritura para que puedas construir.',
      image: '/Comofunciona/Ahorrista/CómofuncionaAhorrista_3a.jpg',
    },
  ];

  const benefits = [
    { icon: AttachMoney, title: 'Sin interés', description: 'Cuotas fijas mensuales sin cargos adicionales' },
    { icon: Shield, title: '100% seguro', description: 'Protegido por fideicomiso privado' },
    { icon: Home, title: 'Digital y fácil', description: 'Todo el proceso online desde tu casa' },
    { icon: Group, title: 'Colaborativo', description: 'Comunidad de ahorristas que se apoyan' },
  ];

  return (
    <Stack spacing={8}>
      {/* Introduction */}
      <Paper elevation={2} sx={{ p: { xs: 4, md: 6 }, textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom fontWeight={700}>
          Comprá tu terreno con facilidades de pago
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto', fontWeight: 400 }}>
          El crowdfunding para ahorristas te permite agruparse con otras personas que buscan comprar su terreno para la{' '}
          <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>
            casa propia o segunda vivienda
          </Box>
          , con cuotas mensuales sin interés.
        </Typography>
      </Paper>

      {/* How to be a Saver */}
      <Card
        sx={{
          p: { xs: 4, md: 6 },
          bgcolor: alpha(theme.palette.primary.main, 0.04),
          border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        }}
      >
        <Typography variant="h4" gutterBottom textAlign="center" fontWeight={700}>
          ¿Cómo ser ahorrista?
        </Typography>
        <Box sx={{ maxWidth: 'md', mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Typography variant="body1" fontSize="1.1rem">
            <Box component="span" fontWeight={700} color="primary.main">
              Es muy fácil:
            </Box>{' '}
            Te registrás o iniciás sesión en nuestra plataforma, buscás el proyecto que más te guste de entre nuestros
            desarrollos disponibles y <strong>te suscribís</strong>.
          </Typography>
          <Typography variant="body1" fontSize="1.1rem">
            También ofrecemos un{' '}
            <Box component="span" fontWeight={700} color="primary.main">
              sistema de subastas
            </Box>
            : ¿Te gustó mucho un lote en particular? ¡Pelealo para ganarlo! Desde la cuota 12 podés participar en
            subastas y adjudicar tu terreno de manera anticipada.
          </Typography>
          <Typography variant="body1" fontSize="1.1rem">
            Si ganás la subasta con una oferta mayor al precio base, el{' '}
            <Box component="span" fontWeight={700} color="primary.main">
              excedente se aplica automáticamente
            </Box>{' '}
            para cubrir tus cuotas futuras.
          </Typography>


        </Box>
      </Card>

      {/* Steps with Images */}
      <Box>
        <Typography variant="h4" textAlign="center" fontWeight={700} gutterBottom sx={{ mb: 6 }}>
          ¿Cómo funciona paso a paso?
        </Typography>

        {/* REEMPLAZO GRID: 3 Columnas */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 4
        }}>
          {steps.map((step, index) => (
            <Box key={index}>
              <Card sx={{ height: '100%', transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-8px)' } }}>
                <Box sx={{ position: 'relative', height: 240 }}>
                  <CardMedia
                    component="img"
                    height="100%"
                    image={step.image}
                    alt={step.title}
                    sx={{ objectFit: 'cover' }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 16,
                      left: 16,
                      width: 48,
                      height: 48,
                      bgcolor: 'primary.main',
                      color: 'white',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      boxShadow: 3,
                    }}
                  >
                    {index + 1}
                  </Box>
                </Box>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {step.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Benefits */}
      <Box>
        <Typography variant="h4" textAlign="center" fontWeight={700} gutterBottom sx={{ mb: 6 }}>
          Ventajas del Modo Ahorrista
        </Typography>

        {/* REEMPLAZO GRID: 4 Columnas (2 en tablet, 1 en movil) */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 3
        }}>
          {benefits.map((benefit, index) => (
            <Box key={index}>
              <Paper
                elevation={1}
                sx={{
                  p: 3,
                  height: '100%',
                  textAlign: 'center',
                  transition: 'transform 0.3s',
                  '&:hover': { transform: 'translateY(-4px)' },
                }}
              >
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                    color: 'white',
                  }}
                >
                  <benefit.icon fontSize="large" />
                </Box>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  {benefit.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {benefit.description}
                </Typography>
              </Paper>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Auction System */}
      <Card
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          color: 'primary.contrastText',
          p: { xs: 4, md: 6 },
        }}
      >
        <Typography variant="h4" fontWeight={700} textAlign="center" sx={{ mb: 4 }}>
          🏆 Sistema de Subastas
        </Typography>
        <Stack spacing={3} sx={{ maxWidth: 'md', mx: 'auto' }}>
          <Box sx={{ display: 'flex', gap: 3, bgcolor: alpha('#fff', 0.1), p: 3, borderRadius: 2 }}>
            <Gavel sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Entrega anticipada desde cuota 12
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Podés participar en subastas y adjudicar tu lote antes de completar el plan completo de pagos.
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 3, bgcolor: alpha('#fff', 0.1), p: 3, borderRadius: 2 }}>
            <AttachMoney sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h6" fontWeight={700}>
                El excedente trabaja para vos
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Si pujás más que el precio base, la diferencia se aplica automáticamente para pagar tus cuotas futuras.
              </Typography>
            </Box>
          </Box>
        </Stack>
      </Card>
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
      title: 'Elegís el proyecto y el dinero a invertir',
      description: 'Seleccionás el proyecto que te interesa y determinás cuánto vas a invertir junto con otros inversionistas.',
      image: '/Comofunciona/inversionista/CómofuncionaInversionista_1.jpg',
    },
    {
      title: 'Tu inversión es asegurada en un Fideicomiso',
      description: 'Los fondos se depositan en un Fideicomiso, garantizando seguridad jurídica y separación de los bienes.',
      image: '/Comofunciona/inversionista/CómofuncionaInversionista_2.jpg',
    },
    {
      title: 'Generás retornos con la venta al ahorrista',
      description: 'Una vez urbanizado el terreno, se venden fracciones a ahorristas y se generan retornos transparentes.',
      image: '/Comofunciona/inversionista/CómofuncionaInversionista_3.jpg',
    },
  ];

  const methodology = [
    {
      icon: BarChart,
      title: 'Análisis Geográfico',
      description: 'Realizamos estudio de mercado y demanda para garantizar el rendimiento.',
    },
    {
      icon: Business,
      title: 'Marco Jurídico',
      description: 'Los terrenos se transfieren a un Fideicomiso, conformando un patrimonio separado.',
    },
    {
      icon: Handshake,
      title: 'Gestión de Grupos',
      description: 'Conformamos Grupos de Ahorro, reduciendo riesgos y aumentando la seguridad.',
    },
  ];

  const projects = [
    {
      name: 'Portfolio Gran Mendoza',
      location: 'Mendoza Norte',
      investment: 'USD 10.000 mínimo',
      term: '24 meses',
      returnRate: '15,5% en USD',
    },
    {
      name: 'Campus Perdriel',
      location: 'Luján de Cuyo',
      investment: 'USD 7.000 mínimo',
      term: '5 años',
      returnRate: '35%',
    },
  ];

  return (
    <Stack spacing={8}>
      {/* Introduction */}
      <Paper elevation={2} sx={{ p: { xs: 4, md: 6 }, textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom fontWeight={700}>
          Invertí en terrenos con alto potencial
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto', fontWeight: 400 }}>
          El crowdfunding para inversores te permite reunir capital para obtener terrenos urbanizados.{' '}
          <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>
            Sos dueño de una parte de la tierra
          </Box>
          , no realizás un préstamo de dinero.
        </Typography>
      </Paper>

      {/* How to be an Investor */}
      <Card
        sx={{
          p: { xs: 4, md: 6 },
          bgcolor: alpha(theme.palette.primary.main, 0.04),
          border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        }}
      >
        <Typography variant="h4" gutterBottom textAlign="center" fontWeight={700}>
          ¿Cómo ser inversionista?
        </Typography>
        <Box sx={{ maxWidth: 'md', mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Typography variant="body1" fontSize="1.1rem">
            <Box component="span" fontWeight={700} color="primary.main">
              Muy simple:
            </Box>{' '}
            Te registrás, explorás los proyectos disponibles con toda su información detallada y elegís en cuál invertir.
          </Typography>
          <Typography variant="body1" fontSize="1.1rem">
            Una vez alcanzado el objetivo de financiación,{' '}
            <Box component="span" fontWeight={700} color="primary.main">
              se formaliza legalmente
            </Box>{' '}
            la operación ante escribano público y los terrenos se transfieren a un Fideicomiso.
          </Typography>
          <Typography variant="body1" fontSize="1.1rem">
            Cuando los ahorristas compran los terrenos,{' '}
            <Box component="span" fontWeight={700} color="primary.main">
              obtenés tu retorno
            </Box>{' '}
            en función del porcentaje de m² que te corresponde.
          </Typography>


        </Box>
      </Card>

      {/* Key Concept */}
      <Card
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          color: 'primary.contrastText',
          p: { xs: 4, md: 6 },
          textAlign: 'center',
        }}
      >

        <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>
          Invertís en tierra, no en promesas
        </Typography>
        <Typography variant="body1" sx={{ maxWidth: 800, mx: 'auto', opacity: 0.9, fontSize: '1.1rem' }}>
          Cada inversor es propietario de una fracción de terreno urbanizado. Cuando se comercializa, obtenés tu
          ganancia por la revalorización del capital.
        </Typography>
      </Card>

      {/* Steps Images */}
      <Box>
        <Typography variant="h4" textAlign="center" fontWeight={700} gutterBottom sx={{ mb: 6 }}>
          ¿Cómo funciona paso a paso?
        </Typography>

        {/* REEMPLAZO GRID: 3 Columnas */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 4
        }}>
          {steps.map((step, index) => (
            <Box key={index}>
              <Card sx={{ height: '100%', transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-8px)' } }}>
                <Box sx={{ position: 'relative', height: 240 }}>
                  <CardMedia
                    component="img"
                    height="100%"
                    image={step.image}
                    alt={step.title}
                    sx={{ objectFit: 'cover' }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 16,
                      left: 16,
                      width: 48,
                      height: 48,
                      bgcolor: 'primary.main',
                      color: 'white',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      boxShadow: 3,
                    }}
                  >
                    {index + 1}
                  </Box>
                </Box>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {step.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Methodology */}
      <Box>
        <Typography variant="h4" textAlign="center" fontWeight={700} gutterBottom sx={{ mb: 6 }}>
          Nuestra metodología
        </Typography>

        {/* REEMPLAZO GRID: 3 Columnas */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 4
        }}>
          {methodology.map((item, index) => (
            <Box key={index}>
              <Paper
                elevation={2}
                sx={{
                  p: 4,
                  height: '100%',
                  textAlign: 'center',
                  transition: 'transform 0.3s',
                  '&:hover': { transform: 'translateY(-4px)' },
                }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3,
                    color: 'white',
                  }}
                >
                  <item.icon fontSize="large" />
                </Box>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.description}
                </Typography>
              </Paper>
            </Box>
          ))}
        </Box>
      </Box>


      {/* Security Section */}
      <Card sx={{ p: { xs: 4, md: 6 } }}>
        <Typography variant="h4" textAlign="center" fontWeight={700} gutterBottom sx={{ mb: 6 }}>
          ¿Por qué es seguro invertir en Nectárea?
        </Typography>

        {/* REEMPLAZO GRID: 2 Columnas */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
          gap: 3
        }}>
          {[
            { icon: Shield, title: 'Fideicomiso', text: 'Los terrenos están separados legalmente de los bienes de la empresa' },
            { icon: CheckCircle, title: 'Escritura pública', text: 'Todas las operaciones se formalizan ante escribano' },
            { icon: Group, title: 'Transparencia', text: 'Acceso completo a documentación y avance del proyecto' },
            { icon: EmojiEvents, title: 'Análisis de mercado', text: 'Estudios geográficos y de demanda previos' },
          ].map((item, index) => (
            <Box key={index}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  display: 'flex',
                  gap: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  height: '100%',
                }}
              >
                <item.icon color="primary" fontSize="large" />
                <Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.text}
                  </Typography>
                </Box>
              </Paper>
            </Box>
          ))}
        </Box>
      </Card>
    </Stack>
  );
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
const ComoFunciona: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const theme = useTheme();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          py: { xs: 8, md: 10 },
          textAlign: 'center',
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h2" component="h1" fontWeight={700} gutterBottom>
            Loteplan
          </Typography>
          <Typography variant="h4" sx={{ mb: 2, color: alpha('#fff', 0.9), fontWeight: 500 }}>
            Plataforma de Crowdfunding Inmobiliario
          </Typography>
          <Typography variant="h6" sx={{ maxWidth: 'md', mx: 'auto', opacity: 0.8, fontWeight: 400 }}>
            Invertí y comprá terrenos urbanizados de manera sencilla, segura y colaborativa
          </Typography>
        </Container>
      </Box>

      {/* Tabs Navigation */}
      <Container maxWidth="lg" sx={{ mt: -4, mb: 6, position: 'relative', zIndex: 10 }}>
        <Paper elevation={4} sx={{ p: 1, borderRadius: 3, display: 'flex', gap: 2 }}>
          <Box
            onClick={() => setActiveTab(0)}
            sx={{
              flex: 1,
              py: 2,
              px: 3,
              borderRadius: 2,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              transition: 'all 0.3s',
              bgcolor: activeTab === 0 ? 'primary.main' : 'transparent',
              color: activeTab === 0 ? 'white' : 'text.secondary',
              boxShadow: activeTab === 0 ? 4 : 0,
              '&:hover': {
                bgcolor: activeTab === 0 ? 'primary.dark' : alpha(theme.palette.action.hover, 0.05),
              },
            }}
          >
            <Home fontSize="large" />
            <Typography variant="h6" fontWeight={700}>
              Modo Ahorrista
            </Typography>
          </Box>
          <Box
            onClick={() => setActiveTab(1)}
            sx={{
              flex: 1,
              py: 2,
              px: 3,
              borderRadius: 2,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              transition: 'all 0.3s',
              bgcolor: activeTab === 1 ? 'primary.main' : 'transparent',
              color: activeTab === 1 ? 'white' : 'text.secondary',
              boxShadow: activeTab === 1 ? 4 : 0,
              '&:hover': {
                bgcolor: activeTab === 1 ? 'primary.dark' : alpha(theme.palette.action.hover, 0.05),
              },
            }}
          >
            <TrendingUp fontSize="large" />
            <Typography variant="h6" fontWeight={700}>
              Modo Inversionista
            </Typography>
          </Box>
        </Paper>
      </Container>

      {/* Content */}
      <Container maxWidth="lg" sx={{ py: 6, pb: 12 }}>
        {activeTab === 0 ? <AhorristaContent /> : <InversionistaContent />}
      </Container>

      {/* Footer CTA */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          py: 12,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h3" fontWeight={700} gutterBottom>
            ¿Listo para empezar?
          </Typography>
          <Typography variant="h6" sx={{ mb: 6, opacity: 0.9 }}>
            Únete a nuestra comunidad y da el primer paso hacia tu objetivo
          </Typography>
          <Button
            variant="contained"
            size="large"
            endIcon={<ChevronRight />}
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              px: 5,
              py: 2,
              fontSize: '1.1rem',
              '&:hover': {
                bgcolor: alpha('#fff', 0.9),
              },
            }}
          >
            Registrarme ahora
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default ComoFunciona;