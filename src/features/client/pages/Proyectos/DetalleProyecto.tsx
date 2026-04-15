// src/features/client/pages/Proyectos/DetalleProyecto.tsx

import ContratoService from '@/core/api/services/contrato.service';
import SuscripcionService from '@/core/api/services/suscripcion.service';
import { SecurityRequirementModal } from '@/core/auth/guards/SecurityRequirementModal';
import { useSecurityGuard } from '@/core/auth/hooks/useSecurityGuard';
import { useAuth } from '@/core/context/AuthContext';
import type { ContratoTrackingResponse } from '@/core/types/contrato.dto';
import type { ProyectoDto } from '@/core/types/proyecto.dto';
import { MapUrlIframe } from '@/features/admin/pages/Proyectos/modals/MapUrlIframe/MapUrlIframe';
import { ROUTES } from '@/routes';
import { PageContainer } from '@/shared';
import {
  ArrowBack,
  Block, CalendarMonth, CheckCircle,
  Gavel, GppGood,
  Info, InsertPhoto,
  MonetizationOn, Stars, ViewList
} from '@mui/icons-material';
import {
  Alert, Avatar, Box, Button,
  Chip,
  CircularProgress,
  Fade,
  LinearProgress,
  Paper, Skeleton, Stack, Tab, Tabs, Typography, alpha, useTheme
} from '@mui/material';
import { useIsFetching } from '@tanstack/react-query';
import React, { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useDetalleProyecto } from '../../hooks/useDetalleProyecto';
import { useVerificarSuscripcion } from '../../hooks/useVerificarSuscripcion';
import ListaLotesProyecto from '../Lotes/ListaLotesProyecto';
import { ProjectHero } from './components/ProjectHero';
import { ProjectSidebar } from './components/ProjectSidebar';
import { CheckoutInversionModal } from './modals/CheckoutInversionModal/CheckoutInversionModal';
import { CheckoutWizardModal } from './modals/CheckoutWizardModal/CheckoutWizardModal';

// 🚀 LAZY LOADING
const ProjectGallery = lazy(() => import('./components/ProjectGallery').then(m => ({ default: m.ProjectGallery })));

// ===================================================
// SUB-COMPONENTES MEMOIZADOS
// ===================================================

const MemoizedHero = React.memo(ProjectHero);
const MemoizedSidebar = React.memo(ProjectSidebar);

const DataPoint = React.memo(({ label, value, icon }: any) => (
  <Stack
    direction="row"
    spacing={1.5}
    alignItems="center"
    sx={{
      // 👇 Reducimos el padding general de 2 a 1.5 (o puedes usar py: 1, px: 2)
      p: 1,
      px: 2,
      py: 1,
      borderRight: '0.5px solid',
      borderColor: 'divider',
      '&:last-child': { borderRight: 'none' }
    }}
  >
    {icon && <Box sx={{ color: 'primary.main', display: 'flex', flexShrink: 0 }}>{icon}</Box>}
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        display="block"
        fontWeight={800}
        sx={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}
      >
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500}>
        {value}
      </Typography>
    </Box>
  </Stack>
));


interface TabOverviewProps {
  proyecto: ProyectoDto;
  esMensual: boolean;
  googleMapsUrl: string | null;
}
const TabOverview = React.memo(({ proyecto, esMensual, googleMapsUrl }: TabOverviewProps) => {
  const theme = useTheme();
  const mapEmbedUrl = proyecto.map_url
    ?? (proyecto.latitud && proyecto.longitud
      ? `https://maps.google.com/maps?q=${proyecto.latitud},${proyecto.longitud}&output=embed&z=15`
      : null);
  return (
    <Fade in timeout={300}>
      <Stack spacing={4}>
        <Paper variant="outlined" sx={{
          p: 0, borderRadius: 3, overflow: 'hidden', width: '100%',
          mx: 'auto', bgcolor: alpha(theme.palette.primary.main, 0.03)
        }}>
          <Box display="grid" gridTemplateColumns={{ xs: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }}>
            <DataPoint label="Moneda" value={proyecto.moneda} icon={<MonetizationOn fontSize="small" />} />
            <DataPoint label="Modalidad" value={esMensual ? 'Mensual' : 'Directa'} icon={<CalendarMonth fontSize="small" />} />
            {esMensual && (
              <DataPoint
                label="Suscritos"
                value={`${proyecto.suscripciones_actuales} de ${proyecto.obj_suscripciones}`}
                icon={<Stars fontSize="small" />}
              />
            )}
            <DataPoint label="Seguridad" value={proyecto.forma_juridica || '—'} icon={<GppGood fontSize="small" />} />
            <DataPoint label="Estado" value={<Chip label={proyecto.estado_proyecto} size="small" color="success" />} icon={<CheckCircle fontSize="small" />} />
          </Box>
        </Paper>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>Descripción del proyecto</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'justify', whiteSpace: 'pre-line' }}>{proyecto.descripcion}</Typography>
        </Box>

        <MapUrlIframe map_url={mapEmbedUrl} type_proyect={esMensual} />
      </Stack>

    </Fade>
  );
});

