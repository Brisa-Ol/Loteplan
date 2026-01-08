import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Box, Typography, Button, Stack, Chip, LinearProgress, 
  Divider, Tabs, Tab, Skeleton, Alert, Tooltip,
  Backdrop, CircularProgress, useTheme, alpha, Card, CardContent
} from '@mui/material';
import { 
  GppGood, Security, CheckCircle, MonetizationOn, Description, 
  ArrowForward, InsertPhoto, ViewList, Info
} from '@mui/icons-material';

// --- SERVICIOS ---
import ProyectoService from '../../../services/proyecto.service';
import SuscripcionService from '../../../services/suscripcion.service';
import InversionService from '../../../services/inversion.service';
import ImagenService from '../../../services/imagen.service';
import TransaccionService from '../../../services/transaccion.service';
import ContratoService from '../../../services/contrato.service';
import MercadoPagoService from '../../../services/pagoMercado.service';

// --- TIPOS ---
import type { ContratoFirmadoDto } from '../../../types/dto/contrato.dto';

// --- HOOKS Y CONTEXTO ---
import { useModal } from '../../../hooks/useModal';
import { useAuth } from '../../../context/AuthContext';
import { useSnackbar } from '../../../context/SnackbarContext';

// --- COMPONENTES COMUNES ---
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import TwoFactorAuthModal from '../../../components/common/TwoFactorAuthModal/TwoFactorAuthModal';

// --- COMPONENTES ESPECÍFICOS ---
import ModalFirmaContrato from '../Contratos/components/ModalFirmaContrato';
import { VerContratoModal } from '../Contratos/components/VerContratoModal';
import { ListaLotesProyecto } from '../Lotes/ListaLotesProyecto';
import { PagoExitosoModal } from './components/PagoExitosoModal'; 
import { VerContratoFirmadoModal } from './components/VerContratoFirmadoModal';
import { SuscribirseModal } from './components/SuscribirseModal';
import { ConfirmarInversionModal } from './components/ConfirmarInversionModal';

// Helper de Tabs
interface TabPanelProps { children?: React.ReactNode; index: number; value: number; }
function CustomTabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index} {...other} style={{ width: '100%' }}>
        {value === index && <Box sx={{ py: 3, animation: 'fadeIn 0.5s ease' }}>{children}</Box>}
    </div>
  );
}

