// src/features/client/pages/Proyectos/ProyectosUnificados.tsx

import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from '@tanstack/react-query';

// Material UI
import {
  Box,
  Chip,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
  alpha,
  useTheme,
  Button,
  Container,
  Fade
} from "@mui/material";

// Iconos
import {
  TrendingUp,
  Savings,
  Home as HomeIcon,
  CheckCircle,
  FilterListOff
} from "@mui/icons-material";

// Servicios y Contexto
import proyectoService from "@/core/api/services/proyecto.service";
import { useAuth } from "@/core/context/AuthContext";

// Componentes
import { QueryHandler } from "../../../../shared/components/data-grid/QueryHandler/QueryHandler";
import { ProjectCard } from "./components/ProjectCard"; 

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
const ProyectosUnificados: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { isAuthenticated } = useAuth();

  // ==========================================
  // ESTADOS
  // ==========================================
  const [perfilSeleccionado, setPerfilSeleccionado] = useState<'ahorrista' | 'inversionista'>('ahorrista');
  const [estadoTab, setEstadoTab] = useState<'activos' | 'finalizados'>('activos');
  const [itemsVisibles, setItemsVisibles] = useState(9);

  // ==========================================
  // DATA FETCHING
  // ==========================================
  const { data: proyectosInv, isLoading: loadingInv } = useQuery({
    queryKey: ['proyectosInversionista'],
    queryFn: async () => (await proyectoService.getInversionistasActive()).data,
    staleTime: 5 * 60 * 1000, 
  });

  const { data: proyectosAho, isLoading: loadingAho } = useQuery({
    queryKey: ['proyectosAhorrista'],
    queryFn: async () => (await proyectoService.getAhorristasActive()).data,
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = loadingInv || loadingAho;

  // ==========================================
  // LÓGICA DE FILTRADO (MEMOIZED)
  // ==========================================
  
  // 1. Unificar listas y etiquetar
  const proyectosCombinados = useMemo(() => {
    const inversionista = (proyectosInv || []).map(p => ({ ...p, perfil: 'inversionista' as const }));
    const ahorrista = (proyectosAho || []).map(p => ({ ...p, perfil: 'ahorrista' as const }));
    return [...inversionista, ...ahorrista];
  }, [proyectosInv, proyectosAho]);

  // 2. Aplicar filtros (Perfil y Estado)
  const proyectosFiltrados = useMemo(() => {
    return proyectosCombinados.filter(project => {
      // A. Filtro por Perfil (Toggle Grande)
      const cumplePerfil = project.perfil === perfilSeleccionado;

      // B. Filtro por Estado (Tabs)
      const cumpleEstado = estadoTab === 'activos'
        ? project.estado_proyecto !== 'Finalizado'
        : project.estado_proyecto === 'Finalizado';

      return cumplePerfil && cumpleEstado;
    });
  }, [proyectosCombinados, estadoTab, perfilSeleccionado]);

  // 3. Paginación local
  const proyectosVisibles = proyectosFiltrados.slice(0, itemsVisibles);
  const hayMasProyectos = proyectosFiltrados.length > itemsVisibles;

  // ==========================================
  // HANDLERS
  // ==========================================
  const handleProjectClick = (projectId: number | string) => {
    const targetPath = `/proyectos/${projectId}`;
    if (isAuthenticated) {
      navigate(targetPath);
    } else {
      navigate("/login", { state: { from: targetPath } });
    }
  };

  const handleCambioPerfil = (nuevoPerfil: 'ahorrista' | 'inversionista') => {
    setPerfilSeleccionado(nuevoPerfil);
    setItemsVisibles(9);
    // UX: Scroll suave hacia arriba para no perder el foco
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      
      {/* 1. HERO HEADER */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'primary.contrastText',
          py: { xs: 6, md: 8 },
          textAlign: 'center',
          mb: 6,
          borderBottomLeftRadius: { xs: 24, md: 48 },
          borderBottomRightRadius: { xs: 24, md: 48 },
          boxShadow: 3
        }}
      >
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
        
        {/* 2. CONTROLES DE FILTRADO */}
        <Stack spacing={4} mb={6} alignItems="center">
          
          {/* A. Toggle Grande (Pill Shape) */}
          <Paper
            elevation={4}
            sx={{
              p: 0.8,
              borderRadius: 50,
              bgcolor: 'background.paper',
              display: 'flex',
              maxWidth: 600,
              width: '100%',
              border: `1px solid ${theme.palette.divider}`
            }}
          >
            <Button
              onClick={() => handleCambioPerfil('ahorrista')}
              fullWidth
              startIcon={<HomeIcon />}
              sx={{
                borderRadius: 50,
                py: 1.5,
                fontSize: { xs: '0.9rem', md: '1.1rem' },
                textTransform: 'none',
                transition: 'all 0.3s ease',
                ...(perfilSeleccionado === 'ahorrista' ? {
                  bgcolor: 'primary.main',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  '&:hover': { bgcolor: 'primary.dark' }
                } : {
                  color: 'text.secondary',
                  '&:hover': { bgcolor: 'action.hover' }
                })
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
                fontSize: { xs: '0.9rem', md: '1.1rem' },
                textTransform: 'none',
                transition: 'all 0.3s ease',
                ...(perfilSeleccionado === 'inversionista' ? {
                  bgcolor: 'primary.main',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  '&:hover': { bgcolor: 'primary.dark' }
                } : {
                  color: 'text.secondary',
                  '&:hover': { bgcolor: 'action.hover' }
                })
              }}
            >
              Modo Inversionista
            </Button>
          </Paper>

          {/* B. Tabs Activos/Finalizados (Centrados) */}
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <Tabs
              value={estadoTab}
              onChange={(_, val) => { setEstadoTab(val); setItemsVisibles(9); }}
              textColor="primary"
              indicatorColor="primary"
              centered
              sx={{
                '& .MuiTab-root': { 
                    textTransform: 'none', 
                    fontWeight: 600, 
                    fontSize: '1rem',
                    px: { xs: 2, md: 4 }
                }
              }}
            >
              <Tab label="Proyectos Activos" value="activos" />
              <Tab 
                label={
                  <Stack direction="row" alignItems="center" gap={1}>
                    Finalizados <CheckCircle fontSize="small" />
                  </Stack>
                } 
                value="finalizados" 
              />
            </Tabs>
          </Box>
        </Stack>

        {/* 3. GRID DE RESULTADOS */}
        <QueryHandler
          isLoading={isLoading}
          error={null}
          loadingMessage="Buscando las mejores oportunidades..."
          fullHeight={true}
        >
          <>
            <Box mb={2}>
               <Typography variant="body2" color="text.secondary" textAlign="center">
                  Mostrando {proyectosVisibles.length} de {proyectosFiltrados.length} proyectos encontrados
               </Typography>
            </Box>

            {proyectosFiltrados.length === 0 ? (
              <Box textAlign="center" py={8} bgcolor="action.hover" borderRadius={4} border={`1px dashed ${theme.palette.divider}`}>
                <FilterListOff sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" fontWeight={500}>
                  No hay proyectos disponibles en esta categoría.
                </Typography>
                <Button 
                  variant="text" 
                  onClick={() => setEstadoTab('activos')}
                  sx={{ mt: 2 }}
                >
                  Ver proyectos activos
                </Button>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
                  gap: 4,
                  width: "100%",
                }}
              >
                {proyectosVisibles.map((project) => (
                  <Fade in={true} key={`${project.perfil}-${project.id}`} timeout={500}>
                    <Box 
                      position="relative"
                      sx={{
                        height: '100%',
                        transition: 'transform 0.3s',
                        '&:hover': { transform: 'translateY(-8px)' }
                      }}
                    >
                      {/* Badge Flotante (UX: Reafirmar contexto) */}
                      <Chip
                        icon={project.perfil === 'inversionista' ? <TrendingUp style={{ color: 'white' }} /> : <Savings style={{ color: 'white' }} />}
                        label={project.perfil === 'inversionista' ? 'Inversión' : 'Ahorro'}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 16,
                          left: 16,
                          zIndex: 10,
                          fontWeight: 700,
                          backdropFilter: 'blur(8px)',
                          bgcolor: project.perfil === 'inversionista'
                            ? alpha(theme.palette.info.main, 0.9)
                            : alpha(theme.palette.success.main, 0.9),
                          color: 'white',
                          boxShadow: 2
                        }}
                      />

                      <Box 
                        sx={{ 
                          height: '100%', 
                          '& > *': { height: '100%' },
                          boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)',
                          borderRadius: 4,
                          overflow: 'hidden'
                        }}
                      >
                        <ProjectCard
                          project={project}
                          type={project.perfil}
                          onClick={() => handleProjectClick(project.id)}
                        />
                      </Box>
                    </Box>
                  </Fade>
                ))}
              </Box>
            )}

            {/* Botón Cargar Más */}
            {hayMasProyectos && (
              <Box textAlign="center" py={6}>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => setItemsVisibles(prev => prev + 9)}
                  sx={{
                    px: 4,
                    py: 1.5,
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