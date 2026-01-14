import React from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Stack,
  Paper,
  useTheme,
  alpha,
  Avatar,
} from '@mui/material';
import {
  Business,
  EmojiEvents,
  Handshake,
  VerifiedUser,
  TrendingUp,
} from '@mui/icons-material';

const Nosotros: React.FC = () => {
  const theme = useTheme();

  const values = [
    {
      icon: VerifiedUser,
      title: 'Transparencia',
      description:
        'Toda la información es clara y accesible. Sin letras chicas ni sorpresas. Sabés exactamente dónde está tu dinero.',
    },
    {
      icon: Handshake,
      title: 'Colaboración',
      description:
        'Creemos en el poder de las personas unidas. Juntos logramos objetivos que individualmente serían imposibles.',
    },
    {
      icon: Business,
      title: 'Seguridad Jurídica',
      description:
        'Todos los proyectos están respaldados por fideicomiso y escritura pública, garantizando tu tranquilidad.',
    },
    {
      icon: EmojiEvents,
      title: 'Compromiso',
      description:
        'Trabajamos cada día para que más familias accedan a su terreno propio y los inversores maximicen sus retornos.',
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      
      {/* ==========================================
          HERO SECTION (Estilo Unificado)
          ========================================== */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'primary.contrastText',
          py: { xs: 8, md: 10 },
          textAlign: 'center',
          mb: 8,
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h2" component="h1" fontWeight={800} gutterBottom>
            Acerca de Nosotros
          </Typography>
          <Typography
            variant="h6"
            sx={{
              maxWidth: 'md',
              mx: 'auto',
              opacity: 0.9,
              fontWeight: 400,
            }}
          >
            Conocé más sobre quiénes somos y qué nos impulsa a transformar el mercado inmobiliario.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pb: 12 }}>
        
        {/* ==========================================
            NUESTRA HISTORIA
            ========================================== */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 6 },
            mb: 8,
            bgcolor: alpha(theme.palette.primary.main, 0.03),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            borderRadius: 4,
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={6} alignItems="center">
            <Box flex={1}>
              <Typography variant="overline" color="primary" fontWeight={700} letterSpacing={1.2}>
                NUESTRO ORIGEN
              </Typography>
              <Typography variant="h4" fontWeight={700} gutterBottom sx={{ mb: 3, mt: 1 }}>
                Democratizando el acceso a la tierra
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, mb: 2, fontSize: '1.1rem' }}>
                Nectárea nace de la visión de democratizar el acceso a la tierra urbanizada, haciendo
                posible que cualquier persona, sin importar si es un gran inversor o una familia buscando su primer hogar, 
                pueda participar en el mercado inmobiliario.
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, fontSize: '1.1rem' }}>
                Entendimos que la unión hace la fuerza. Al agrupar a ahorristas e inversores mediante tecnología, 
                eliminamos las barreras de entrada tradicionales, bajamos los costos y generamos valor real y tangible para todos los involucrados.
              </Typography>
            </Box>
            
            {/* Imagen ilustrativa (Placeholder) */}
            <Box flex={1} sx={{ width: '100%', height: '100%' }}>
               <Box 
                 component="img"
                 src="/nosotros/Nosotros_2a.jpg" // Asegurate de que la ruta sea correcta
                 alt="Equipo Nectárea"
                 sx={{ 
                   width: '100%', 
                   borderRadius: 4, 
                   boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' 
                 }}
               />
            </Box>
          </Stack>
        </Paper>

        {/* ==========================================
            NUESTROS VALORES (GRID)
            ========================================== */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h3" textAlign="center" fontWeight={700} gutterBottom sx={{ mb: 6 }}>
            Nuestros Valores
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
              gap: 4,
            }}
          >
            {values.map((value, index) => (
              <Card
                key={index}
                sx={{
                  height: '100%',
                  border: 'none',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.1)',
                  },
                }}
              >
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <Avatar
                    sx={{
                      width: 64,
                      height: 64,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: 'primary.main',
                      mx: 'auto',
                      mb: 3,
                    }}
                  >
                    <value.icon fontSize="large" />
                  </Avatar>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {value.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {value.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>

        {/* ==========================================
            ESTADÍSTICAS / CIERRE
            ========================================== */}
        <Box
          sx={{
            py: 6,
            px: 4,
            borderRadius: 4,
            background: `linear-gradient(135deg, ${theme.palette.secondary.light} 0%, #FFFFFF 100%)`,
            border: `1px solid ${theme.palette.divider}`,
            textAlign: 'center',
          }}
        >
          <Stack 
            direction={{ xs: 'column', md: 'row' }} 
            spacing={6} 
            justifyContent="center" 
            alignItems="center"
            divider={<Box sx={{ width: { xs: '100%', md: '1px' }, height: { xs: '1px', md: '60px' }, bgcolor: 'divider' }} />}
          >
            <Box>
              <Typography variant="h3" fontWeight={800} color="primary.main">
                +400
              </Typography>
              <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                Hectáreas desarrolladas
              </Typography>
            </Box>
            <Box>
              <Typography variant="h3" fontWeight={800} color="primary.main">
                +15%
              </Typography>
              <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                Rentabilidad anual promedio
              </Typography>
            </Box>
            <Box>
              <Typography variant="h3" fontWeight={800} color="primary.main">
                100%
              </Typography>
              <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                Seguridad Jurídica
              </Typography>
            </Box>
          </Stack>
        </Box>

      </Container>
    </Box>
  );
};

export default Nosotros;