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
  CalendarMonth, GppGood, Gavel, HelpOutline,
  Restore, ShoppingBag, SportsScore, AutoGraph,
  AccountBalance, Groups, MonetizationOn, Explore
} from '@mui/icons-material';

// Hooks y Componentes Existentes
import { useDetalleProyecto } from '../../hooks/useDetalleProyecto';
import { PageContainer } from '@/shared/components/layout/containers/PageContainer/PageContainer';
import { ProjectHero } from './components/ProjectHero';
import { ProjectGallery } from './components/ProjectGallery';
import { ProjectSidebar } from './components/ProjectSidebar';
import { ListaLotesProyecto } from '../Lotes/ListaLotesProyecto';
import { CheckoutWizardModal } from './modals/CheckoutWizardModal';
import type { ProyectoDto } from '@/core/types/dto/proyecto.dto';

// ✅ IMPORTACIONES DE SEGURIDAD
import { useSecurityGuard } from '@/shared/hooks/useSecurityGuard';
import { SecurityRequirementModal } from '@/shared/components/domain/modals/SecurityRequirementModal/SecurityRequirementModal';

// ===================================================
// TYPES
// ===================================================
interface FeatureItemProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  action?: React.ReactNode;
}

interface DataPointProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}

interface LightboxState {
  open: boolean;
  img: string;
}

// ===================================================
// SUB-COMPONENTS (FeatureItem, DataPoint, etc.)
// ... (Se mantienen igual que en tu código original)
// ===================================================
const FeatureItem = React.memo<FeatureItemProps>(({ icon, title, desc, action }) => (
  <Stack
    spacing={1}
    sx={{
      p: 2.5,
      bgcolor: 'background.default',
      borderRadius: 3,
      height: '100%',
      border: '1px solid',
      borderColor: 'divider',
      transition: 'all 0.3s ease',
      '&:hover': {
        borderColor: 'primary.main',
        transform: 'translateY(-2px)',
        boxShadow: 1
      }
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Avatar
        sx={{
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
          color: 'primary.main',
          width: 40,
          height: 40
        }}
      >
        {icon}
      </Avatar>
      <Typography variant="subtitle2" fontWeight={800}>
        {title}
      </Typography>
    </Box>
    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5, flexGrow: 1 }}>
      {desc}
    </Typography>
    {action && <Box sx={{ mt: 1 }}>{action}</Box>}
  </Stack>
));
FeatureItem.displayName = 'FeatureItem';

const DataPoint = React.memo<DataPointProps>(({ label, value, icon }) => (
  <Stack direction="row" spacing={1.5} alignItems="center">
    {icon && <Box sx={{ color: 'action.active', display: 'flex' }}>{icon}</Box>}
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        display="block"
        fontWeight={600}
        sx={{ textTransform: 'uppercase', lineHeight: 1 }}
      >
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={700}>
        {value}
      </Typography>
    </Box>
  </Stack>
));
DataPoint.displayName = 'DataPoint';

const TokenInfoModal = React.memo<{ open: boolean; onClose: () => void }>(({ open, onClose }) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
    <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <HelpOutline color="primary" /> Sistema de Tokens
    </DialogTitle>
    <DialogContent dividers>
      <Stack spacing={3}>
        <Typography variant="body2" color="text.secondary">
          Tu suscripción te otorga <strong>Tokens de Subasta</strong> para participar en la adjudicación de lotes.
        </Typography>
        <List dense disablePadding>
          <ListItem disableGutters>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <ShoppingBag fontSize="small" color="action" />
            </ListItemIcon>
            <ListItemText
              primaryTypographyProps={{ variant: 'body2' }}
              primary="Cada oferta activa bloquea 1 token de tu saldo."
            />
          </ListItem>
          <ListItem disableGutters>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <SportsScore fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText
              primaryTypographyProps={{ variant: 'body2' }}
              primary="Si ganas, el token se consume para la entrega del lote."
            />
          </ListItem>
          <ListItem disableGutters>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Restore fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText
              primaryTypographyProps={{ variant: 'body2' }}
              primary="Si pierdes, el token vuelve a tu cuenta automáticamente."
            />
          </ListItem>
        </List>
      </Stack>
    </DialogContent>
    <DialogActions sx={{ p: 2 }}>
      <Button onClick={onClose} variant="contained" fullWidth sx={{ borderRadius: 2, fontWeight: 700 }}>
        Entendido
      </Button>
    </DialogActions>
  </Dialog>
));
TokenInfoModal.displayName = 'TokenInfoModal';

