// src/features/client/pages/Proyectos/DetalleProyecto.tsx

import React, { useState } from 'react';
import {
  Backdrop, Box, CircularProgress, Stack, Tab, Tabs,
  Typography, Skeleton, Alert, Dialog, IconButton,
  Divider, Paper, Fade, Avatar, Button, alpha, useTheme,
  List, ListItem, ListItemIcon, ListItemText, DialogTitle,
  DialogContent, DialogActions
} from '@mui/material';
import {
  Info, InsertPhoto, ViewList, Close, LocationOn,
  CalendarMonth, GppGood, Gavel, HelpOutline,
  Restore, ShoppingBag, SportsScore, AutoGraph, CheckCircle,
  AccountBalance, Groups, Schedule, MonetizationOn, Explore
} from '@mui/icons-material';

// Hooks y Componentes
import { useDetalleProyecto } from '../../hooks/useDetalleProyecto';
import { PageContainer } from '@/shared/components/layout/containers/PageContainer/PageContainer';
import { ProjectHero } from './components/ProjectHero';
import { ProjectGallery } from './components/ProjectGallery';
import { ProjectSidebar } from './components/ProjectSidebar';
import { ListaLotesProyecto } from '../Lotes/ListaLotesProyecto';
import { CheckoutWizardModal } from './modals/CheckoutWizardModal';
import type { ProyectoDto } from '@/core/types/dto/proyecto.dto';

// ==========================================
// COMPONENTE INTERNOS DE UI
// ==========================================

const FeatureItem = ({ icon, title, desc, action }: { icon: React.ReactNode, title: string, desc: string, action?: React.ReactNode }) => (
  <Stack spacing={1} sx={{ p: 2.5, bgcolor: 'background.default', borderRadius: 3, height: '100%', border: '1px solid', borderColor: 'divider' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Avatar sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 40, height: 40 }}>
        {icon}
      </Avatar>
      <Typography variant="subtitle2" fontWeight={800}>{title}</Typography>
    </Box>
    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5, flexGrow: 1 }}>{desc}</Typography>
    {action && <Box sx={{ mt: 1 }}>{action}</Box>}
  </Stack>
);

