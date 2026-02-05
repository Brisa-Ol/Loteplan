// src/features/client/pages/Proyectos/DetalleProyecto.tsx

import React, { useState, useMemo, useCallback } from 'react';
import {
  Backdrop, Box, CircularProgress, Stack, Tab, Tabs,
  Typography, Skeleton, Alert, Dialog, IconButton,
  Paper, Fade, Avatar, Button, alpha, useTheme,
  List, ListItem, ListItemIcon, ListItemText, DialogTitle,
  DialogContent, DialogActions
} from '@mui/material';
import {
  Info, InsertPhoto, ViewList, LocationOn,
  GppGood, Gavel, AutoGraph, Explore,
  Close, MonetizationOn, CheckCircle,
  // ✅ Iconos agregados para la Ficha Técnica:
  CalendarMonth, AccountBalance, Groups
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

// Hooks y Componentes
import { useDetalleProyecto } from '../../hooks/useDetalleProyecto';
import { PageContainer } from '@/shared/components/layout/containers/PageContainer/PageContainer';
import { ProjectHero } from './components/ProjectHero';
import { ProjectGallery } from './components/ProjectGallery';
import { ProjectSidebar } from './components/ProjectSidebar';
import { ListaLotesProyecto } from '../Lotes/ListaLotesProyecto';
import { CheckoutWizardModal } from './modals/CheckoutWizardModal';
import type { ProyectoDto } from '@/core/types/dto/proyecto.dto';

// Seguridad y Rutas
import { useSecurityGuard } from '@/shared/hooks/useSecurityGuard';
import { SecurityRequirementModal } from '@/shared/components/domain/modals/SecurityRequirementModal/SecurityRequirementModal';
import { ROUTES } from '@/routes';
import { useAuth } from '@/core/context/AuthContext';

// ===================================================
// SUB-COMPONENTES (DataPoint y FeatureItem)
// ===================================================

// ✅ Definimos DataPoint aquí para que TabOverview pueda usarlo
const DataPoint = React.memo<{ label: string; value: string | number; icon?: React.ReactNode }>(({ label, value, icon }) => (
  <Stack direction="row" spacing={1.5} alignItems="center">
    {icon && <Box sx={{ color: 'action.active', display: 'flex' }}>{icon}</Box>}
    <Box>
      <Typography variant="caption" color="text.secondary" display="block" fontWeight={600} sx={{ textTransform: 'uppercase', lineHeight: 1 }}>{label}</Typography>
      <Typography variant="body2" fontWeight={700}>{value}</Typography>
    </Box>
  </Stack>
));

const FeatureItem = React.memo<{ icon: React.ReactNode; title: string; desc: string; action?: React.ReactNode }>(({ icon, title, desc, action }) => (
  <Stack spacing={1} sx={{ p: 2.5, bgcolor: 'background.default', borderRadius: 3, height: '100%', border: '1px solid', borderColor: 'divider', transition: 'all 0.3s ease', '&:hover': { borderColor: 'primary.main', transform: 'translateY(-2px)', boxShadow: 1 } }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Avatar sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 40, height: 40 }}>{icon}</Avatar>
      <Typography variant="subtitle2" fontWeight={800}>{title}</Typography>
    </Box>
    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5, flexGrow: 1 }}>{desc}</Typography>
    {action && <Box sx={{ mt: 1 }}>{action}</Box>}
  </Stack>
));

