// src/features/client/pages/Proyectos/modals/CheckoutWizardModal.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Stepper, Step, StepLabel, Button, Typography, Paper, Stack,
  Divider, Alert, CircularProgress, TextField, alpha, useTheme,
  Avatar, Zoom, Fade, useMediaQuery, Chip, keyframes
} from '@mui/material';
import {
  ShoppingCart, Description, Security, Payment, Draw, CheckCircle,
  ArrowForward, ArrowBack, Close, Info, VpnKey,
  LocationOn, Business, VerifiedUser, Lock, Clear, Save, CloudUpload,
  Token, GppGood, Explore, MyLocation
} from '@mui/icons-material';
import { PDFDocument } from 'pdf-lib'; 

// Services
import InversionService from '@/core/api/services/inversion.service';
import SuscripcionService from '@/core/api/services/suscripcion.service';
import MercadoPagoService from '@/core/api/services/pagoMercado.service';
import ContratoPlantillaService from '@/core/api/services/contrato-plantilla.service';
import ImagenService from '@/core/api/services/imagen.service';
import ContratoFirmadoService from '@/core/api/services/contrato-firmado.service';

// Components
import BaseModal from '@/shared/components/domain/modals/BaseModal/BaseModal';
import PDFViewerMejorado from '../../Contratos/components/PDFViewerMejorado';

// Hooks
import useSnackbar from '@/shared/hooks/useSnackbar';
import { useQuery } from '@tanstack/react-query';

// Types
import type { ProyectoDto } from '@/core/types/dto/proyecto.dto';

// =====================================================
// ANIMACIONES
// =====================================================
const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
  40% {transform: translateY(-10px);}
  60% {transform: translateY(-5px);}
`;

const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
`;

// =====================================================
// TIPOS Y CONSTANTES
// =====================================================

export interface CheckoutWizardModalProps {
  open: boolean;
  onClose: () => void;
  proyecto: ProyectoDto;
  tipo: 'suscripcion' | 'inversion';
  onConfirmInvestment?: () => void;      
  onSubmit2FA?: (code: string) => void;  
  onSignContract?: (file: File, location: { lat: string, lng: string } | null) => void; 
  isProcessing?: boolean;
  error2FA?: string | null;
  inversionId?: number;
  pagoId?: number;
  onComplete?: () => void;
}

const STEPS = [
  { label: 'Resumen', icon: <ShoppingCart /> },
  { label: 'Contrato', icon: <Description /> },
  { label: 'Seguridad', icon: <Security /> },
  { label: 'Pago', icon: <Payment /> },
  { label: 'Firma', icon: <Draw /> },
];

// =====================================================
// SUB-COMPONENTES DE APOYO
// =====================================================

