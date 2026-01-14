import React, { useState } from 'react';
import {
  ArrowForward, CheckCircle, Description, GppGood,
  Info, InsertPhoto, MonetizationOn, Security, ViewList, Close
} from '@mui/icons-material';
import {
  Alert, Backdrop, Box, Button, Card, CardContent, Chip,
  CircularProgress, Divider, LinearProgress, Skeleton, Stack,
  Tab, Tabs, Tooltip, Typography, alpha, useTheme, CardMedia,
  Dialog, IconButton, Paper
} from '@mui/material';

// Componentes
import { PageContainer } from '../../../../shared/components/layout/containers/PageContainer/PageContainer';
import TwoFactorAuthModal from '../../../../shared/components/domain/modals/TwoFactorAuthModal/TwoFactorAuthModal';
import ModalFirmaContrato from '../Contratos/components/ModalFirmaContrato';
import { VerContratoModal } from '../Contratos/components/VerContratoModal';
import { ListaLotesProyecto } from '../Lotes/ListaLotesProyecto';
import { ConfirmarInversionModal } from './components/ConfirmarInversionModal';
import { PagoExitosoModal } from './components/PagoExitosoModal';
import { SuscribirseModal } from './components/SuscribirseModal';
import { VerContratoFirmadoModal } from './components/VerContratoFirmadoModal';
import { useDetalleProyecto } from '../../hooks/useDetalleProyecto';
import ImagenService from '../../../services/imagen.service';

// --- HELPER PARA TABS ---
interface TabPanelProps { children?: React.ReactNode; index: number; value: number; }
const CustomTabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index} style={{ width: '100%' }}>
    {value === index && <Box sx={{ py: 3, animation: 'fadeIn 0.5s ease' }}>{children}</Box>}
  </div>
);

