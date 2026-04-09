// src/features/client/pages/Proyectos/ProyectosUnificados.tsx

import { useQuery } from '@tanstack/react-query';
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// Material UI
import GavelIcon from '@mui/icons-material/Gavel';
import {
  Alert,
  AlertTitle,
  alpha, Avatar, Box, Button,
  Container, Divider,
  Fade, Paper, Stack, Typography, useTheme
} from "@mui/material";
// Iconos
import { Business, FilterListOff, Home as HomeIcon, Savings, TrendingUp, Visibility } from "@mui/icons-material";

// Servicios & Config
import InversionService from "@/core/api/services/inversion.service";
import proyectoService from "@/core/api/services/proyecto.service";
import SuscripcionService from "@/core/api/services/suscripcion.service";
import { env } from '@/core/config/env';

// Componentes
import PujaService from '@/core/api/services/puja.service';
import { useAuth } from '@/core/context';
import theme from '@/core/theme/globalStyles';
import type { ProyectoDto } from '@/core/types/proyecto.dto';
import { ROUTES } from '@/routes';
import { QueryHandler } from "../../../../shared/components/data-grid/QueryHandler";
import { ProjectCard } from "./components/ProjectCard";

// ===================================================
// 1. 🧠 CUSTOM HOOK: Lógica y Datos
// ===================================================

const useProyectosData = () => {
  const [perfilSeleccionado, setPerfilSeleccionado] = useState<'ahorrista' | 'inversionista'>('ahorrista');
  const [itemsVisibles, setItemsVisibles] = useState(env.defaultPageSize);
  const [filtros] = useState({ search: '', status: 'todos' });
  const { isAuthenticated } = useAuth();
  // Recuperar perfil guardado
  useEffect(() => {
    const savedPerfil = sessionStorage.getItem('proyectosPerfil');
    if (savedPerfil === 'ahorrista' || savedPerfil === 'inversionista') {
      setPerfilSeleccionado(savedPerfil);
    }
  }, []);

  // --- QUERIES DE PROYECTOS ---
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

  // --- QUERIES DE USUARIO (Tus nuevas adiciones) ---
  const { data: misSuscripciones, isLoading: loadingSusc } = useQuery({
    queryKey: ['misSuscripciones'],
    queryFn: async () => (await SuscripcionService.getMisSuscripciones()).data,
    staleTime: env.queryStaleTime,
    enabled: isAuthenticated,
  });
  const idsSuscritos = useMemo(() => {
    if (!isAuthenticated || !misSuscripciones) return new Set<number>();
    const rawData = (misSuscripciones as any).data || misSuscripciones;
    const dataArray = Array.isArray(rawData) ? rawData : [];
    return new Set(dataArray.map((s: any) => Number(s.id_proyecto)));
  }, [isAuthenticated, misSuscripciones]);

  const { data: misInversiones, isLoading: loadingInvUsr } = useQuery({
    queryKey: ['misInversiones'],
    queryFn: async () => (await InversionService.getMisInversiones()).data,
    staleTime: env.queryStaleTime,
    enabled: isAuthenticated,
  });
  // ✅ NUEVO: Traemos el historial de pujas del usuario
  const { data: misPujas, isLoading: loadingPujas } = useQuery({
    queryKey: ['misPujas'],
    queryFn: async () => (await PujaService.getMyPujas()).data,
    staleTime: env.queryStaleTime,
    enabled: isAuthenticated,
  });
  // El loading global ahora espera también por los datos del usuario
  const isLoading = loadingInv || loadingAho || loadingSusc || loadingInvUsr;
  // ✅ NUEVO: Detectar proyectos suscritos que tienen lotes en subasta activa
  const alertasSubasta = useMemo(() => {
    if (!misSuscripciones || perfilSeleccionado !== 'ahorrista') return [];

    const suscripcionesIds = new Set(misSuscripciones.map(s => s.id_proyecto));

    return (proyectosAho || []).filter(p => {
      const estaSuscrito = suscripcionesIds.has(p.id);
      const tieneSubastaActiva = p.lotes?.some(lote => lote.estado_subasta === 'activa');
      return estaSuscrito && tieneSubastaActiva;
    });
  }, [misSuscripciones, proyectosAho, perfilSeleccionado]);

  // --- FILTRADO Y ORDENAMIENTO MULTINIVEL ---
  const proyectosFiltrados = useMemo(() => {
    const base = perfilSeleccionado === 'inversionista' ? (proyectosInv || []) : (proyectosAho || []);

    const idsVinculados = new Set(
      perfilSeleccionado === 'inversionista'
        ? (misInversiones || []).map(i => i.id_proyecto)
        : (misSuscripciones || []).map(s => s.id_proyecto)
    );

    // Identificamos en qué proyectos el usuario ha ganado una puja
    const idsProyectosGanados = new Set(
      (misPujas || [])
        .filter(puja => puja.estado_puja.includes('ganadora'))
        .map(puja => puja.id_proyecto)
    );

    const filtrados = base.filter(p => {
      const search = filtros.search.toLowerCase();
      const matchSearch = !search || p.nombre_proyecto.toLowerCase().includes(search);
      const matchStatus = filtros.status === 'todos' || p.estado_proyecto === filtros.status;
      return matchSearch && matchStatus;
    });

    return [...filtrados].sort((a, b) => {
      // Sistema de pesos para el ordenamiento:
      // Peso 2: Proyectos donde el usuario ganó la subasta de un lote (Van primero siempre)
      // Peso 1: Proyectos donde el usuario está suscrito/invertido
      // Peso 0: Resto de los proyectos
      const getPeso = (id: number) => {
        if (idsProyectosGanados.has(id)) return 2;
        if (idsVinculados.has(id)) return 1;
        return 0;
      };

      return getPeso(b.id) - getPeso(a.id);
    });
  }, [proyectosInv, proyectosAho, perfilSeleccionado, filtros, misSuscripciones, misInversiones, misPujas]);

  const proyectosVisibles = useMemo(() =>
    proyectosFiltrados.slice(0, itemsVisibles),
    [proyectosFiltrados, itemsVisibles]);

  const handleCambioPerfil = useCallback((nuevo: 'ahorrista' | 'inversionista') => {
    setPerfilSeleccionado(nuevo);
    setItemsVisibles(env.defaultPageSize);
    sessionStorage.setItem('proyectosPerfil', nuevo);
  }, []);

  const loadMore = useCallback(() => {
    setItemsVisibles(v => v + env.defaultPageSize);
  }, []);

  return {
    perfilSeleccionado,
    isLoading,
    proyectosVisibles,
    idsSuscritos,
    hayMasProyectos: proyectosFiltrados.length > itemsVisibles,
    alertasSubasta, // Exportamos las alertas para dibujarlas en la UI
    handleCambioPerfil,
    loadMore
  };
};