const SignatureCanvas: React.FC<{ onSave: (data: string) => void; onClear: () => void }> = ({ onSave, onClear }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const theme = useTheme();

  const handleResize = useCallback(() => {
    if (!canvasRef.current?.parentElement) return;
    const parent = canvasRef.current.parentElement;
    canvasRef.current.width = parent.clientWidth;
    canvasRef.current.height = parent.clientHeight;
    const context = canvasRef.current.getContext('2d');
    if (context) {
      context.strokeStyle = theme.palette.text.primary;
      context.lineWidth = 2.5;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      setCtx(context);
    }
  }, [theme.palette.text.primary]);

  useEffect(() => {
    const timeout = setTimeout(handleResize, 100);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeout);
    };
  }, [handleResize]);

  const getPos = useCallback((e: any) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  const startDrawing = useCallback((e: any) => {
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  }, [ctx, getPos]);

  const draw = useCallback((e: any) => {
    if (!isDrawing || !ctx) return;
    e.preventDefault(); 
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  }, [isDrawing, ctx, getPos]);

  const stopDrawing = useCallback(() => {
    if (isDrawing && ctx) {
      ctx.closePath();
      setIsDrawing(false);
    }
  }, [isDrawing, ctx]);

  const handleClear = useCallback(() => {
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setHasSignature(false);
      onClear();
    }
  }, [ctx, onClear]);

  const handleSave = useCallback(() => {
    if (canvasRef.current && hasSignature) {
      onSave(canvasRef.current.toDataURL('image/png'));
    }
  }, [hasSignature, onSave]);

  return (
    <Box>
      <Paper 
        variant="outlined" 
        sx={{ 
            mb: 2, overflow: 'hidden', touchAction: 'none',
            bgcolor: 'background.default', 
            border: `2px dashed ${theme.palette.divider}`,
            borderRadius: 2,
            position: 'relative',
            height: { xs: 180, sm: 220 },
            transition: 'all 0.3s ease',
            '&:hover': { borderColor: 'primary.main' }
        }}
      >
        {!hasSignature && !isDrawing && (
            <Box position="absolute" top="50%" left="50%" sx={{ transform: 'translate(-50%, -50%)', pointerEvents: 'none', textAlign: 'center' }}>
                <Draw sx={{ fontSize: 40, color: 'action.disabled', mb: 1, mx: 'auto', display: 'block' }} />
                <Typography variant="caption" color="text.disabled">Firma aquí dentro</Typography>
            </Box>
        )}
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
          onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
          style={{ width: '100%', height: '100%', cursor: 'crosshair', display: 'block' }}
        />
      </Paper>
      <Stack direction="row" spacing={2} justifyContent="center">
        <Button size="small" onClick={handleClear} startIcon={<Clear />} variant="outlined" color="error">Borrar</Button>
        <Button size="small" variant="contained" onClick={handleSave} startIcon={<Save />} disabled={!hasSignature}>Usar Firma</Button>
      </Stack>
    </Box>
  );
};

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export const CheckoutWizardModal: React.FC<CheckoutWizardModalProps> = ({
  open, onClose, proyecto, tipo, onConfirmInvestment, onSignContract,
  isProcessing, error2FA, inversionId, pagoId
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { showSuccess, showError, showWarning } = useSnackbar();

  const [activeStep, setActiveStep] = useState(0);
  const [codigo2FA, setCodigo2FA] = useState('');
  const [location, setLocation] = useState<{ lat: string; lng: string } | null>(null);
  const [transaccionId, setTransaccionId] = useState<number | null>(null);
  const [pagoExitoso, setPagoExitoso] = useState(false);
  const [isVerificandoPago, setIsVerificandoPago] = useState(false);
  const [isInternalProcessing, setIsInternalProcessing] = useState(false);
  
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signaturePosition, setSignaturePosition] = useState<{ x: number; y: number; page: number } | null>(null);
  const [isSigningPdf, setIsSigningPdf] = useState(false);

  const montoFormateado = new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: proyecto.moneda === 'USD' ? 'USD' : 'ARS', minimumFractionDigits: 0,
  }).format(Number(proyecto.monto_inversion));

  const { data: plantillas, isLoading: loadingPlantilla } = useQuery({
    queryKey: ['plantillaContrato', proyecto.id],
    queryFn: async () => (await ContratoPlantillaService.findByProject(proyecto.id)).data,
    enabled: open,
  });
  const plantillaActual = plantillas && plantillas.length > 0 ? plantillas[0] : null;

  useEffect(() => {
    if ((activeStep === 2 || activeStep === 4) && open) {
      ContratoFirmadoService.getCurrentPosition().then(pos => { if (pos) setLocation(pos); });
    }
  }, [activeStep, open]);

  useEffect(() => {
    if (open) {
      const savedTxId = sessionStorage.getItem('checkout_tx_id');
      const savedProjId = sessionStorage.getItem('checkout_proj_id');
      if (savedTxId && savedProjId === String(proyecto.id)) {
        setTransaccionId(Number(savedTxId));
        setActiveStep(3);
        sessionStorage.removeItem('checkout_tx_id');
        sessionStorage.removeItem('checkout_proj_id');
        iniciarVerificacionPago(Number(savedTxId));
      }
    }
  }, [open, proyecto.id]);

  const handleClose = () => {
    if (isVerificandoPago || isProcessing || isInternalProcessing || isSigningPdf) return;
    onClose();
    setTimeout(() => {
      setActiveStep(0);
      setCodigo2FA('');
      setPagoExitoso(false);
      setSignatureDataUrl(null);
      setSignaturePosition(null);
    }, 300);
  };

  const handleSubmit2FA = async () => {
    try {
      setIsInternalProcessing(true);
      let response;
      if (tipo === 'inversion' && inversionId) {
        response = await InversionService.confirmar2FA({ inversionId, codigo_2fa: codigo2FA });
      } else if (tipo === 'suscripcion') {
        const idTransaccion = pagoId || inversionId;
        if (!idTransaccion) throw new Error("Falta el ID de transacción.");
        response = await SuscripcionService.confirmar2FA({ transaccionId: idTransaccion, codigo_2fa: codigo2FA });
      } else throw new Error('Error interno: IDs faltantes.');

      const data = response?.data as any;
      const urlPago = data?.redirectUrl || data?.init_point || data?.url || data?.preference?.init_point;
      const txId = data?.transaccionId || data?.id || data?.data?.transaccionId;

      if (urlPago) {
        if (txId) {
          sessionStorage.setItem('checkout_tx_id', String(txId));
          sessionStorage.setItem('checkout_proj_id', String(proyecto.id));
        }
        window.location.href = urlPago;
      } else {
        showError('Error: No se recibió el link de pago.');
        setIsInternalProcessing(false);
      }
    } catch (error: any) {
      showError(error.response?.data?.message || 'Error al procesar el pago');
      setCodigo2FA('');
      setIsInternalProcessing(false);
    }
  };

  const handleGenerateSignedPdf = async () => {
    if (!plantillaActual || !signatureDataUrl || !onSignContract) return;
    try {
        setIsSigningPdf(true);
        const pdfUrl = ImagenService.resolveImageUrl(plantillaActual.url_archivo);
        const pdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const signatureImage = await pdfDoc.embedPng(signatureDataUrl);
        
        let page, x, y;
        if (signaturePosition) {
            const pageIndex = (signaturePosition.page || 1) - 1;
            page = pdfDoc.getPages()[pageIndex];
            const { height } = page.getSize();
            x = signaturePosition.x;
            y = height - signaturePosition.y - 50; 
        } else {
            const pages = pdfDoc.getPages();
            page = pages[pages.length - 1]; 
            const { width } = page.getSize();
            x = (width / 2) - 75; 
            y = 50; 
        }
        page.drawImage(signatureImage, { x, y, width: 150, height: 50 });
        const signedPdfBytes = await pdfDoc.save();
        const signedFile = new File([signedPdfBytes as any], `firmado_${plantillaActual.nombre_archivo}`, { type: 'application/pdf' });
        onSignContract(signedFile, location);
        handleClose();
    } catch (error) {
        console.error(error);
        showError("Error al generar el documento firmado.");
    } finally {
        setIsSigningPdf(false);
    }
  };

  const handleStepAction = async () => {
    switch (activeStep) {
      case 0: if (onConfirmInvestment) onConfirmInvestment(); setActiveStep(1); break;
      case 1: setActiveStep(2); break;
      case 2: if (codigo2FA.length === 6) await handleSubmit2FA(); break;
      case 4: if (signatureDataUrl) await handleGenerateSignedPdf(); break;
    }
  };

  const iniciarVerificacionPago = async (id: number) => {
    setIsVerificandoPago(true);
    for (let i = 0; i < 8; i++) {
      try {
        const res = await MercadoPagoService.getPaymentStatus(id, true);
        const estado = (res.data?.transaccion?.estado || (res.data as any)?.estado) as string;
        if (estado === 'pagado' || estado === 'approved') {
          setPagoExitoso(true);
          setIsVerificandoPago(false);
          showSuccess('¡Pago confirmado!');
          setTimeout(() => setActiveStep(4), 2000); 
          return;
        }
        if (estado === 'fallido' || estado === 'rejected') {
             setIsVerificandoPago(false);
             showError('El pago fue rechazado.');
             setActiveStep(0); 
             return;
        }
        await new Promise(r => setTimeout(r, 3000));
      } catch (e) { console.error(e); }
    }
    setIsVerificandoPago(false);
    showWarning('El pago sigue procesándose. Verifica en "Mis Inversiones".');
    handleClose();
  };

  const isStepValid = () => {
      if (activeStep === 1) return true;
      if (activeStep === 2) return codigo2FA.length === 6 && !!location; // ✅ Solo válido si hay ubicación
      if (activeStep === 4) return !!signatureDataUrl;
      return true;
  };
  
  const loading = isProcessing || isInternalProcessing || isSigningPdf;

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      title={tipo === 'suscripcion' ? 'Nueva Suscripción' : 'Nueva Inversión'}
      subtitle={proyecto.nombre_proyecto}
      icon={tipo === 'suscripcion' ? <VerifiedUser /> : <Business />}
      headerColor={activeStep === 4 ? 'success' : 'primary'}
      fullScreen={isMobile}
      maxWidth="md"
      disableClose={isVerificandoPago || loading}
      PaperProps={{ sx: { height: { xs: '100%', md: '95vh' } } }}
      customActions={
        <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={2} width="100%" justifyContent="space-between">
            <Button onClick={activeStep === 0 ? handleClose : () => setActiveStep(p => p - 1)} disabled={loading || isVerificandoPago || activeStep === 3} startIcon={activeStep === 0 ? <Close/> : <ArrowBack/>} color="inherit" fullWidth={isMobile}>
              {activeStep === 0 ? 'Cancelar' : 'Atrás'}
            </Button>
            {activeStep !== 3 && (
              <Button variant="contained" color={activeStep === 4 ? 'success' : 'primary'} onClick={handleStepAction} disabled={!isStepValid() || loading} endIcon={loading ? <CircularProgress size={20} color="inherit" /> : activeStep === 4 ? <CloudUpload/> : <ArrowForward />} fullWidth={isMobile}>
                {loading ? 'Procesando...' : activeStep === 4 ? 'Finalizar Firma' : activeStep === 2 ? 'Ir a Pagar' : 'Continuar'}
              </Button>
            )}
        </Stack>
      }
    >
      <Stack spacing={3} height="100%">
        {!isMobile && (
            <Stepper activeStep={activeStep} alternativeLabel sx={{ pt: 2 }}>
            {STEPS.map((step, index) => (
                <Step key={step.label}>
                <StepLabel StepIconProps={{ sx: { '&.Mui-active': { color: index === 4 ? theme.palette.success.main : theme.palette.primary.main, transform: 'scale(1.2)' }, '&.Mui-completed': { color: theme.palette.success.main } } }}>
                    {step.label}
                </StepLabel>
                </Step>
            ))}
            </Stepper>
        )}

        {isMobile && (
            <Box py={1} px={2} borderBottom={`1px solid ${theme.palette.divider}`} bgcolor="background.paper">
                <Typography variant="subtitle2" color="primary.main" fontWeight={700}>Paso {activeStep + 1} / {STEPS.length}: {STEPS[activeStep].label}</Typography>
                <Box width="100%" height={4} bgcolor="secondary.light" mt={1} borderRadius={2}>
                    <Box width={`${((activeStep + 1) / STEPS.length) * 100}%`} height="100%" bgcolor="primary.main" borderRadius={2} />
                </Box>
            </Box>
        )}

        <Box flex={1} overflow="auto" p={{ xs: 2, md: 4 }}>
          {activeStep === 0 && <StepConfirmacion proyecto={proyecto} tipo={tipo} monto={montoFormateado} />}
          {activeStep === 1 && <StepContrato plantilla={plantillaActual} isLoading={loadingPlantilla} />}
          {activeStep === 2 && <StepSeguridad codigo2FA={codigo2FA} setCodigo2FA={setCodigo2FA} location={location} isProcessing={loading} error={error2FA} />}
          {activeStep === 3 && <StepPago isVerificando={isVerificandoPago} pagoExitoso={pagoExitoso} />}
          {activeStep === 4 && (
             <Stack spacing={3} height="100%">
                <Fade in={!signatureDataUrl} unmountOnExit>
                    <Box>
                        <Alert severity="info" icon={<Draw />} sx={{ borderRadius: 2, mb: 3 }}><Typography variant="body2">Dibuja tu firma en el recuadro a continuación.</Typography></Alert>
                        <SignatureCanvas onSave={setSignatureDataUrl} onClear={() => setSignatureDataUrl(null)} />
                    </Box>
                </Fade>
                <Fade in={!!signatureDataUrl} unmountOnExit>
                    <Box height="100%" display="flex" flexDirection="column">
                        <Alert severity="success" variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
                                <Typography variant="body2" fontWeight={600}>¡Firma capturada correctamente!</Typography>
                                <Button size="small" onClick={() => setSignatureDataUrl(null)} sx={{ fontWeight: 700 }}>Cambiar Firma</Button>
                            </Stack>
                        </Alert>
                        <Box flex={1} borderRadius={2} overflow="hidden" border={`1px solid ${theme.palette.divider}`}>
                            <PDFViewerMejorado pdfUrl={plantillaActual ? ImagenService.resolveImageUrl(plantillaActual.url_archivo) : ''} signatureDataUrl={signatureDataUrl} onSignaturePositionSet={setSignaturePosition} />
                        </Box>
                    </Box>
                </Fade>
             </Stack>
          )}
        </Box>
      </Stack>
    </BaseModal>
  );
};