const DetalleProyecto: React.FC = () => {
  const theme = useTheme();
  const logic = useDetalleProyecto();

  // --- ESTADOS PARA LIGHTBOX (Mejora UX 1) ---
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImg, setSelectedImg] = useState('');

  // --- LOADING STATE ---
  if (logic.loadingProyecto) return (
    <PageContainer>
      <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 4 }} />
      <Box mt={4}><Skeleton width="60%" height={40} /><Skeleton width="40%" /></Box>
    </PageContainer>
  );

  if (!logic.proyecto) return <PageContainer><Alert severity="error">Proyecto no encontrado</Alert></PageContainer>;

  const { proyecto } = logic;

  // Handler para abrir imagen
  const handleOpenImage = (url: string) => {
    setSelectedImg(url);
    setLightboxOpen(true);
  };

  return (
    <PageContainer maxWidth="xl">
      <Backdrop sx={{ color: '#fff', zIndex: 9999 }} open={logic.verificandoPago}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress color="inherit" />
          <Typography>Verificando pago...</Typography>
        </Stack>
      </Backdrop>

      {/* =========================================================
          HERO IMAGE (Mejora UX 3: Glassmorphism)
         ========================================================= */}
      <Box sx={{ position: 'relative', height: { xs: 300, sm: 400, md: 500 }, borderRadius: 4, overflow: 'hidden', mb: 4, boxShadow: theme.shadows[6] }}>
        <Box component="img" src={logic.coverImage} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        
        {/* Overlay Cristal */}
        <Box sx={{ 
            position: 'absolute', 
            bottom: 24, left: 24, right: 24, 
            background: 'rgba(0, 0, 0, 0.65)', 
            backdropFilter: 'blur(12px)',
            borderRadius: 3, 
            p: { xs: 2.5, md: 4 }, 
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            maxWidth: 900
        }}>
          <Stack direction="row" spacing={1} mb={2}>
            <Chip label={proyecto.tipo_inversion === 'mensual' ? 'Plan de Ahorro' : 'Inversión Directa'} color="primary" size="small" sx={{ fontWeight: 700, borderRadius: 1 }} />
            <Chip label={proyecto.estado_proyecto} size="small" sx={{ fontWeight: 600, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.15)', color: 'white' }} />
          </Stack>
          <Typography variant="h3" fontWeight={800} sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)', fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3rem' }, lineHeight: 1.1 }}>
            {proyecto.nombre_proyecto}
          </Typography>
        </Box>
      </Box>

      {/* =========================================================
          LAYOUT PRINCIPAL
         ========================================================= */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 4 }}>
        
        {/* --- COLUMNA IZQUIERDA: Tabs --- */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, overflow: 'hidden' }}>
            <Tabs value={logic.tabValue} onChange={(_, v) => logic.setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }} indicatorColor="primary" textColor="primary" variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile>
              <Tab icon={<Info fontSize="small" />} iconPosition="start" label="Descripción" sx={{ fontWeight: 600, minHeight: 60 }} />
              <Tab icon={<InsertPhoto fontSize="small" />} iconPosition="start" label="Galería" sx={{ fontWeight: 600, minHeight: 60 }} />
              <Tab icon={<ViewList fontSize="small" />} iconPosition="start" label="Lotes Disponibles" disabled={!logic.mostrarTabLotes} sx={{ fontWeight: 600, minHeight: 60 }} />
            </Tabs>
            
            <CardContent sx={{ p: { xs: 2, md: 4 } }}>
              {/* TAB 0: DESCRIPCION */}
              <CustomTabPanel value={logic.tabValue} index={0}>
                <Typography paragraph sx={{ whiteSpace: 'pre-line', lineHeight: 1.8, color: 'text.secondary', fontSize: { xs: '0.9rem', md: '1rem' } }}>
                  {proyecto.descripcion}
                </Typography>
              </CustomTabPanel>
              
              {/* TAB 1: GALERIA (Mejora UX 1: Click para Lightbox) */}
              <CustomTabPanel value={logic.tabValue} index={1}>
                <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, 
                    gap: 2 
                }}>
                  {proyecto.imagenes?.map((img) => {
                    const imgUrl = ImagenService.resolveImageUrl(img.url);
                    return (
                      <Card 
                        key={img.id}
                        variant="outlined"
                        onClick={() => handleOpenImage(imgUrl)} // Abre lightbox
                        sx={{
                          borderRadius: 3, overflow: 'hidden', cursor: 'pointer',
                          borderColor: theme.palette.divider,
                          transition: 'all 0.3s ease',
                          position: 'relative',
                          '&:hover': { 
                            transform: 'translateY(-4px)', 
                            boxShadow: theme.shadows[8],
                            borderColor: 'primary.main',
                            '& img': { transform: 'scale(1.05)' }
                          }
                        }}
                      >
                        <CardMedia
                          component="img"
                          sx={{ height: 200, objectFit: 'cover', width: '100%', transition: 'transform 0.5s ease' }}
                          image={imgUrl}
                          alt="Galería del proyecto"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/assets/placeholder-lote.jpg'; }}
                        />
                      </Card>
                    );
                  })}
                  {(!proyecto.imagenes || proyecto.imagenes.length === 0) && (
                     <Alert severity="info" variant="outlined" sx={{ gridColumn: '1 / -1' }}>No hay imágenes disponibles en la galería.</Alert>
                  )}
                </Box>
              </CustomTabPanel>
              
              {/* TAB 2: LISTA LOTES */}
              {logic.mostrarTabLotes && (
                <CustomTabPanel value={logic.tabValue} index={2}>
                  <ListaLotesProyecto idProyecto={Number(logic.id)} />
                </CustomTabPanel>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* --- COLUMNA DERECHA: Sidebar Sticky --- */}
        <Box sx={{ width: { xs: '100%', lg: 380 }, flexShrink: 0 }}>
          <Card elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, position: { lg: 'sticky' }, top: { lg: 100 }, border: `1px solid ${theme.palette.divider}`, boxShadow: theme.shadows[2] }}>
            
            <Typography variant="h6" fontWeight="bold" gutterBottom>Resumen de Inversión</Typography>
            <Divider sx={{ my: 2 }} />
            
            <Stack spacing={3}>
              {/* Tarjeta de Precio (Mejora UX 4) */}
              <Box sx={{ 
                  position: 'relative', overflow: 'hidden', 
                  bgcolor: 'background.paper', p: 3, borderRadius: 3, 
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                  boxShadow: `0 8px 30px ${alpha(theme.palette.primary.main, 0.12)}`
              }}>
                <Box sx={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, bgcolor: alpha(theme.palette.primary.main, 0.08), borderRadius: '50%' }} />
                
                <Stack direction="row" spacing={1} alignItems="center" color="text.secondary" mb={1}>
                  <MonetizationOn color="primary" fontSize="small" />
                  <Typography variant="overline" fontWeight={700}>Valor del Proyecto</Typography>
                </Stack>
                
                <Typography variant="h3" color="primary.main" fontWeight={800} sx={{ fontSize: { xs: '2rem', md: '2.5rem' }, letterSpacing: -1 }}>
                  {Number(proyecto.monto_inversion).toLocaleString()}
                  <Typography component="span" variant="h6" color="text.secondary" fontWeight={600} ml={1}>{proyecto.moneda}</Typography>
                </Typography>
              </Box>

              {/* Barra de Progreso */}
              {proyecto.tipo_inversion === 'mensual' && (
                <Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="caption" fontWeight="bold" color="text.secondary">PROGRESO DE FONDEO</Typography>
                    <Typography variant="caption" fontWeight="bold" color="primary">{logic.porcentaje.toFixed(0)}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={logic.porcentaje} sx={{ height: 10, borderRadius: 5, bgcolor: alpha(theme.palette.primary.main, 0.1), '& .MuiLinearProgress-bar': { borderRadius: 5 } }} />
                </Box>
              )}

              {/* Alertas de Seguridad */}
              {logic.is2FAMissing && logic.user && (
                <Alert severity="warning" icon={<Security fontSize="inherit" />} sx={{ borderRadius: 2 }}>
                  <Typography variant="body2" fontWeight="bold">Seguridad Requerida</Typography>
                  <Button size="small" color="warning" onClick={logic.handleClickFirmar} sx={{ mt: 1, textTransform: 'none', fontWeight: 600 }}>Configurar 2FA ahora</Button>
                </Alert>
              )}

              {/* Botón de Acción Principal */}
              {!logic.yaFirmo && !logic.puedeFirmar && (
                <Tooltip title={logic.is2FAMissing && logic.user ? "Activa 2FA para continuar" : ""}>
                  <Box>
                    <Button 
                      variant="contained" size="large" fullWidth 
                      disabled={logic.handleInversion.isPending || (logic.is2FAMissing && !!logic.user)}
                      onClick={logic.handleMainAction}
                      endIcon={!logic.handleInversion.isPending && <ArrowForward />}
                      sx={{ py: 1.5, fontSize: '1rem', fontWeight: 700, borderRadius: 2, boxShadow: theme.shadows[4] }}
                    >
                      {logic.handleInversion.isPending ? 'Procesando...' : proyecto.tipo_inversion === 'mensual' ? 'Suscribirme Ahora' : 'Invertir Ahora'}
                    </Button>
                  </Box>
                </Tooltip>
              )}

              {/* Acciones para Usuario con Inversión Activa */}
              {logic.user && (proyecto.tipo_inversion === 'mensual' || proyecto.tipo_inversion === 'directo') && (
                <Stack spacing={2}>
                  {logic.yaFirmo ? (
                    <Button variant="contained" color="success" fullWidth startIcon={<CheckCircle />} onClick={logic.handleVerContratoFirmado} sx={{ fontWeight: 700, borderRadius: 2, py: 1.2 }}>
                      Ver Contrato Firmado
                    </Button>
                  ) : logic.puedeFirmar ? (
                    <Button variant="outlined" color="success" startIcon={<GppGood />} fullWidth onClick={logic.handleClickFirmar} disabled={logic.is2FAMissing} sx={{ borderWidth: 2, fontWeight: 700, borderRadius: 2, py: 1.2, '&:hover': { borderWidth: 2 } }}>
                      Firmar Contrato (Pendiente)
                    </Button>
                  ) : (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      <Typography variant="caption">Realiza el pago inicial para habilitar la firma del contrato.</Typography>
                    </Alert>
                  )}
                  
                  {!logic.yaFirmo && (
                    <Button variant="text" fullWidth startIcon={<Description />} onClick={logic.modales.contrato.open} sx={{ color: 'text.secondary', borderRadius: 2 }}>
                      Ver Modelo de Contrato
                    </Button>
                  )}
                </Stack>
              )}
            </Stack>
          </Card>
        </Box>
      </Box>

      {/* =========================================================
          STICKY FOOTER MOBILE (Mejora UX 2)
         ========================================================= */}
      <Paper 
        sx={{ 
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
          p: 2, display: { xs: 'flex', lg: 'none' }, // Solo visible en móvil
          alignItems: 'center', justifyContent: 'space-between',
          borderTop: `1px solid ${theme.palette.divider}`,
          boxShadow: '0px -4px 20px rgba(0,0,0,0.1)'
        }} 
        elevation={3}
      >
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">Inversión Total</Typography>
          <Typography variant="h6" color="primary.main" fontWeight={800} lineHeight={1}>
            {proyecto.moneda} {Number(proyecto.monto_inversion).toLocaleString()}
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          onClick={logic.handleMainAction}
          disabled={logic.handleInversion.isPending}
          sx={{ fontWeight: 700, borderRadius: 2, px: 3 }}
        >
          {proyecto.tipo_inversion === 'mensual' ? 'Suscribirse' : 'Invertir'}
        </Button>
      </Paper>
      {/* Espaciador para que el footer no tape contenido */}
      <Box sx={{ height: { xs: 80, lg: 0 } }} />

      {/* =========================================================
          MODALES DE LÓGICA Y LIGHTBOX
         ========================================================= */}
      
      {/* LIGHTBOX (Visor de Imágenes) */}
      <Dialog 
        open={lightboxOpen} 
        onClose={() => setLightboxOpen(false)} 
        maxWidth="xl"
        PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none', overflow: 'hidden' } }}
      >
        <Box position="relative">
          <IconButton 
            onClick={() => setLightboxOpen(false)}
            sx={{ position: 'absolute', right: 0, top: -40, color: 'white', bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}
          >
            <Close />
          </IconButton>
          <img src={selectedImg} alt="Detalle" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 8, display: 'block' }} />
        </Box>
      </Dialog>

      {/* Modales de Negocio (Existentes) */}
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