// src/features/client/pages/Proyectos/DetalleProyecto.tsx

import React, { useState } from 'react';
import { 
  Backdrop, Box, CircularProgress, Stack, Tab, Tabs, 
  Typography, Skeleton, Alert, Dialog, IconButton, 
  Divider, Paper, Fade
} from '@mui/material';
import { 
  Info, InsertPhoto, ViewList, Close, LocationOn, 
  CalendarMonth, GppGood 
} from '@mui/icons-material';

// Hooks
import { useDetalleProyecto } from '../../hooks/useDetalleProyecto';

// Componentes
import { PageContainer } from '@/shared/components/layout/containers/PageContainer/PageContainer';
import { ProjectHero } from './components/ProjectHero';
import { ProjectGallery } from './components/ProjectGallery';
import { ProjectSidebar } from './components/ProjectSidebar';
import { ListaLotesProyecto } from '../Lotes/ListaLotesProyecto';

// Modales
import { CheckoutWizardModal } from './modals/CheckoutWizardModal';

// Types
import type { ProyectoDto } from '@/core/types/dto/proyecto.dto';

// ==========================================
// SUB-COMPONENTES (UI Helpers)
// ==========================================

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const CustomTabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index} style={{ width: '100%' }}>
    {value === index && (
      <Fade in={value === index} timeout={500}>
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      </Fade>
    )}
  </div>
);

const ProjectHighlights: React.FC<{ proyecto: ProyectoDto }> = ({ proyecto }) => (
  <Paper 
    elevation={0} 
    sx={{ 
      p: 2, 
      mb: 3, 
      bgcolor: 'background.default', 
      border: '1px solid', 
      borderColor: 'divider', 
      borderRadius: 3 
    }}
  >
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

// ✅ WRAPPER DE MODALES (Conectado a useDetalleProyecto)
const ProjectModals: React.FC<{ logic: any, proyecto: ProyectoDto }> = ({ logic, proyecto }) => {
  if (!logic.user) return null;
  
  return (
    <CheckoutWizardModal
      // --- Control de Estado ---
      open={logic.modales.checkoutWizard.isOpen}
      onClose={logic.modales.checkoutWizard.close}
      
      // --- Datos ---
      proyecto={proyecto}
      tipo={proyecto.tipo_inversion === 'mensual' ? 'suscripcion' : 'inversion'}
      inversionId={logic.inversionId} 
      pagoId={logic.pagoId}
      
      // --- Callbacks de Lógica (Desde el Hook) ---
      onConfirmInvestment={logic.wizardCallbacks.onConfirmInvestment}
      onSubmit2FA={logic.wizardCallbacks.onSubmit2FA}
      onSignContract={logic.wizardCallbacks.onSignContract}
      
      // --- Feedback UI ---
      isProcessing={logic.isProcessingWizard}
      error2FA={logic.error2FA}
    />
  );
};

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
      
      {/* Overlay global para cuando vuelve de Mercado Pago */}
      <Backdrop 
        sx={{ color: '#fff', zIndex: 9999, flexDirection: 'column', gap: 2 }} 
        open={logic.verificandoPago}
      >
        <CircularProgress color="inherit" size={60} />
        <Typography variant="h6" fontWeight={600}>Verificando transacción...</Typography>
        <Typography variant="body2" color="inherit" sx={{ opacity: 0.8 }}>
          Por favor no cierres esta ventana
        </Typography>
      </Backdrop>

      {/* Hero Section */}
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
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab icon={<Info fontSize="small" />} iconPosition="start" label="Visión General" />
              <Tab icon={<InsertPhoto fontSize="small" />} iconPosition="start" label="Galería" />
              {logic.mostrarTabLotes && (
                <Tab icon={<ViewList fontSize="small" />} iconPosition="start" label="Inventario de Lotes" />
              )}
            </Tabs>
          </Box>

          {/* Tabs Content */}
          <Box sx={{ minHeight: 400 }}>
            {/* Tab 0: Visión General */}
            <CustomTabPanel value={logic.tabValue} index={0}>
              <Typography variant="h5" fontWeight={800} gutterBottom>
                Sobre este proyecto
              </Typography>
              <Typography 
                variant="body1" 
                paragraph 
                sx={{ 
                  whiteSpace: 'pre-line', 
                  lineHeight: 1.8, 
                  color: 'text.secondary', 
                  fontSize: '1.05rem' 
                }}
              >
                {proyecto.descripcion}
              </Typography>
            </CustomTabPanel>
            
            {/* Tab 1: Galería */}
            <CustomTabPanel value={logic.tabValue} index={1}>
              <ProjectGallery 
                proyecto={proyecto} 
                onImageClick={(url) => setLightbox({ open: true, img: url })} 
              />
            </CustomTabPanel>
            
            {/* Tab 2: Lotes */}
            {logic.mostrarTabLotes && (
              <CustomTabPanel value={logic.tabValue} index={2}>
                <ListaLotesProyecto idProyecto={Number(logic.id)} />
              </CustomTabPanel>
            )}
          </Box>
        </Box>

        {/* === SIDEBAR (STICKY) === */}
        <Box sx={{ width: { xs: '100%', lg: 380 }, flexShrink: 0 }}>
           <ProjectSidebar logic={logic} proyecto={proyecto} />
        </Box>
      </Box>

      {/* --- Elementos Flotantes --- */}
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
    <Skeleton variant="rectangular" height={500} sx={{ borderRadius: 4, mb: 4 }} />
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 4 }}>
      <Skeleton sx={{ flex: 1, height: 300, borderRadius: 3 }} />
      <Skeleton sx={{ width: { xs: '100%', lg: 380 }, height: 400, borderRadius: 3 }} />
    </Box>
  </PageContainer>
);

const LightboxViewer: React.FC<{ isOpen: boolean, imgSrc: string, onClose: () => void }> = ({ isOpen, imgSrc, onClose }) => (
  <Dialog 
    open={isOpen} 
    onClose={onClose} 
    maxWidth="xl"
    PaperProps={{ 
      sx: { 
        bgcolor: 'transparent', 
        boxShadow: 'none', 
        overflow: 'hidden' 
      } 
    }}
  >
    <Box position="relative">
      <IconButton 
        onClick={onClose} 
        sx={{ 
          position: 'absolute', 
          right: 0, 
          top: 0, 
          m: 2, 
          color: 'white', 
          bgcolor: 'rgba(0,0,0,0.5)', 
          '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } 
        }}
      >
        <Close />
      </IconButton>
      <img 
        src={imgSrc} 
        alt="Zoom Detalle" 
        style={{ 
          maxWidth: '100%', 
          maxHeight: '90vh', 
          borderRadius: 8, 
          display: 'block' 
        }} 
      />
    </Box>
  </Dialog>
);
  
export default DetalleProyecto;