import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Box, Typography, Button, Stack, Chip, LinearProgress, 
  Paper, Divider, Tabs, Tab, Skeleton, Alert, Tooltip,
  Backdrop, CircularProgress, useTheme, alpha 
} from '@mui/material';
import { 
  GppGood, Security, CheckCircle, MonetizationOn, Description, 
  ArrowForward 
} from '@mui/icons-material';

// --- SERVICIOS ---
import ProyectoService from '../../../Services/proyecto.service';
import SuscripcionService from '../../../Services/suscripcion.service';
import InversionService from '../../../Services/inversion.service';
import ImagenService from '../../../Services/imagen.service';
import TransaccionService from '../../../Services/transaccion.service';
import ContratoService from '../../../Services/contrato.service';
import MercadoPagoService from '../../../Services/pagoMercado.service';

// --- TIPOS ---
import type { ContratoFirmadoDto } from '../../../types/dto/contrato.dto';

// --- HOOKS Y CONTEXTO ---
import { useModal } from '../../../hooks/useModal';
import { useAuth } from '../../../context/AuthContext';

// --- COMPONENTES COMUNES ---
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import TwoFactorAuthModal from '../../../components/common/TwoFactorAuthModal/TwoFactorAuthModal';

// --- COMPONENTES ESPECÍFICOS DEL FLUJO ---
import ModalFirmaContrato from '../Contratos/components/ModalFirmaContrato';
import { VerContratoModal } from '../Contratos/components/VerContratoModal';
import { ListaLotesProyecto } from '../Lotes/ListaLotesProyecto';
import { PagoExitosoModal } from './components/PagoExitosoModal'; 
import { VerContratoFirmadoModal } from './components/VerContratoFirmadoModal';
import { SuscribirseModal } from './components/SuscribirseModal';       // ✅ Usamos el específico
import { ConfirmarInversionModal } from './components/ConfirmarInversionModal'; // ✅ Usamos el específico

// Helper de Tabs (Estilizado)
interface TabPanelProps { children?: React.ReactNode; index: number; value: number; }
function CustomTabPanel({ children, value, index, ...other }: TabPanelProps) {
  return <div role="tabpanel" hidden={value !== index} {...other}>{value === index && <Box sx={{ py: 3 }}>{children}</Box>}</div>;
}

