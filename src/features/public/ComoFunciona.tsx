import { ROUTES } from '@/routes';
import {
  AttachMoney,
  BarChart,
  Business,
  CheckCircle,
  EmojiEvents,
  Gavel,
  Group,
  Handshake,
  Home,
  Security as Shield,
  TrendingUp,
  Home as HomeIcon,
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
      description: 'Nuestra plataforma te ofrece más de cien cupos disponibles en nuestros proyectos inmobiliarios asociados.',
      image: '/Comofunciona/Ahorrista/CómofuncionaAhorrista_1a.jpg',
    },
    {
      title: 'Comenzás tu plan en cuotas sin interés',
      description: 'Ya desde la cuota 12 podés participar de la subasta de entrega anticipada y planificar el inicio de la construcción.',
      image: '/Comofunciona/Ahorrista/CómofuncionaAhorrista_2b.jpg',
    },
    {
      title: 'Elegís el lote que te gusta y adjudicás',
      description: 'Nos aseguramos de que tengas la entrega inmediata de tu terreno con escritura para que puedas construir.',
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
        <Typography variant="h3" gutterBottom fontWeight={700} color="text.primary">
          Comprá tu terreno con facilidades de pago
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto', fontWeight: 400, lineHeight: 1.6 }}>
          El crowdfunding para ahorristas te permite agruparse con otras personas que buscan comprar su terreno para la{' '}
          <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>
            casa propia o segunda vivienda
          </Box>
          , con cuotas mensuales sin interés.
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
          ¿Cómo ser ahorrista?
        </Typography>
        <Box sx={{ maxWidth: 'md', mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3, mt: 4 }}>
          <Typography variant="body1" fontSize="1.1rem" color="text.primary" sx={{ lineHeight: 1.8 }}>
            <Box component="span" fontWeight={700} color="primary.main">Es muy fácil:</Box> Te registrás o iniciás sesión en nuestra plataforma, buscás el proyecto que más te guste de entre nuestros desarrollos disponibles y <strong>te suscribís</strong>.
          </Typography>
          <Typography variant="body1" fontSize="1.1rem" color="text.primary" sx={{ lineHeight: 1.8 }}>
            También ofrecemos un <Box component="span" fontWeight={700} color="primary.main">sistema de subastas</Box>: ¿Te gustó mucho un lote en particular? ¡Pelealo para ganarlo! Desde la cuota 12 podés participar en subastas y adjudicar tu terreno de manera anticipada.
          </Typography>
          <Typography variant="body1" fontSize="1.1rem" color="text.primary" sx={{ lineHeight: 1.8 }}>
            Si ganás la subasta con una oferta mayor al precio base, el <Box component="span" fontWeight={700} color="primary.main">excedente se aplica automáticamente</Box> para cubrir tus cuotas futuras.
          </Typography>
        </Box>
      </Card>

      <Box>
        <Typography variant="h4" textAlign="center" fontWeight={700} gutterBottom sx={{ mb: 7 }} color="text.primary">
          ¿Cómo funciona paso a paso?
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
          Ventajas del Modo Ahorrista
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3 }}>
          {benefits.map((benefit, index) => (
            <Box key={index}>
              <Paper elevation={0} sx={{ p: 3, height: '100%', textAlign: 'center', transition: 'all 0.3s ease', border: `1px solid ${theme.palette.divider}`, borderRadius: 3, '&:hover': { transform: 'translateY(-4px)', boxShadow: theme.shadows[4], borderColor: alpha(theme.palette.primary.main, 0.3) } }}>
                <Box sx={{ width: 64, height: 64, background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2, color: 'white' }}>
                  <benefit.icon fontSize="large" />
                </Box>
                <Typography variant="h6" fontWeight={700} gutterBottom color="text.primary">{benefit.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{benefit.description}</Typography>
              </Paper>
            </Box>
          ))}
        </Box>
      </Box>

      <Card sx={{ background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`, color: 'primary.contrastText', p: { xs: 5, md: 7 }, borderRadius: 3, boxShadow: theme.shadows[4] }}>
        <Typography variant="h4" fontWeight={700} textAlign="center" sx={{ mb: 5 }}>🏆 Sistema de Subastas</Typography>
        <Stack spacing={3} sx={{ maxWidth: 'md', mx: 'auto' }}>
          <Box sx={{ display: 'flex', gap: 3, bgcolor: alpha('#fff', 0.1), p: 3, borderRadius: 2 }}>
            <Gavel sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h6" fontWeight={700}>Entrega anticipada desde cuota 12</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 1, lineHeight: 1.6 }}>Podés participar en subastas y adjudicar tu lote antes de completar el plan completo de pagos.</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 3, bgcolor: alpha('#fff', 0.1), p: 3, borderRadius: 2 }}>
            <AttachMoney sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h6" fontWeight={700}>El excedente trabaja para vos</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 1, lineHeight: 1.6 }}>Si pujás más que el precio base, la diferencia se aplica automáticamente para pagar tus cuotas futuras.</Typography>
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
        <Typography variant="h3" gutterBottom fontWeight={700} color="text.primary">
          Invertí en terrenos con alto potencial
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto', fontWeight: 400, lineHeight: 1.6 }}>
          El crowdfunding para inversores te permite reunir capital para obtener terrenos urbanizados.{' '}
          <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>
            Sos dueño de una parte de la tierra
          </Box>
          , no realizás un préstamo de dinero.
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
          ¿Cómo ser inversionista?
        </Typography>
        <Box sx={{ maxWidth: 'md', mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3, mt: 4 }}>
          <Typography variant="body1" fontSize="1.1rem" color="text.primary" sx={{ lineHeight: 1.8 }}>
            <Box component="span" fontWeight={700} color="primary.main">Muy simple:</Box> Te registrás, explorás los proyectos disponibles con toda su información detallada y elegís en cuál invertir.
          </Typography>
          <Typography variant="body1" fontSize="1.1rem" color="text.primary" sx={{ lineHeight: 1.8 }}>
            Una vez alcanzado el objetivo de financiación, <Box component="span" fontWeight={700} color="primary.main">se formaliza legalmente</Box> la operación ante escribano público y los terrenos se transfieren a un Fideicomiso.
          </Typography>
          <Typography variant="body1" fontSize="1.1rem" color="text.primary" sx={{ lineHeight: 1.8 }}>
            Cuando los ahorristas compran los terrenos, <Box component="span" fontWeight={700} color="primary.main">obtenés tu retorno</Box> en función del porcentaje de m² que te corresponde.
          </Typography>
        </Box>
      </Card>

      <Card sx={{ background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`, color: 'primary.contrastText', p: { xs: 5, md: 7 }, textAlign: 'center', borderRadius: 3, boxShadow: theme.shadows[4] }}>
        <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>Invertís en tierra, no en promesas</Typography>
        <Typography variant="body1" sx={{ maxWidth: 800, mx: 'auto', opacity: 0.9, fontSize: '1.1rem', lineHeight: 1.8 }}>Cada inversor es propietario de una fracción de terreno urbanizado. Cuando se comercializa, obtenés tu ganancia por la revalorización del capital.</Typography>
      </Card>

      <Box>
        <Typography variant="h4" textAlign="center" fontWeight={700} gutterBottom sx={{ mb: 7 }} color="text.primary">
          ¿Cómo funciona paso a paso?
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
          Nuestra metodología
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 4 }}>
          {methodology.map((item, index) => (
            <Box key={index}>
              <Paper elevation={0} sx={{ p: 4, height: '100%', textAlign: 'center', transition: 'all 0.3s ease', border: `1px solid ${theme.palette.divider}`, borderRadius: 3, '&:hover': { transform: 'translateY(-4px)', boxShadow: theme.shadows[4], borderColor: alpha(theme.palette.primary.main, 0.3) } }}>
                <Box sx={{ width: 80, height: 80, background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3, color: 'white' }}>
                  <item.icon fontSize="large" />
                </Box>
                <Typography variant="h6" fontWeight={700} gutterBottom color="text.primary">{item.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{item.description}</Typography>
              </Paper>
            </Box>
          ))}
        </Box>
      </Box>

      <Card sx={{ p: { xs: 5, md: 7 }, bgcolor: 'background.paper', borderRadius: 3 }}>
        <Typography variant="h4" textAlign="center" fontWeight={700} gutterBottom sx={{ mb: 7 }} color="text.primary">
          ¿Por qué es seguro invertir en Nectárea?
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
          {[
            { icon: Shield, title: 'Fideicomiso', text: 'Los terrenos están separados legalmente de los bienes de la empresa' },
            { icon: CheckCircle, title: 'Escritura pública', text: 'Todas las operaciones se formalizan ante escribano' },
            { icon: Group, title: 'Transparencia', text: 'Acceso completo a documentación y avance del proyecto' },
            { icon: EmojiEvents, title: 'Análisis de mercado', text: 'Estudios geográficos y de demanda previos' },
          ].map((item, index) => (
            <Box key={index}>
              <Paper elevation={0} sx={{ p: 3, display: 'flex', gap: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), height: '100%', borderRadius: 2, border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
                <item.icon color="primary" fontSize="large" />
                <Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom color="text.primary">{item.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{item.text}</Typography>
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
          <Typography variant="h2" component="h1" fontWeight={800} gutterBottom>Loteplan</Typography>
          <Typography variant="h4" sx={{ mb: 2, color: alpha('#fff', 0.9), fontWeight: 500 }}>Plataforma de Crowdfunding Inmobiliario</Typography>
          <Typography variant="h6" sx={{ maxWidth: 'md', mx: 'auto', opacity: 0.85, fontWeight: 400, lineHeight: 1.6 }}>Invertí y comprá terrenos urbanizados de manera sencilla, segura y colaborativa</Typography>
        </Container>
      </Box>

      {/* Tabs Navigation (ESTILO UNIFICADO) */}
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

      {/* ✅ FOOTER CONDICIONAL 
          Solo se muestra si el usuario NO está autenticado.
      */}
      {!isAuthenticated && (
        <Box
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white',
            py: 7, // Sección más pequeña
            textAlign: 'center',
          }}
        >
          <Container maxWidth="md">
            <Typography variant="h4" fontWeight={700} gutterBottom sx={{ mb: 1 }}>
              ¿Listo para empezar?
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, opacity: 0.9 }}>
              Únete a nuestra comunidad y da el primer paso hacia tu objetivo
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<HomeIcon />}
              onClick={() => navigate(ROUTES.REGISTER)} // Redirige a registro
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
              Registrate ahora
            </Button>
          </Container>
        </Box>
      )}
    </Box>
  );
};

export default ComoFunciona;