// ===================================================
// COMPONENTE PRINCIPAL
// ===================================================

const DetalleProyecto: React.FC = () => {



  //Fin Funciones Thomy
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();

  const logic = useDetalleProyecto();
  const isFetching = useIsFetching();
  //variable Thomy

  const [cantProyectsUser, setCantProyectsUser] = useState(0)
  const [trackingData, setTrackingData] = useState<ContratoTrackingResponse | null>(null)


  //fin variables Thomy

  //Funciones Thomy

  //Llamar los proyectos del usuario
  useEffect(() => {
    const getProyects = async () => {
      const proyectsFetched = await SuscripcionService.getMisSuscripciones();

      const data = proyectsFetched.data;

      console.log(data);

      const cantidadSuscripciones = data.filter(
        (p) => p.id_proyecto === logic.proyecto?.id
      ).length;

      setCantProyectsUser(cantidadSuscripciones);

      console.log(cantidadSuscripciones);
    };

    getProyects();
  }, [logic.proyecto?.id]);

  useEffect(() => {
    if (!logic.proyecto?.id) return; // 🔥 CLAVE
    const trackingContracts = async () => {
      try {
        console.log(`Id proyecto: ${logic.proyecto?.id}`)
        const res = await ContratoService.trackPaymentAndContract(Number(logic.proyecto?.id));
        console.log(res)
        setTrackingData(res);
      } catch (err) {
        console.error(err);
      }
    };

    trackingContracts();
    console.log(trackingData)
  }, [logic.proyecto?.id]);







  //Fin Funciones Thomy
  const currentTab = useMemo(() => {
    const tab = searchParams.get('tab');
    return tab === 'inventario' ? 2 : tab === 'galeria' ? 1 : 0;
  }, [searchParams]);

  const handleTabChange = useCallback((_: any, newValue: number) => {
    const tab = newValue === 1 ? 'galeria' : newValue === 2 ? 'inventario' : '';
    setSearchParams(tab ? { tab } : {}, { replace: true });
  }, [setSearchParams]);

  // ✅ esMensual se mantiene solo para pasar a TabOverview y CheckoutWizardModal (display logic)
  const esMensual = logic.proyecto?.tipo_inversion === 'mensual';

  const googleMapsUrl = useMemo(() => {
    if (!logic.proyecto?.latitud || !logic.proyecto?.longitud) return null;
    return `https://www.google.com/maps/search/?api=1&query=${logic.proyecto.latitud},${logic.proyecto.longitud}`;
  }, [logic.proyecto?.latitud, logic.proyecto?.longitud]);

  const { tokensDisponibles } = useVerificarSuscripcion(Number(logic.proyecto?.id));
  console.log("tokens disponibles", tokensDisponibles);
  const { withSecurityCheck, securityModalProps } = useSecurityGuard();

  const handleOpenCheckoutSecurely = useCallback(() => {
    if (!isAuthenticated) return navigate(ROUTES.LOGIN, { state: { from: location.pathname } });

    if (logic.proyecto?.tipo_inversion === 'directo') {
      withSecurityCheck(() => logic.modales.checkoutInversion.open());
    } else {
      withSecurityCheck(() => logic.modales.checkoutWizard.open());
    }
  }, [
    isAuthenticated, navigate, location.pathname, withSecurityCheck,
    logic.proyecto?.tipo_inversion,
    logic.modales.checkoutWizard,
    logic.modales.checkoutInversion,
  ]);

  const secureLogic = useMemo(() => ({
    ...logic,
    yaCancelado: (logic as any).yaCancelado || false,
    tieneFirmaPendiente: (logic as any).tieneFirmaPendiente || false,
    handleMainAction: handleOpenCheckoutSecurely,
    handleClickFirmar: handleOpenCheckoutSecurely,
  }), [logic, handleOpenCheckoutSecurely]);


  if (logic.loadingProyecto) return <Box p={10} textAlign="center"><CircularProgress /></Box>;
  if (!logic.proyecto) return <PageContainer><Alert severity="error">Proyecto no encontrado.</Alert></PageContainer>;

  return (
    <PageContainer maxWidth="xl" sx={{ pb: 8 }}>
      {isFetching > 0 && <LinearProgress sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10000, height: 2 }} />}

      {/* ✅ Botón Volver más pequeño y a la izquierda */}
      <Box sx={{ mb: 5, display: 'flex', justifyContent: 'flex-start' }}>
        <Button
          size="small"
          startIcon={<ArrowBack fontSize="small" />}
          onClick={() => navigate(-1)}
          sx={{
            fontWeight: 700,
            color: 'text.secondary',
            textTransform: 'none',
            borderRadius: 2,
            px: 1.5,
            py: 0.5,
            '&:hover': { bgcolor: alpha(theme.palette.text.secondary, 0.08) }
          }}
        >
          Volver
        </Button>
      </Box>

      <MemoizedHero proyecto={logic.proyecto} />

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 5, mt: 4 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Tabs value={currentTab} onChange={handleTabChange} sx={{ mb: 4, borderBottom: 1, borderColor: 'divider', '& .MuiTab-root': { fontWeight: 800 } }}>
            <Tab icon={<Info fontSize="small" />} iconPosition="start" label="Informacion del Proyecto" />
            <Tab icon={<InsertPhoto fontSize="small" />} iconPosition="start" label="Galería de fotos " />
            {logic.mostrarTabLotes && <Tab icon={<ViewList fontSize="small" />} iconPosition="start" label="Lotes y Subastas disponibles" />}
          </Tabs>

          <Box sx={{ minHeight: 400 }}>
            {currentTab === 0 && <TabOverview proyecto={logic.proyecto} esMensual={esMensual} googleMapsUrl={googleMapsUrl} />}

            {currentTab === 1 && (
              <Suspense fallback={<Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />}>
                <ProjectGallery proyecto={logic.proyecto} onImageClick={(url) => console.log(url)} />
              </Suspense>
            )}

            {/* ✅ CORREGIDO: usa logic.mostrarTabLotes en lugar de esMensual */}
            {currentTab === 2 && logic.mostrarTabLotes && (
              <Box>
                <Paper variant="outlined" sx={{ mb: 4, p: 3, borderRadius: 3, bgcolor: alpha(theme.palette.warning.main, 0.05), borderStyle: 'dashed' }}>
                  <Stack direction="row" spacing={3} alignItems="center">
                    <Avatar sx={{ bgcolor: tokensDisponibles > 0 ? 'warning.main' : 'error.main' }}>
                      {tokensDisponibles > 0 ? <Gavel /> : <Block />}
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">
                      {tokensDisponibles > 0
                        ? <>Tienes <b>{tokensDisponibles} tokens</b> disponibles para participar en subastas en tiempo real.</>
                        : <>No tenés tokens disponibles. Te podes <b>VOLVER </b> a suscribir para adquirir un nuevo token y participar en las subastas</>
                      }
                    </Typography>
                  </Stack>
                </Paper>
                <ListaLotesProyecto idProyecto={Number(logic.proyecto.id)} />
              </Box>
            )}
          </Box>
        </Box>

        <Box sx={{ width: { xs: '100%', lg: 380 }, flexShrink: 0 }}>
          <MemoizedSidebar logic={secureLogic} proyecto={logic.proyecto} cantProyectUser={cantProyectsUser} puedeFirmar={trackingData?.puede_firmar} />
        </Box>
      </Box>

      <SecurityRequirementModal {...securityModalProps} />
      {isAuthenticated && (
        (esMensual
          ? <CheckoutWizardModal
            open={logic.modales.checkoutWizard.isOpen}
            onClose={logic.modales.checkoutWizard.close}
            proyecto={logic.proyecto}
            tipo={'suscripcion'}
            trackingData={trackingData}
          />
          :
          <CheckoutInversionModal
            open={logic.modales.checkoutInversion.isOpen}
            onClose={logic.modales.checkoutInversion.close}
            proyecto={logic.proyecto}
            tipo='inversion'
            trackingData={trackingData}
          />
        ))}



    </PageContainer>
  );
};

export default DetalleProyecto;