// ===================================================
// TAB PANELS (Overview, Gallery, Inventory)
// ... (Se mantienen igual)
// ===================================================
const TabOverview = React.memo<{
  proyecto: ProyectoDto;
  esMensual: boolean;
  googleMapsUrl: string | null;
}>(({ proyecto, esMensual, googleMapsUrl }) => {
  const theme = useTheme();
  return (
    <Fade in>
      <Stack spacing={4}>
        <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr 1fr' }} gap={3}>
          <FeatureItem
            icon={<LocationOn />}
            title="Ubicación"
            desc={googleMapsUrl ? 'Proyecto georreferenciado con coordenadas exactas.' : 'Ubicación estratégica con alta plusvalía.'}
            action={googleMapsUrl && (
              <Button size="small" variant="text" startIcon={<Explore fontSize="small" />} href={googleMapsUrl} target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 700, textTransform: 'none', p: 0 }}>
                Ver en Google Maps
              </Button>
            )}
          />
          <FeatureItem icon={<AutoGraph />} title="Rendimiento" desc={`Inversión en ${proyecto.moneda} con capitalización progresiva.`} />
          <FeatureItem icon={<GppGood />} title="Seguridad" desc={`Avalado legalmente por ${proyecto.forma_juridica || 'Contrato Digital'}.`} />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={800} gutterBottom>Sobre el proyecto</Typography>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8, color: 'text.secondary', textAlign: 'justify' }}>
            {proyecto.descripcion}
          </Typography>
        </Box>
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

const TabGallery = React.memo<{ proyecto: ProyectoDto; onImageClick: (url: string) => void; }>(({ proyecto, onImageClick }) => (
  <ProjectGallery proyecto={proyecto} onImageClick={onImageClick} />
));
TabGallery.displayName = 'TabGallery';