// =====================================================
// COMPONENTES DE PASOS
// =====================================================

const StepConfirmacion: React.FC<{ proyecto: ProyectoDto; tipo: string; monto: string }> = ({ proyecto, tipo, monto }) => (
  <Stack spacing={3} maxWidth="sm" mx="auto">
     <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>Revisa los detalles antes de iniciar la operación.</Alert>
     <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, bgcolor: 'background.default' }}>
        <Stack spacing={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1" color="text.secondary">Total a Pagar</Typography>
                <Typography variant="h4" fontWeight={700} color="success.main">{monto}</Typography>
            </Box>
            <Divider />
            <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Proyecto</Typography>
                <Typography variant="body2" fontWeight={600}>{proyecto.nombre_proyecto}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">Modalidad</Typography>
                <Chip label={tipo.toUpperCase()} size="small" color="primary" sx={{ fontWeight: 700, borderRadius: 1 }} />
            </Box>
            {tipo === 'suscripcion' && (
              <>
                <Divider />
                <Stack direction="row" spacing={2} alignItems="center" sx={{ color: 'primary.main' }}>
                  <Token color="inherit" />
                  <Box>
                    <Typography variant="body2" fontWeight={700}>Beneficio de Bienvenida</Typography>
                    <Typography variant="caption" color="text.secondary">Esta suscripción incluye 1 Token de Subasta.</Typography>
                  </Box>
                </Stack>
              </>
            )}
        </Stack>
     </Paper>
  </Stack>
);

