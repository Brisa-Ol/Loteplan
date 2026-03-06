// src/features/client/pages/Proyectos/DetalleProyecto.tsx

import {
  ArrowBack, AutoGraph, CalendarMonth, CheckCircle,
  Gavel, GppGood,
  Info, InsertPhoto, LocationOn, MonetizationOn, Stars, ViewList
} from '@mui/icons-material';
import {
  Alert, Avatar, Box, Button,
  CircularProgress,
  Fade,
  LinearProgress,
  Paper, Skeleton, Stack, Tab, Tabs, Typography, alpha, useTheme
} from '@mui/material';
import { useIsFetching } from '@tanstack/react-query';
import React, { Suspense, lazy, useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { useSecurityGuard } from '@/core/auth/hooks/useSecurityGuard';
import { useAuth } from '@/core/context/AuthContext';
import { ROUTES } from '@/routes';
import { useDetalleProyecto } from '../../hooks/useDetalleProyecto';
import { useVerificarSuscripcion } from '../../hooks/useVerificarSuscripcion';

// Componentes críticos cargados de forma inmediata pero memoizados
import { SecurityRequirementModal } from '@/core/auth/guards/SecurityRequirementModal';
import { PageContainer } from '@/shared';
import { ProjectHero } from './components/ProjectHero';
import { ProjectSidebar } from './components/ProjectSidebar';
import { CheckoutWizardModal } from './modals/CheckoutWizardModal';
import ListaLotesProyecto from '../Lotes/ListaLotesProyecto';


// 🚀 LAZY LOADING: Componentes no esenciales para el FCP (First Contentful Paint)
const ProjectGallery = lazy(() => import('./components/ProjectGallery').then(m => ({ default: m.ProjectGallery })));

// ===================================================
// SUB-COMPONENTES MEMOIZADOS (Evitan re-renders)
// ===================================================

const MemoizedHero = React.memo(ProjectHero);
const MemoizedSidebar = React.memo(ProjectSidebar);

const DataPoint = React.memo(({ label, value, icon }: any) => (
  <Stack direction="row" spacing={1.5} alignItems="center">
    {icon && <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>}
    <Box>
      <Typography variant="caption" color="text.secondary" display="block" fontWeight={700} sx={{ textTransform: 'uppercase' }}>{label}</Typography>
      <Typography variant="body2" fontWeight={800}>{value}</Typography>
    </Box>
  </Stack>
));

const FeatureItem = React.memo(({ icon, title, desc, action }: any) => (
  <Stack spacing={1} sx={{ p: 2.5, bgcolor: 'background.paper', borderRadius: 3, height: '100%', border: '1px solid', borderColor: 'divider' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Avatar sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 40, height: 40 }}>{icon}</Avatar>
      <Typography variant="subtitle2" fontWeight={800}>{title}</Typography>
    </Box>
    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>{desc}</Typography>
    {action}
  </Stack>
));

const TabOverview = React.memo(({ proyecto, esMensual, googleMapsUrl }: any) => {
  const theme = useTheme();
  return (
    <Fade in timeout={300}>
      <Stack spacing={4}>
        <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr 1fr' }} gap={3}>
          <FeatureItem icon={<LocationOn />} title="Ubicación" desc="Zona de alta valorización."
            action={googleMapsUrl && <Button size="small" variant="text" href={googleMapsUrl} target="_blank" sx={{ fontWeight: 800, justifyContent: 'flex-start', p: 0 }}>Ver en Maps</Button>}
          />
          <FeatureItem icon={<AutoGraph />} title="Rendimiento" desc={`Inversión en ${proyecto.moneda}.`} />
          <FeatureItem icon={<GppGood />} title="Seguridad" desc={proyecto.forma_juridica || 'Respaldo legal total.'} />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={800} gutterBottom>Descripción</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'justify', whiteSpace: 'pre-line' }}>{proyecto.descripcion}</Typography>
        </Box>
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: alpha(theme.palette.secondary.main, 0.05) }}>
          <Box display="grid" gridTemplateColumns={{ xs: '1fr 1fr', md: 'repeat(4, 1fr)' }} gap={4}>
            <DataPoint label="Moneda" value={proyecto.moneda} icon={<MonetizationOn fontSize="small" />} />
            <DataPoint label="Modalidad" value={esMensual ? 'Mensual' : 'Directa'} icon={<CalendarMonth fontSize="small" />} />
            <DataPoint label="Suscritos" value={proyecto.suscripciones_actuales} icon={<Stars fontSize="small" />} />
            <DataPoint label="Estado" value={proyecto.estado_proyecto} icon={<CheckCircle fontSize="small" />} />
          </Box>
        </Paper>
      </Stack>
    </Fade>
  );
});

// ===================================================
// COMPONENTE PRINCIPAL
// ===================================================