// ===================================================
// 2. 🎨 COMPONENTES DE UI MODULARES (Presentacionales)
// ===================================================

const HeroSection = memo(() => {
  const theme = useTheme();
  return (
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
  );
});

const ProfileSelector = memo(({
  perfil,
  onChange
}: {
  perfil: 'ahorrista' | 'inversionista',
  onChange: (p: 'ahorrista' | 'inversionista') => void
}) => (
  <Container maxWidth="sm" sx={{ mt: -4, mb: 6 }}>
    <Paper elevation={4} sx={{ p: 0.5, borderRadius: 10, display: 'flex', bgcolor: 'background.paper' }}>
      <Button
        fullWidth onClick={() => onChange('ahorrista')}
        variant={perfil === 'ahorrista' ? 'contained' : 'text'}
        sx={{ borderRadius: 10, py: 1.5, fontWeight: 700 }}
        startIcon={<HomeIcon />}
      >
        Modo Ahorrista
      </Button>
      <Button
        fullWidth onClick={() => onChange('inversionista')}
        variant={perfil === 'inversionista' ? 'contained' : 'text'}
        sx={{ borderRadius: 10, py: 1.5, fontWeight: 700 }}
        startIcon={<TrendingUp />}
      >
        Modo Inversionista
      </Button>
    </Paper>
  </Container>
));

