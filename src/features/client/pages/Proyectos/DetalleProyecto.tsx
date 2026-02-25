// src/features/client/pages/Proyectos/DetalleProyecto.tsx

import {
  AccountBalance, ArrowBack, AutoGraph, CalendarMonth,
  CheckCircle, Close, Explore, Gavel, GppGood,
  History, Info, InsertPhoto, LocationOn,
  MonetizationOn,
  Stars // 🚀 Nuevo icono para tokens
  ,
  ViewList
} from '@mui/icons-material';
import {
  Alert, Avatar, Box, Button,
  Chip,
  Dialog, DialogContent, DialogTitle,
  Fade, IconButton, Paper, Skeleton, Stack, Tab, Tabs,
  Typography, alpha, useTheme
} from '@mui/material';
import React, { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

// Hooks y Componentes
import { useAuth } from '@/core/context/AuthContext';
import type { ProyectoDto } from '@/core/types/dto/proyecto.dto';
import { ROUTES } from '@/routes';
import { SecurityRequirementModal } from '@/shared/components/domain/modals/SecurityRequirementModal/SecurityRequirementModal';
import { PageContainer } from '@/shared/components/layout/containers/PageContainer/PageContainer';
import { useSecurityGuard } from '@/shared/hooks/useSecurityGuard';
import { useDetalleProyecto } from '../../hooks/useDetalleProyecto';
import { useVerificarSuscripcion } from '../../hooks/useVerificarSuscripcion'; // 🚀 Hook de tokens
import { ListaLotesProyecto } from '../Lotes/ListaLotesProyecto';
import { ProjectGallery } from './components/ProjectGallery';
import { ProjectHero } from './components/ProjectHero';
import { ProjectSidebar } from './components/ProjectSidebar';
import { CheckoutWizardModal } from './modals/CheckoutWizardModal';

// ===================================================
// 🚀 SUB-COMPONENTES (SKELETON, DATAPOINT, ETC)
// ===================================================
const TabSkeleton = ({ tabIndex }: { tabIndex: number }) => (
  <Box sx={{ width: '100%', py: 2 }}>
    {tabIndex === 0 && (
      <Stack spacing={4}>
        <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr 1fr' }} gap={3}>
          {[1, 2, 3].map((i) => <Skeleton key={i} variant="rectangular" height={120} sx={{ borderRadius: 3 }} />)}
        </Box>
        <Box><Skeleton width="30%" height={32} sx={{ mb: 2 }} /><Skeleton variant="text" width="100%" /><Skeleton variant="text" width="80%" /></Box>
      </Stack>
    )}
    {tabIndex === 1 && (
      <Box display="grid" gridTemplateColumns={{ xs: '1fr 1fr', md: 'repeat(3, 1fr)' }} gap={2}>
        {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} variant="rectangular" width="100%" sx={{ paddingTop: '75%', borderRadius: 2 }} />)}
      </Box>
    )}
    {tabIndex === 2 && (
      <Stack spacing={3}>
        <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 3 }} />
        <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={3}>
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} variant="rectangular" height={250} sx={{ borderRadius: 4 }} />)}
        </Box>
      </Stack>
    )}
  </Box>
);

const DataPoint = React.memo<{ label: string; value: string | number; icon?: React.ReactNode }>(({ label, value, icon }) => (
  <Stack direction="row" spacing={1.5} alignItems="center">
    {icon && <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>}
    <Box>
      <Typography variant="caption" color="text.secondary" display="block" fontWeight={700} sx={{ textTransform: 'uppercase', lineHeight: 1 }}>{label}</Typography>
      <Typography variant="body2" fontWeight={800}>{value}</Typography>
    </Box>
  </Stack>
));