const DetalleProyecto: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation(); 
  const { user } = useAuth(); 
  const queryClient = useQueryClient();
  const theme = useTheme();
  const { showSuccess, showError, showInfo } = useSnackbar();
  
  // --- ESTADOS ---
  const [tabValue, setTabValue] = useState(0);
  const [yaFirmo, setYaFirmo] = useState(false); 
  const [puedeFirmar, setPuedeFirmar] = useState(false);
  const [contratoFirmadoSeleccionado, setContratoFirmadoSeleccionado] = useState<ContratoFirmadoDto | null>(null);
  
  // --- MODALES ---
  const firmaModal = useModal();
  const contratoModal = useModal();     
  const firmadoModal = useModal();       
  const suscribirseModal = useModal();  
  const inversionModal = useModal();    
  const pagoExitosoModal = useModal();
  const twoFAModal = useModal();
  
  // --- ESTADOS PROCESO ---
  const [verificandoPago, setVerificandoPago] = useState(false);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [pendingTransactionId, setPendingTransactionId] = useState<number | null>(null);
  const [error2FA, setError2FA] = useState<string | null>(null);

  // ==========================================
  // QUERIES
  // ==========================================
  const { data: proyecto, isLoading } = useQuery({
    queryKey: ['proyecto', id],
    queryFn: async () => (await ProyectoService.getByIdActive(Number(id))).data,
    retry: false
  });

  const { data: misContratos } = useQuery({
    queryKey: ['misContratos'],
    queryFn: async () => (await ContratoService.getMyContracts()).data,
    enabled: !!user,
  });

  const { data: misInversiones } = useQuery({
    queryKey: ['misInversiones'],
    queryFn: async () => (await InversionService.getMisInversiones()).data,
    enabled: !!user && proyecto?.tipo_inversion === 'directo',
  });

  const { data: misSuscripciones } = useQuery({
    queryKey: ['misSuscripciones'],
    queryFn: async () => (await SuscripcionService.getMisSuscripciones()).data,
    enabled: !!user && proyecto?.tipo_inversion === 'mensual',
  });

  // ==========================================
  // EFECTOS
  // ==========================================
  useEffect(() => {
    if (misContratos && proyecto) {
      const contrato = misContratos.find(c => c.id_proyecto === proyecto.id && c.estado_firma === 'FIRMADO');
      if (contrato) setYaFirmo(true);
    }
  }, [misContratos, proyecto]);

  useEffect(() => {
    if (!proyecto || !user) return;
    let tienePermiso = false;
    if (proyecto.tipo_inversion === 'directo' && misInversiones) {
      const inv = misInversiones.find(i => i.id_proyecto === proyecto.id && i.estado === 'pagado');
      if (inv) tienePermiso = true;
    } else if (proyecto.tipo_inversion === 'mensual' && misSuscripciones) {
      const sub = misSuscripciones.find(s => s.id_proyecto === proyecto.id && s.activo);
      if (sub) tienePermiso = true;
    }
    setPuedeFirmar(tienePermiso);
  }, [proyecto, user, misInversiones, misSuscripciones]);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const status = query.get('status');
    const externalReference = query.get('external_reference'); 

    if (status === 'approved' && externalReference && !pagoExitosoModal.isOpen) {
        verificarEstadoPago(Number(externalReference));
    } else if (status === 'failure' || status === 'rejected') {
        showError("El pago fue rechazado o no se completó.");
        limpiarUrl();
    }
    return () => { if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current); };
  }, [location]);

  const limpiarUrl = () => window.history.replaceState({}, document.title, window.location.pathname);

  const verificarEstadoPago = async (transaccionId: number, intentos = 0) => {
      setVerificandoPago(true);
      try {
          const { data } = await TransaccionService.getMyTransactionById(transaccionId);
          if (data.estado_transaccion === 'pagado') {
              setVerificandoPago(false);
              limpiarUrl();
              queryClient.invalidateQueries({ queryKey: ['misInversiones'] });
              queryClient.invalidateQueries({ queryKey: ['misSuscripciones'] });
              pagoExitosoModal.open(); 
          } else {
              if (intentos < 10) { 
                  pollingTimeoutRef.current = setTimeout(() => verificarEstadoPago(transaccionId, intentos + 1), 3000);
              } else {
                  setVerificandoPago(false);
                  showInfo("Pago aprobado en MP. Espera unos minutos a que impacte en el sistema.");
                  limpiarUrl();
              }
          }
      } catch (error) {
          setVerificandoPago(false);
      }
  };

  // ==========================================
  // MUTACIONES
  // ==========================================
  const handleInversion = useMutation({
    mutationFn: async () => {
      if (!proyecto) throw new Error("Error de proyecto");
      let initResponse: any;
      let modelType: 'pago' | 'inversion';
      
      if (proyecto.tipo_inversion === 'mensual') {
         const res = await SuscripcionService.iniciar({ id_proyecto: proyecto.id });
         initResponse = res.data;
         modelType = 'pago'; 
      } else {
         const res = await InversionService.iniciar({ id_proyecto: proyecto.id });
         initResponse = res.data;
         modelType = 'inversion';
      }

      if (initResponse.redirectUrl) return initResponse;
      const idParaCheckout = initResponse.pagoId || initResponse.inversionId || initResponse.id;
      if (!idParaCheckout) return initResponse;

      const checkoutRes = await MercadoPagoService.iniciarCheckoutModelo(modelType, idParaCheckout);
      return { ...initResponse, ...checkoutRes.data };
    },
    onSuccess: (data: any) => {
      suscribirseModal.close(); 
      inversionModal.close();
      if (data.is2FARequired && data.transaccionId) {
        setPendingTransactionId(data.transaccionId);
        twoFAModal.open();
        return;
      } 
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      } 
      manejarRedireccionExito(data);
    },
    onError: () => {
      suscribirseModal.close(); 
      inversionModal.close();
    }
  });

  const confirmar2FAMutation = useMutation({
    mutationFn: async (codigo: string) => {
      if (!pendingTransactionId) throw new Error("ID perdido");
      return (await SuscripcionService.confirmar2FA({ transaccionId: pendingTransactionId, codigo_2fa: codigo })).data;
    },
    onSuccess: (data) => {
      twoFAModal.close(); setError2FA(null);
      if (data.redirectUrl) window.location.href = data.redirectUrl;
      else manejarRedireccionExito(data);
    },
    onError: (err: any) => setError2FA(err.response?.data?.message || "Código incorrecto")
  });

  const manejarRedireccionExito = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['misInversiones'] });
      queryClient.invalidateQueries({ queryKey: ['misSuscripciones'] });
      pagoExitosoModal.open();
  };

  // ==========================================
  // HANDLERS & RENDER
  // ==========================================
  const handleContinuarAFirma = () => {
    pagoExitosoModal.close(); 
    setTimeout(() => { setPuedeFirmar(true); firmaModal.open(); }, 500);
  };

  const handleFirmaExitosa = () => {
    setYaFirmo(true);
    firmaModal.close();
    queryClient.invalidateQueries({ queryKey: ['misContratos'] });
    showSuccess("Contrato firmado correctamente");
  };

  const handleVerContratoFirmado = () => {
    if (!misContratos || !proyecto) return;
    const contrato = misContratos.find(c => c.id_proyecto === proyecto.id && c.estado_firma === 'FIRMADO');
    if (contrato) {
        setContratoFirmadoSeleccionado(contrato);
        firmadoModal.open(); 
    }
  };

  const is2FAMissing = !!(user && !user.is_2fa_enabled);
  const handleMainAction = () => {
    if (!user) return navigate('/login', { state: { from: window.location.pathname }});
    if (proyecto?.tipo_inversion === 'mensual') suscribirseModal.open();
    else inversionModal.open();
  };

  const handleClickFirmar = () => {
    if (!user) return;
    if (is2FAMissing) { navigate('/client/MiCuenta/SecuritySettings'); return; }
    firmaModal.open();
  };

  const coverImage = proyecto?.imagenes?.[0] ? ImagenService.resolveImageUrl(proyecto.imagenes[0].url) : '/assets/placeholder-project.jpg'; 
  const porcentaje = (proyecto?.tipo_inversion === 'mensual' && proyecto?.obj_suscripciones > 0) ? (proyecto.suscripciones_actuales / proyecto.obj_suscripciones) * 100 : 0;
  const mostrarTabLotes = proyecto?.tipo_inversion === 'directo' || (proyecto?.lotes && proyecto.lotes.length > 0);

  if (isLoading) return (
    <PageContainer>
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 4 }} />
        <Box mt={4}><Skeleton width="60%" height={40} /><Skeleton width="40%" /></Box>
    </PageContainer>
  );
  
  if (!proyecto) return <PageContainer><Alert severity="error">Proyecto no encontrado</Alert></PageContainer>;

  return (
    <PageContainer maxWidth="xl">
      <Backdrop sx={{ color: '#fff', zIndex: 9999 }} open={verificandoPago}>
        <Stack alignItems="center" spacing={2}>
            <CircularProgress color="inherit" />
            <Typography>Verificando pago...</Typography>
        </Stack>
      </Backdrop>

      {/* --- HERO IMAGE RESPONSIVE --- */}
      <Box 
        sx={{ 
            position: 'relative', 
            height: { xs: 250, sm: 350, md: 450 }, // Altura variable
            borderRadius: 4, 
            overflow: 'hidden', 
            mb: 4, 
            boxShadow: theme.shadows[6] 
        }}
      >
        <Box component="img" src={coverImage} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <Box 
            sx={{ 
                position: 'absolute', bottom: 0, left: 0, right: 0, 
                background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', 
                p: { xs: 2, sm: 3, md: 5 }, // Padding adaptable
                color: 'white' 
            }}
        >
          <Stack direction="row" spacing={1} mb={2}>
             <Chip 
                label={proyecto.tipo_inversion === 'mensual' ? 'Plan de Ahorro' : 'Inversión Directa'} 
                color="primary" 
                size="small"
                sx={{ fontWeight: 700, borderRadius: 1 }} 
             />
             <Chip 
                label={proyecto.estado_proyecto} 
                size="small"
                sx={{ 
                    fontWeight: 600, borderRadius: 1,
                    bgcolor: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(4px)'
                }} 
             />
          </Stack>
          <Typography variant="h3" fontWeight={800} sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)', fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3rem' } }}>
            {proyecto.nombre_proyecto}
          </Typography>
        </Box>
      </Box>

      {/* --- LAYOUT PRINCIPAL (Flex Column en Mobile, Row en Desktop) --- */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 4 }}>
        
        {/* COLUMNA IZQUIERDA: Tabs de Información */}
        <Box sx={{ flex: 1, minWidth: 0 }}> 
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, overflow: 'hidden' }}>
              <Tabs 
                value={tabValue} 
                onChange={(_, v) => setTabValue(v)} 
                sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
                indicatorColor="primary"
                textColor="primary"
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
              >
                <Tab icon={<Info fontSize="small" />} iconPosition="start" label="Descripción" sx={{ fontWeight: 600 }} />
                <Tab icon={<InsertPhoto fontSize="small" />} iconPosition="start" label="Galería" sx={{ fontWeight: 600 }} />
                <Tab icon={<ViewList fontSize="small" />} iconPosition="start" label="Lotes Disponibles" disabled={!mostrarTabLotes} sx={{ fontWeight: 600 }} />
              </Tabs>
              
              <CardContent sx={{ p: { xs: 2, md: 4 } }}>
                  <CustomTabPanel value={tabValue} index={0}>
                    <Typography paragraph sx={{ whiteSpace: 'pre-line', lineHeight: 1.8, color: 'text.secondary', fontSize: { xs: '0.9rem', md: '1rem' } }}>
                        {proyecto.descripcion}
                    </Typography>
                  </CustomTabPanel>
                  
                  <CustomTabPanel value={tabValue} index={1}>
                      <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(280px, 1fr))" gap={2}>
                        {proyecto.imagenes?.map((img) => (
                            <Box 
                                key={img.id} 
                                component="img" 
                                src={ImagenService.resolveImageUrl(img.url)} 
                                sx={{ 
                                    width: '100%', aspectRatio: '16/9', objectFit: 'cover',
                                    borderRadius: 2, cursor: 'pointer', 
                                    transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.02)' } 
                                }} 
                            />
                        ))}
                      </Box>
                  </CustomTabPanel>
                  
                  {mostrarTabLotes && (
                    <CustomTabPanel value={tabValue} index={2}>
                        <ListaLotesProyecto idProyecto={Number(id)} />
                    </CustomTabPanel>
                  )}
              </CardContent>
          </Card>
        </Box>

        {/* COLUMNA DERECHA: Sidebar Sticky (Inversión) */}
        <Box sx={{ width: { xs: '100%', lg: 380 }, flexShrink: 0 }}>
          <Card 
            elevation={0} 
            sx={{ 
                p: { xs: 2, sm: 3 }, 
                borderRadius: 3, 
                position: { lg: 'sticky' }, top: { lg: 100 }, 
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: theme.shadows[2]
            }}
          >
            <Typography variant="h6" fontWeight="bold" gutterBottom>Resumen de Inversión</Typography>
            <Divider sx={{ my: 2 }} />
            
            <Stack spacing={3}>
               {/* Monto */}
               <Box 
                 sx={{ 
                   bgcolor: alpha(theme.palette.primary.main, 0.05), 
                   p: 2, borderRadius: 2, border: `1px dashed ${alpha(theme.palette.primary.main, 0.2)}`
                 }}
               >
                 <Stack direction="row" spacing={1} alignItems="center" color="text.secondary" mb={0.5}>
                     <MonetizationOn color="primary" fontSize="small" />
                     <Typography variant="body2" fontWeight={600}>Valor Total del Proyecto</Typography>
                 </Stack>
                 <Typography variant="h4" color="primary.main" fontWeight={800} sx={{ fontSize: { xs: '1.8rem', md: '2.2rem' } }}>
                     {proyecto.moneda} {Number(proyecto.monto_inversion).toLocaleString()}
                 </Typography>
               </Box>

               {/* Barra de Progreso */}
               {proyecto.tipo_inversion === 'mensual' && (
                 <Box>
                   <Box display="flex" justifyContent="space-between" mb={1}>
                       <Typography variant="caption" fontWeight="bold" color="text.secondary">PROGRESO DE FONDEO</Typography>
                       <Typography variant="caption" fontWeight="bold" color="primary">{porcentaje.toFixed(0)}%</Typography>
                   </Box>
                   <LinearProgress 
                       variant="determinate" 
                       value={porcentaje} 
                       sx={{ 
                           height: 10, borderRadius: 5, 
                           bgcolor: alpha(theme.palette.primary.main, 0.1),
                           '& .MuiLinearProgress-bar': { borderRadius: 5 }
                       }} 
                   />
                 </Box>
               )}

               {/* Alerta Seguridad */}
               {is2FAMissing && user && (
                <Alert severity="warning" icon={<Security fontSize="inherit" />} sx={{ borderRadius: 2 }}>
                  <Typography variant="body2" fontWeight="bold">Seguridad Requerida</Typography>
                  <Button size="small" color="warning" onClick={() => navigate('/client/MiCuenta/SecuritySettings')} sx={{ mt: 1, textTransform: 'none', fontWeight: 600 }}>
                      Configurar 2FA ahora
                  </Button>
                </Alert>
               )}

               {/* === BOTÓN PRINCIPAL DE ACCIÓN === */}
               {!yaFirmo && !puedeFirmar && (
                 <Tooltip title={is2FAMissing && user ? "Activa 2FA para continuar" : ""}>
                   <Box> 
                    <Button 
                      variant="contained" 
                      size="large" 
                      fullWidth 
                      disabled={handleInversion.isPending || (is2FAMissing && !!user)}
                      onClick={handleMainAction} 
                      endIcon={!handleInversion.isPending && <ArrowForward />}
                      sx={{ py: 1.5, fontSize: '1rem', fontWeight: 700, borderRadius: 2, boxShadow: theme.shadows[4] }}
                    >
                      {handleInversion.isPending ? 'Procesando...' : proyecto.tipo_inversion === 'mensual' ? 'Suscribirme Ahora' : 'Invertir Ahora'}
                    </Button>
                   </Box>
                 </Tooltip>
               )}

               {/* ZONA DE CONTRATOS */}
               {user && (proyecto.tipo_inversion === 'mensual' || proyecto.tipo_inversion === 'directo') && (
                 <Stack spacing={2}>
                   {yaFirmo ? (
                     <Button 
                       variant="contained" color="success" fullWidth startIcon={<CheckCircle />}
                       onClick={handleVerContratoFirmado}
                       sx={{ fontWeight: 700, borderRadius: 2, py: 1.2 }}
                     >
                       Ver Contrato Firmado
                     </Button>
                   ) : puedeFirmar ? (
                     <Button 
                       variant="outlined" color="success" startIcon={<GppGood />} fullWidth 
                       onClick={handleClickFirmar} disabled={is2FAMissing}
                       sx={{ borderWidth: 2, fontWeight: 700, borderRadius: 2, py: 1.2, '&:hover': { borderWidth: 2 } }}
                     >
                       Firmar Contrato (Pendiente)
                     </Button>
                   ) : (
                     <Alert severity="info" sx={{ borderRadius: 2 }}>
                       <Typography variant="caption">Realiza el pago inicial para habilitar la firma del contrato.</Typography>
                     </Alert>
                   )}

                   {!yaFirmo && (
                      <Button variant="text" fullWidth startIcon={<Description />} onClick={contratoModal.open} sx={{ color: 'text.secondary', borderRadius: 2 }}>
                          Ver Modelo de Contrato
                      </Button>
                   )}
                 </Stack>
               )}
            </Stack>
          </Card>
        </Box>
      </Box>

      {/* --- MODALES --- */}
      {user && (
        <>
          <PagoExitosoModal open={pagoExitosoModal.isOpen} onContinuar={handleContinuarAFirma} />
          <ModalFirmaContrato {...firmaModal.modalProps} idProyecto={Number(id)} idUsuario={user.id} onFirmaExitosa={handleFirmaExitosa} />
          <VerContratoModal {...contratoModal.modalProps} idProyecto={Number(id)} nombreProyecto={proyecto.nombre_proyecto} />
          
          <VerContratoFirmadoModal 
              open={firmadoModal.isOpen}
              onClose={() => { firmadoModal.close(); setTimeout(() => setContratoFirmadoSeleccionado(null), 300); }}
              contrato={contratoFirmadoSeleccionado}
          />
          
          <SuscribirseModal 
              {...suscribirseModal.modalProps}
              proyecto={proyecto}
              isLoading={handleInversion.isPending}
              onConfirm={() => handleInversion.mutate()}
          />

          <ConfirmarInversionModal
              {...inversionModal.modalProps}
              proyecto={proyecto}
              isLoading={handleInversion.isPending}
              onConfirm={() => handleInversion.mutate()}
          />
          
          <TwoFactorAuthModal 
              open={twoFAModal.isOpen} 
              onClose={() => { twoFAModal.close(); setError2FA(null); }} 
              onSubmit={(code) => confirmar2FAMutation.mutate(code)} 
              isLoading={confirmar2FAMutation.isPending} 
              error={error2FA}
              title="Confirmar Transacción"
              description="Ingresa el código de seguridad para autorizar el pago."
          />
        </>
      )}
    </PageContainer>
  );
};

export default DetalleProyecto;