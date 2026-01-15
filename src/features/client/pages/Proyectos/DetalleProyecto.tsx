// src/features/client/pages/Proyectos/DetalleProyecto.tsx

import React, { useState } from 'react';
import { 
  Backdrop, Box, CircularProgress, Stack, Tab, Tabs, 
  Typography, Skeleton, Alert, Dialog, IconButton 
} from '@mui/material';
import { Info, InsertPhoto, ViewList, Close } from '@mui/icons-material';

// Hooks
import { useDetalleProyecto } from '../../hooks/useDetalleProyecto';

// Componentes
import { PageContainer } from '../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { ProjectHero } from './components/ProjectHero'; // ✅ Usamos el nuevo Hero inteligente
import { ProjectGallery } from './components/ProjectGallery';
import { ProjectSidebar } from './components/ProjectSidebar';
import { ListaLotesProyecto } from '../Lotes/ListaLotesProyecto';

// Modales
import TwoFactorAuthModal from '../../../../shared/components/domain/modals/TwoFactorAuthModal/TwoFactorAuthModal';
import ModalFirmaContrato from '../Contratos/components/ModalFirmaContrato';
import { VerContratoModal } from '../Contratos/components/VerContratoModal';
import { VerContratoFirmadoModal } from './modals/VerContratoFirmadoModal';
import { PagoExitosoModal } from './modals/PagoExitosoModal';
import { ConfirmarInversionModal } from './modals/ConfirmarInversionModal';
import { SuscribirseModal } from './modals/SuscribirseModal';

const CustomTabPanel: React.FC<{ children?: React.ReactNode; index: number; value: number }> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index} style={{ width: '100%' }}>
    {value === index && <Box sx={{ py: 3, animation: 'fadeIn 0.5s ease' }}>{children}</Box>}
  </div>
);

const DetalleProyecto: React.FC = () => {
  const logic = useDetalleProyecto();
  const [lightbox, setLightbox] = useState<{ open: boolean; img: string }>({ open: false, img: '' });

  if (logic.loadingProyecto) return (
    <PageContainer>
      <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 4 }} />
      <Box mt={4}><Skeleton width="60%" height={40} /><Skeleton width="40%" /></Box>
    </PageContainer>
  );

  if (!logic.proyecto) return <PageContainer><Alert severity="error">Proyecto no encontrado</Alert></PageContainer>;

  const { proyecto } = logic;

  return (
    <PageContainer maxWidth="xl">
      <Backdrop sx={{ color: '#fff', zIndex: 9999 }} open={logic.verificandoPago}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress color="inherit" />
          <Typography>Verificando pago...</Typography>
        </Stack>
      </Backdrop>

      {/* ✅ 1. HERO CON CARRUSEL INTEGRADO */}
      <ProjectHero proyecto={proyecto} />

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 4 }}>
        
        {/* COLUMNA IZQUIERDA */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper', overflow: 'hidden' }}>
            <Tabs 
              value={logic.tabValue} 
              onChange={(_, v) => logic.setTabValue(v)} 
              indicatorColor="primary" 
              textColor="primary" 
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab icon={<Info fontSize="small" />} iconPosition="start" label="Descripción" sx={{ minHeight: 60 }} />
              <Tab icon={<InsertPhoto fontSize="small" />} iconPosition="start" label="Galería" sx={{ minHeight: 60 }} />
              <Tab icon={<ViewList fontSize="small" />} iconPosition="start" label="Lotes" disabled={!logic.mostrarTabLotes} sx={{ minHeight: 60 }} />
            </Tabs>
            
            <Box sx={{ p: { xs: 2, md: 4 } }}>
              <CustomTabPanel value={logic.tabValue} index={0}>
                <Typography paragraph sx={{ whiteSpace: 'pre-line', lineHeight: 1.8, color: 'text.secondary' }}>
                  {proyecto.descripcion}
                </Typography>
              </CustomTabPanel>
              
              <CustomTabPanel value={logic.tabValue} index={1}>
                {/* La galería sigue siendo útil para ver todo de un vistazo */}
                <ProjectGallery 
                  imagenes={proyecto.imagenes} 
                  onImageClick={(url) => setLightbox({ open: true, img: url })} 
                />
              </CustomTabPanel>
              
              {logic.mostrarTabLotes && (
                <CustomTabPanel value={logic.tabValue} index={2}>
                  <ListaLotesProyecto idProyecto={Number(logic.id)} />
                </CustomTabPanel>
              )}
            </Box>
          </Box>
        </Box>

        {/* COLUMNA DERECHA */}
        <Box sx={{ width: { xs: '100%', lg: 380 }, flexShrink: 0 }}>
            <ProjectSidebar logic={logic} proyecto={proyecto} />
        </Box>
      </Box>

      {/* LIGHTBOX */}
      <Dialog 
        open={lightbox.open} 
        onClose={() => setLightbox({ ...lightbox, open: false })} 
        maxWidth="xl"
        PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none' } }}
      >
        <Box position="relative">
          <IconButton 
            onClick={() => setLightbox({ ...lightbox, open: false })} 
            sx={{ position: 'absolute', right: 0, top: -40, color: 'white', bgcolor: 'rgba(0,0,0,0.5)' }}
          >
            <Close />
          </IconButton>
          <img 
            src={lightbox.img} 
            alt="Full size" 
            style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 8 }} 
          />
        </Box>
      </Dialog>

      {/* MODALES */}
      {logic.user && (
        <>
           <PagoExitosoModal open={logic.modales.pagoExitoso.isOpen} onContinuar={logic.handleContinuarAFirma} />
           <ModalFirmaContrato {...logic.modales.firma.modalProps} idProyecto={Number(logic.id)} idUsuario={logic.user.id} onFirmaExitosa={logic.handleFirmaExitosa} />
           <VerContratoModal {...logic.modales.contrato.modalProps} idProyecto={Number(logic.id)} nombreProyecto={proyecto.nombre_proyecto} />
           <VerContratoFirmadoModal 
             open={logic.modales.firmado.isOpen}
             onClose={() => { logic.modales.firmado.close(); setTimeout(() => logic.setContratoFirmadoSeleccionado(null), 300); }}
             contrato={logic.contratoFirmadoSeleccionado}
           />
           <SuscribirseModal {...logic.modales.suscribirse.modalProps} proyecto={proyecto} isLoading={logic.handleInversion.isPending} onConfirm={() => logic.handleInversion.mutate()} />
           <ConfirmarInversionModal {...logic.modales.inversion.modalProps} proyecto={proyecto} isLoading={logic.handleInversion.isPending} onConfirm={() => logic.handleInversion.mutate()} />
           <TwoFactorAuthModal 
             open={logic.modales.twoFA.isOpen} 
             onClose={() => { logic.modales.twoFA.close(); logic.setError2FA(null); }} 
             onSubmit={(code) => logic.confirmar2FAMutation.mutate(code)} 
             isLoading={logic.confirmar2FAMutation.isPending} 
             error={logic.error2FA}
             title="Confirmar Transacción" 
             description="Ingresa el código de seguridad para autorizar el pago."
           />
        </>
      )}
    </PageContainer>
  );
};

export default DetalleProyecto;