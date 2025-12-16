import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Box, Typography, Button, Stack, Chip, LinearProgress, 
  Paper, Divider, Tabs, Tab, Skeleton, Alert, Tooltip,
  Backdrop, CircularProgress 
} from '@mui/material';
import { LocationOn, GppGood, Security, CheckCircle } from '@mui/icons-material';

// --- SERVICIOS ---
import ProyectoService from '../../../Services/proyecto.service';
import SuscripcionService from '../../../Services/suscripcion.service';
import InversionService from '../../../Services/inversion.service';
import ImagenService from '../../../Services/imagen.service';
import TransaccionService from '../../../Services/transaccion.service';
import ContratoService from '../../../Services/contrato.service'; // ✅ Servicio unificado

// --- TIPOS ---
import type { ContratoFirmadoDto } from '../../../types/dto/contrato.dto';

// --- HOOKS ---
import { useModal } from '../../../hooks/useModal';

// --- COMPONENTES COMUNES ---
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { useAuth } from '../../../context/AuthContext';
import TwoFactorAuthModal from '../../../components/common/TwoFactorAuthModal/TwoFactorAuthModal';

// --- COMPONENTES DE CONTRATOS ---
import ModalFirmaContrato from '../Contratos/components/ModalFirmaContrato';
import { VerContratoModal } from '../Contratos/components/VerContratoModal'; // Ver Plantilla


