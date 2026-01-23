// src/features/client/pages/Proyectos/DetalleProyecto.tsx

import React, { useState, lazy, Suspense } from 'react';
import { 
  Backdrop, Box, CircularProgress, Stack, Tab, Tabs, 
  Typography, Skeleton, Alert, Dialog, IconButton, 
  Divider, Paper 
} from '@mui/material';
import { 
  Info, InsertPhoto, ViewList, Close, LocationOn, 
  CalendarMonth, GppGood 
} from '@mui/icons-material';

// Hooks
import { useDetalleProyecto } from '../../hooks/useDetalleProyecto';

// Componentes Core (Carga inmediata)
import { PageContainer } from '../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { ProjectHero } from './components/ProjectHero';
import { ProjectSidebar } from './components/ProjectSidebar';
import type { ProyectoDto } from '@/core/types/dto/proyecto.dto';

// ✅ OPTIMIZACIÓN 1: Lazy Loading de componentes pesados
const ProjectGallery = lazy(() => import('./components/ProjectGallery').then(m => ({ default: m.ProjectGallery })));
const ListaLotesProyecto = lazy(() => import('../Lotes/ListaLotesProyecto').then(m => ({ default: m.ListaLotesProyecto })));

// ✅ OPTIMIZACIÓN 2: Lazy Loading de Modales (solo se cargan si se abren)
const TwoFactorAuthModal = lazy(() => import('../../../../shared/components/domain/modals/TwoFactorAuthModal/TwoFactorAuthModal'));
const ModalFirmaContrato = lazy(() => import('../Contratos/components/ModalFirmaContrato'));
const VerContratoModal = lazy(() => import('../Contratos/components/VerContratoModal').then(m => ({ default: m.VerContratoModal })));
const VerContratoFirmadoModal = lazy(() => import('./modals/VerContratoFirmadoModal').then(m => ({ default: m.VerContratoFirmadoModal })));
const PagoExitosoModal = lazy(() => import('./modals/PagoExitosoModal').then(m => ({ default: m.PagoExitosoModal })));
const ConfirmarInversionModal = lazy(() => import('./modals/ConfirmarInversionModal').then(m => ({ default: m.ConfirmarInversionModal })));
const SuscribirseModal = lazy(() => import('./modals/SuscribirseModal').then(m => ({ default: m.SuscribirseModal })));

// ==========================================
// SUB-COMPONENTES (UI Helpers)
// ==========================================

const CustomTabPanel: React.FC<{ children?: React.ReactNode; index: number; value: number }> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index} style={{ width: '100%' }}>
    {value === index && (
      <Box sx={{ py: 3, animation: 'fadeIn 0.4s ease-in-out', '@keyframes fadeIn': { from: { opacity: 0 }, to: { opacity: 1 } } }}>
        {children}
      </Box>
    )}
  </div>
);

const ProjectHighlights: React.FC<{ proyecto: ProyectoDto }> = ({ proyecto }) => (
  <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'background.default', border: '1px solid #e0e0e0', borderRadius: 3 }}>
    <Stack 
      direction={{ xs: 'column', sm: 'row' }} 
      spacing={3} 
      alignItems={{ xs: 'flex-start', sm: 'center' }} 
      divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />}
    >
      <HighlightItem 
        icon={<LocationOn color="error" />} 
        label="UBICACIÓN" 
        value={proyecto.latitud && proyecto.longitud ? 'Georreferenciada' : 'Consultar Zona'} 
      />
      <HighlightItem 
        icon={<CalendarMonth color="primary" />} 
        label="CIERRE PREVISTO" 
        value={new Date(proyecto.fecha_cierre).toLocaleDateString()} 
      />
      <HighlightItem 
        icon={<GppGood color="success" />} 
        label="RESPALDO" 
        value={proyecto.forma_juridica || 'Contrato Digital'} 
      />
    </Stack>
  </Paper>
);

const HighlightItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
  <Stack direction="row" alignItems="center" gap={1}>
    {icon}
    <Box>
      <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
      <Typography variant="body2" fontWeight={700}>{value}</Typography>
    </Box>
  </Stack>
);