const HighlightsSection = memo(({ perfil }: { perfil: string }) => {
  const theme = useTheme();
  const isAhorrista = perfil === 'ahorrista';

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2, mb: 3, borderRadius: 3,
        bgcolor: 'background.paper',
        border: `1px solid ${theme.palette.divider}`,
        width: 'fit-content',
        mx: 'auto'
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
            <Typography variant="body2" color="text.secondary">{isAhorrista ? 'En pesos sin interés' : ''}</Typography>
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

const EmptyState = memo(() => (
  <Box textAlign="center" py={10}>
    <FilterListOff sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
    <Typography variant="h5" color="text.secondary">No hay proyectos disponibles en esta categoría.</Typography>
  </Box>
));

const AuctionAlerts = memo(({ proyectosConSubasta }: { proyectosConSubasta: ProyectoDto[] }) => {
  const navigate = useNavigate();

  if (!proyectosConSubasta || proyectosConSubasta.length === 0) return null;

  return (
    <Stack spacing={2} sx={{ mb: 5 }}>
      {proyectosConSubasta.map((proyecto) => (
        <Fade in key={`alert-${proyecto.id}`}>
          <Alert
            severity="info"
            // Cambiamos el icono para que use tu color primario naranja/tierra
            icon={<GavelIcon sx={{ color: theme.palette.primary.main, width: 28, height: 28 }} />}
            action={
              <Button
                variant="contained"
                color="primary" // Usará tu #CC6333
                size="small"
                startIcon={<Visibility />}
                onClick={() => navigate(ROUTES.PROYECTOS.DETALLE.replace(':id', String(proyecto.id)))}
                sx={{
                  fontWeight: 700,
                  px: 2,
                  // Forzamos el border radius definido en tu theme (8px)
                  borderRadius: '8px',
                  textTransform: 'none',
                  whiteSpace: 'nowrap'
                }}
              >
                Ver Subasta
              </Button>
            }
            sx={{
              borderRadius: '12px',
              border: '1px solid',
              borderColor: alpha(theme.palette.success.main, 0.3),
              bgcolor: alpha(theme.palette.success.main, 0.3),
              alignItems: 'center',
              padding: '12px 20px',
              '& .MuiAlert-message': { width: '100%' }
            }}
          >
            <AlertTitle sx={{ typography: 'h6', fontWeight: 800, color: theme.palette.text.primary, mb: 0 }}>
              ¡Subasta activa en{' '}
              <Box component="span" sx={{ color: theme.palette.primary.main }}>
                {proyecto.nombre_proyecto}
              </Box>!
            </AlertTitle>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              Tenes una suscripción en <strong>{proyecto.nombre_proyecto}</strong> y actualmente hay lotes en subasta. ¡Aprovecha y utiliza tus tokens!
            </Typography>
          </Alert>
        </Fade>
      ))}
    </Stack>
  );
});
// ===================================================
// 3. 🏗️ COMPONENTE PRINCIPAL (Orquestador)
// ===================================================

const ProyectosUnificados: React.FC = () => {
  const navigate = useNavigate();

  // Obtenemos todo del Custom Hook
  const {
    perfilSeleccionado,
    isLoading,
    proyectosVisibles,
    hayMasProyectos,
    idsSuscritos,
    alertasSubasta,
    handleCambioPerfil,
    loadMore
  } = useProyectosData();

  // Navegación
  const handleProjectClick = useCallback((id: number | string) => {
    navigate(ROUTES.PROYECTOS.DETALLE.replace(':id', String(id)));
  }, [navigate]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>

      <HeroSection />

      <ProfileSelector
        perfil={perfilSeleccionado}
        onChange={handleCambioPerfil}
      />

      <Container maxWidth="xl">
        <HighlightsSection perfil={perfilSeleccionado} />
        <AuctionAlerts proyectosConSubasta={alertasSubasta} />
        <QueryHandler isLoading={isLoading} error={null} useSkeleton skeletonCount={6}>
          {proyectosVisibles.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* Grilla de Proyectos */}
              <Box sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
                gap: 4
              }}>
                {proyectosVisibles.map((project: ProyectoDto) => (
                  <Fade in key={project.id} timeout={400}>
                    <Box>
                      <ProjectCard project={project} onClick={() => handleProjectClick(project.id)} estaSuscrito={idsSuscritos.has(project.id)} />
                    </Box>
                  </Fade>
                ))}
              </Box>

              {/* Botón Cargar Más */}
              {hayMasProyectos && (
                <Box textAlign="center" mt={8}>
                  <Button
                    variant="outlined" size="large"
                    onClick={loadMore}
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