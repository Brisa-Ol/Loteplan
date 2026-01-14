import {
  Business,
  TrendingUp,
  Savings,
  Home as HomeIcon, // Usado para el icono de Ahorrista
  Search,
  ArrowForward,
  LocationOn,
  AttachMoney,
  CalendarToday,
  CheckCircle // Usado para estado finalizado
} from "@mui/icons-material";
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
  Card,
  CardMedia,
  CardContent
} from "@mui/material";
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

// Asumo que estos componentes existen
import { QueryHandler } from "../../../../shared/components/data-grid/QueryHandler/QueryHandler";
import proyectoService from '../../../services/proyecto.service';
import { ProjectCard } from "./components/ProjectCard";

// ==========================================
// COMPONENTE: Highlights (Estilo Metodología)
// ==========================================
// ... (Mismo código de UnifiedHighlights que tenías antes, lo omito para ahorrar espacio) ...

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
const ProyectosUnificados: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { isAuthenticated } = useAuth();

  // ==========================================
  // ESTADOS DE FILTRO (REESTRUCTURADOS)
  // ==========================================
  // 1. Perfil (El toggle grande de la imagen): 'ahorrista' o 'inversionista'
  const [perfilSeleccionado, setPerfilSeleccionado] = useState<'ahorrista' | 'inversionista'>('ahorrista');
  
  // 2. Estado (Los tabs de abajo): 'activos' o 'finalizados'
  const [estadoTab, setEstadoTab] = useState<'activos' | 'finalizados'>('activos');
  
  const [itemsVisibles, setItemsVisibles] = useState(9);

  // ==========================================
  // QUERIES
  // ==========================================
  const { data: proyectosInv, isLoading: loadingInv } = useQuery({
    queryKey: ['proyectosInversionista'],
    queryFn: async () => (await proyectoService.getInversionistasActive()).data
  });

  const { data: proyectosAho, isLoading: loadingAho } = useQuery({
    queryKey: ['proyectosAhorrista'],
    queryFn: async () => (await proyectoService.getAhorristasActive()).data
  });

  const isLoading = loadingInv || loadingAho;

  // ==========================================
  // LÓGICA DE FILTRADO
  // ==========================================
  const proyectosCombinados = useMemo(() => {
    const inversionista = (proyectosInv || []).map(p => ({ ...p, perfil: 'inversionista' as const }));
    const ahorrista = (proyectosAho || []).map(p => ({ ...p, perfil: 'ahorrista' as const }));
    return [...inversionista, ...ahorrista];
  }, [proyectosInv, proyectosAho]);

  const proyectosFiltrados = useMemo(() => {
    return proyectosCombinados.filter(project => {
      // 1. Filtro estricto por Perfil (Toggle Grande)
      const cumplePerfil = project.perfil === perfilSeleccionado;

      // 2. Filtro por Estado (Tabs de abajo)
      const cumpleEstado = estadoTab === 'activos'
        ? project.estado_proyecto !== 'Finalizado'
        : project.estado_proyecto === 'Finalizado';

      return cumplePerfil && cumpleEstado;
    });
  }, [proyectosCombinados, estadoTab, perfilSeleccionado]);

  const proyectosVisibles = proyectosFiltrados.slice(0, itemsVisibles);
  const hayMasProyectos = proyectosFiltrados.length > itemsVisibles;

  const handleProjectClick = (projectId: number | string) => {
    const targetPath = `/proyectos/${projectId}`;
    if (isAuthenticated) {
      navigate(targetPath);
    } else {
      navigate("/login", { state: { from: targetPath } });
    }
  };

  const cargarMas = () => {
    setItemsVisibles(prev => prev + 9);
  };

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      
      {/* HEADER HERO */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'primary.contrastText',
          py: { xs: 6, md: 8 },
          textAlign: 'center',
          mb: 6
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h3" component="h1" fontWeight={800} gutterBottom>
            Explora Oportunidades
          </Typography>
          <Typography variant="h6" sx={{ maxWidth: 'md', mx: 'auto', opacity: 0.9, fontWeight: 400 }}>
            Inversiones estratégicas y planes de ahorro en un solo lugar.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ pb: 12 }}>
        
        {/* ==========================================
            1. TOGGLE GRANDE (ESTILO IMAGEN)
            ========================================== */}
        <Box sx={{ maxWidth: 800, mx: 'auto', mb: 4 }}>
          <Paper
            elevation={3}
            sx={{
              p: 0.8,
              borderRadius: 50, // Bordes muy redondos (Pill shape)
              bgcolor: 'grey.200', // Fondo gris claro contenedor
              display: 'flex',
              position: 'relative'
            }}
          >
            {/* Opción AHORRISTA */}
            <Button
              onClick={() => {
                setPerfilSeleccionado('ahorrista');
                setItemsVisibles(9);
              }}
              fullWidth
              startIcon={<HomeIcon />}
              sx={{
                borderRadius: 50,
                py: 1.5,
                fontSize: { xs: '1rem', md: '1.2rem' },
                fontWeight: 700,
                textTransform: 'none',
                transition: 'all 0.3s ease',
                ...(perfilSeleccionado === 'ahorrista' ? {
                  bgcolor: 'primary.main', // Naranja
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(204, 99, 51, 0.4)',
                  '&:hover': { bgcolor: 'primary.dark' }
                } : {
                  color: 'text.secondary',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' }
                })
              }}
            >
              Modo Ahorrista
            </Button>

            {/* Opción INVERSIONISTA */}
            <Button
              onClick={() => {
                setPerfilSeleccionado('inversionista');
                setItemsVisibles(9);
              }}
              fullWidth
              startIcon={<TrendingUp />}
              sx={{
                borderRadius: 50,
                py: 1.5,
                fontSize: { xs: '1rem', md: '1.2rem' },
                fontWeight: 700,
                textTransform: 'none',
                transition: 'all 0.3s ease',
                ...(perfilSeleccionado === 'inversionista' ? {
                  bgcolor: 'primary.main', // Naranja
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(204, 99, 51, 0.4)',
                  '&:hover': { bgcolor: 'primary.dark' }
                } : {
                  color: 'text.secondary',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' }
                })
              }}
            >
              Modo Inversionista
            </Button>
          </Paper>
        </Box>

        {/* ==========================================
            2. TABS DE ESTADO (ABAJO)
            ========================================== */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 6 }}>
          <Tabs
            value={estadoTab}
            onChange={(_, newVal) => {
              setEstadoTab(newVal);
              setItemsVisibles(9);
            }}
            textColor="primary"
            indicatorColor="primary"
            centered
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                minWidth: 120,
                px: 4
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

        {/* ==========================================
            3. GRID DE PROYECTOS
            ========================================== */}
        <QueryHandler
          isLoading={isLoading}
          error={null}
          loadingMessage="Cargando proyectos..."
          fullHeight={true}
        >
          <>
            <Box mb={2}>
               <Typography variant="body2" color="text.secondary" textAlign="center">
                  Mostrando {proyectosVisibles.length} proyectos de {perfilSeleccionado === 'ahorrista' ? 'ahorro' : 'inversión'} {estadoTab}
               </Typography>
            </Box>

            {proyectosFiltrados.length === 0 ? (
              <Box textAlign="center" py={10} bgcolor="action.hover" borderRadius={4}>
                <Typography variant="h5" color="text.secondary" fontWeight={500} gutterBottom>
                  No hay proyectos {estadoTab} en modo {perfilSeleccionado}.
                </Typography>
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
                  <Box 
                    key={`${project.perfil}-${project.id}`} 
                    position="relative"
                    sx={{
                      height: '100%',
                      transition: 'transform 0.3s',
                      '&:hover': { transform: 'translateY(-8px)' }
                    }}
                  >
                    {/* Badge de Perfil sobre la tarjeta */}
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
                ))}
              </Box>
            )}

            {hayMasProyectos && (
              <Box textAlign="center" py={6}>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={cargarMas}
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderWidth: 2,
                    fontWeight: 700,
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