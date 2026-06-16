// src/layouts/shared/Footer.tsx

import { Email, Phone } from '@mui/icons-material';
import {
  Box, Container, Divider, Link, Stack, Typography, useTheme
} from '@mui/material';
import React from 'react';

const Footer: React.FC = () => {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  // Títulos de columnas: Inter SemiBold, 18px, Peso 600, Letras Mayúsculas
  const colLabelStyle = {
    fontSize: '18px',
    fontWeight: 600,
    fontFamily: 'Inter, sans-serif',
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    color: 'primary.main', // Color principal
    mb: '24px', // Título -> Primer elemento
  };

  // Links de navegación: Inter Regular, 18px, Peso 400
  const linkStyle = {
    color: 'text.secondary',
    textDecoration: 'none',
    fontSize: '18px',
    fontFamily: 'Inter, sans-serif',
    fontWeight: 400,
    display: 'block',
    mb: '16px', // Entre links
    transition: 'color 0.15s',
    '&:hover': { color: 'text.primary' },
  };

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'background.paper',
        borderTop: `1px solid ${theme.palette.divider}`,
        pt: '120px', // Espaciado superior del bloque
        pb: '60px',  // Margen inferior disclaimer
      }}
    >
      <Container maxWidth={false} sx={{ maxWidth: '1200px', px: 3 }}>

        {/* Columnas principales */}
        <Box
          sx={{
            display: 'grid',
            // Distribución: ~22%, ~38%, ~30% con gaps específicos
            gridTemplateColumns: { md: '0.22fr 0.38fr 0.30fr' },
            columnGap: { md: '100px' }, // Separación columnas 2 y 3: 100px
            mb: '80px',
          }}
        >
          {/* Accesos rápidos */}
          <Box>
            <Typography sx={colLabelStyle}>Accesos rápidos</Typography>
            <Box>
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
            </Box>
          </Box>

          {/* Sobre nosotros */}
          <Box sx={{ maxWidth: '450px' }}>
            <Typography sx={colLabelStyle}>Sobre nosotros</Typography>
            <Typography 
              sx={{ 
                fontSize: '18px', 
                lineHeight: 1.8, // 180%
                color: 'text.secondary',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              Loteplan es una plataforma fiduciaria colaborativa que facilita el acceso
              progresivo a lotes y oportunidades de inversión respaldadas por activos
              inmobiliarios reales.
            </Typography>
          </Box>

          {/* Contacto */}
          <Box>
            <Typography sx={colLabelStyle}>Contacto</Typography>
            <Typography 
              sx={{ 
                mb: '20px', 
                fontSize: '18px', 
                lineHeight: 1.8, 
                color: 'text.secondary',
                fontFamily: 'Inter, sans-serif' 
              }}
            >
              Loteplan es el nombre comercial de Nectarea Sociedad Anónima de Ahorro para
              fines determinados. Inscripta en el Registro Público con la Matrícula 34.417 P
            </Typography>
            <Stack spacing="20px">
              <Stack direction="row" spacing="16px" alignItems="center">
                <Phone sx={{ fontSize: 20, color: 'text.secondary' }} />
                <Typography sx={{ fontSize: '18px', color: 'text.secondary' }}>+54 9 261 717-1142</Typography>
              </Stack>
              <Stack direction="row" spacing="16px" alignItems="center">
                <Email sx={{ fontSize: 20, color: 'text.secondary' }} />
                <Link href="mailto:nectarea@loteplan.com" sx={{ ...linkStyle, mb: 0 }}>
                  nectarea@loteplan.com
                </Link>
              </Stack>
            </Stack>
          </Box>
        </Box>

        <Divider sx={{ mb: '40px' }} /> {/* Separador línea -> logo: 40px */}

        {/* Branding y copyright */}
        <Stack alignItems="center" sx={{ mb: '50px' }}> {/* Copyright -> Disclaimer: 50px */}
          <Box
            component="img"
            src="/navbar/nav.png"
            alt="Loteplan"
            sx={{ height: 50, opacity: 0.65, mb: '20px' }} // Logo 45-50px
          />
          <Typography sx={{ fontSize: '16px', color: 'text.secondary' }}>
            © {currentYear} Nectarea S.A. Todos los derechos reservados.
          </Typography>
        </Stack>
      </Container>
      
      {/* Disclaimer legal */}
      <Container maxWidth={false} sx={{ maxWidth: '1200px', px: 3 }}>
        <Typography
          sx={{ 
            fontSize: '14px', 
            color: 'text.disabled',
            lineHeight: 1.7, 
            textAlign: 'justify',
            fontFamily: 'Inter, sans-serif'
          }}
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
      </Container>
    </Box>
  );
};

export default Footer;