const DetalleProyecto: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation(); 
  const { user } = useAuth(); 
  const queryClient = useQueryClient();
  const theme = useTheme(); // 🟢 Acceso al Theme Global
  
  // --- ESTADOS DE UI ---
  const [tabValue, setTabValue] = useState(0);
  const [yaFirmo, setYaFirmo] = useState(false); 
  const [puedeFirmar, setPuedeFirmar] = useState(false);
  const [contratoFirmadoSeleccionado, setContratoFirmadoSeleccionado] = useState<ContratoFirmadoDto | null>(null);
  
  // --- HOOKS DE MODALES (Uno para cada acción específica) ---
  const firmaModal = useModal();
  const contratoModal = useModal();     
  const firmadoModal = useModal();      
  const suscribirseModal = useModal();  // ✅ Modal Específico Ahorrista
  const inversionModal = useModal();    // ✅ Modal Específico Inversionista
  const pagoExitosoModal = useModal();
  const twoFAModal = useModal();
  
  // --- ESTADOS DE PROCESO ---
  const [verificandoPago, setVerificandoPago] = useState(false);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [pendingTransactionId, setPendingTransactionId] = useState<number | null>(null);
  const [error2FA, setError2FA] = useState<string | null>(null);

  // ==========================================
  // 1. QUERIES (DATOS)
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
  // 2. EFECTOS (LÓGICA DE NEGOCIO)
  // ==========================================
  
  // Detectar si YA FIRMÓ contrato
  useEffect(() => {
    if (misContratos && proyecto) {
      const contrato = misContratos.find(c => c.id_proyecto === proyecto.id && c.estado_firma === 'FIRMADO');
      if (contrato) setYaFirmo(true);
    }
  }, [misContratos, proyecto]);

  // Detectar si PUEDE FIRMAR (Ya pagó)
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

  // Polling de Mercado Pago (Al volver de la pasarela)
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const status = query.get('status');
    const externalReference = query.get('external_reference'); 

    if (status === 'approved' && externalReference && !pagoExitosoModal.isOpen) {
        verificarEstadoPago(Number(externalReference));
    } else if (status === 'failure' || status === 'rejected') {
        alert("El pago fue rechazado o no se completó.");
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
                  alert("Pago aprobado en MP. Espera unos minutos a que impacte en el sistema.");
                  limpiarUrl();
              }
          }
      } catch (error) {
          setVerificandoPago(false);
      }
  };

  // ==========================================
  // 3. MUTACIONES (INVERSIÓN Y PAGO)
  // ==========================================

  const handleInversion = useMutation({
    mutationFn: async () => {
      if (!proyecto) throw new Error("Error de proyecto");

      let initResponse: any;
      let modelType: 'pago' | 'inversion';
      
      // 1. Crear registro en backend
      if (proyecto.tipo_inversion === 'mensual') {
         const res = await SuscripcionService.iniciar({ id_proyecto: proyecto.id });
         initResponse = res.data;
         modelType = 'pago'; 
      } else {
         const res = await InversionService.iniciar({ id_proyecto: proyecto.id });
         initResponse = res.data;
         modelType = 'inversion';
      }

      // 2. Obtener link de pago
      if (initResponse.redirectUrl) return initResponse;

      const idParaCheckout = initResponse.pagoId || initResponse.inversionId || initResponse.id;
      if (!idParaCheckout) return initResponse;

      const checkoutRes = await MercadoPagoService.iniciarCheckoutModelo(modelType, idParaCheckout);
      return { ...initResponse, ...checkoutRes.data };
    },
    onSuccess: (data: any) => {
      suscribirseModal.close(); 
      inversionModal.close();
      
      // Caso 2FA
      if (data.is2FARequired && data.transaccionId) {
        setPendingTransactionId(data.transaccionId);
        twoFAModal.open();
        return;
      } 
      
      // Caso Redirect MP
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      } 
      
      // Caso Exito Directo
      manejarRedireccionExito(data);
    },
    onError: (err: any) => {
      console.error(err);
      alert(`Error: ${err.response?.data?.error || err.message || 'Error al procesar la solicitud'}`);
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
  // 4. HANDLERS
  // ==========================================

  const handleContinuarAFirma = () => {
    pagoExitosoModal.close(); 
    setTimeout(() => { setPuedeFirmar(true); firmaModal.open(); }, 500);
  };

  const handleFirmaExitosa = () => {
    setYaFirmo(true);
    firmaModal.close();
    queryClient.invalidateQueries({ queryKey: ['misContratos'] });
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

  // 🟢 Abre el modal ESPECÍFICO según el tipo de proyecto
  const handleMainAction = () => {
    if (!user) return navigate('/login', { state: { from: window.location.pathname }});
    
    if (proyecto?.tipo_inversion === 'mensual') {
        suscribirseModal.open();
    } else {
        inversionModal.open();
    }
  };

  const handleClickFirmar = () => {
    if (!user) return;
    if (is2FAMissing) { navigate('/client/MiCuenta/SecuritySettings'); return; }
    firmaModal.open();
  };

  // ==========================================
  // 5. RENDER
  // ==========================================
  const coverImage = proyecto?.imagenes?.[0] ? ImagenService.resolveImageUrl(proyecto.imagenes[0].url) : '/assets/placeholder-project.jpg'; 
  const porcentaje = (proyecto?.tipo_inversion === 'mensual' && proyecto?.obj_suscripciones > 0) ? (proyecto.suscripciones_actuales / proyecto.obj_suscripciones) * 100 : 0;
  const mostrarTabLotes = proyecto?.tipo_inversion === 'directo' || (proyecto?.lotes && proyecto.lotes.length > 0);

  if (isLoading) return <PageContainer><Skeleton variant="rectangular" height={400} sx={{ borderRadius: 4 }} /><Box mt={2}><Skeleton width="60%" /></Box></PageContainer>;
  if (!proyecto) return <PageContainer><Alert severity="error">Proyecto no encontrado</Alert></PageContainer>;

  return (
    <PageContainer maxWidth="xl">
      <Backdrop sx={{ color: '#fff', zIndex: 9999 }} open={verificandoPago}>
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* --- HERO IMAGE (Premium) --- */}
      <Box sx={{ position: 'relative', height: { xs: 300, md: 450 }, borderRadius: 4, overflow: 'hidden', mb: 4, boxShadow: theme.shadows[4] }}>
        <Box component="img" src={coverImage} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', p: { xs: 3, md: 5 }, color: 'white' }}>
          <Stack direction="row" spacing={1} mb={2}>
             <Chip label={proyecto.tipo_inversion === 'mensual' ? 'Ahorro' : 'Inversión Directa'} color="primary" sx={{ fontWeight: 700 }} />
             <Chip label={proyecto.estado_proyecto} color={proyecto.estado_proyecto === 'En proceso' ? 'success' : 'default'} sx={{ fontWeight: 600, bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
          </Stack>
          <Typography variant="h3" fontWeight={800} sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{proyecto.nombre_proyecto}</Typography>
        </Box>
      </Box>

      {/* --- LAYOUT PRINCIPAL (Flex) --- */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 4 }}>
        
        {/* COLUMNA IZQUIERDA: Tabs de Información */}
        <Box sx={{ flex: 1, minWidth: 0 }}> 
          <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, overflow: 'hidden' }}>
              <Tabs 
                value={tabValue} 
                onChange={(_, v) => setTabValue(v)} 
                sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default' }}
                indicatorColor="primary"
                textColor="primary"
              >
                <Tab label="Descripción" sx={{ fontWeight: 600 }} />
                <Tab label="Galería" sx={{ fontWeight: 600 }} />
                <Tab label="Lotes Disponibles" disabled={!mostrarTabLotes} sx={{ fontWeight: 600 }} />
              </Tabs>
              
              <Box p={3}>
                  <CustomTabPanel value={tabValue} index={0}>
                    <Typography paragraph sx={{ whiteSpace: 'pre-line', lineHeight: 1.8, color: 'text.secondary' }}>{proyecto.descripcion}</Typography>
                  </CustomTabPanel>
                  <CustomTabPanel value={tabValue} index={1}>
                      <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap={2}>
                        {proyecto.imagenes?.map((img) => (
                            <Box key={img.id} component="img" src={ImagenService.resolveImageUrl(img.url)} sx={{ width: '100%', borderRadius: 2, cursor: 'pointer', transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.02)' } }} />
                        ))}
                      </Box>
                  </CustomTabPanel>
                  {mostrarTabLotes && <CustomTabPanel value={tabValue} index={2}><ListaLotesProyecto idProyecto={Number(id)} /></CustomTabPanel>}
              </Box>
          </Paper>
        </Box>

        {/* COLUMNA DERECHA: Sidebar Sticky (Inversión) */}
        <Box sx={{ width: { xs: '100%', lg: 380 }, flexShrink: 0 }}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 3, position: 'sticky', top: 100, border: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Resumen de Inversión</Typography>
            <Divider sx={{ my: 2 }} />
            
            <Stack spacing={3}>
               {/* Monto */}
               <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={1} alignItems="center" color="text.secondary">
                      <MonetizationOn color="action" />
                      <Typography variant="body2">Valor Total</Typography>
                  </Stack>
                  <Typography variant="h5" color="primary.main" fontWeight={800}>
                      {proyecto.moneda} {Number(proyecto.monto_inversion).toLocaleString()}
                  </Typography>
               </Box>

               {/* Barra de Progreso (Solo Suscripciones) */}
               {proyecto.tipo_inversion === 'mensual' && (
                 <Box>
                   <Box display="flex" justifyContent="space-between" mb={1}>
                       <Typography variant="caption" fontWeight="bold" color="text.secondary">PROGRESO DE FONDEO</Typography>
                       <Typography variant="caption" fontWeight="bold" color="primary">{porcentaje.toFixed(0)}%</Typography>
                   </Box>
                   <LinearProgress variant="determinate" value={porcentaje} sx={{ height: 8, borderRadius: 4, bgcolor: alpha(theme.palette.primary.main, 0.1) }} />
                 </Box>
               )}

               {/* Alerta Seguridad */}
               {is2FAMissing && (
                <Alert severity="warning" icon={<Security fontSize="inherit" />} sx={{ borderRadius: 2 }}>
                  <Typography variant="body2" fontWeight="bold">Seguridad Requerida</Typography>
                  <Button size="small" color="warning" onClick={() => navigate('/client/MiCuenta/SecuritySettings')} sx={{ mt: 1, textTransform: 'none' }}>
                      Configurar 2FA ahora
                  </Button>
                </Alert>
               )}

               {/* === BOTÓN PRINCIPAL DE ACCIÓN === */}
               {!yaFirmo && !puedeFirmar && (
                 <Tooltip title={is2FAMissing ? "Activa 2FA para continuar" : ""}>
                   <Box> {/* Wrapper para tooltip si button disabled */}
                    <Button 
                      variant="contained" 
                      size="large" 
                      fullWidth 
                      disabled={handleInversion.isPending || is2FAMissing}
                      onClick={handleMainAction} // 🟢 Abre modal específico
                      endIcon={!handleInversion.isPending && <ArrowForward />}
                      sx={{ py: 1.5, fontSize: '1rem', fontWeight: 700, boxShadow: theme.shadows[4] }}
                    >
                      {handleInversion.isPending ? 'Procesando...' : proyecto.tipo_inversion === 'mensual' ? 'Suscribirme Ahora' : 'Invertir Ahora'}
                    </Button>
                   </Box>
                 </Tooltip>
               )}

               {/* ZONA DE CONTRATOS (Si ya pagó) */}
               {user && proyecto.tipo_inversion === 'mensual' && (
                 <>
                   {yaFirmo ? (
                     <Button 
                       variant="contained" color="success" fullWidth startIcon={<CheckCircle />}
                       onClick={handleVerContratoFirmado}
                       sx={{ fontWeight: 700 }}
                     >
                       Ver Contrato Firmado
                     </Button>
                   ) : puedeFirmar ? (
                     <Button 
                       variant="outlined" color="success" startIcon={<GppGood />} fullWidth 
                       onClick={handleClickFirmar} disabled={is2FAMissing}
                       sx={{ borderWidth: 2, fontWeight: 700, '&:hover': { borderWidth: 2 } }}
                     >
                       Firmar Contrato (Pendiente)
                     </Button>
                   ) : (
                     <Alert severity="info" sx={{ borderRadius: 2 }}>
                       <Typography variant="caption">Realiza el pago inicial para habilitar la firma del contrato.</Typography>
                     </Alert>
                   )}

                   {!yaFirmo && (
                      <Button variant="text" fullWidth startIcon={<Description />} onClick={contratoModal.open} sx={{ color: 'text.secondary' }}>
                          Ver Modelo de Contrato
                      </Button>
                   )}
                 </>
               )}
            </Stack>
          </Paper>
        </Box>
      </Box>

      {/* --- MODALES CONECTADOS --- */}
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
          
          {/* ✅ Modal Específico para Ahorristas */}
          <SuscribirseModal 
             {...suscribirseModal.modalProps}
             proyecto={proyecto}
             isLoading={handleInversion.isPending}
             onConfirm={() => handleInversion.mutate()}
          />

          {/* ✅ Modal Específico para Inversionistas */}
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