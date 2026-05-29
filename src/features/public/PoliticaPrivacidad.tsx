import {
  ContactSupport,
  Description,
  Gavel,
  Lock,
  Security,
  Visibility
} from '@mui/icons-material';
import {
  alpha,
  Box,
  Container,
  Paper,
  Stack,
  Typography,
  useTheme
} from '@mui/material';
import React from 'react';

// ==========================================
// DATOS DE LA POLÍTICA
// ==========================================
const privacySections = [
  {
    icon: Visibility,
    title: '1. Información que recopilamos',
    content: (
      <>
        Recopilamos información personal que nos proporcionás al registrarte, como tu nombre, correo electrónico, número de teléfono y DNI. En el caso de operar en la plataforma, también podemos requerir datos financieros o fiscales necesarios para cumplir con normativas legales y fiduciarias.
      </>
    ),
  },
  {
    icon: Lock,
    title: '2. Uso de tu información',
    content: (
      <>
        Utilizamos tus datos exclusivamente para operar y mantener tu cuenta en Loteplan, procesar tus suscripciones, gestionar los pagos de cuotas y adjudicaciones, y comunicarnos con vos sobre actualizaciones de proyectos, subastas o cambios en nuestros términos.
      </>
    ),
  },
  {
    icon: Security,
    title: '3. Protección y Seguridad',
    content: (
      <>
        Tu seguridad es nuestra prioridad. Implementamos medidas técnicas, administrativas y físicas para proteger tu información personal contra acceso no autorizado, alteración, divulgación o destrucción. Todos los datos sensibles están encriptados bajo estándares de la industria.
      </>
    ),
  },
  {
    icon: Gavel,
    title: '4. Compartir información con terceros',
    content: (
      <>
        No vendemos ni alquilamos tu información personal. Solo compartimos tus datos con terceros cuando es estrictamente necesario para la ejecución del fideicomiso (por ejemplo, escribanías, entidades bancarias o autoridades fiscales) o para cumplir con obligaciones legales vigentes.
      </>
    ),
  },
  {
    icon: Description,
    title: '5. Tus derechos',
    content: (
      <>
        Tenés derecho a acceder, rectificar, actualizar o solicitar la eliminación de tu información personal en cualquier momento. Podés ejercer estos derechos directamente desde la configuración de tu cuenta o contactando a nuestro equipo de soporte.
      </>
    ),
  },
];

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
const PoliticaPrivacidad: React.FC = () => {
  const theme = useTheme();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      
      {/* ==========================================
          HERO SECTION
          ========================================== */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'primary.contrastText',
          position: 'relative',
          overflow: 'hidden',
          py: { xs: 8, md: 12 },
          textAlign: 'center',
          borderBottomLeftRadius: { xs: 24, md: 48 },
          borderBottomRightRadius: { xs: 24, md: 48 },
          boxShadow: `0 10px 30px ${alpha(theme.palette.primary.dark, 0.3)}`,
        }}
      >
        {/* Trama SVG de fondo (Misma que en Home) */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.1,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <Container maxWidth="md" sx={{ position: 'relative' }}>
          <Typography variant="h3" component="h1" fontWeight={800} gutterBottom>
            Política de Privacidad
          </Typography>
          <Typography
            variant="h6"
            sx={{
              maxWidth: 700,
              mx: 'auto',
              color: alpha(theme.palette.common.white, 0.9),
              fontWeight: 400,
              lineHeight: 1.6,
              mt: 2,
            }}
          >
            En Loteplan valoramos tu confianza. Te explicamos de manera transparente cómo cuidamos, usamos y protegemos tu información personal y financiera.
          </Typography>
          <Typography
            variant="body2"
            sx={{ mt: 4, color: alpha(theme.palette.common.white, 0.7), fontWeight: 500 }}
          >
            Última actualización: Mayo 2026
          </Typography>
        </Container>
      </Box>

      {/* ==========================================
          CONTENIDO LEGAL
          ========================================== */}
      <Container maxWidth="md" sx={{ py: { xs: 8, md: 10 }, mt: -4 }}>
        <Stack spacing={4}>
          {privacySections.map((section, index) => (
            <Paper
              key={index}
              elevation={0}
              sx={{
                p: { xs: 4, md: 5 },
                bgcolor: 'background.paper',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 4,
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: theme.shadows[4],
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="flex-start">
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    minWidth: 56,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.2)} 100%)`,
                    borderRadius: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'primary.main',
                  }}
                >
                  <section.icon fontSize="large" />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={700} color="text.primary" gutterBottom>
                    {section.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                    {section.content}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          ))}

          {/* ==========================================
              SECCIÓN DE CONTACTO / DUDAS
              ========================================== */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 4, md: 5 },
              bgcolor: alpha(theme.palette.primary.main, 0.04),
              border: `2px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
              borderRadius: 4,
              textAlign: 'center',
              mt: 4,
            }}
          >
            <ContactSupport sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" fontWeight={700} color="text.primary" gutterBottom>
              ¿Tenés dudas sobre tu privacidad?
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
              Si tenés alguna pregunta sobre cómo manejamos tus datos o querés ejercer tus derechos sobre ellos, no dudes en escribirnos.
            </Typography>
            <Typography variant="h6" color="primary.main" fontWeight={700}>
              privacidad@loteplan.com
            </Typography>
          </Paper>

        </Stack>
      </Container>
    </Box>
  );
};

export default PoliticaPrivacidad;