const StepContrato: React.FC<{ plantilla: any; isLoading: boolean }> = ({ plantilla, isLoading }) => {
    if (isLoading) return <Box p={4} textAlign="center"><CircularProgress /></Box>;
    if (!plantilla) return <Stack alignItems="center" justifyContent="center" height="50vh" spacing={2} color="text.secondary"><Info sx={{ fontSize: 60, opacity: 0.5 }} /><Typography>No hay contrato disponible.</Typography></Stack>;
    return (
        <Stack spacing={2} height="100%">
            <Box><Typography variant="h6" fontWeight={700} gutterBottom display="flex" alignItems="center" gap={1}><Description color="primary" /> Contrato de Participación</Typography>
            <Typography variant="body2" color="text.secondary">Este documento detalla los términos legales. Lo firmarás digitalmente en el último paso.</Typography></Box>
            <Alert severity="info" variant="outlined" icon={<GppGood />} sx={{ borderRadius: 2 }}>Respaldo jurídico de tu operación.</Alert>
            <Box sx={{ flex: 1, minHeight: { xs: '60vh', md: '70vh' }, bgcolor: 'grey.100', borderRadius: 2, overflow: 'hidden', border: '1px solid #e0e0e0' }}><iframe src={ImagenService.resolveImageUrl(plantilla.url_archivo)} width="100%" height="100%" title="Contrato" style={{ border: 'none' }} /></Box>
        </Stack>
    );
};

