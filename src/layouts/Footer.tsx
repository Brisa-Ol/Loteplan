// src/layouts/shared/Footer.tsx

import { Email, Phone } from '@mui/icons-material';
import {
  Box, Container, Divider, Link, Stack, Typography, useTheme
} from '@mui/material';
import React from 'react';

const Footer: React.FC = () => {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  const colLabelStyle = {
    fontSize: '0.7rem',
    fontWeight: 600,
    letterSpacing: 1.1,
    textTransform: 'uppercase' as const,
    color: 'text.secondary',
    mb: 2,
  };

  const linkStyle = {
    color: 'text.secondary',
    textDecoration: 'none',
    fontSize: '0.875rem',
    display: 'block',
    transition: 'color 0.15s',
    '&:hover': { color: 'text.primary' },
  };

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'background.paper',
        borderTop: `1px solid ${theme.palette.divider}`,
        pt: 7,
        pb: 4,
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 3, md: 6 } }}>

        {/* Columnas principales */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.2fr 2fr 1.5fr' },
            gap: { xs: 4, md: 6 },
            mb: 6,
          }}
        >
          {/* Accesos rápidos */}
          <Box>
            <Typography sx={colLabelStyle}>Accesos rápidos</Typography>
            <Stack spacing={1.2}>
              {[
                { label: 'Nosotros', href: '/nosotros' },
                { label: 'Cómo funciona', href: '/como-funciona' },
                { label: 'Proyectos', href: '/proyectos' },
                { label: 'Políticas y privacidad', href: '/privacidad' },
                { label: 'Preguntas', href: '/preguntas' },
                { label: 'Mapa del sitio', href: '/mapa-sitio' },
              ].map(({ label, href }) => (
                <Link key={href} href={href} sx={linkStyle}>{label}</Link>
              ))}
            </Stack>
          </Box>

          {/* Sobre nosotros */}
          <Box>
            <Typography sx={colLabelStyle}>Sobre nosotros</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.75, textAlign: 'justify' }}>
              Loteplan es una plataforma fiduciaria colaborativa que facilita el acceso
              progresivo a lotes y oportunidades de inversión respaldadas por activos
              inmobiliarios reales.
            </Typography>
          </Box>

          {/* Contacto */}
          <Box>
            <Typography sx={colLabelStyle}>Contacto</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.65, textAlign: 'justify' }}>
              Loteplan es el nombre comercial de Nectarea Sociedad Anónima de Ahorro para
              fines determinados. Inscripta en el Registro Público con la Matrícula 34.417 P
            </Typography>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  +54 9 261 717-1142
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Link href="mailto:nectarea@loteplan.com" sx={linkStyle}>
                  nectarea@loteplan.com
                </Link>
              </Stack>
            </Stack>
          </Box>
        </Box>

        <Divider sx={{ mb: 3.5 }} />

        {/* Branding y copyright */}
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="center" sx={{ mb: 2.5 }}>

          <Box
            component="img"
            src="/navbar/nav.png"
            alt="Loteplan"
            sx={{ height: 28, opacity: 0.65 }}
          />
          <Typography variant="caption" color="text.secondary">
            © {currentYear} Nectarea S.A. Todos los derechos reservados.
          </Typography>
        </Stack>
      </Container>
      {/* Disclaimer legal */}
      <Box sx={{ px: { xs: 6, md: 6 }, mt: 1 }}>
        <Typography
          variant="caption"
          color="text.disabled"

          sx={{ display: 'block', lineHeight: 1.5, textAlign: 'justify' }}
        >
          Loteplan no otorga créditos ni garantiza la adjudicación de programas públicos.
          La administración de los fondos se realiza a través de un fideicomiso de administración,
          en el cual cada adherente efectúa sus aportes directamente en la cuenta bancaria del
          fideicomiso. El fideicomiso no constituye un fideicomiso financiero en los términos de
          la Ley de Mercado de Capitales N° 26.831, ni un fondo de inversión regulado por la CNV.
          Las oportunidades en los proyectos ofrecidos no son consideradas títulos, valores
          negociables o contratos de inversión en los términos de dicha ley. Toda participación
          en proyectos inmobiliarios implica riesgos propios de la actividad y debe evaluarse
          junto con la documentación contractual correspondiente.
        </Typography>
      </Box>

    </Box>
  );
};

export default Footer;