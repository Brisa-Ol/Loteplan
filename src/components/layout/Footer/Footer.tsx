import React from 'react';
import { Box, Container, Typography, Link, Stack } from '@mui/material';

const Footer: React.FC = () => {
  return (
    <Box component="footer" sx={{ bgcolor: 'background.paper', py: 6, mt: 8 }}>
      <Container maxWidth="lg">
        {/* Logo y descripción */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
          <Box sx={{ flex: 1 }}>
            <img
              src="public\navbar\nav.png"
              alt="Loteplan Logo"
              style={{ height: '40px', marginBottom: '10px' }}
            />
            <Typography variant="body2" color="text.secondary">
              Compra y financia lotes para construir tu futuro.
            </Typography>
          </Box>

          {/* Enlaces de Empresa */}
          <Stack spacing={1} sx={{ minWidth: 160 }}>
            <Typography variant="subtitle1">Empresa</Typography>
            <Link href="/nosotros" color="inherit" underline="hover">Nosotros</Link>
            <Link href="/proyectos" color="inherit" underline="hover">Proyectos</Link>
            <Link href="/preguntas" color="inherit" underline="hover">Preguntas</Link>
          </Stack>

          {/* Enlaces de Ayuda */}
          <Stack spacing={1} sx={{ minWidth: 160 }}>
            <Typography variant="subtitle1">Ayuda</Typography>
            <Link href="/contacto" color="inherit" underline="hover">Contacto</Link>
            <Link href="/terminos" color="inherit" underline="hover">Términos y condiciones</Link>
            <Link href="/privacidad" color="inherit" underline="hover">Política de privacidad</Link>
          </Stack>

          {/* Enlaces de Redes Sociales */}
          <Stack spacing={1} sx={{ minWidth: 160 }}>
            <Typography variant="subtitle1">Síguenos</Typography>
            <Link href="#" color="inherit" underline="hover">Facebook</Link>
            <Link href="#" color="inherit" underline="hover">Instagram</Link>
            <Link href="#" color="inherit" underline="hover">LinkedIn</Link>
          </Stack>
        </Box>

        {/* Copyright */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} LotePlan. Todos los derechos reservados.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
