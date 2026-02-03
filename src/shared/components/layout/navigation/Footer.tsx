// src/components/layout/Footer/Footer.tsx

import { Email, Facebook, Instagram, LinkedIn, LocationOn, Phone } from '@mui/icons-material';
import { alpha, Box, Container, Divider, IconButton, Link, Stack, Typography, useTheme } from '@mui/material';
import React from 'react';

const Footer: React.FC = () => {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  // Estilos reutilizables
  const sectionTitleStyle = {
    fontWeight: 700,
    mb: 2,
    color: 'text.primary',
    textTransform: 'uppercase',
    fontSize: '0.75rem', // Un poco más pequeño y elegante
    letterSpacing: 1.2
  };

  const linkStyle = {
    color: 'text.secondary',
    fontWeight: 500,
    textDecoration: 'none',
    fontSize: '0.9rem',
    transition: 'all 0.2s ease',
    display: 'inline-block',
    '&:hover': {
      color: 'primary.main',
      transform: 'translateX(4px)' // Pequeña animación al hover
    }
  };

  const socialButtonStyle = {
    color: 'text.secondary',
    transition: '0.2s',
    '&:hover': {
      color: 'primary.main',
      bgcolor: alpha(theme.palette.primary.main, 0.1),
      transform: 'translateY(-2px)'
    }
  };

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'background.paper',
        pt: { xs: 6, md: 8 },
        pb: 4,
        mt: 'auto',
        borderTop: `1px solid ${theme.palette.divider}`
      }}
    >
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 5, md: 4 } }}>

          {/* 1. Identidad de Marca */}
          <Box sx={{ flex: { xs: 1, md: 1.5 }, maxWidth: { md: 350 } }}>
            {/* Logo: Asegúrate de que la ruta sea correcta */}
            <Box
              component="img"
              src="/navbar/nav.png"
              alt="Loteplan Logo"
              sx={{ height: 36, mb: 2.5, objectFit: 'contain', objectPosition: 'left' }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mb: 3 }}>
              La plataforma líder para comprar, financiar y gestionar lotes de inversión. Construye tu futuro con seguridad y confianza.
            </Typography>

            {/* Redes Sociales */}
            <Stack direction="row" spacing={1}>
              <IconButton size="small" sx={socialButtonStyle} aria-label="Facebook">
                <Facebook fontSize="small" />
              </IconButton>
              <IconButton size="small" sx={socialButtonStyle} aria-label="Instagram">
                <Instagram fontSize="small" />
              </IconButton>
              <IconButton size="small" sx={socialButtonStyle} aria-label="LinkedIn">
                <LinkedIn fontSize="small" />
              </IconButton>
            </Stack>
          </Box>

          {/* 2. Enlaces - Empresa */}
          <Box sx={{ flex: 1 }}>
            <Typography sx={sectionTitleStyle} component="h6">Empresa</Typography>
            <Stack spacing={1.2}>
              <Link href="/nosotros" sx={linkStyle}>Nosotros</Link>
              <Link href="/proyectos" sx={linkStyle}>Proyectos</Link>
              <Link href="/como-funciona" sx={linkStyle}>Como Funciona</Link>
              <Link href="/preguntas" sx={linkStyle}>Preguntas Frecuentes</Link>
            </Stack>
          </Box>

          {/* 3. Enlaces - Legal */}
          <Box sx={{ flex: 1 }}>
            <Typography sx={sectionTitleStyle} component="h6">Legal & Ayuda</Typography>
            <Stack spacing={1.2}>
              <Link href="/contacto" sx={linkStyle}>Centro de Ayuda</Link>
              <Link href="/terminos" sx={linkStyle}>Términos y Condiciones</Link>
              <Link href="/privacidad" sx={linkStyle}>Política de Privacidad</Link>
              <Link href="/cookies" sx={linkStyle}>Política de Cookies</Link>
            </Stack>
          </Box>

          {/* 4. Contacto con Iconos */}
          <Box sx={{ flex: 1 }}>
            <Typography sx={sectionTitleStyle} component="h6">Contacto</Typography>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Email fontSize="small" color="action" sx={{ fontSize: 18 }} />
                <Link href="mailto:info@loteplan.com" sx={{ ...linkStyle, '&:hover': { color: 'primary.main', transform: 'none' } }}>
                  info@loteplan.com
                </Link>
              </Stack>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Phone fontSize="small" color="action" sx={{ fontSize: 18 }} />
                <Typography variant="body2" color="text.secondary">+54 11 1234-5678</Typography>
              </Stack>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <LocationOn fontSize="small" color="action" sx={{ fontSize: 18, mt: 0.3 }} />
                <Typography variant="body2" color="text.secondary">Av. del Libertador 1000,<br />Buenos Aires, Argentina</Typography>
              </Stack>
            </Stack>
          </Box>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Footer Bottom */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            © {currentYear} LotePlan S.A. Todos los derechos reservados.
          </Typography>
          <Stack direction="row" spacing={3}>
            {/* Enlaces legales rápidos (opcional) */}
            <Link href="#" variant="caption" color="text.disabled" underline="hover">Mapa del sitio</Link>
            <Typography variant="caption" color="text.disabled">v1.0.0</Typography>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;