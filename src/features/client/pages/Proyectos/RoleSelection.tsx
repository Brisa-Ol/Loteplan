// src/features/client/pages/Proyectos/ProyectosUnificados.tsx

import { useQuery } from '@tanstack/react-query';
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
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
import { env } from '@/core/config/env';

// Componentes
import { ROUTES } from '@/routes';
import { QueryHandler } from "../../../../shared/components/data-grid/QueryHandler";
import { ProjectCard } from "./components/ProjectCard";

// ===================================================
// 🚀 COMPONENTES MEMOIZADOS
// ===================================================

const MemoizedProjectCard = memo(ProjectCard);

const HighlightsSection = memo(({ perfil }: { perfil: string }) => {
  const theme = useTheme();
  const isAhorrista = perfil === 'ahorrista';

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4, mb: 5, borderRadius: 3,
        bgcolor: 'background.paper',
        border: `1px solid ${theme.palette.divider}`,
        width: '100%'
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={{ xs: 4, md: 8 }}
        justifyContent="center"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ bgcolor: isAhorrista ? 'success.light' : 'info.light', color: isAhorrista ? 'success.main' : 'info.main', width: 48, height: 48 }}>
            {isAhorrista ? <Savings /> : <TrendingUp />}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>{isAhorrista ? 'Cuotas Fijas' : 'Alta Rentabilidad'}</Typography>
            <Typography variant="body2" color="text.secondary">{isAhorrista ? 'En pesos sin interés' : 'Retornos en USD'}</Typography>
          </Box>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ bgcolor: isAhorrista ? 'warning.light' : alpha(theme.palette.primary.main, 0.1), color: isAhorrista ? 'warning.main' : 'primary.main', width: 48, height: 48 }}>
            {isAhorrista ? <HomeIcon /> : <Business />}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>{isAhorrista ? 'Tu Casa Propia' : 'Respaldo Real'}</Typography>
            <Typography variant="body2" color="text.secondary">{isAhorrista ? 'Adjudicación pactada' : 'Activos tangibles'}</Typography>
          </Box>
        </Box>
      </Stack>
    </Paper>
  );
});

// ===================================================
// COMPONENTE PRINCIPAL
// ===================================================