const StepSeguridad: React.FC<{ codigo2FA: string; setCodigo2FA: any; location: any; isProcessing: boolean; error: string | null | undefined }> = ({ codigo2FA, setCodigo2FA, location, isProcessing, error }) => {
    const theme = useTheme();

    return (
        <Stack spacing={4} alignItems="center" py={2} maxWidth="sm" mx="auto">
            <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', boxShadow: 3 }}><Lock fontSize="large" /></Avatar>
            
            <Box textAlign="center">
                <Typography variant="h5" fontWeight={700} gutterBottom>Verificación de Identidad</Typography>
                <Typography variant="body2" color="text.secondary">Ingresa el código de tu aplicación <b>Google Authenticator</b>.</Typography>
            </Box>

            {/* ✅ BLOQUE DE PERMISOS DE UBICACIÓN DINÁMICO */}
            {!location ? (
                <Alert 
                    severity="warning" 
                    icon={<Explore sx={{ animation: `${pulse} 2s infinite` }} />} 
                    sx={{ width: '100%', borderRadius: 2, border: `1px solid ${theme.palette.warning.main}` }}
                >
                    <Typography variant="subtitle2" fontWeight={700}>Acceso a Ubicación Requerido</Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                        Para obtener las coordenadas debes <b>concedernos el permiso para acceder a tu ubicación</b> y recarga la página si lo habías denegado anteriormente.
                    </Typography>
                    <Typography variant="caption" display="block" fontWeight={700} sx={{ mt: 1 }}>
                        Este paso es obligatorio para la validez legal de tu firma.
                    </Typography>
                </Alert>
            ) : (
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.05), borderColor: 'success.main', width: '100%' }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <MyLocation color="success" />
                        <Box flex={1} overflow="hidden">
                            <Typography variant="caption" fontWeight={700} color="success.main" display="block">UBICACIÓN VERIFICADA</Typography>
                            <Typography variant="caption" color="text.secondary" noWrap display="block">
                                Coordenadas registradas para la auditoría del contrato.
                            </Typography>
                        </Box>
                        <CheckCircle color="success" fontSize="small" />
                    </Stack>
                </Paper>
            )}

            <TextField 
                value={codigo2FA} 
                onChange={(e) => setCodigo2FA(e.target.value.slice(0, 6))} 
                placeholder="000 000" 
                disabled={isProcessing || !location} // ✅ Bloqueado si no hay ubicación
                error={!!error} 
                helperText={error} 
                fullWidth 
                InputProps={{ 
                    startAdornment: <VpnKey color="action" sx={{ mr: 2 }}/>, 
                    style: { fontSize: '1.5rem', letterSpacing: 4, textAlign: 'center', fontWeight: 700 } 
                }} 
                sx={{ maxWidth: 320 }} 
            />

            {!location && (
                <Typography variant="caption" color="error" fontWeight={600} textAlign="center">
                    * Debes habilitar la ubicación para poder continuar al pago.
                </Typography>
            )}
        </Stack>
    );
};