const DataPoint = ({ label, value, icon }: { label: string, value: string | number, icon?: React.ReactNode }) => (
  <Stack direction="row" spacing={1.5} alignItems="center">
    {icon && <Box sx={{ color: 'action.active', display: 'flex' }}>{icon}</Box>}
    <Box>
      <Typography variant="caption" color="text.secondary" display="block" fontWeight={600} sx={{ textTransform: 'uppercase', lineHeight: 1 }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={700}>{value}</Typography>
    </Box>
  </Stack>
);

const TokenInfoModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => (
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
            <ListItemIcon sx={{ minWidth: 36 }}><ShoppingBag fontSize="small" color="action" /></ListItemIcon>
            <ListItemText primaryTypographyProps={{ variant: 'body2' }} primary="Cada oferta activa bloquea 1 token de tu saldo." />
          </ListItem>
          <ListItem disableGutters>
            <ListItemIcon sx={{ minWidth: 36 }}><SportsScore fontSize="small" color="success" /></ListItemIcon>
            <ListItemText primaryTypographyProps={{ variant: 'body2' }} primary="Si ganas, el token se consume para la entrega del lote." />
          </ListItem>
          <ListItem disableGutters>
            <ListItemIcon sx={{ minWidth: 36 }}><Restore fontSize="small" color="primary" /></ListItemIcon>
            <ListItemText primaryTypographyProps={{ variant: 'body2' }} primary="Si pierdes, el token vuelve a tu cuenta automáticamente." />
          </ListItem>
        </List>
      </Stack>
    </DialogContent>
    <DialogActions sx={{ p: 2 }}>
      <Button onClick={onClose} variant="contained" fullWidth sx={{ borderRadius: 2, fontWeight: 700 }}>Entendido</Button>
    </DialogActions>
  </Dialog>
);

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

const DetalleProyecto: React.FC = () => {
  const logic = useDetalleProyecto();
  const theme = useTheme();
  const [lightbox, setLightbox] = useState<{ open: boolean; img: string }>({ open: false, img: '' });
  const [tokenInfoOpen, setTokenInfoOpen] = useState(false);

  if (logic.loadingProyecto) return <Skeleton variant="rectangular" height="100vh" />;
  if (!logic.proyecto) return <PageContainer><Alert severity="error">Proyecto no disponible.</Alert></PageContainer>;

  const { proyecto } = logic;
  const esMensual = proyecto.tipo_inversion === 'mensual';

  // Lógica para el mapa
  const googleMapsUrl = proyecto.latitud && proyecto.longitud 
    ? `https://www.google.com/maps/search/?api=1&query=${proyecto.latitud},${proyecto.longitud}`
    : null;

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
            {/* TAB 0: VISIÓN GENERAL */}
            {logic.tabValue === 0 && (
              <Fade in>
                <Stack spacing={4}>
                  <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr 1fr' }} gap={3}>
                    
                    {/* ✅ HIGHLIGHT DE UBICACIÓN DINÁMICO */}
                    <FeatureItem 
                      icon={<LocationOn />} 
                      title="Ubicación" 
                      desc={googleMapsUrl 
                        ? "Proyecto georreferenciado con coordenadas exactas en mapa digital." 
                        : "Ubicación estratégica con alta proyección urbana y plusvalía."} 
                      action={googleMapsUrl && (
                        <Button 
                          size="small" 
                          variant="text" 
                          startIcon={<Explore fontSize="small" />}
                          href={googleMapsUrl}
                          target="_blank"
                          sx={{ fontWeight: 700, textTransform: 'none', p: 0 }}
                        >
                          Ver en Google Maps
                        </Button>
                      )}
                    />

                    <FeatureItem icon={<AutoGraph />} title="Rendimiento" desc={`Inversión en ${proyecto.moneda} con capitalización progresiva por desarrollo.`} />
                    <FeatureItem icon={<GppGood />} title="Seguridad" desc={`Avalado legalmente por ${proyecto.forma_juridica || 'Contrato Digital'}.`} />
                  </Box>

                  <Box>
                    <Typography variant="h6" fontWeight={800} gutterBottom>Sobre el proyecto</Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8, color: 'text.secondary', textAlign: 'justify' }}>
                      {proyecto.descripcion}
                    </Typography>
                  </Box>

                  {/* FICHA TÉCNICA DINÁMICA */}
                  <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: alpha(theme.palette.action.hover, 0.4) }}>
                    <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 3, textTransform: 'uppercase' }}>Ficha Técnica del Activo</Typography>
                    <Box display="grid" gridTemplateColumns={{ xs: '1fr 1fr', md: 'repeat(4, 1fr)' }} gap={4}>
                      <DataPoint label="Moneda" value={proyecto.moneda} icon={<MonetizationOn fontSize="small"/>} />
                      <DataPoint label="Modalidad" value={esMensual ? 'Ahorro Mensual' : 'Inversión Directa'} icon={<CalendarMonth fontSize="small"/>} />
                      
                      {/* ✅ UBICACIÓN EN FICHA TÉCNICA */}
                      <DataPoint 
                        label="Ubicación" 
                        value={proyecto.latitud ? "Georreferenciada" : "Consultar Zona"} 
                        icon={<LocationOn fontSize="small"/>} 
                      />
                      
                      <DataPoint label="Respaldo" value={proyecto.forma_juridica || 'Contrato'} icon={<AccountBalance fontSize="small"/>} />
                    </Box>

                    {esMensual && (
                      <Box sx={{ mt: 4, pt: 3, borderTop: `1px dashed ${theme.palette.divider}` }}>
                        <Stack direction="row" spacing={4}>
                          <DataPoint label="Suscripciones" value={`${proyecto.suscripciones_actuales} / ${proyecto.obj_suscripciones}`} icon={<Groups fontSize="small"/>} />
                          <DataPoint label="Total Lotes" value={proyecto.lotes?.length || 0} icon={<ViewList fontSize="small"/>} />
                        </Stack>
                      </Box>
                    )}
                  </Paper>
                </Stack>
              </Fade>
            )}

            {/* TAB 1: GALERÍA */}
            {logic.tabValue === 1 && <ProjectGallery proyecto={proyecto} onImageClick={(url) => setLightbox({ open: true, img: url })} />}

            {/* TAB 2: LOTES */}
            {logic.tabValue === 2 && esMensual && (
              <Fade in>
                <Box>
                  <Paper variant="outlined" sx={{ mb: 4, p: 3, borderRadius: 3, bgcolor: alpha(theme.palette.warning.main, 0.05), borderColor: 'warning.light' }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center">
                      <Avatar sx={{ bgcolor: 'warning.main', width: 56, height: 56 }}><Gavel /></Avatar>
                      <Box flex={1}>
                        <Typography variant="subtitle1" fontWeight={800} color="warning.dark" gutterBottom>Sistema de Subastas</Typography>
                        <Typography variant="body2" color="text.secondary">Usa tus tokens para pujar por lotes. El token se libera si tu oferta es superada.</Typography>
                      </Box>
                      <Button variant="outlined" color="warning" size="small" sx={{ borderRadius: 2, fontWeight: 700 }} onClick={() => setTokenInfoOpen(true)}>Saber más</Button>
                    </Stack>
                  </Paper>
                  <ListaLotesProyecto idProyecto={Number(proyecto.id)} />
                </Box>
              </Fade>
            )}
          </Box>
        </Box>

        <Box sx={{ width: { xs: '100%', lg: 380 }, flexShrink: 0 }}>
          <ProjectSidebar logic={logic} proyecto={proyecto} />
        </Box>
      </Box>

      {/* MODALES */}
      <TokenInfoModal open={tokenInfoOpen} onClose={() => setTokenInfoOpen(false)} />
      <CheckoutWizardModal
          open={logic.modales.checkoutWizard.isOpen}
          onClose={logic.modales.checkoutWizard.close}
          proyecto={proyecto}
          tipo={esMensual ? 'suscripcion' : 'inversion'}
          inversionId={logic.inversionId}
          pagoId={logic.pagoId}
          onConfirmInvestment={logic.wizardCallbacks.onConfirmInvestment}
          onSubmit2FA={logic.wizardCallbacks.onSubmit2FA}
          onSignContract={logic.wizardCallbacks.onSignContract}
          isProcessing={logic.isProcessingWizard}
          error2FA={logic.error2FA}
        />
    </PageContainer>
  );
};

export default DetalleProyecto;