const ProyectosUnificados: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  // ✅ Estado inicial
  const [perfilSeleccionado, setPerfilSeleccionado] = useState<'ahorrista' | 'inversionista'>('ahorrista');
  const [itemsVisibles, setItemsVisibles] = useState(env.defaultPageSize);
  const [filtros] = useState({ search: '', status: 'todos' });

  // ✅ NUEVO: Recuperar el perfil guardado al montar el componente (al volver atrás)
  useEffect(() => {
    const savedPerfil = sessionStorage.getItem('proyectosPerfil');
    if (savedPerfil === 'ahorrista' || savedPerfil === 'inversionista') {
      setPerfilSeleccionado(savedPerfil);
    }
  }, []);

  const { data: proyectosInv, isLoading: loadingInv } = useQuery({
    queryKey: ['proyectosInversionista'],
    queryFn: async () => (await proyectoService.getInversionistasActive()).data,
    staleTime: env.queryStaleTime,
  });

  const { data: proyectosAho, isLoading: loadingAho } = useQuery({
    queryKey: ['proyectosAhorrista'],
    queryFn: async () => (await proyectoService.getAhorristasActive()).data,
    staleTime: env.queryStaleTime,
  });

  const isLoading = loadingInv || loadingAho;

  const proyectosFiltrados = useMemo(() => {
    const base = perfilSeleccionado === 'inversionista' ? (proyectosInv || []) : (proyectosAho || []);
    if (filtros.status === 'todos' && !filtros.search) return base;

    const search = filtros.search.toLowerCase();
    return base.filter(p => {
      const matchSearch = !search || p.nombre_proyecto.toLowerCase().includes(search);
      const matchStatus = filtros.status === 'todos' || p.estado_proyecto === filtros.status;
      return matchSearch && matchStatus;
    });
  }, [proyectosInv, proyectosAho, perfilSeleccionado, filtros]);

  const proyectosVisibles = useMemo(() =>
    proyectosFiltrados.slice(0, itemsVisibles),
    [proyectosFiltrados, itemsVisibles]);

  const handleProjectClick = useCallback((id: number | string) => {
    navigate(ROUTES.PROYECTOS.DETALLE.replace(':id', String(id)));
  }, [navigate]);

  // ✅ NUEVO: Guardar en sessionStorage cuando se cambia el perfil
  const handleCambioPerfil = useCallback((nuevo: 'ahorrista' | 'inversionista') => {
    setPerfilSeleccionado(nuevo);
    setItemsVisibles(env.defaultPageSize);
    sessionStorage.setItem('proyectosPerfil', nuevo);
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>

      {/* HERO SECTION */}
      <Box sx={{
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        color: 'white', py: { xs: 8, md: 10 }, textAlign: 'center',
        borderBottomLeftRadius: { xs: 32, md: 64 }, borderBottomRightRadius: { xs: 32, md: 64 },
        boxShadow: theme.shadows[4]
      }}>
        <Container maxWidth="md">
          <Typography variant="h2" fontWeight={900} gutterBottom>Explora Oportunidades</Typography>
          <Typography variant="h6" sx={{ opacity: 0.8, fontWeight: 400 }}>
            Invierte en activos reales y asegura tu futuro financiero con Loteplan.
          </Typography>
        </Container>
      </Box>

      {/* SELECTOR DE PERFIL */}
      <Container maxWidth="sm" sx={{ mt: -4, mb: 6 }}>
        <Paper elevation={4} sx={{ p: 0.5, borderRadius: 10, display: 'flex', bgcolor: 'background.paper' }}>
          <Button
            fullWidth onClick={() => handleCambioPerfil('ahorrista')}
            variant={perfilSeleccionado === 'ahorrista' ? 'contained' : 'text'}
            sx={{ borderRadius: 10, py: 1.5, fontWeight: 700 }}
            startIcon={<HomeIcon />}
          >
            Modo Ahorrista
          </Button>
          <Button
            fullWidth onClick={() => handleCambioPerfil('inversionista')}
            variant={perfilSeleccionado === 'inversionista' ? 'contained' : 'text'}
            sx={{ borderRadius: 10, py: 1.5, fontWeight: 700 }}
            startIcon={<TrendingUp />}
          >
            Modo Inversionista
          </Button>
        </Paper>
      </Container>

      <Container maxWidth="xl">
        <HighlightsSection perfil={perfilSeleccionado} />

        <QueryHandler isLoading={isLoading} error={null} useSkeleton skeletonCount={6}>
          {proyectosFiltrados.length === 0 ? (
            <Box textAlign="center" py={10}>
              <FilterListOff sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h5" color="text.secondary">No hay proyectos disponibles en esta categoría.</Typography>
            </Box>
          ) : (
            <>
              <Box sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
                gap: 4
              }}>
                {proyectosVisibles.map((project) => (
                  <Fade in key={project.id} timeout={400}>
                    <Box>
                      <MemoizedProjectCard project={project} onClick={() => handleProjectClick(project.id)} />
                    </Box>
                  </Fade>
                ))}
              </Box>

              {proyectosFiltrados.length > itemsVisibles && (
                <Box textAlign="center" mt={8}>
                  <Button
                    variant="outlined" size="large"
                    onClick={() => setItemsVisibles(v => v + env.defaultPageSize)}
                    sx={{ px: 8, py: 1.5, borderRadius: 3, borderWidth: 2, fontWeight: 800 }}
                  >
                    Ver más proyectos
                  </Button>
                </Box>
              )}
            </>
          )}
        </QueryHandler>
      </Container>
    </Box>
  );
};

export default ProyectosUnificados;