// --- COMPONENTES DE PROYECTO ---
import { ListaLotesProyecto } from '../Lotes/ListaLotesProyecto';
import { SuscribirseModal } from './components/SuscribirseModal';
import { ConfirmarInversionModal } from './components/ConfirmarInversionModal';
import { PagoExitosoModal } from './components/PagoExitosoModal'; 
import { VerContratoFirmadoModal } from './components/VerContratoFirmadoModal';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const DetalleProyecto: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation(); 
  const { user } = useAuth(); 
  const queryClient = useQueryClient();
  
  // --- ESTADOS LÓGICOS ---
  const [tabValue, setTabValue] = useState(0);
  const [yaFirmo, setYaFirmo] = useState(false); 
  const [puedeFirmar, setPuedeFirmar] = useState(false);
  
  // Estado para el modal de visualización de contrato firmado
  const [contratoFirmadoSeleccionado, setContratoFirmadoSeleccionado] = useState<ContratoFirmadoDto | null>(null);
  
  // --- MODALES (Hooks) ---
  const firmaModal = useModal();
  const contratoModal = useModal(); // Ver Plantilla
  const suscribirseModal = useModal();
  const inversionModal = useModal();
  const pagoExitosoModal = useModal();
  const twoFAModal = useModal();
  
  // --- ESTADOS DE PROCESO ---
  const [verificandoPago, setVerificandoPago] = useState(false);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [pendingTransactionId, setPendingTransactionId] = useState<number | null>(null);
  const [error2FA, setError2FA] = useState<string | null>(null);

  // ==========================================
  // 1. QUERIES (Datos del servidor)
  // ==========================================

  // A. Obtener Proyecto
  const { data: proyecto, isLoading, error } = useQuery({
    queryKey: ['proyecto', id],
    queryFn: async () => (await ProyectoService.getByIdActive(Number(id))).data,
    retry: false
  });

  // B. Obtener Contratos Firmados (Para saber si ya firmó y obtener el PDF final)
  const { data: misContratos } = useQuery({
    queryKey: ['misContratos'],
    queryFn: async () => (await ContratoService.getMyContracts()).data,
    enabled: !!user,
  });

  // C. Obtener Inversiones (Para habilitar firma si es Directo)
  const { data: misInversiones } = useQuery({
    queryKey: ['misInversiones'],
    queryFn: async () => (await InversionService.getMisInversiones()).data,
    enabled: !!user && proyecto?.tipo_inversion === 'directo',
  });

  // D. Obtener Suscripciones (Para habilitar firma si es Mensual)
  const { data: misSuscripciones } = useQuery({
    queryKey: ['misSuscripciones'],
    queryFn: async () => (await SuscripcionService.getMisSuscripciones()).data,
    enabled: !!user && proyecto?.tipo_inversion === 'mensual',
  });

  // ==========================================
  // 2. EFECTOS (Lógica de Negocio)
  // ==========================================

  // Detectar si YA FIRMÓ
  useEffect(() => {
    if (misContratos && proyecto) {
      // Buscamos si existe un contrato FIRMADO y ACTIVO para este proyecto
      const contrato = misContratos.find(c => c.id_proyecto === proyecto.id && c.estado_firma === 'FIRMADO');
      if (contrato) {
        setYaFirmo(true);
      }
    }
  }, [misContratos, proyecto]);

  // Detectar si PUEDE FIRMAR (Tiene pago realizado)
  useEffect(() => {
    if (!proyecto || !user) return;
    
    let tienePermiso = false;

    if (proyecto.tipo_inversion === 'directo' && misInversiones) {
      const inv = misInversiones.find(i => i.id_proyecto === proyecto.id && i.estado === 'pagado');
      if (inv) tienePermiso = true;
    } 
    else if (proyecto.tipo_inversion === 'mensual' && misSuscripciones) {
      const sub = misSuscripciones.find(s => s.id_proyecto === proyecto.id && s.activo);
      if (sub) tienePermiso = true;
    }

    setPuedeFirmar(tienePermiso);
  }, [proyecto, user, misInversiones, misSuscripciones]);

  // Lógica de Retorno de Mercado Pago (Polling)
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
  // 3. HANDLERS (Acciones)
  // ==========================================

  const handleContinuarAFirma = () => {
    pagoExitosoModal.close(); 
    // Pequeño delay para UX y asegurar que los datos refrescados estén listos
    setTimeout(() => { 
        setPuedeFirmar(true); 
        firmaModal.open(); 
    }, 500);
  };

  const handleFirmaExitosa = () => {
    setYaFirmo(true);
    firmaModal.close();
    queryClient.invalidateQueries({ queryKey: ['misContratos'] });
  };

  // Handler para abrir el contrato ya firmado
  const handleVerContratoFirmado = () => {
    if (!misContratos || !proyecto) return;
    const contrato = misContratos.find(c => c.id_proyecto === proyecto.id && c.estado_firma === 'FIRMADO');
    
    if (contrato) {
        setContratoFirmadoSeleccionado(contrato); // Esto abre el modal automáticamente
    } else {
        alert("No se encontró el documento firmado. Por favor recarga la página.");
    }
  };

  const handleInversion = useMutation({
    mutationFn: async () => {
      if (!proyecto) throw new Error("Error de proyecto");
      if (proyecto.tipo_inversion === 'mensual') {
         const res = await SuscripcionService.iniciar({ id_proyecto: proyecto.id });
         return res.data;
      } 
      const res = await InversionService.iniciar({ id_proyecto: proyecto.id });
      return res.data;
    },
    onSuccess: (data: any) => {
      suscribirseModal.close(); inversionModal.close();
      if (data.is2FARequired && data.transaccionId) {
        setPendingTransactionId(data.transaccionId);
        twoFAModal.open();
      } else {
        manejarRedireccionExito(data);
      }
    },
    onError: (err: any) => {
      alert(`Error: ${err.response?.data?.error || err.message}`);
      suscribirseModal.close(); inversionModal.close();
    }
  });

  const confirmar2FAMutation = useMutation({
    mutationFn: async (codigo: string) => {
      if (!pendingTransactionId) throw new Error("ID perdido");
      return (await SuscripcionService.confirmar2FA({ transaccionId: pendingTransactionId, codigo_2fa: codigo })).data;
    },
    onSuccess: (data) => {
      twoFAModal.close(); setError2FA(null);
      manejarRedireccionExito(data);
    },
    onError: (err: any) => setError2FA(err.response?.data?.message || "Código incorrecto")
  });

  const manejarRedireccionExito = (data: any) => {
      if (data.redirectUrl) window.location.href = data.redirectUrl;
      else {
        // Caso: Pago interno o saldo a favor
        queryClient.invalidateQueries({ queryKey: ['misInversiones'] });
        queryClient.invalidateQueries({ queryKey: ['misSuscripciones'] });
        pagoExitosoModal.open();
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
    if (is2FAMissing) {
        navigate('/client/MiCuenta/SecuritySettings');
        return;
    }
    firmaModal.open();
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => setTabValue(newValue);

  // ==========================================
  // 4. RENDER
  // ==========================================
  const coverImage = proyecto?.imagenes?.[0] ? ImagenService.resolveImageUrl(proyecto.imagenes[0].url) : '/assets/placeholder-project.jpg'; 
  const porcentaje = (proyecto?.tipo_inversion === 'mensual' && proyecto?.obj_suscripciones > 0) ? (proyecto.suscripciones_actuales / proyecto.obj_suscripciones) * 100 : 0;
  const mostrarTabLotes = proyecto?.tipo_inversion === 'directo' || (proyecto?.lotes && proyecto.lotes.length > 0);

  if (isLoading) return <PageContainer><Skeleton variant="rectangular" height={400} /><Box mt={2}><Skeleton width="60%" /></Box></PageContainer>;
  if (!proyecto) return <PageContainer><Alert severity="error">Proyecto no encontrado</Alert></PageContainer>;

  return (
    <PageContainer maxWidth="xl">
      <Backdrop sx={{ color: '#fff', zIndex: 9999 }} open={verificandoPago}>
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* HERO SECTION */}
      <Box sx={{ position: 'relative', height: { xs: 300, md: 450 }, borderRadius: 4, overflow: 'hidden', mb: 4 }}>
        <Box component="img" src={coverImage} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', p: 4, color: 'white' }}>
          <Stack direction="row" spacing={1} mb={1}>
             <Chip label={proyecto.tipo_inversion === 'mensual' ? 'Ahorro' : 'Inversión Directa'} color="primary" sx={{ fontWeight: 'bold' }} />
             <Chip label={proyecto.estado_proyecto} color={proyecto.estado_proyecto === 'En proceso' ? 'success' : 'default'} />
          </Stack>
          <Typography variant="h3" fontWeight={700}>{proyecto.nombre_proyecto}</Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 4 }}>
        {/* IZQUIERDA: Tabs */}
        <Box sx={{ flex: 1, minWidth: 0 }}> 
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Descripción" />
            <Tab label="Galería" />
            <Tab label="Lotes Disponibles" disabled={!mostrarTabLotes} />
          </Tabs>
          <CustomTabPanel value={tabValue} index={0}>
            <Typography paragraph sx={{ whiteSpace: 'pre-line' }}>{proyecto.descripcion}</Typography>
          </CustomTabPanel>
          <CustomTabPanel value={tabValue} index={1}>
             <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap={2}>
                {proyecto.imagenes?.map((img) => <Box key={img.id} component="img" src={ImagenService.resolveImageUrl(img.url)} sx={{ width: '100%', borderRadius: 2 }} />)}
             </Box>
          </CustomTabPanel>
          {mostrarTabLotes && <CustomTabPanel value={tabValue} index={2}><ListaLotesProyecto idProyecto={Number(id)} /></CustomTabPanel>}
        </Box>

        {/* DERECHA: Sidebar */}
        <Box sx={{ width: { xs: '100%', lg: 380 }, flexShrink: 0 }}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 3, position: 'sticky', top: 100 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>Resumen</Typography>
            <Divider sx={{ my: 2 }} />
            
            <Stack spacing={3}>
               <Box display="flex" justifyContent="space-between">
                  <Typography>Valor</Typography>
                  <Typography variant="h5" color="primary" fontWeight="bold">{proyecto.moneda} {Number(proyecto.monto_inversion).toLocaleString()}</Typography>
               </Box>

               {proyecto.tipo_inversion === 'mensual' && (
                 <Box>
                   <Box display="flex" justifyContent="space-between" mb={1}><Typography variant="caption">Progreso</Typography><Typography variant="caption">{porcentaje.toFixed(0)}%</Typography></Box>
                   <LinearProgress variant="determinate" value={porcentaje} sx={{ height: 10, borderRadius: 5 }} />
                 </Box>
               )}

               {is2FAMissing && (
                <Alert severity="warning" icon={<Security />}>
                  <Typography variant="body2" fontWeight="bold">Seguridad Requerida</Typography>
                  <Button size="small" color="warning" onClick={() => navigate('/client/MiCuenta/SecuritySettings')}>Configurar 2FA</Button>
                </Alert>
               )}

               {/* BOTÓN INVERTIR (Oculto si ya pagó) */}
               {!yaFirmo && !puedeFirmar && (
                 <Tooltip title={is2FAMissing ? "Activa 2FA" : ""}>
                   <span>
                    <Button 
                      variant="contained" size="large" fullWidth 
                      disabled={handleInversion.isPending || is2FAMissing}
                      onClick={handleMainAction}
                    >
                      {handleInversion.isPending ? 'Procesando...' : proyecto.tipo_inversion === 'mensual' ? 'Suscribirme' : 'Invertir'}
                    </Button>
                   </span>
                 </Tooltip>
               )}

               {/* ZONA DE CONTRATOS */}
               {user && proyecto.tipo_inversion === 'mensual' && (
                 <>
                   {yaFirmo ? (
                     // ✅ 1. ESTADO: FIRMADO -> Botón verde que abre el modal de visualización
                     <Button 
                       variant="contained" 
                       color="success" 
                       fullWidth 
                       startIcon={<CheckCircle />}
                       onClick={handleVerContratoFirmado}
                       sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}
                     >
                       Ver Contrato Firmado
                     </Button>
                   ) : puedeFirmar ? (
                     // ✅ 2. ESTADO: PAGADO PERO NO FIRMADO -> Botón para firmar
                     <Button 
                       variant="outlined" 
                       color="success" 
                       startIcon={<GppGood />} 
                       fullWidth 
                       onClick={handleClickFirmar} 
                       disabled={is2FAMissing}
                       sx={{ borderWidth: 2, '&:hover': { borderWidth: 2 } }}
                     >
                       Firmar Contrato (Pendiente)
                     </Button>
                   ) : (
                     // ✅ 3. ESTADO: NO PAGADO -> Mensaje informativo
                     <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
                       Debes realizar el pago inicial para habilitar la firma del contrato.
                     </Alert>
                   )}

                   {/* Ver modelo siempre disponible si no ha firmado */}
                   {!yaFirmo && (
                      <Button variant="text" fullWidth onClick={contratoModal.open}>Ver Modelo de Contrato</Button>
                   )}
                 </>
               )}
            </Stack>
          </Paper>
        </Box>
      </Box>

      {/* --- MODALES --- */}
      {user && (
        <>
          <PagoExitosoModal 
             open={pagoExitosoModal.isOpen} 
             onContinuar={handleContinuarAFirma} 
          />

          <ModalFirmaContrato 
             {...firmaModal.modalProps}
             idProyecto={Number(id)} 
             idUsuario={user.id} 
             onFirmaExitosa={handleFirmaExitosa} 
          />
          
          <VerContratoModal 
             {...contratoModal.modalProps}
             idProyecto={Number(id)} 
             nombreProyecto={proyecto.nombre_proyecto} 
          />
          
          {/* ✅ NUEVO MODAL: Ver contrato ya firmado */}
          <VerContratoFirmadoModal 
             open={!!contratoFirmadoSeleccionado}
             onClose={() => setContratoFirmadoSeleccionado(null)}
             contrato={contratoFirmadoSeleccionado}
          />
          
          <SuscribirseModal 
             {...suscribirseModal.modalProps}
             onConfirm={() => handleInversion.mutate()} 
             proyecto={proyecto} 
             isLoading={handleInversion.isPending} 
          />

          <ConfirmarInversionModal
             {...inversionModal.modalProps}
             onConfirm={() => handleInversion.mutate()}
             proyecto={proyecto}
             isLoading={handleInversion.isPending} 
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