const FeatureItem = React.memo<{ icon: React.ReactNode; title: string; desc: string; action?: React.ReactNode }>(({ icon, title, desc, action }) => (
  <Stack spacing={1} sx={{ p: 2.5, bgcolor: 'background.paper', borderRadius: 3, height: '100%', border: '1px solid', borderColor: 'divider' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Avatar sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 40, height: 40 }}>{icon}</Avatar>
      <Typography variant="subtitle2" fontWeight={800}>{title}</Typography>
    </Box>
    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5, flexGrow: 1 }}>{desc}</Typography>
    {action && <Box sx={{ mt: 1 }}>{action}</Box>}
  </Stack>
));

const TabOverview = React.memo<{ proyecto: ProyectoDto; esMensual: boolean; googleMapsUrl: string | null; }>(({ proyecto, esMensual, googleMapsUrl }) => {
  const theme = useTheme();
  return (
    <Fade in>
      <Stack spacing={4}>
        <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr 1fr' }} gap={3}>
          <FeatureItem icon={<LocationOn />} title="Ubicación" desc={googleMapsUrl ? 'Proyecto georreferenciado.' : 'Ubicación estratégica.'} action={googleMapsUrl && <Button size="small" variant="text" startIcon={<Explore fontSize="small" />} href={googleMapsUrl} target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 800, textTransform: 'none', p: 0 }}>Ver en Maps</Button>} />
          <FeatureItem icon={<AutoGraph />} title="Rendimiento" desc={`Inversión en ${proyecto.moneda}.`} />
          <FeatureItem icon={<GppGood />} title="Seguridad" desc={`Avalado por ${proyecto.forma_juridica || 'Contrato Digital'}.`} />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={800} gutterBottom>Sobre el proyecto</Typography>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-line', color: 'text.secondary', textAlign: 'justify' }}>{proyecto.descripcion}</Typography>
        </Box>
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: alpha(theme.palette.secondary.main, 0.2) }}>
          <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 3, textTransform: 'uppercase' }}>Ficha Técnica</Typography>
          <Box display="grid" gridTemplateColumns={{ xs: '1fr 1fr', md: 'repeat(4, 1fr)' }} gap={4}>
            <DataPoint label="Moneda" value={proyecto.moneda} icon={<MonetizationOn fontSize="small" />} />
            <DataPoint label="Modalidad" value={esMensual ? 'Ahorro Mensual' : 'Inversión Directa'} icon={<CalendarMonth fontSize="small" />} />
            <DataPoint label="Ubicación" value={proyecto.latitud ? 'Georreferenciada' : 'Consultar Zona'} icon={<LocationOn fontSize="small" />} />
            <DataPoint label="Respaldo" value={proyecto.forma_juridica || 'Contrato'} icon={<AccountBalance fontSize="small" />} />
          </Box>
        </Paper>
      </Stack>
    </Fade>
  );
});