// ✅ OPTIMIZACIÓN 3: Wrapper de Modales con Suspense
const ProjectModals: React.FC<{ logic: any, proyecto: ProyectoDto }> = ({ logic, proyecto }) => {
  if (!logic.user) return null;
  
  return (
    <Suspense fallback={null}>
      {logic.modales.pagoExitoso.isOpen && (
        <PagoExitosoModal 
          open={logic.modales.pagoExitoso.isOpen} 
          onContinuar={logic.handleContinuarAFirma} 
        />
      )}
      
      {logic.modales.firma.isOpen && (
        <ModalFirmaContrato 
          {...logic.modales.firma.modalProps} 
          idProyecto={Number(logic.id)} 
          idUsuario={logic.user.id} 
          onFirmaExitosa={logic.handleFirmaExitosa} 
        />
      )}
      
      {logic.modales.contrato.isOpen && (
        <VerContratoModal 
          {...logic.modales.contrato.modalProps} 
          idProyecto={Number(logic.id)} 
          nombreProyecto={proyecto.nombre_proyecto} 
        />
      )}
      
      {logic.modales.firmado.isOpen && (
        <VerContratoFirmadoModal 
          open={logic.modales.firmado.isOpen}
          onClose={() => { 
            logic.modales.firmado.close(); 
            setTimeout(() => logic.setContratoFirmadoSeleccionado(null), 300); 
          }}
          contrato={logic.contratoFirmadoSeleccionado}
        />
      )}
      
      {logic.modales.suscribirse.isOpen && (
        <SuscribirseModal 
          {...logic.modales.suscribirse.modalProps} 
          proyecto={proyecto} 
          isLoading={logic.handleInversion.isPending} 
          onConfirm={() => logic.handleInversion.mutate()} 
        />
      )}
      
      {logic.modales.inversion.isOpen && (
        <ConfirmarInversionModal 
          {...logic.modales.inversion.modalProps} 
          proyecto={proyecto} 
          isLoading={logic.handleInversion.isPending} 
          onConfirm={() => logic.handleInversion.mutate()} 
        />
      )}
      
      {logic.modales.twoFA.isOpen && (
        <TwoFactorAuthModal 
          open={logic.modales.twoFA.isOpen} 
          onClose={() => { 
            logic.modales.twoFA.close(); 
            logic.setError2FA(null); 
          }} 
          onSubmit={(code) => logic.confirmar2FAMutation.mutate(code)} 
          isLoading={logic.confirmar2FAMutation.isPending} 
          error={logic.error2FA}
          title="Confirmar Transacción" 
          description="Ingresa el código de seguridad para autorizar el pago."
        />
      )}
    </Suspense>
  );
};