// ===================================================
// TAB PANELS
// ===================================================
const TabOverview = React.memo<{ proyecto: ProyectoDto; esMensual: boolean; googleMapsUrl: string | null; }>(({ proyecto, esMensual, googleMapsUrl }) => {
  const theme = useTheme();
  
  return (
    <Fade in>
      <Stack spacing={4}>
        {/* 1. Feature Items Grid */}
        <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr 1fr' }} gap={3}>
          <FeatureItem icon={<LocationOn />} title="Ubicación" desc={googleMapsUrl ? 'Proyecto georreferenciado.' : 'Ubicación estratégica.'} action={googleMapsUrl && <Button size="small" variant="text" startIcon={<Explore fontSize="small" />} href={googleMapsUrl} target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 700, textTransform: 'none', p: 0 }}>Ver en Maps</Button>} />
          <FeatureItem icon={<AutoGraph />} title="Rendimiento" desc={`Inversión en ${proyecto.moneda}.`} />
          <FeatureItem icon={<GppGood />} title="Seguridad" desc={`Avalado por ${proyecto.forma_juridica || 'Contrato Digital'}.`} />
        </Box>

        {/* 2. Description */}
        <Box>
          <Typography variant="h6" fontWeight={800} gutterBottom>Sobre el proyecto</Typography>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8, color: 'text.secondary', textAlign: 'justify' }}>{proyecto.descripcion}</Typography>
        </Box>

        {/* 3. ✅ NUEVA FICHA TÉCNICA AGREGADA */}
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: alpha(theme.palette.action.hover, 0.4) }}>
          <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 3, textTransform: 'uppercase' }}>Ficha Técnica del Activo</Typography>
          
          <Box display="grid" gridTemplateColumns={{ xs: '1fr 1fr', md: 'repeat(4, 1fr)' }} gap={4}>
            <DataPoint label="Moneda" value={proyecto.moneda} icon={<MonetizationOn fontSize="small" />} />
            <DataPoint label="Modalidad" value={esMensual ? 'Ahorro Mensual' : 'Inversión Directa'} icon={<CalendarMonth fontSize="small" />} />
            <DataPoint label="Ubicación" value={proyecto.latitud ? 'Georreferenciada' : 'Consultar Zona'} icon={<LocationOn fontSize="small" />} />
            <DataPoint label="Respaldo" value={proyecto.forma_juridica || 'Contrato'} icon={<AccountBalance fontSize="small" />} />
          </Box>

          {esMensual && (
            <Box sx={{ mt: 4, pt: 3, borderTop: `1px dashed ${theme.palette.divider}` }}>
              <Stack direction="row" spacing={4}>
                <DataPoint label="Suscripciones" value={`${proyecto.suscripciones_actuales} / ${proyecto.obj_suscripciones}`} icon={<Groups fontSize="small" />} />
                <DataPoint label="Total Lotes" value={proyecto.lotes?.length || 0} icon={<ViewList fontSize="small" />} />
              </Stack>
            </Box>
          )}
        </Paper>

      </Stack>
    </Fade>
  );
});

TabOverview.displayName = 'TabOverview';