// ===================================================
// 🚀 MODAL: INFORMACIÓN DE SUBASTAS (ACTUALIZADO CON TOKENS)
// ===================================================
const AuctionInfoModal = ({ open, onClose, tokens }: { open: boolean; onClose: () => void; tokens: number }) => {
  const theme = useTheme();
  const rules = [
    { icon: <CheckCircle color="success" />, title: "Un Token por Suscripción", desc: "Al suscribirte, recibes 1 Token. Es tu llave para participar por cualquier lote." },
    { icon: <Gavel sx={{ color: theme.palette.primary.main }} />, title: "Oferta Inicial", desc: "Usarás tu token al realizar la primera oferta en un lote." },
    { icon: <AutoGraph color="info" />, title: "Mejoras Sin Costo", desc: "Subir tu oferta para mantener el primer puesto NO consume tokens adicionales." },
    { icon: <History sx={{ color: theme.palette.warning.main }} />, title: "Devolución de Tokens", desc: "Si retiras tu oferta o pierdes la subasta, el token se devuelve a tu cuenta." }
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ m: 0, p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}><Gavel /></Avatar>
          <Typography variant="h6" fontWeight={800}>Sistema de Subastas</Typography>
        </Stack>
        <IconButton onClick={onClose} size="small"><Close /></IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 3, bgcolor: 'background.default' }}>
        <Stack spacing={3}>
          {/* ✅ SECCIÓN DE ESTADO ACTUAL DE TOKENS */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderColor: 'primary.light', borderStyle: 'dashed' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="subtitle2" fontWeight={800} color="primary.dark">Tus Tokens Actuales</Typography>
                <Typography variant="caption" color="text.secondary">Disponibles para este proyecto</Typography>
              </Box>
              <Chip icon={<Stars sx={{ color: '#FFD700 !important' }} />} label={`${tokens} Token${tokens !== 1 ? 's' : ''}`} sx={{ fontWeight: 800, bgcolor: 'white', border: '1px solid', borderColor: 'divider' }} />
            </Stack>
          </Paper>

          {rules.map((rule, index) => (
            <Stack key={index} direction="row" spacing={2.5}>
              <Box sx={{ mt: 0.5 }}>{rule.icon}</Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={800} gutterBottom>{rule.title}</Typography>
                <Typography variant="body2" color="text.secondary" lineHeight={1.6}>{rule.desc}</Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      </DialogContent>
      <Box sx={{ p: 3 }}><Button variant="contained" fullWidth onClick={onClose} sx={{ py: 1.5, fontWeight: 800 }}>ENTENDIDO</Button></Box>
    </Dialog>
  );
};

// ===================================================
// 🏠 COMPONENTE PRINCIPAL: DETALLE PROYECTO
// ===================================================
const DetalleProyecto: React.FC = () => {
  const logic = useDetalleProyecto();
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isChangingTab, setIsChangingTab] = useState(false);
  const [tokenInfoOpen, setTokenInfoOpen] = useState(false);

  // 🚀 OBTENER TOKENS DISPONIBLES
  const { tokensDisponibles } = useVerificarSuscripcion(Number(logic.proyecto?.id));

  const currentTab = useMemo(() => {
    const tab = searchParams.get('tab');
    if (tab === 'inventario') return 2;
    if (tab === 'galeria') return 1;
    return 0;
  }, [searchParams]);

  const handleTabChange = useCallback((event: React.SyntheticEvent | null, newValue: number) => {
    if (newValue === currentTab) return;
    setIsChangingTab(true);
    const params: { tab?: string } = {};
    if (newValue === 1) params.tab = 'galeria';
    if (newValue === 2) params.tab = 'inventario';
    setSearchParams(params, { replace: true });
    logic.handleTabChange(event as React.SyntheticEvent, newValue);
    setTimeout(() => setIsChangingTab(false), 400);
  }, [setSearchParams, logic, currentTab]);

  const { withSecurityCheck, securityModalProps } = useSecurityGuard();
  const [lightbox, setLightbox] = useState({ open: false, img: '' });

  const esMensual = useMemo(() => logic.proyecto?.tipo_inversion === 'mensual', [logic.proyecto?.tipo_inversion]);
  const googleMapsUrl = useMemo(() => {
    if (!logic.proyecto?.latitud || !logic.proyecto?.longitud) return null;
    return `http://googleusercontent.com/maps.google.com/2{logic.proyecto.latitud},${logic.proyecto.longitud}`;
  }, [logic.proyecto?.latitud, logic.proyecto?.longitud]);

  const handleOpenCheckoutSecurely = useCallback(() => {
    if (!isAuthenticated) return navigate(ROUTES.LOGIN, { state: { from: location.pathname } });
    withSecurityCheck(() => logic.modales.checkoutWizard.open());
  }, [isAuthenticated, navigate, location.pathname, withSecurityCheck, logic.modales.checkoutWizard]);

  const secureLogic = useMemo(() => ({
    ...logic,
    handleMainAction: handleOpenCheckoutSecurely,
    handleClickFirmar: handleOpenCheckoutSecurely,
    modales: { ...logic.modales }
  }), [logic, handleOpenCheckoutSecurely]);

  if (logic.loadingProyecto) return <Skeleton variant="rectangular" height="100vh" />;
  if (!logic.proyecto) return <PageContainer><Alert severity="error">Proyecto no disponible.</Alert></PageContainer>;

  return (
    <PageContainer maxWidth="xl" sx={{ pb: 8 }}>
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ fontWeight: 700, textTransform: 'none', color: 'text.secondary' }}>Volver</Button>
      </Box>

      <ProjectHero proyecto={logic.proyecto} />

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 5, mt: 4 }}>
        <Box sx={{ flex: 1, width: '100%', minWidth: 0 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={currentTab} onChange={handleTabChange} variant="scrollable" sx={{ '& .MuiTab-root': { fontWeight: 700 } }}>
              <Tab icon={<Info fontSize="small" />} iconPosition="start" label="Visión General" />
              <Tab icon={<InsertPhoto fontSize="small" />} iconPosition="start" label="Galería" />
              {esMensual && <Tab icon={<ViewList fontSize="small" />} iconPosition="start" label="Inventario de Lotes" />}
            </Tabs>
          </Box>

          <Box sx={{ minHeight: 450, position: 'relative' }}>
            {isChangingTab ? (
              <TabSkeleton tabIndex={currentTab} />
            ) : (
              <Box>
                {currentTab === 0 && <TabOverview proyecto={logic.proyecto} esMensual={esMensual} googleMapsUrl={googleMapsUrl} />}
                {currentTab === 1 && <ProjectGallery proyecto={logic.proyecto} onImageClick={(url) => setLightbox({ open: true, img: url })} />}
                {currentTab === 2 && esMensual && (
                  <Box>
                    <Paper variant="outlined" sx={{ mb: 4, p: 3, borderRadius: 3, bgcolor: alpha(theme.palette.warning.main, 0.05), borderColor: 'warning.light' }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
                        <Avatar sx={{ bgcolor: 'warning.main', width: 56, height: 56 }}><Gavel /></Avatar>
                        <Box flex={1}>
                          <Stack direction="row" alignItems="center" gap={1.5} mb={0.5}>
                            <Typography variant="subtitle1" fontWeight={800} color="warning.dark">Sistema de Subastas</Typography>
                            {/* ✅ CHIP DE TOKENS EN EL BANNER */}
                            {isAuthenticated && (
                              <Chip size="small" icon={<Stars sx={{ color: '#F57C00 !important', fontSize: 16 }} />} label={`${tokensDisponibles} Token${tokensDisponibles !== 1 ? 's' : ''}`} sx={{ fontWeight: 800, bgcolor: alpha(theme.palette.warning.main, 0.1), border: 'none' }} />
                            )}
                          </Stack>
                          <Typography variant="body2" color="text.secondary">Usa tus tokens para pujar por lotes exclusivos en este proyecto.</Typography>
                        </Box>
                        <Button variant="outlined" color="warning" size="small" sx={{ fontWeight: 800 }} onClick={() => setTokenInfoOpen(true)}>Saber más</Button>
                      </Stack>
                    </Paper>
                    <ListaLotesProyecto idProyecto={Number(logic.proyecto.id)} />
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Box>

        <Box sx={{ width: { xs: '100%', lg: 380 }, flexShrink: 0 }}>
          <ProjectSidebar logic={secureLogic} proyecto={logic.proyecto} />
        </Box>
      </Box>

      {/* ✅ MODALES */}
      <AuctionInfoModal open={tokenInfoOpen} onClose={() => setTokenInfoOpen(false)} tokens={tokensDisponibles} />
      <SecurityRequirementModal {...securityModalProps} />

      {isAuthenticated && (
        <CheckoutWizardModal open={logic.modales.checkoutWizard.isOpen} onClose={logic.modales.checkoutWizard.close} proyecto={logic.proyecto} tipo={esMensual ? 'suscripcion' : 'inversion'} inversionId={logic.inversionId} pagoId={logic.pagoId} />
      )}

      {lightbox.open && (
        <Dialog open={lightbox.open} onClose={() => setLightbox({ open: false, img: '' })} maxWidth="lg" fullWidth>
          <Box component="img" src={lightbox.img} sx={{ width: '100%', height: 'auto', borderRadius: 2 }} />
        </Dialog>
      )}
    </PageContainer>
  );
};

export default DetalleProyecto;