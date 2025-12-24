// src/components/layout/Footer/Footer.tsx

import React from 'react';
import { Box, Container, Typography, Link, Stack, useTheme, alpha, Divider, IconButton } from '@mui/material';
import { Facebook, Instagram, LinkedIn } from '@mui/icons-material';

const Footer: React.FC = () => {
  const theme = useTheme();

  // Estilo común para los títulos de sección
  const sectionTitleStyle = {
    fontWeight: 700,
    mb: 2,
    color: 'text.primary',
    textTransform: 'uppercase',
    fontSize: '0.875rem',
    letterSpacing: 1
  };

  // Estilo para los enlaces
  const linkStyle = {
    color: 'text.secondary',
    fontWeight: 500,
    textDecoration: 'none',
    transition: 'color 0.2s',
    '&:hover': {
      color: 'primary.main',
      textDecoration: 'none'
    }
  };

  return (
    <Box 
      component="footer" 
      sx={{ 
        bgcolor: 'background.paper', // Usa el #ECECEC de tu tema
        pt: 8, 
        pb: 4, 
        mt: 'auto', // Empuja el footer al final si el contenido es corto
        borderTop: `1px solid ${theme.palette.divider}`
      }}
    >
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 5, md: 8 } }}>
          
          {/* 1. Logo y descripción */}
          <Box sx={{ flex: 1.5 }}>
            <Box 
              component="img"
              src="/navbar/nav.png" // Ruta corregida para public folder
              alt="Loteplan Logo"
              sx={{ height: 40, mb: 2, display: 'block' }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, lineHeight: 1.6 }}>
              La plataforma líder para comprar, financiar y gestionar lotes de inversión. Construye tu futuro con seguridad y confianza.
            </Typography>
            
            {/* Redes Sociales (Iconos) */}
            <Stack direction="row" spacing={1} mt={3}>
              <IconButton size="small" sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.1) } }}>
                <Facebook />
              </IconButton>
              <IconButton size="small" sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.1) } }}>
                <Instagram />
              </IconButton>
              <IconButton size="small" sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.1) } }}>
                <LinkedIn />
              </IconButton>
            </Stack>
          </Box>

          {/* 2. Enlaces de Empresa */}
          <Box sx={{ flex: 1 }}>
            <Typography sx={sectionTitleStyle} variant="subtitle2">
                Empresa
            </Typography>
            <Stack spacing={1.5}>
              <Link href="/nosotros" sx={linkStyle}>Nosotros</Link>
              <Link href="/proyectos" sx={linkStyle}>Proyectos</Link>
              <Link href="/blog" sx={linkStyle}>Blog</Link>
              <Link href="/preguntas" sx={linkStyle}>Preguntas Frecuentes</Link>
            </Stack>
          </Box>

          {/* 3. Enlaces de Ayuda */}
          <Box sx={{ flex: 1 }}>
            <Typography sx={sectionTitleStyle} variant="subtitle2">
                Legal & Ayuda
            </Typography>
            <Stack spacing={1.5}>
              <Link href="/contacto" sx={linkStyle}>Centro de Ayuda</Link>
              <Link href="/terminos" sx={linkStyle}>Términos y condiciones</Link>
              <Link href="/privacidad" sx={linkStyle}>Política de privacidad</Link>
              <Link href="/cookies" sx={linkStyle}>Política de Cookies</Link>
            </Stack>
          </Box>

          {/* 4. Newsletter o Contacto Rápido (Opcional) */}
          <Box sx={{ flex: 1 }}>
            <Typography sx={sectionTitleStyle} variant="subtitle2">
                Contacto
            </Typography>
            <Stack spacing={1.5}>
              <Typography variant="body2" color="text.secondary">info@loteplan.com</Typography>
              <Typography variant="body2" color="text.secondary">+54 11 1234-5678</Typography>
              <Typography variant="body2" color="text.secondary">Av. del Libertador 1000, BA</Typography>
            </Stack>
          </Box>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Copyright */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} LotePlan. Todos los derechos reservados.
          </Typography>
          <Typography variant="caption" color="text.disabled">
            v1.0.0
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;