const StepPago: React.FC<{ isVerificando: boolean; pagoExitoso: boolean }> = ({ isVerificando, pagoExitoso }) => {
    const theme = useTheme();
    return (
    <Stack alignItems="center" justifyContent="center" height="100%" minHeight="40vh" spacing={4}>
        {pagoExitoso ? (
            <Zoom in>
              <Stack alignItems="center" spacing={2}>
                <Avatar sx={{ width: 100, height: 100, bgcolor: 'success.main', boxShadow: 4 }}><CheckCircle sx={{ fontSize: 60 }} /></Avatar>
                <Chip icon={<Token style={{ color: 'white' }} />} label="+1 Token Acreditado" color="warning" sx={{ fontWeight: 800, px: 2, py: 2.5, fontSize: '1rem', animation: `${bounce} 1s infinite`, boxShadow: theme.shadows[4] }} />
              </Stack>
            </Zoom>
        ) : (
            <CircularProgress size={80} thickness={4} />
        )}
        <Box textAlign="center">
            <Typography variant="h5" fontWeight={700} gutterBottom>{pagoExitoso ? '¡Pago Acreditado!' : 'Procesando Transacción...'}</Typography>
            <Typography variant="body1" color="text.secondary">{pagoExitoso ? 'Tu operación ha sido registrada exitosamente. Vamos a firmar.' : 'Estamos validando el pago con Mercado Pago. No cierres esta ventana.'}</Typography>
        </Box>
    </Stack>
    );
};