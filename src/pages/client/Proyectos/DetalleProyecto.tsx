import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
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

// --- HOOKS ---
import { useModal } from '../../../hooks/useModal'; // ✅ Usando tu hook

// --- COMPONENTES COMUNES ---
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { useAuth } from '../../../context/AuthContext';
import ModalFirmaContrato from '../Contratos/components/ModalFirmaContrato';
import { VerContratoModal } from '../Contratos/components/VerContratoModal';
import { ListaLotesProyecto } from '../Lotes/ListaLotesProyecto';
import TwoFactorAuthModal from '../../../components/common/TwoFactorAuthModal/TwoFactorAuthModal';

// --- MODALES DE PAGO/INVERSIÓN ---
import { SuscribirseModal } from './components/SuscribirseModal';
import { ConfirmarInversionModal } from './components/ConfirmarInversionModal';
import { PagoExitosoModal } from './components/PagoExitosoModal'; 

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
  
  // --- ESTADOS VISUALES ---
  const [tabValue, setTabValue] = useState(0);
  const [yaFirmo, setYaFirmo] = useState(false); // ✅ Estado para cambiar el botón visualmente
  
  // --- GESTIÓN DE MODALES (Hook useModal) ---
  const firmaModal = useModal();
  const contratoModal = useModal();
  const suscribirseModal = useModal();
  const inversionModal = useModal();
  const pagoExitosoModal = useModal();
  const twoFAModal = useModal();
  
  // --- ESTADOS DE VERIFICACIÓN DE PAGO (POLLING) ---
  const [verificandoPago, setVerificandoPago] = useState(false);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- ESTADOS DATOS 2FA ---
  const [pendingTransactionId, setPendingTransactionId] = useState<number | null>(null);
  const [error2FA, setError2FA] = useState<string | null>(null);

  // 1. QUERY: Obtener Proyecto
  const { data: proyecto, isLoading, error } = useQuery({
    queryKey: ['proyecto', id],
    queryFn: async () => {
      if (!id) throw new Error('ID inválido');
      const res = await ProyectoService.getByIdActive(Number(id));
      return res.data;
    },
    retry: false
  });

  // Opcional: Si el backend ya trae si el usuario firmó, inicializamos el estado
  // useEffect(() => {
  //   if (proyecto?.usuario_ya_firmo) setYaFirmo(true);
  // }, [proyecto]);

  // ===========================================================================
  // 🔄 LOGICA DE RETORNO DE MERCADO PAGO (POLLING)
  // ===========================================================================
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

    return () => {
        if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
    };
  }, [location]);

  const limpiarUrl = () => {
      window.history.replaceState({}, document.title, window.location.pathname);
  };

  const verificarEstadoPago = async (transaccionId: number, intentos = 0) => {
      setVerificandoPago(true);

      try {
          const res = await TransaccionService.getMyTransactionById(transaccionId);
          const transaccion = res.data;

          if (transaccion.estado_transaccion === 'pagado') {
              // ✅ ÉXITO
              setVerificandoPago(false);
              limpiarUrl();
              pagoExitosoModal.open(); // Hook
          } else {
              // ⏳ PENDIENTE
              if (intentos < 10) { 
                  pollingTimeoutRef.current = setTimeout(() => {
                      verificarEstadoPago(transaccionId, intentos + 1);
                  }, 3000);
              } else {
                  setVerificandoPago(false);
                  alert("El pago fue aprobado en Mercado Pago pero aún no impacta en nuestro sistema. Por favor espera unos minutos y verifica en 'Mis Transacciones'.");
                  limpiarUrl();
              }
          }
      } catch (error) {
          console.error("Error verificando pago:", error);
          setVerificandoPago(false);
      }
  };

  // ===========================================================================
  // 🔗 TRANSICIONES Y HANDLERS
  // ===========================================================================
  
  const handleContinuarAFirma = () => {
    pagoExitosoModal.close(); 
    setTimeout(() => {
        firmaModal.open(); 
    }, 300);
  };

  // ✅ Nueva función: Se ejecuta cuando la firma es exitosa
  const handleFirmaExitosa = () => {
    setYaFirmo(true); // Cambia el botón a verde
    firmaModal.close(); // Cierra el modal
    // No redirigimos para que el usuario vea el cambio visual
  };

  // 2. MUTATION: Iniciar Inversión
  const handleInversion = useMutation({
    mutationFn: async () => {
      if (!proyecto) throw new Error("Proyecto no cargado.");

      if (proyecto.tipo_inversion === 'mensual') {
         const res = await SuscripcionService.iniciar({ id_proyecto: proyecto.id });
         return { type: 'suscripcion', data: res.data };
      } 
      const res = await InversionService.iniciar({ id_proyecto: proyecto.id });
      return { type: 'inversion', data: res.data };
    },
    onSuccess: ({ type, data }: any) => {
      suscribirseModal.close();
      inversionModal.close();

      if (!data) return;

      // A. Backend pide 2FA
      if (data.is2FARequired && data.transaccionId) {
        setPendingTransactionId(data.transaccionId);
        twoFAModal.open();
        return;
      }
      // B. Éxito directo
      manejarRedireccionExito(data);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message || 'Error al procesar';
      alert(`Error: ${msg}`);
      suscribirseModal.close();
      inversionModal.close();
    }
  });

  // 3. MUTATION: Confirmar 2FA
  const confirmar2FAMutation = useMutation({
    mutationFn: async (codigo: string) => {
      if (!pendingTransactionId) throw new Error("ID de transacción perdido");
      return (await SuscripcionService.confirmar2FA({ 
          transaccionId: pendingTransactionId, 
          codigo_2fa: codigo 
      })).data;
    },
    onSuccess: (data) => {
      twoFAModal.close();
      setError2FA(null);
      manejarRedireccionExito(data);
    },
    onError: (err: any) => {
      setError2FA(err.response?.data?.message || "Código incorrecto");
    }
  });

  const manejarRedireccionExito = (data: any) => {
      if (data.redirectUrl || (data.url_pago_sugerida && data.url_pago_sugerida.startsWith('http'))) {
        window.location.href = data.redirectUrl || data.url_pago_sugerida;
        return;
      } 
      pagoExitosoModal.open();
  };

  const is2FAMissing = !!(user && !user.is_2fa_enabled);

  const handleMainAction = () => {
    if (!user) return navigate('/login', { state: { from: window.location.pathname }});
    if (is2FAMissing) return; 
    if (!proyecto) return;

    if (proyecto.tipo_inversion === 'mensual') {
        suscribirseModal.open();
    } else {
        inversionModal.open();
    }
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

  // Helpers visuales
  const coverImage = proyecto?.imagenes?.[0]
    ? ImagenService.resolveImageUrl(proyecto.imagenes[0].url)
    : '/assets/placeholder-project.jpg'; 
  const porcentaje = (proyecto?.tipo_inversion === 'mensual' && proyecto?.obj_suscripciones > 0)
    ? (proyecto.suscripciones_actuales / proyecto.obj_suscripciones) * 100 : 0;
  const mostrarTabLotes = proyecto?.tipo_inversion === 'directo' || (proyecto?.lotes && proyecto.lotes.length > 0);

  if (isLoading) return <PageContainer><Skeleton variant="rectangular" height={400} /><Box mt={2}><Skeleton width="60%" /></Box></PageContainer>;
  if (error || !proyecto) return <PageContainer><Alert severity="error">Proyecto no encontrado</Alert><Button onClick={() => navigate(-1)}>Volver</Button></PageContainer>;

  return (
    <PageContainer maxWidth="xl">
      {/* ⏳ BACKDROP VERIFICACIÓN */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1, flexDirection: 'column', gap: 2 }}
        open={verificandoPago}
      >
        <CircularProgress color="inherit" size={60} />
        <Typography variant="h6" fontWeight="bold">Verificando acreditación del pago...</Typography>
        <Typography variant="body2">Por favor no cierres esta ventana.</Typography>
      </Backdrop>

      {/* HERO SECTION */}
      <Box sx={{ position: 'relative', height: { xs: 300, md: 450 }, width: '100%', borderRadius: 4, overflow: 'hidden', mb: 4, boxShadow: 3 }}>
        <Box component="img" src={coverImage} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)', p: { xs: 3, md: 5 }, color: 'white' }}>
          <Stack direction="row" spacing={1} mb={1}>
            <Chip label={proyecto.tipo_inversion === 'mensual' ? 'Ahorro' : 'Inversión Directa'} color="primary" sx={{ fontWeight: 'bold' }} />
            <Chip label={proyecto.estado_proyecto} color={proyecto.estado_proyecto === 'En proceso' ? 'success' : 'default'} />
          </Stack>
          <Typography variant="h3" fontWeight={700} sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{proyecto.nombre_proyecto}</Typography>
          <Box display="flex" alignItems="center" gap={1} mt={1} sx={{ opacity: 0.9 }}>
            <LocationOn fontSize="small" />
            <Typography variant="subtitle1">{proyecto.forma_juridica || 'Ubicación no especificada'}</Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 4 }}>
        {/* IZQUIERDA: Tabs */}
        <Box sx={{ flex: 1, minWidth: 0 }}> 
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Descripción" />
              <Tab label="Galería" />
              <Tab label="Lotes Disponibles" disabled={!mostrarTabLotes} />
            </Tabs>
          </Box>
          <CustomTabPanel value={tabValue} index={0}>
            <Typography paragraph color="text.secondary" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>{proyecto.descripcion}</Typography>
            <Box mt={4} p={3} bgcolor="grey.50" borderRadius={2}>
              <Typography variant="subtitle2" gutterBottom>Características</Typography>
              <Stack direction="row" spacing={4} mt={2} flexWrap="wrap">
                 <Box><Typography variant="caption" color="text.secondary">TIPO</Typography><Typography fontWeight="bold">{proyecto.tipo_inversion === 'mensual' ? 'Plan de Ahorro' : 'Compra Directa'}</Typography></Box>
                 <Box><Typography variant="caption" color="text.secondary">ESTADO</Typography><Typography fontWeight="bold">{proyecto.estado_proyecto}</Typography></Box>
              </Stack>
            </Box>
          </CustomTabPanel>
          <CustomTabPanel value={tabValue} index={1}>
             <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap={2}>
                {proyecto.imagenes?.map((img) => (
                  <Box key={img.id} component="img" src={ImagenService.resolveImageUrl(img.url)} sx={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 2 }} />
                ))}
             </Box>
          </CustomTabPanel>
          {mostrarTabLotes && (
            <CustomTabPanel value={tabValue} index={2}>
              <ListaLotesProyecto idProyecto={Number(id)} />
            </CustomTabPanel>
          )}
        </Box>

        {/* DERECHA: Sidebar */}
        <Box sx={{ width: { xs: '100%', lg: 380 }, flexShrink: 0 }}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 3, position: { lg: 'sticky' }, top: 100 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>Resumen de Inversión</Typography>
            <Divider sx={{ my: 2 }} />
            
            <Stack spacing={3}>
               <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography color="text.secondary">Valor</Typography>
                  <Typography variant="h5" color="primary.main" fontWeight="bold">{proyecto.moneda} {Number(proyecto.monto_inversion).toLocaleString()}</Typography>
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
                  <Typography variant="caption" display="block">Activa el 2FA para invertir.</Typography>
                  <Button size="small" color="warning" onClick={() => navigate('/client/MiCuenta/SecuritySettings')}>
                    Configurar Ahora
                  </Button>
                </Alert>
               )}

               <Tooltip title={is2FAMissing ? "Activa el 2FA en tu perfil" : ""}>
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

               {/* ✅ LÓGICA DEL BOTÓN DE FIRMA MODIFICADA */}
               {user && proyecto.tipo_inversion === 'mensual' && (
                 <>
                   {yaFirmo ? (
                     // ESTADO: YA FIRMADO (Botón verde solido)
                     <Button 
                       variant="contained" 
                       color="success" 
                       fullWidth 
                       disabled
                       startIcon={<CheckCircle />}
                       sx={{ "&.Mui-disabled": { bgcolor: 'success.main', color: 'white', opacity: 0.9 } }}
                     >
                       Contrato Firmado
                     </Button>
                   ) : (
                     // ESTADO: PENDIENTE
                     <Button 
                       variant="outlined" 
                       color="success" 
                       startIcon={<GppGood />} 
                       fullWidth 
                       onClick={handleClickFirmar} 
                       disabled={is2FAMissing}
                     >
                       Firmar Contrato (Manual)
                     </Button>
                   )}

                   {!yaFirmo && (
                      <Button variant="text" fullWidth onClick={contratoModal.open}>Ver Plantilla</Button>
                   )}
                 </>
               )}
            </Stack>
          </Paper>
        </Box>
      </Box>

      {/* --- SECCIÓN DE MODALES --- */}
      {user && (
        <>
          <PagoExitosoModal 
             open={pagoExitosoModal.isOpen} 
             onContinuar={handleContinuarAFirma} 
          />

          {/* ✅ ModalFirmaContrato con spread props y el handler nuevo */}
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