const DetalleProyecto: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();

  // Cargamos lógica del proyecto
  const logic = useDetalleProyecto();
  const isFetching = useIsFetching();

  const currentTab = useMemo(() => {
    const tab = searchParams.get('tab');
    return tab === 'inventario' ? 2 : tab === 'galeria' ? 1 : 0;
  }, [searchParams]);

  const handleTabChange = useCallback((_: any, newValue: number) => {
    const tab = newValue === 1 ? 'galeria' : newValue === 2 ? 'inventario' : '';
    setSearchParams(tab ? { tab } : {}, { replace: true });
  }, [setSearchParams]);

  const esMensual = logic.proyecto?.tipo_inversion === 'mensual';

  const googleMapsUrl = useMemo(() => {
    if (!logic.proyecto?.latitud || !logic.proyecto?.longitud) return null;
    return `https://www.google.com/maps/search/?api=1&query=${logic.proyecto.latitud},${logic.proyecto.longitud}`;
  }, [logic.proyecto?.latitud, logic.proyecto?.longitud]);

  const { tokensDisponibles } = useVerificarSuscripcion(Number(logic.proyecto?.id));
  const { withSecurityCheck, securityModalProps } = useSecurityGuard();

  const handleOpenCheckoutSecurely = useCallback(() => {
    if (!isAuthenticated) return navigate(ROUTES.LOGIN, { state: { from: location.pathname } });
    withSecurityCheck(() => logic.modales.checkoutWizard.open());
  }, [isAuthenticated, navigate, location.pathname, withSecurityCheck, logic.modales.checkoutWizard]);

  // UI Segura memoizada
  const secureLogic = useMemo(() => ({
    ...logic,
    handleMainAction: handleOpenCheckoutSecurely,
    handleClickFirmar: handleOpenCheckoutSecurely,
  }), [logic, handleOpenCheckoutSecurely]);

  if (logic.loadingProyecto) return <Box p={10} textAlign="center"><CircularProgress /></Box>;
  if (!logic.proyecto) return <PageContainer><Alert severity="error">Proyecto no encontrado.</Alert></PageContainer>;

  return (
    <PageContainer maxWidth="xl" sx={{ pb: 8 }}>
      {isFetching > 0 && <LinearProgress sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10000, height: 2 }} />}

      <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 3, fontWeight: 700, color: 'text.secondary', textTransform: 'none' }}>Volver</Button>

      <MemoizedHero proyecto={logic.proyecto} />

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 5, mt: 4 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Tabs value={currentTab} onChange={handleTabChange} sx={{ mb: 4, borderBottom: 1, borderColor: 'divider', '& .MuiTab-root': { fontWeight: 800 } }}>
            <Tab icon={<Info fontSize="small" />} iconPosition="start" label="Info" />
            <Tab icon={<InsertPhoto fontSize="small" />} iconPosition="start" label="Galería" />
            {esMensual && <Tab icon={<ViewList fontSize="small" />} iconPosition="start" label="Lotes" />}
          </Tabs>

          <Box sx={{ minHeight: 400 }}>
            {currentTab === 0 && <TabOverview proyecto={logic.proyecto} esMensual={esMensual} googleMapsUrl={googleMapsUrl} />}

            {currentTab === 1 && (
              <Suspense fallback={<Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />}>
                <ProjectGallery proyecto={logic.proyecto} onImageClick={(url) => console.log(url)} />
              </Suspense>
            )}

            {currentTab === 2 && esMensual && (
              <Box>
                <Paper variant="outlined" sx={{ mb: 4, p: 3, borderRadius: 3, bgcolor: alpha(theme.palette.warning.main, 0.05), borderStyle: 'dashed' }}>
                  <Stack direction="row" spacing={3} alignItems="center">
                    <Avatar sx={{ bgcolor: 'warning.main' }}><Gavel /></Avatar>
                    <Typography variant="body2" color="text.secondary">Tienes <b>{tokensDisponibles} tokens</b> para participar. Las subastas son en tiempo real.</Typography>
                  </Stack>
                </Paper>
                <ListaLotesProyecto idProyecto={Number(logic.proyecto.id)} />
              </Box>
            )}
          </Box>
        </Box>

        <Box sx={{ width: { xs: '100%', lg: 380 }, flexShrink: 0 }}>
          <MemoizedSidebar logic={secureLogic} proyecto={logic.proyecto} />
        </Box>
      </Box>

      <SecurityRequirementModal {...securityModalProps} />
      {isAuthenticated && (
        <CheckoutWizardModal
          open={logic.modales.checkoutWizard.isOpen}
          onClose={logic.modales.checkoutWizard.close}
          proyecto={logic.proyecto}
          tipo={esMensual ? 'suscripcion' : 'inversion'}
        />
      )}
    </PageContainer>
  );
};

export default DetalleProyecto;