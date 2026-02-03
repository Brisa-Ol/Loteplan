import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// Material UI
import {
  alpha,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Fade,
  Paper, Stack, Typography,
  useTheme
} from "@mui/material";

// Iconos
import { Business, FilterListOff, Home as HomeIcon, Savings, TrendingUp } from "@mui/icons-material";

// Servicios y Hooks
import proyectoService from "@/core/api/services/proyecto.service";
import { useAuth } from "@/core/context/AuthContext";

// Componentes
import { QueryHandler } from "../../../../shared/components/data-grid/QueryHandler/QueryHandler";
import { ProjectCard } from "./components/ProjectCard";
import { ProjectFilters } from "./components/ProjectFilters";

// --- Highlights Section ---
const HighlightsSection: React.FC<{ perfil: string }> = ({ perfil }) => (
  <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 4, md: 8 }} justifyContent="center" alignItems={{ xs: 'flex-start', md: 'center' }} divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />}>
      {perfil === 'ahorrista' ? (
        <>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'success.light', color: 'success.dark' }}><Savings /></Avatar>
            <Box><Typography variant="subtitle1" fontWeight={700}>Cuotas Fijas</Typography><Typography variant="body2" color="text.secondary">En pesos sin interés</Typography></Box>
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.dark' }}><HomeIcon /></Avatar>
            <Box><Typography variant="subtitle1" fontWeight={700}>Tu Casa Propia</Typography><Typography variant="body2" color="text.secondary">Adjudicación pactada</Typography></Box>
          </Box>
        </>
      ) : (
        <>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.dark' }}><TrendingUp /></Avatar>
            <Box><Typography variant="subtitle1" fontWeight={700}>Alta Rentabilidad</Typography><Typography variant="body2" color="text.secondary">Retornos en USD</Typography></Box>
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'info.light', color: 'info.dark' }}><Business /></Avatar>
            <Box><Typography variant="subtitle1" fontWeight={700}>Respaldo Real</Typography><Typography variant="body2" color="text.secondary">Activos tangibles</Typography></Box>
          </Box>
        </>
      )}
    </Stack>
  </Paper>
);

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
const ProyectosUnificados: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { isAuthenticated } = useAuth();

  // Estados
  const [perfilSeleccionado, setPerfilSeleccionado] = useState<'ahorrista' | 'inversionista'>('ahorrista');
  const [itemsVisibles, setItemsVisibles] = useState(9);

  // Estado de Filtros
  const [filtros, setFiltros] = useState({
    search: '',
    status: 'todos'
  });

  // ✅ MEJORA 1: Caché más agresivo (de 5 a 10 minutos)
  const { data: proyectosInv, isLoading: loadingInv } = useQuery({
    queryKey: ['proyectosInversionista'],
    queryFn: async () => (await proyectoService.getInversionistasActive()).data,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const { data: proyectosAho, isLoading: loadingAho } = useQuery({
    queryKey: ['proyectosAhorrista'],
    queryFn: async () => (await proyectoService.getAhorristasActive()).data,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const isLoading = loadingInv || loadingAho;

  // Lógica de Filtrado
  const proyectosFiltrados = useMemo(() => {
    let baseProyectos = perfilSeleccionado === 'inversionista'
      ? (proyectosInv || [])
      : (proyectosAho || []);

    return baseProyectos.filter(p => {
      const searchTerm = filtros.search.toLowerCase().trim();

      const matchSearch = searchTerm
        ? (p.nombre_proyecto || '').toLowerCase().includes(searchTerm)
        : true;

      const matchStatus = filtros.status === 'todos'
        ? true
        : p.estado_proyecto === filtros.status;

      return matchSearch && matchStatus;
    });
  }, [proyectosInv, proyectosAho, perfilSeleccionado, filtros]);

  const proyectosVisibles = proyectosFiltrados.slice(0, itemsVisibles);
  const hayMasProyectos = proyectosFiltrados.length > itemsVisibles;

  // ✅ MEJORA 2: Indicador de filtros activos
  const tieneFiltrosActivos = filtros.search || filtros.status !== 'todos';

  // Handlers
  const handleProjectClick = (projectId: number | string) => {
    const targetPath = `/proyectos/${projectId}`;
    if (isAuthenticated) navigate(targetPath);
    else navigate("/login", { state: { from: targetPath } });
  };

  const handleCambioPerfil = (nuevoPerfil: 'ahorrista' | 'inversionista') => {
    setPerfilSeleccionado(nuevoPerfil);
    setItemsVisibles(9);
    setFiltros({ search: '', status: 'todos' });
  };

  const handleFilter = (newFilters: { search: string; status: string }) => {
    setFiltros(newFilters);
    setItemsVisibles(9);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>

      {/* 1. HERO HEADER */}
      <Box sx={{
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        color: 'primary.contrastText',
        py: { xs: 6, md: 8 },
        textAlign: 'center',
        mb: 6,
        borderBottomLeftRadius: { xs: 24, md: 48 },
        borderBottomRightRadius: { xs: 24, md: 48 },
        boxShadow: 3
      }}>
        <Container maxWidth="lg">
          <Typography variant="h3" component="h1" fontWeight={800} gutterBottom sx={{ letterSpacing: -1 }}>
            Explora Oportunidades
          </Typography>
          <Typography variant="h6" sx={{ maxWidth: 'md', mx: 'auto', opacity: 0.9, fontWeight: 400 }}>
            Encuentra el proyecto ideal para hacer crecer tu capital o asegurar tu futuro lote.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ pb: 12 }}>

        {/* 2. CONTROLES DE PERFIL (TOGGLE) */}
        <Stack spacing={4} mb={2} alignItems="center">
          <Paper
            elevation={0}
            sx={{
              p: 0.8,
              borderRadius: 50,
              bgcolor: 'background.paper',
              display: 'flex',
              maxWidth: 600,
              width: '100%',
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.05)}`
            }}
          >
            <Button
              onClick={() => handleCambioPerfil('ahorrista')}
              fullWidth
              startIcon={<HomeIcon />}
              sx={{
                borderRadius: 50,
                py: 1.5,
                transition: 'all 0.3s ease',
                ...(perfilSeleccionado === 'ahorrista'
                  ? { bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }
                  : { color: 'text.secondary', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) } })
              }}
            >
              Modo Ahorrista
            </Button>
            <Button
              onClick={() => handleCambioPerfil('inversionista')}
              fullWidth
              startIcon={<TrendingUp />}
              sx={{
                borderRadius: 50,
                py: 1.5,
                transition: 'all 0.3s ease',
                ...(perfilSeleccionado === 'inversionista'
                  ? { bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }
                  : { color: 'text.secondary', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) } })
              }}
            >
              Modo Inversionista
            </Button>
          </Paper>

          <HighlightsSection perfil={perfilSeleccionado} />
        </Stack>

        {/* 3. BARRA DE FILTROS (Con debounce integrado) */}
        <Box mb={6}>
          <ProjectFilters onFilter={handleFilter} />
        </Box>

        {/* ✅ MEJORA 3: Chip de resultados con filtros activos */}
        {tieneFiltrosActivos && (
          <Box mb={3} display="flex" justifyContent="center">
            <Chip
              label={`${proyectosFiltrados.length} ${proyectosFiltrados.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}`}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          </Box>
        )}

        {/* 4. GRID DE RESULTADOS - ✅ MEJORA 4: Skeleton Loading */}
        <QueryHandler
          isLoading={isLoading}
          error={null}
          loadingMessage="Buscando las mejores oportunidades..."
          fullHeight={true}
          useSkeleton={true}
          skeletonCount={9}
        >
          <>
            {proyectosFiltrados.length === 0 ? (
              <Box textAlign="center" py={8} bgcolor="background.paper" borderRadius={4} border={`1px dashed ${theme.palette.divider}`}>
                <FilterListOff sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" fontWeight={500}>
                  No se encontraron proyectos con estos filtros.
                </Typography>
                <Button variant="text" onClick={() => setFiltros({ search: '', status: 'todos' })} sx={{ mt: 2 }}>
                  Limpiar filtros
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }, gap: 4, width: "100%" }}>
                {/* ✅ MEJORA 5: Animación escalonada */}
                {proyectosVisibles.map((project, index) => (
                  <Fade in={true} key={project.id} timeout={500} style={{ transitionDelay: `${index * 50}ms` }}>
                    <Box>
                      <ProjectCard
                        project={project}
                        onClick={() => handleProjectClick(project.id)}
                      />
                    </Box>
                  </Fade>
                ))}
              </Box>
            )}

            {hayMasProyectos && (
              <Box textAlign="center" py={6}>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => setItemsVisibles(prev => prev + 9)}
                  sx={{
                    px: 4, py: 1.5,
                    borderWidth: 2,
                    fontWeight: 700,
                    borderRadius: 50,
                    '&:hover': { borderWidth: 2 }
                  }}
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