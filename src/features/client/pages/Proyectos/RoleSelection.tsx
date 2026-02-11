// src/features/client/pages/Proyectos/ProyectosUnificados.tsx

import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// Material UI
import {
  alpha, Avatar, Box, Button,
  Container, Divider,
  Fade, Paper, Stack, Typography, useTheme
} from "@mui/material";

// Iconos
import { Business, FilterListOff, Home as HomeIcon, Savings, TrendingUp } from "@mui/icons-material";

// Servicios
import proyectoService from "@/core/api/services/proyecto.service";

// Componentes
import { ROUTES } from '@/routes';
import { QueryHandler } from "../../../../shared/components/data-grid/QueryHandler/QueryHandler";
import { ProjectCard } from "./components/ProjectCard";

// --- Highlights Section ---
const HighlightsSection: React.FC<{ perfil: string }> = ({ perfil }) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4, mb: 5, borderRadius: 2,
        bgcolor: 'background.paper',
        border: `1px solid ${theme.palette.divider}`
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={{ xs: 4, md: 8 }}
        justifyContent="center"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />}
      >
        {perfil === 'ahorrista' ? (
          <>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'success.light', color: 'success.main', width: 48, height: 48 }}>
                <Savings />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={700} color="text.primary">Cuotas Fijas</Typography>
                <Typography variant="body2" color="text.secondary">En pesos sin interés</Typography>
              </Box>
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.main', width: 48, height: 48 }}>
                <HomeIcon />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={700} color="text.primary">Tu Casa Propia</Typography>
                <Typography variant="body2" color="text.secondary">Adjudicación pactada</Typography>
              </Box>
            </Box>
          </>
        ) : (
          <>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'info.light', color: 'info.main', width: 48, height: 48 }}>
                <TrendingUp />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={700} color="text.primary">Alta Rentabilidad</Typography>
                <Typography variant="body2" color="text.secondary">Retornos en USD</Typography>
              </Box>
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 48, height: 48 }}>
                <Business />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={700} color="text.primary">Respaldo Real</Typography>
                <Typography variant="body2" color="text.secondary">Activos tangibles</Typography>
              </Box>
            </Box>
          </>
        )}
      </Stack>
    </Paper>
  );
};

const ProyectosUnificados: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  // Estados
  const [perfilSeleccionado, setPerfilSeleccionado] = useState<'ahorrista' | 'inversionista'>('ahorrista');
  const [itemsVisibles, setItemsVisibles] = useState(9);
  const [filtros, setFiltros] = useState({ search: '', status: 'todos' });

  // Queries
  const { data: proyectosInv, isLoading: loadingInv } = useQuery({
    queryKey: ['proyectosInversionista'],
    queryFn: async () => (await proyectoService.getInversionistasActive()).data,
    staleTime: 600000, // 10 minutos
  });

  const { data: proyectosAho, isLoading: loadingAho } = useQuery({
    queryKey: ['proyectosAhorrista'],
    queryFn: async () => (await proyectoService.getAhorristasActive()).data,
    staleTime: 600000, // 10 minutos
  });

  const isLoading = loadingInv || loadingAho;

  // Lógica de Filtrado Memoizada