// ✅ OPTIMIZACIÓN 4: Skeleton específico para tabs
const TabContentSkeleton = () => (
  <Box py={3}>
    <Skeleton variant="text" width="40%" height={40} sx={{ mb: 2 }} />
    <Skeleton variant="text" width="100%" height={20} />
    <Skeleton variant="text" width="100%" height={20} />
    <Skeleton variant="text" width="80%" height={20} />
  </Box>
);

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
const DetalleProyecto: React.FC = () => {
  const logic = useDetalleProyecto();
  const [lightbox, setLightbox] = useState<{ open: boolean; img: string }>({ open: false, img: '' });

  // --- Estados de Carga y Error ---
  if (logic.loadingProyecto) return <LoadingSkeleton />;
  if (!logic.proyecto) return (
    <PageContainer>
      <Alert severity="error" variant="outlined">Proyecto no encontrado o no disponible.</Alert>
    </PageContainer>
  );

  const { proyecto } = logic;

  return (
    <PageContainer maxWidth="xl" sx={{ pb: 8 }}>
      
      {/* Overlay global */}
      <Backdrop sx={{ color: '#fff', zIndex: 9999, flexDirection: 'column', gap: 2 }} open={logic.verificandoPago}>
        <CircularProgress color="inherit" size={60} />
        <Typography variant="h6" fontWeight={600}>Verificando transacción...</Typography>
      </Backdrop>

      <ProjectHero proyecto={proyecto} />

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 5, alignItems: 'flex-start' }}>
        
        {/* === COLUMNA PRINCIPAL === */}
        <Box sx={{ flex: 1, width: '100%', minWidth: 0 }}>
          <ProjectHighlights proyecto={proyecto} />

          {/* Tabs Header */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={logic.tabValue} 
              onChange={logic.handleTabChange}
            >
              <Tab icon={<Info fontSize="small" />} iconPosition="start" label="Visión General" />
              <Tab icon={<InsertPhoto fontSize="small" />} iconPosition="start" label="Galería" />
              {logic.mostrarTabLotes && (
                <Tab icon={<ViewList fontSize="small" />} iconPosition="start" label="Inventario de Lotes" />
              )}
            </Tabs>
          </Box>

          {/* ✅ OPTIMIZACIÓN 5: Tabs Content con Suspense */}
          <Box sx={{ minHeight: 400 }}>
            {/* Index 0: Descripción */}
            <CustomTabPanel value={logic.tabValue} index={0}>
              <Typography variant="h5" fontWeight={800} gutterBottom>Sobre este proyecto</Typography>
              <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-line', lineHeight: 1.8, color: 'text.secondary', fontSize: '1.05rem' }}>
                {proyecto.descripcion}
              </Typography>
            </CustomTabPanel>
            
            {/* Index 1: Galería (Lazy) */}
            <CustomTabPanel value={logic.tabValue} index={1}>
              <Suspense fallback={<TabContentSkeleton />}>
                <ProjectGallery proyecto={proyecto} onImageClick={(url) => setLightbox({ open: true, img: url })} />
              </Suspense>
            </CustomTabPanel>
            
            {/* Index 2: Lotes (Lazy) */}
            {logic.mostrarTabLotes && (
              <CustomTabPanel value={logic.tabValue} index={2}>
                <Suspense fallback={<TabContentSkeleton />}>
                  <ListaLotesProyecto idProyecto={Number(logic.id)} />
                </Suspense>
              </CustomTabPanel>
            )}
          </Box>
        </Box>

        {/* === SIDEBAR (STICKY) === */}
        <Box sx={{ width: { xs: '100%', lg: 380 }, flexShrink: 0 }}>
           <ProjectSidebar logic={logic} proyecto={proyecto} />
        </Box>
      </Box>

      {/* --- UI ELEMENTS (Lightbox & Modals) --- */}
      <LightboxViewer 
        isOpen={lightbox.open} 
        imgSrc={lightbox.img} 
        onClose={() => setLightbox({ ...lightbox, open: false })} 
      />

      <ProjectModals logic={logic} proyecto={proyecto} />

    </PageContainer>
  );
};

// ==========================================
// COMPONENTES AUXILIARES
// ==========================================

const LoadingSkeleton = () => (
  <PageContainer>
    <Skeleton variant="rectangular" height={500} sx={{ borderRadius: 4, mb: 4 }} animation="wave" />
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 4 }}>
      <Skeleton sx={{ flex: 1, height: 300, borderRadius: 3 }} animation="wave" />
      <Skeleton sx={{ width: { xs: '100%', lg: 380 }, height: 400, borderRadius: 3 }} animation="wave" />
    </Box>
  </PageContainer>
);

const LightboxViewer: React.FC<{ isOpen: boolean, imgSrc: string, onClose: () => void }> = ({ isOpen, imgSrc, onClose }) => (
  <Dialog 
    open={isOpen} 
    onClose={onClose} 
    maxWidth="xl"
    PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none', overflow: 'hidden' } }}
  >
    <Box position="relative">
      <IconButton 
        onClick={onClose} 
        sx={{ position: 'absolute', right: 0, top: 0, m: 2, color: 'white', bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}
      >
        <Close />
      </IconButton>
      <img 
        src={imgSrc} 
        alt="Zoom Detalle" 
        loading="lazy"
        style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 8, display: 'block' }} 
      />
    </Box>
  </Dialog>
);
  
export default DetalleProyecto;