// ===================================================
// MAIN COMPONENT
// ===================================================
const DetalleProyecto: React.FC = () => {
  const logic = useDetalleProyecto();
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { withSecurityCheck, securityModalProps } = useSecurityGuard();

  const [lightbox, setLightbox] = useState({ open: false, img: '' });
  const [tokenInfoOpen, setTokenInfoOpen] = useState(false);

  const esMensual = useMemo(() => logic.proyecto?.tipo_inversion === 'mensual', [logic.proyecto?.tipo_inversion]);
  
  const googleMapsUrl = useMemo(() => {
    if (!logic.proyecto?.latitud || !logic.proyecto?.longitud) return null;
    return `https://www.google.com/maps/search/?api=1&query=${logic.proyecto.latitud},${logic.proyecto.longitud}`;
  }, [logic.proyecto?.latitud, logic.proyecto?.longitud]);

  const handleOpenCheckoutSecurely = useCallback(() => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN, { state: { from: location.pathname } });
      return;
    }
    
    withSecurityCheck(() => {
      logic.modales.checkoutWizard.open();
    });
  }, [isAuthenticated, navigate, location.pathname, withSecurityCheck, logic.modales.checkoutWizard]);

  const secureLogic = useMemo(() => ({
    ...logic,
    modales: {
      ...logic.modales,
      checkoutWizard: {
        ...logic.modales.checkoutWizard,
        open: handleOpenCheckoutSecurely
      }
    }
  }), [logic, handleOpenCheckoutSecurely]);

  const handleImageClick = useCallback((url: string) => setLightbox({ open: true, img: url }), []);

  if (logic.loadingProyecto) return <Skeleton variant="rectangular" height="100vh" />;
  if (!logic.proyecto) return <PageContainer><Alert severity="error">Proyecto no disponible.</Alert></PageContainer>;

  const { proyecto } = logic;

  return (
    <PageContainer maxWidth="xl" sx={{ pb: 8 }}>
      <Backdrop sx={{ color: '#fff', zIndex: 9999, flexDirection: 'column', gap: 2 }} open={logic.verificandoPago}>
        <CircularProgress color="inherit" size={60} />
        <Typography variant="h6">Verificando transacción...</Typography>
      </Backdrop>

      <ProjectHero proyecto={proyecto} />

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 5, alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1, width: '100%', minWidth: 0 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={logic.tabValue} onChange={logic.handleTabChange} variant="scrollable">
              <Tab icon={<Info fontSize="small" />} iconPosition="start" label="Visión General" />
              <Tab icon={<InsertPhoto fontSize="small" />} iconPosition="start" label="Galería" />
              {esMensual && <Tab icon={<ViewList fontSize="small" />} iconPosition="start" label="Inventario de Lotes" />}
            </Tabs>
          </Box>
          <Box sx={{ minHeight: 400 }}>
            {logic.tabValue === 0 && <TabOverview proyecto={proyecto} esMensual={esMensual} googleMapsUrl={googleMapsUrl} />}
            {logic.tabValue === 1 && <ProjectGallery proyecto={proyecto} onImageClick={handleImageClick} />}
            {logic.tabValue === 2 && esMensual && (
              <Box>
                <Paper variant="outlined" sx={{ mb: 4, p: 3, borderRadius: 3, bgcolor: alpha(theme.palette.warning.main, 0.05), borderColor: 'warning.light' }}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center">
                    <Avatar sx={{ bgcolor: 'warning.main', width: 56, height: 56 }}><Gavel /></Avatar>
                    <Box flex={1}>
                      <Typography variant="subtitle1" fontWeight={800} color="warning.dark" gutterBottom>Sistema de Subastas</Typography>
                      <Typography variant="body2" color="text.secondary">Usa tus tokens para pujar por lotes.</Typography>
                    </Box>
                    <Button variant="outlined" color="warning" size="small" sx={{ borderRadius: 2, fontWeight: 700 }} onClick={() => setTokenInfoOpen(true)}>Saber más</Button>
                  </Stack>
                </Paper>
                <ListaLotesProyecto idProyecto={Number(proyecto.id)} />
              </Box>
            )}
          </Box>
        </Box>

        <Box sx={{ width: { xs: '100%', lg: 380 }, flexShrink: 0 }}>
          <ProjectSidebar logic={secureLogic} proyecto={proyecto} />
        </Box>
      </Box>

      {/* MODALES DEL SISTEMA */}
      <SecurityRequirementModal {...securityModalProps} />
      
      {isAuthenticated && (
        <CheckoutWizardModal
          open={logic.modales.checkoutWizard.isOpen}
          onClose={logic.modales.checkoutWizard.close}
          proyecto={proyecto}
          tipo={esMensual ? 'suscripcion' : 'inversion'}
          inversionId={logic.inversionId}
          pagoId={logic.pagoId}
          onConfirmInvestment={logic.wizardCallbacks.onConfirmInvestment}
          onSignContract={logic.wizardCallbacks.onSignContract}
          isProcessing={logic.isProcessingWizard}
          error2FA={logic.error2FA}
        />
      )}

      {lightbox.open && (
        <Dialog open={lightbox.open} onClose={() => setLightbox({ open: false, img: '' })} maxWidth="lg" fullWidth>
          <Box component="img" src={lightbox.img} alt="Ampliación" sx={{ width: '100%', height: 'auto', borderRadius: 2 }} />
        </Dialog>
      )}

      {/* MODAL INFORMACIÓN DE TOKENS / SUBASTA */}
      <Dialog 
        open={tokenInfoOpen} 
        onClose={() => setTokenInfoOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.dark' }}>
              <Gavel fontSize="small" />
            </Avatar>
            <Typography variant="h6" fontWeight={700}>
              ¿Cómo funciona la Subasta?
            </Typography>
          </Box>
          <IconButton onClick={() => setTokenInfoOpen(false)} size="small">
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>
        
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" paragraph>
            Este proyecto utiliza un sistema de asignación por subasta para garantizar transparencia en la entrega de lotes.
          </Typography>

          <List sx={{ bgcolor: 'background.default', borderRadius: 2 }}>
            <ListItem>
              <ListItemIcon>
                <MonetizationOn color="warning" />
              </ListItemIcon>
              <ListItemText 
                primary="1. Obtén Tokens" 
                secondary="Al suscribirte al proyecto, recibes tokens de participación según tu nivel de inversión." 
                primaryTypographyProps={{ fontWeight: 700, fontSize: '0.9rem' }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Gavel color="warning" />
              </ListItemIcon>
              <ListItemText 
                primary="2. Realiza tu Puja" 
                secondary="Usa un token para ofertar por el lote que deseas. El token se bloquea temporalmente." 
                primaryTypographyProps={{ fontWeight: 700, fontSize: '0.9rem' }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="success" />
              </ListItemIcon>
              <ListItemText 
                primary="3. Gana y Asigna" 
                secondary="Si ganas la subasta, el lote es tuyo y se inicia el plan de pagos. Si pierdes, recuperas tu token." 
                primaryTypographyProps={{ fontWeight: 700, fontSize: '0.9rem' }}
              />
            </ListItem>
          </List>

          <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
            <Typography variant="caption" display="block">
              Recuerda: Solo puedes ganar un lote por token disponible.
            </Typography>
          </Alert>
        </DialogContent>
        
        <DialogActions sx={{ p: 2.5 }}>
          <Button 
            onClick={() => setTokenInfoOpen(false)} 
            variant="contained" 
            color="primary" 
            fullWidth
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Entendido
          </Button>
        </DialogActions>
      </Dialog>

    </PageContainer>
  );
};

export default DetalleProyecto;