const TabInventory = React.memo<{ proyecto: ProyectoDto; onOpenTokenInfo: () => void; }>(({ proyecto, onOpenTokenInfo }) => {
  const theme = useTheme();
  return (
    <Fade in>
      <Box>
        <Paper variant="outlined" sx={{ mb: 4, p: 3, borderRadius: 3, bgcolor: alpha(theme.palette.warning.main, 0.05), borderColor: 'warning.light' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center">
            <Avatar sx={{ bgcolor: 'warning.main', width: 56, height: 56 }}><Gavel /></Avatar>
            <Box flex={1}>
              <Typography variant="subtitle1" fontWeight={800} color="warning.dark" gutterBottom>Sistema de Subastas</Typography>
              <Typography variant="body2" color="text.secondary">Usa tus tokens para pujar por lotes. El token se libera si tu oferta es superada.</Typography>
            </Box>
            <Button variant="outlined" color="warning" size="small" sx={{ borderRadius: 2, fontWeight: 700 }} onClick={onOpenTokenInfo}>Saber más</Button>
          </Stack>
        </Paper>
        <ListaLotesProyecto idProyecto={Number(proyecto.id)} />
      </Box>
    </Fade>
  );
});
TabInventory.displayName = 'TabInventory';

// ===================================================
// MAIN COMPONENT
// ===================================================
const DetalleProyecto: React.FC = () => {
  const logic = useDetalleProyecto();
  const theme = useTheme();
  
  // ✅ 1. INICIALIZAR EL GUARDIA DE SEGURIDAD
  const { withSecurityCheck, securityModalProps } = useSecurityGuard();

  const [lightbox, setLightbox] = useState<LightboxState>({ open: false, img: '' });
  const [tokenInfoOpen, setTokenInfoOpen] = useState(false);

  // Memoized values
  const esMensual = useMemo(() => logic.proyecto?.tipo_inversion === 'mensual', [logic.proyecto?.tipo_inversion]);
  const googleMapsUrl = useMemo(() => {
    if (!logic.proyecto?.latitud || !logic.proyecto?.longitud) return null;
    return `https://www.google.com/maps?q=$${logic.proyecto.latitud},${logic.proyecto.longitud}`;
  }, [logic.proyecto?.latitud, logic.proyecto?.longitud]);

  // ✅ 2. INTERCEPTOR DE ACCIÓN
  // Creamos una función que envuelve la apertura del Wizard con la verificación de seguridad
  const handleOpenCheckoutSecurely = useCallback(() => {
    withSecurityCheck(() => {
      // Si pasa 2FA y KYC, abrimos el modal
      logic.modales.checkoutWizard.open();
    });
  }, [withSecurityCheck, logic.modales.checkoutWizard]);

  // ✅ 3. LÓGICA SEGURA PARA EL SIDEBAR
  // Creamos un objeto 'logic' modificado para pasarle al Sidebar.
  // Cuando el Sidebar llame a 'checkoutWizard.open', se ejecutará nuestra versión segura.
  const secureLogic = useMemo(() => ({
    ...logic,
    modales: {
      ...logic.modales,
      checkoutWizard: {
        ...logic.modales.checkoutWizard,
        open: handleOpenCheckoutSecurely // Sobrescribimos la función open
      }
    }
  }), [logic, handleOpenCheckoutSecurely]);

  // Callbacks de UI
  const handleImageClick = useCallback((url: string) => setLightbox({ open: true, img: url }), []);
  const handleCloseLightbox = useCallback(() => setLightbox({ open: false, img: '' }), []);
  const handleOpenTokenInfo = useCallback(() => setTokenInfoOpen(true), []);
  const handleCloseTokenInfo = useCallback(() => setTokenInfoOpen(false), []);

  // Loading & Error States
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
        
        {/* Left Column */}
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
            {logic.tabValue === 1 && <TabGallery proyecto={proyecto} onImageClick={handleImageClick} />}
            {logic.tabValue === 2 && esMensual && <TabInventory proyecto={proyecto} onOpenTokenInfo={handleOpenTokenInfo} />}
          </Box>
        </Box>

        {/* Right Column: Sidebar */}
        <Box sx={{ width: { xs: '100%', lg: 380 }, flexShrink: 0 }}>
          {/* ✅ 4. Pasamos secureLogic en lugar de logic */}
          <ProjectSidebar logic={secureLogic} proyecto={proyecto} />
        </Box>
      </Box>

      {/* ================= MODALS ================= */}
      
      <TokenInfoModal open={tokenInfoOpen} onClose={handleCloseTokenInfo} />

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

      {lightbox.open && (
        <Dialog open={lightbox.open} onClose={handleCloseLightbox} maxWidth="lg" fullWidth PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none', overflow: 'hidden' } }}>
          <IconButton onClick={handleCloseLightbox} sx={{ position: 'absolute', right: 8, top: 8, color: 'white', bgcolor: alpha(theme.palette.common.black, 0.5), '&:hover': { bgcolor: alpha(theme.palette.common.black, 0.7) }, zIndex: 1 }}>✕</IconButton>
          <Box component="img" src={lightbox.img} alt="Imagen ampliada" sx={{ width: '100%', height: 'auto', maxHeight: '90vh', objectFit: 'contain', borderRadius: 2 }} />
        </Dialog>
      )}

      {/* ✅ 5. RENDERIZAR EL MODAL DE SEGURIDAD */}
      <SecurityRequirementModal {...securityModalProps} />
    </PageContainer>
  );
};

export default DetalleProyecto;