const proyectosFiltrados = useMemo(() => {
    const baseProyectos = perfilSeleccionado === 'inversionista' ? (proyectosInv || []) : (proyectosAho || []);
    const searchTerm = filtros.search.toLowerCase().trim();

    return baseProyectos.filter(p => {
        const matchSearch = !searchTerm || (p.nombre_proyecto || '').toLowerCase().includes(searchTerm);
        const matchStatus = filtros.status === 'todos' || p.estado_proyecto === filtros.status;
        
        // ✅ MEJORA: Filtro de seguridad adicional para asegurar que el perfil 
        // coincida con el tipo_inversion real que viene del back
        const matchTipo = perfilSeleccionado === 'inversionista' 
            ? p.tipo_inversion === 'directo' 
            : p.tipo_inversion === 'mensual';

        return matchSearch && matchStatus && matchTipo;
    });
}, [proyectosInv, proyectosAho, perfilSeleccionado, filtros]);

  const proyectosVisibles = useMemo(() => proyectosFiltrados.slice(0, itemsVisibles), [proyectosFiltrados, itemsVisibles]);
  const hayMasProyectos = proyectosFiltrados.length > itemsVisibles;

  // Handlers
  const handleProjectClick = (projectId: number | string) => {
    navigate(ROUTES.PROYECTOS.DETALLE.replace(':id', String(projectId)));
  };

  const handleCambioPerfil = (nuevoPerfil: 'ahorrista' | 'inversionista') => {
    setPerfilSeleccionado(nuevoPerfil);
    setItemsVisibles(9);
    setFiltros({ search: '', status: 'todos' });
  };

  // Styles Helpers
  const getButtonStyle = (isActive: boolean) => ({
    borderRadius: 8,
    py: 1.5,
    textTransform: 'none' as const,
    fontSize: '1rem',
    fontWeight: 700,
    transition: 'all 0.3s ease',
    ...(isActive ? {
      bgcolor: 'primary.main',
      color: 'white',
      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
      border: `1px solid ${theme.palette.primary.dark}`,
      '&:hover': { bgcolor: 'primary.dark' }
    } : {
      color: 'text.primary',
      '&:hover': { bgcolor: alpha(theme.palette.common.black, 0.04) }
    })
  });

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>

      {/* 1. HERO HEADER */}
      <Box sx={{
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        color: 'primary.contrastText',
        py: { xs: 10, md: 12 },
        textAlign: 'center',
        borderBottomLeftRadius: { xs: 24, md: 48 },
        borderBottomRightRadius: { xs: 24, md: 48 },
        boxShadow: `0 10px 30px ${alpha(theme.palette.primary.dark, 0.3)}`,
        mb: 0
      }}>
        <Container maxWidth="lg">
          <Typography variant="h1" gutterBottom sx={{ color: 'white' }}>
            Explora Oportunidades
          </Typography>
          <Typography variant="h6" sx={{ maxWidth: 'md', mx: 'auto', opacity: 0.9, fontWeight: 400, lineHeight: 1.7 }}>
            Encuentra el proyecto ideal para hacer crecer tu capital o asegurar tu futuro lote.
          </Typography>
        </Container>
      </Box>

      {/* 2. SELECTOR DE PERFIL */}
      <Container maxWidth="md" sx={{ mt: -5, mb: 8, position: 'relative', zIndex: 10 }}>
        <Paper elevation={0} sx={{
          p: 0.6, borderRadius: 10, display: 'flex',
          bgcolor: '#F2F2F2', border: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.shadows[3]
        }}>
          <Button
            onClick={() => handleCambioPerfil('ahorrista')}
            fullWidth
            startIcon={<HomeIcon fontSize="medium" />}
            sx={getButtonStyle(perfilSeleccionado === 'ahorrista')}
          >
            Modo Ahorrista
          </Button>
          <Button
            onClick={() => handleCambioPerfil('inversionista')}
            fullWidth
            startIcon={<TrendingUp fontSize="medium" />}
            sx={getButtonStyle(perfilSeleccionado === 'inversionista')}
          >
            Modo Inversionista
          </Button>
        </Paper>
      </Container>

      <Container maxWidth="xl" sx={{ pb: 14 }}>
        <Stack spacing={2} mb={7} alignItems="center">
          <HighlightsSection perfil={perfilSeleccionado} />
        </Stack>

        {/* 3. FILTROS */}



        {/* 4. GRID DE RESULTADOS */}
        <QueryHandler
          isLoading={isLoading}
          error={null}
          loadingMessage="Buscando las mejores oportunidades..."
          fullHeight
          useSkeleton
          skeletonCount={9}
        >
          <>
            {proyectosFiltrados.length === 0 ? (
              <Box textAlign="center" py={10} bgcolor="secondary.light" borderRadius={2} border={`1px dashed ${theme.palette.divider}`}>
                <FilterListOff sx={{ fontSize: 60, color: 'text.disabled', mb: 3 }} />
                <Typography variant="h5" color="text.secondary" fontWeight={500}>
                  No se encontraron proyectos con estos filtros.
                </Typography>
                <Button variant="text" color="primary" onClick={() => setFiltros({ search: '', status: 'todos' })} sx={{ mt: 3, fontWeight: 600 }}>
                  Limpiar filtros
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }, gap: 4, width: "100%" }}>
                {proyectosVisibles.map((project, index) => (
                  <Fade in key={project.id} timeout={500} style={{ transitionDelay: `${index * 50}ms` }}>
                    <Box>
                      <ProjectCard project={project} onClick={() => handleProjectClick(project.id)} />
                    </Box>
                  </Fade>
                ))}
              </Box>
            )}

            {hayMasProyectos && (
              <Box textAlign="center" py={8}>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => setItemsVisibles(prev => prev + 9)}
                  sx={{ px: 6, borderRadius: 2, borderWidth: 2, fontWeight: 700, '&:hover': { borderWidth: 2 } }}
                >
                  Cargar más proyectos
                </Button>
              </Box>
            )}
          </>
        </QueryHandler>
      </Container>
    </Box>
  );
};

export default ProyectosUnificados;