// src/features/client/pages/Proyectos/modals/CheckoutWizardModal.tsx

import {
  ArrowBack,
  ArrowForward,
  Business,
  CheckCircle,
  Clear,
  Close,
  CloudUpload,
  Description,
  Draw,
  Info,
  Lock,
  Payment,
  Refresh,
  Save,
  Security,
  ShoppingCart,
  Token,
  VerifiedUser
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  Fade,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  keyframes,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { PDFDocument } from 'pdf-lib';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Services
import ContratoFirmadoService from '@/core/api/services/contrato-firmado.service';
import ContratoPlantillaService from '@/core/api/services/contrato-plantilla.service';
import ImagenService from '@/core/api/services/imagen.service';
import InversionService from '@/core/api/services/inversion.service';
import MercadoPagoService from '@/core/api/services/pagoMercado.service';
import SuscripcionService from '@/core/api/services/suscripcion.service';

// Components
import BaseModal from '@/shared/components/domain/modals/BaseModal/BaseModal';
import PDFViewerMejorado from '../../Contratos/components/PDFViewerMejorado';

// Hooks
import useSnackbar from '@/shared/hooks/useSnackbar';
import { useQuery } from '@tanstack/react-query';

// Types
import type { ProyectoDto } from '@/core/types/dto/proyecto.dto';
import { useCurrencyFormatter } from '@/features/client/hooks/useCurrencyFormatter';
import { CheckoutStateManager, type CheckoutPersistedState } from './Checkout persistence';

// ===================================================
// CONSTANTS
// ===================================================
const CODIGO_2FA_LENGTH = 6;
const MAX_PAYMENT_VERIFICATION_ATTEMPTS = 8;
const PAYMENT_VERIFICATION_INTERVAL_MS = 3000;
const SIGNATURE_WIDTH = 150;
const SIGNATURE_HEIGHT = 50;

const STEPS = [
  { label: 'Resumen', icon: <ShoppingCart /> },
  { label: 'Contrato', icon: <Description /> },
  { label: 'Seguridad', icon: <Security /> },
  { label: 'Pago', icon: <Payment /> },
  { label: 'Firma', icon: <Draw /> },
] as const;

// ===================================================
// ANIMATIONS
// ===================================================
const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
`;

const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
`;

// ===================================================
// TYPES
// ===================================================
export interface CheckoutWizardModalProps {
  open: boolean;
  onClose: () => void;
  proyecto: ProyectoDto;
  tipo: 'suscripcion' | 'inversion';
  onConfirmInvestment?: () => void;
  onSignContract?: (file: File, location: { lat: string; lng: string } | null, codigo2FA: string) => void;
  isProcessing?: boolean;
  error2FA?: string | null;
  inversionId?: number;
  pagoId?: number;
}

interface SignaturePosition {
  x: number;
  y: number;
  page: number;
}

interface Location {
  lat: string;
  lng: string;
}

// ===================================================
// SIGNATURE CANVAS COMPONENT
// ===================================================
const SignatureCanvas = React.memo<{
  onSave: (data: string) => void;
  onClear: () => void;
  initialSignature?: string | null;
}>(({ onSave, onClear, initialSignature }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!initialSignature);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const theme = useTheme();

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas?.parentElement) return;

    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;

    const context = canvas.getContext('2d');
    if (context) {
      context.strokeStyle = theme.palette.text.primary;
      context.lineWidth = 2.5;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      setCtx(context);

      if (initialSignature && !hasSignature) {
        const img = new Image();
        img.onload = () => {
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.drawImage(img, 0, 0, canvas.width, canvas.height);
          setHasSignature(true);
        };
        img.src = initialSignature;
      }
    }
  }, [theme.palette.text.primary, initialSignature, hasSignature]);

  useEffect(() => {
    const timeoutId = setTimeout(setupCanvas, 100);
    window.addEventListener('resize', setupCanvas);

    return () => {
      window.removeEventListener('resize', setupCanvas);
      clearTimeout(timeoutId);
    };
  }, [setupCanvas]);

  const getPointerPosition = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const isTouchEvent = 'touches' in e;
    const clientX = isTouchEvent ? e.touches[0].clientX : e.clientX;
    const clientY = isTouchEvent ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!ctx) return;

    const { x, y } = getPointerPosition(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  }, [ctx, getPointerPosition]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !ctx) return;

    e.preventDefault();
    const { x, y } = getPointerPosition(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  }, [isDrawing, ctx, getPointerPosition]);

  const stopDrawing = useCallback(() => {
    if (isDrawing && ctx) {
      ctx.closePath();
      setIsDrawing(false);
    }
  }, [isDrawing, ctx]);

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
      onClear();
    }
  }, [ctx, onClear]);

  const handleSave = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas && hasSignature) {
      const dataUrl = canvas.toDataURL('image/png');
      onSave(dataUrl);
    }
  }, [hasSignature, onSave]);

  return (
    <Box>
      <Paper
        variant="outlined"
        sx={{
          mb: 2,
          overflow: 'hidden',
          touchAction: 'none',
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
          <Box
            position="absolute"
            top="50%"
            left="50%"
            sx={{
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              textAlign: 'center'
            }}
          >
            <Draw sx={{ fontSize: 40, color: 'action.disabled', mb: 1 }} />
            <Typography variant="caption" color="text.disabled">
              Firma aquí dentro
            </Typography>
          </Box>
        )}
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{
            width: '100%',
            height: '100%',
            cursor: 'crosshair',
            display: 'block'
          }}
        />
      </Paper>
      <Stack direction="row" spacing={2} justifyContent="center">
        <Button
          size="small"
          onClick={handleClear}
          startIcon={<Clear />}
          variant="outlined"
          color="error"
        >
          Borrar
        </Button>
        <Button
          size="small"
          variant="contained"
          onClick={handleSave}
          startIcon={<Save />}
          disabled={!hasSignature}
        >
          Usar Firma
        </Button>
      </Stack>
    </Box>
  );
});

SignatureCanvas.displayName = 'SignatureCanvas';

// ===================================================
// MAIN COMPONENT
// ===================================================
export const CheckoutWizardModal: React.FC<CheckoutWizardModalProps> = ({
  open,
  onClose,
  proyecto,
  tipo,
  onConfirmInvestment,
  onSignContract,
  isProcessing = false,
  error2FA,
  inversionId: initialInversionId,
  pagoId: initialPagoId
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { showSuccess, showError, showWarning, showInfo } = useSnackbar();
  const formatCurrency = useCurrencyFormatter({
    currency: proyecto.moneda === 'USD' ? 'USD' : 'ARS'
  });

  // ===================================================
  // STATE
  // ===================================================
  const [activeStep, setActiveStep] = useState(0);
  const [codigo2FA, setCodigo2FA] = useState('');
  const [location, setLocation] = useState<Location | null>(null);
  const [transaccionId, setTransaccionId] = useState<number | null>(null);
  const [pagoExitoso, setPagoExitoso] = useState(false);
  const [isVerificandoPago, setIsVerificandoPago] = useState(false);
  const [isInternalProcessing, setIsInternalProcessing] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signaturePosition, setSignaturePosition] = useState<SignaturePosition | null>(null);
  const [isSigningPdf, setIsSigningPdf] = useState(false);
  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false);
  const [recoveredState, setRecoveredState] = useState<CheckoutPersistedState | null>(null);

  const isVerifyingRef = useRef(false);
  const hasAttemptedRecovery = useRef(false);

  // IDs efectivos
  const effectiveInversionId = transaccionId || initialInversionId;
  const effectivePagoId = transaccionId || initialPagoId;

  // ===================================================
  // MEMOIZED VALUES
  // ===================================================
  const montoFormateado = useMemo(
    () => formatCurrency(Number(proyecto.monto_inversion)),
    [formatCurrency, proyecto.monto_inversion]
  );

  const { data: plantillas, isLoading: loadingPlantilla } = useQuery({
    queryKey: ['plantillaContrato', proyecto.id],
    queryFn: async () => {
      const response = await ContratoPlantillaService.findByProject(proyecto.id);
      return response.data;
    },
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const plantillaActual = useMemo(
    () => (plantillas && plantillas.length > 0 ? plantillas[0] : null),
    [plantillas]
  );

  // ===================================================
  // PERSISTENCIA DE ESTADO
  // ===================================================
  const persistState = useCallback(() => {
    const state: CheckoutPersistedState = {
      projectId: proyecto.id,
      tipo,
      activeStep,
      transactionId: transaccionId,
      paymentSuccess: pagoExitoso,
      signatureDataUrl,
      location,
      timestamp: Date.now()
    };
    CheckoutStateManager.saveState(state);
  }, [proyecto.id, tipo, activeStep, transaccionId, pagoExitoso, signatureDataUrl, location]);

  useEffect(() => {
    if (open && (pagoExitoso || activeStep >= 3 || transaccionId)) {
      persistState();
    }
  }, [open, pagoExitoso, activeStep, transaccionId, persistState]);

  // ===================================================
  // RECUPERACIÓN DE ESTADO (CORREGIDA)
  // ===================================================
  useEffect(() => {
    if (!open || hasAttemptedRecovery.current) return;

    const savedState = CheckoutStateManager.loadState(proyecto.id);

    if (savedState) {
      console.log('🔄 Estado recuperado:', savedState);

      // CASO: PAGO EXITOSO DETECTADO
      if (savedState.paymentSuccess && savedState.transactionId) {
        console.log('✅ Pago exitoso detectado. Requerimos 2FA nuevamente para firmar.');

        setTransaccionId(savedState.transactionId);
        setPagoExitoso(true);
        // NO restauramos la firma para que la dibuje de nuevo
        setLocation(savedState.location);

        // ✅ FIX ARIA-HIDDEN: Quitamos el setTimeout para que el cambio de paso sea sincrónico
        // y el input autoFocus pueda capturar el foco inmediatamente.
        setActiveStep(2);
        showInfo('Pago confirmado. Por seguridad, ingresa tu 2FA para firmar.');

        hasAttemptedRecovery.current = true;
        return;
      }

      // CASO: SESIÓN INTERRUMPIDA (Prompt)
      if (savedState.activeStep >= 3 && savedState.transactionId) {
        setRecoveredState(savedState);
        setShowRecoveryPrompt(true);
        hasAttemptedRecovery.current = true;
        return;
      }
    }

    // NUEVO: Verificación por props (URL Return)
    if (!savedState && (effectiveInversionId || effectivePagoId)) {
      const txId = effectiveInversionId || effectivePagoId;
      MercadoPagoService.getPaymentStatus(txId!, true)
        .then(res => {
          const estado = (res.data?.transaccion?.estado || (res.data as any)?.estado) as any;
          if (estado === 'pagado' || estado === 'approved') {
            console.log('✅ Pago verificado como exitoso desde props');
            setTransaccionId(txId!);
            setPagoExitoso(true);
            CheckoutStateManager.markPaymentSuccess(proyecto.id, txId!);

            // ✅ FIX ARIA-HIDDEN: Sin timeout
            setActiveStep(2);
            showInfo('Pago confirmado. Por seguridad, ingresa tu 2FA para firmar.');
          }
        })
        .catch(err => console.warn('⚠️ Error verificando pago:', err));
    }

    hasAttemptedRecovery.current = true;
  }, [open, proyecto.id, effectiveInversionId, effectivePagoId, showSuccess, showInfo]);

  // HANDLER RECUPERACIÓN MANUAL
  const handleRecoverState = useCallback(() => {
    if (!recoveredState) return;

    setTransaccionId(recoveredState.transactionId);
    setPagoExitoso(recoveredState.paymentSuccess);
    setSignatureDataUrl(recoveredState.signatureDataUrl);
    setLocation(recoveredState.location);

    if (recoveredState.paymentSuccess) {
      // Si recuperamos un pago exitoso, ir a paso 2
      setActiveStep(2);
      showInfo('Por seguridad, ingresa tu 2FA para proceder a la firma.');
    } else {
      setActiveStep(recoveredState.activeStep);
      if (recoveredState.transactionId && recoveredState.activeStep >= 3) {
        iniciarVerificacionPago(recoveredState.transactionId);
      }
    }
    setShowRecoveryPrompt(false);
  }, [recoveredState, showInfo]);

  const handleDiscardRecovery = useCallback(() => {
    CheckoutStateManager.clearState();
    setShowRecoveryPrompt(false);
    setRecoveredState(null);
  }, []);

  // GEOLOCATION
  useEffect(() => {
    if ((activeStep === 2 || activeStep === 4) && open && !location) {
      ContratoFirmadoService.getCurrentPosition()
        .then(pos => {
          if (pos) {
            setLocation(pos);
            const currentState = CheckoutStateManager.loadState(proyecto.id);
            if (currentState) {
              CheckoutStateManager.saveState({ ...currentState, location: pos });
            }
          }
        })
        .catch(err => console.warn('Error obteniendo ubicación:', err));
    }
  }, [activeStep, open, location, proyecto.id]);

  // PAYMENT VERIFICATION
  const iniciarVerificacionPago = useCallback(async (id: number) => {
    if (isVerifyingRef.current) return;
    isVerifyingRef.current = true;
    setIsVerificandoPago(true);

    try {
      for (let i = 0; i < MAX_PAYMENT_VERIFICATION_ATTEMPTS; i++) {
        try {
          const res = await MercadoPagoService.getPaymentStatus(id, true);
          const estado = (res.data?.transaccion?.estado || (res.data as any)?.estado) as any;

          if (estado === 'pagado' || estado === 'approved') {
            setPagoExitoso(true);
            setIsVerificandoPago(false);
            showSuccess('¡Pago confirmado!');
            CheckoutStateManager.markPaymentSuccess(proyecto.id, id);

            // ✅ FIX ARIA-HIDDEN: Transición directa a 2FA para firma
            setActiveStep(2);
            showInfo('Ingresa tu 2FA para proceder a la firma.');
            return;
          }
          if (estado === 'fallido' || estado === 'rejected') {
            setIsVerificandoPago(false);
            showError('El pago fue rechazado.');
            setActiveStep(0);
            CheckoutStateManager.clearState();
            return;
          }
          await new Promise(resolve => setTimeout(resolve, PAYMENT_VERIFICATION_INTERVAL_MS));
        } catch (error) { console.error(error); }
      }
      setIsVerificandoPago(false);
      showWarning('El pago sigue procesándose. Puedes cerrar y volver.');
      persistState();
    } finally { isVerifyingRef.current = false; }
  }, [showSuccess, showError, showWarning, persistState, proyecto.id]);

  // ===================================================
  // 2FA SUBMISSION (Modificado)
  // ===================================================
  const handleSubmit2FA = useCallback(async () => {
    if (codigo2FA.length !== CODIGO_2FA_LENGTH) {
      showError('El código 2FA debe tener 6 dígitos');
      return;
    }
    if (!location) {
      showError('Se requiere la ubicación para continuar');
      return;
    }

    // ✅ SI YA HAY PAGO EXITOSO:
    // No llamamos al backend para pagar de nuevo.
    // Simplemente avanzamos al paso de Firma (Paso 4), manteniendo el codigo2FA en el estado.
    if (pagoExitoso && transaccionId) {
      console.log('✅ 2FA ingresado para firma. Avanzando.');
      setActiveStep(4);
      return;
    }

    // FLUJO NORMAL (Pagar)
    try {
      setIsInternalProcessing(true);
      let response;
      const currentInversionId = effectiveInversionId;
      const currentPagoId = effectivePagoId;

      if (tipo === 'inversion' && currentInversionId) {
        response = await InversionService.confirmar2FA({ inversionId: currentInversionId, codigo_2fa: codigo2FA });
      } else if (tipo === 'suscripcion') {
        const idTx = currentPagoId || currentInversionId;
        if (!idTx) throw new Error('Falta ID transacción');
        response = await SuscripcionService.confirmar2FA({ transaccionId: idTx, codigo_2fa: codigo2FA });
      } else {
        throw new Error('Error interno: IDs faltantes.');
      }

      const data = response?.data as any;
      const urlPago = data?.redirectUrl || data?.init_point || data?.url;
      const txId = data?.transaccionId || data?.id || data?.data?.transaccionId;

      if (urlPago) {
        if (txId) {
          setTransaccionId(txId);
          CheckoutStateManager.saveState({
            projectId: proyecto.id,
            tipo,
            activeStep: 3,
            transactionId: txId,
            paymentSuccess: false,
            signatureDataUrl: null,
            location,
            timestamp: Date.now()
          });
        }
        window.location.href = urlPago;
      } else {
        throw new Error('No se recibió el link de pago.');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Error al procesar';
      showError(msg);
      setCodigo2FA('');
      setIsInternalProcessing(false);
    }
  }, [tipo, effectiveInversionId, effectivePagoId, codigo2FA, location, proyecto.id, pagoExitoso, transaccionId, showError]);

  // ===================================================
  // PDF SIGNING (Modificado)
  // ===================================================
  const handleGenerateSignedPdf = useCallback(async () => {
    if (!plantillaActual || !signatureDataUrl || !onSignContract) {
      showError('Faltan datos para generar el PDF firmado');
      return;
    }

    try {
      setIsSigningPdf(true);
      const pdfUrl = ImagenService.resolveImageUrl(plantillaActual.url_archivo);
      const pdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const signatureImage = await pdfDoc.embedPng(signatureDataUrl);

      let page, x, y;
      if (signaturePosition) {
        const pages = pdfDoc.getPages();
        page = pages[Math.min((signaturePosition.page || 1) - 1, pages.length - 1)];
        const { height } = page.getSize();
        x = signaturePosition.x;
        y = height - signaturePosition.y - SIGNATURE_HEIGHT;
      } else {
        const pages = pdfDoc.getPages();
        page = pages[pages.length - 1];
        const { width } = page.getSize();
        x = (width / 2) - (SIGNATURE_WIDTH / 2);
        y = 50;
      }

      page.drawImage(signatureImage, { x, y, width: SIGNATURE_WIDTH, height: SIGNATURE_HEIGHT });
      const signedPdfBytes = await pdfDoc.save();
      const signedFile = new File([new Uint8Array(signedPdfBytes)], `firmado_${plantillaActual.nombre_archivo}`, { type: 'application/pdf' });

      // ✅ Enviamos el codigo2FA que el usuario ingresó en el paso 2
      onSignContract(signedFile, location, codigo2FA);

      showSuccess('Enviando documento firmado...');
    } catch (error) {
      console.error('Error generando PDF:', error);
      showError('Error al generar el documento firmado.');
      setIsSigningPdf(false);
    }
  }, [plantillaActual, signatureDataUrl, signaturePosition, location, onSignContract, showSuccess, showError, codigo2FA]);

  // ===================================================
  // NAVIGATION
  // ===================================================
  const handleStepAction = useCallback(async () => {
    switch (activeStep) {
      case 0:
        // Si hay pago exitoso, vamos al paso 2 para pedir 2FA
        if (pagoExitoso && transaccionId) {
          console.log('⏭️ Pago exitoso. Yendo a 2FA.');
          setActiveStep(2);
          return;
        }
        if (onConfirmInvestment) {
          await onConfirmInvestment();
          const saved = CheckoutStateManager.loadState(proyecto.id);
          if (saved?.paymentSuccess) {
            setTransaccionId(saved.transactionId);
            setPagoExitoso(true);

            // ✅ FIX ARIA-HIDDEN: Cambio directo de paso
            setActiveStep(2);
            showInfo('Pago ya confirmado. Ingresa 2FA para firmar.');

            return;
          }
        }
        setActiveStep(1);
        break;
      case 1:
        setActiveStep(2);
        break;
      case 2:
        if (codigo2FA.length === CODIGO_2FA_LENGTH) {
          await handleSubmit2FA();
        }
        break;
      case 4:
        if (signatureDataUrl) {
          await handleGenerateSignedPdf();
        }
        break;
    }
  }, [activeStep, onConfirmInvestment, codigo2FA, signatureDataUrl, handleSubmit2FA, handleGenerateSignedPdf, pagoExitoso, transaccionId, proyecto.id, showInfo]);

  // ===================================================
  // HELPERS
  // ===================================================
  const handleClose = useCallback(() => {
    if (isVerificandoPago || isProcessing || isInternalProcessing || isSigningPdf) return;
    onClose();
    setTimeout(() => {
      if (!pagoExitoso || activeStep === 0) CheckoutStateManager.clearState();
      setActiveStep(0);
      setCodigo2FA('');
      setPagoExitoso(false);
      setSignatureDataUrl(null);
      setSignaturePosition(null);
      setLocation(null);
      setTransaccionId(null);
      setShowRecoveryPrompt(false);
      setRecoveredState(null);
      hasAttemptedRecovery.current = false;
    }, 300);
  }, [isVerificandoPago, isProcessing, isInternalProcessing, isSigningPdf, onClose, pagoExitoso, activeStep]);

  const isStepValid = useMemo(() => {
    switch (activeStep) {
      case 0: return true;
      case 1: return true;
      case 2: return codigo2FA.length === CODIGO_2FA_LENGTH && !!location;
      case 4: return !!signatureDataUrl;
      default: return true;
    }
  }, [activeStep, codigo2FA, location, signatureDataUrl]);

  const loading = isProcessing || isInternalProcessing || isSigningPdf;

  const getButtonText = () => {
    if (loading) return 'Procesando...';
    if (activeStep === 4) return 'Finalizar Firma';
    // Si estamos en paso 2 y ya pagó, el botón es "Continuar a Firma"
    if (activeStep === 2 && pagoExitoso) return 'Verificar y Firmar';
    if (activeStep === 2) return 'Ir a Pagar';
    return 'Continuar';
  };

  // ===================================================
  // RENDER
  // ===================================================
  return (
    <>
      {showRecoveryPrompt && recoveredState && !recoveredState.paymentSuccess && (
        <BaseModal
          open={showRecoveryPrompt}
          onClose={handleDiscardRecovery}
          title="Sesión Interrumpida"
          subtitle="Detectamos un proceso incompleto"
          icon={<Refresh />}
          headerColor="warning"
          maxWidth="sm"
        >
          <Stack spacing={3} p={2}>
            <Alert severity="info" icon={<Info />}>
              <Typography variant="body2" fontWeight={600}>Encontramos una sesión anterior</Typography>
              <Typography variant="caption">Puedes continuar donde lo dejaste.</Typography>
            </Alert>
            <Stack direction="row" spacing={2}>
              <Button variant="outlined" fullWidth onClick={handleDiscardRecovery} startIcon={<Close />}>Empezar de Nuevo</Button>
              <Button variant="contained" fullWidth onClick={handleRecoverState} startIcon={<Refresh />} color="primary">Continuar</Button>
            </Stack>
          </Stack>
        </BaseModal>
      )}

      <BaseModal
        open={open && !showRecoveryPrompt}
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
            <Button
              onClick={activeStep === 0 ? handleClose : () => setActiveStep(p => p - 1)}
              disabled={loading || isVerificandoPago || activeStep === 3}
              startIcon={activeStep === 0 ? <Close /> : <ArrowBack />}
              color="inherit"
              fullWidth={isMobile}
            >
              {activeStep === 0 ? 'Cancelar' : 'Atrás'}
            </Button>
            {activeStep !== 3 && (
              <Button
                variant="contained"
                color={activeStep === 4 ? 'success' : 'primary'}
                onClick={handleStepAction}
                disabled={!isStepValid || loading}
                endIcon={loading ? <CircularProgress size={20} color="inherit" /> : activeStep === 4 ? <CloudUpload /> : <ArrowForward />}
                fullWidth={isMobile}
              >
                {getButtonText()}
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
                  <StepLabel StepIconProps={{
                    sx: {
                      '&.Mui-active': { color: index === 4 ? theme.palette.success.main : theme.palette.primary.main, transform: 'scale(1.2)' },
                      '&.Mui-completed': { color: theme.palette.success.main }
                    }
                  }}>{step.label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          )}

          <Box flex={1} overflow="auto" p={{ xs: 2, md: 4 }}>
            {activeStep === 0 && <StepConfirmacion proyecto={proyecto} tipo={tipo} monto={montoFormateado} />}
            {activeStep === 1 && <StepContrato plantilla={plantillaActual} isLoading={loadingPlantilla} />}
            {activeStep === 2 && (
              <StepSeguridad
                codigo2FA={codigo2FA}
                setCodigo2FA={setCodigo2FA}
                location={location}
                isProcessing={loading}
                error={error2FA}
              />
            )}
            {activeStep === 3 && <StepPago isVerificando={isVerificandoPago} pagoExitoso={pagoExitoso} />}
            {activeStep === 4 && (
              <Stack spacing={3} height="100%">
                <Fade in={!signatureDataUrl} unmountOnExit>
                  <Box>
                    <Alert severity="info" icon={<Draw />} sx={{ borderRadius: 2, mb: 3 }}>
                      <Typography variant="body2">Dibuja tu firma digital.</Typography>
                    </Alert>
                    <SignatureCanvas onSave={setSignatureDataUrl} onClear={() => setSignatureDataUrl(null)} initialSignature={signatureDataUrl} />
                  </Box>
                </Fade>
                <Fade in={!!signatureDataUrl} unmountOnExit>
                  <Box height="100%" display="flex" flexDirection="column">
                    <Alert severity="success" variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
                      <Typography variant="body2" fontWeight={600}>✓ Firma capturada correctamente</Typography>
                      <Button size="small" onClick={() => setSignatureDataUrl(null)}>Cambiar Firma</Button>
                    </Alert>
                    <Box flex={1} borderRadius={2} overflow="hidden" border={`1px solid ${theme.palette.divider}`}>
                      <PDFViewerMejorado
                        pdfUrl={plantillaActual ? ImagenService.resolveImageUrl(plantillaActual.url_archivo) : ''}
                        signatureDataUrl={signatureDataUrl}
                        onSignaturePositionSet={setSignaturePosition}
                      />
                    </Box>
                  </Box>
                </Fade>
              </Stack>
            )}
          </Box>
        </Stack>
      </BaseModal>
    </>
  );
};

// ... (Step Components)

const StepConfirmacion = React.memo<{ proyecto: ProyectoDto; tipo: string; monto: string; }>(({ proyecto, tipo, monto }) => (
  <Stack spacing={3} maxWidth="sm" mx="auto">
    <Alert severity="info" variant="outlined">Revisa los detalles antes de iniciar.</Alert>
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Box display="flex" justifyContent="space-between"><Typography>Total a Pagar</Typography><Typography fontWeight={700} color="success.main">{monto}</Typography></Box>
        <Divider />
        <Box display="flex" justifyContent="space-between"><Typography>Proyecto</Typography><Typography fontWeight={600}>{proyecto.nombre_proyecto}</Typography></Box>
        {tipo === 'suscripcion' && (
          <Stack direction="row" spacing={2} alignItems="center" sx={{ color: 'primary.main' }}>
            <Token />
            <Typography variant="caption">Incluye 1 Token de Subasta.</Typography>
          </Stack>
        )}
      </Stack>
    </Paper>
  </Stack>
));
StepConfirmacion.displayName = 'StepConfirmacion';

const StepContrato = React.memo<{ plantilla: any; isLoading: boolean; }>(({ plantilla, isLoading }) => {
  if (isLoading) return <CircularProgress />;
  if (!plantilla) return <Typography>No hay contrato.</Typography>;
  return (
    <Box sx={{ flex: 1, minHeight: '60vh', bgcolor: 'grey.100', borderRadius: 2, border: '1px solid #e0e0e0' }}>
      <iframe src={ImagenService.resolveImageUrl(plantilla.url_archivo)} width="100%" height="100%" style={{ border: 'none' }} title="Contrato" />
    </Box>
  );
});
StepContrato.displayName = 'StepContrato';

const StepSeguridad = React.memo<{ codigo2FA: string; setCodigo2FA: (v: string) => void; location: any; isProcessing: boolean; error: any; }>(({ codigo2FA, setCodigo2FA, location, isProcessing, error }) => (
  <Stack spacing={4} alignItems="center" py={2} maxWidth="sm" mx="auto">
    <Avatar sx={{ bgcolor: 'primary.main' }}><Lock /></Avatar>
    <Box textAlign="center">
      <Typography variant="h5" fontWeight={700}>Verificación 2FA</Typography>
      <Typography variant="body2" color="text.secondary">Ingresa el código de Google Authenticator.</Typography>
    </Box>
    {!location && <Alert severity="warning" sx={{ width: '100%' }}>Acceso a Ubicación Requerido</Alert>}

    {/* ✅ FIX: autoFocus para atrapar foco y evitar error aria-hidden */}
    <TextField
      autoFocus
      value={codigo2FA}
      onChange={(e) => setCodigo2FA(e.target.value.replace(/\D/g, '').slice(0, 6))}
      placeholder="000 000"
      disabled={isProcessing || !location}
      error={!!error}
      helperText={error}
      fullWidth
      inputProps={{ maxLength: 6 }}
      sx={{ maxWidth: 300 }}
    />
  </Stack>
));
StepSeguridad.displayName = 'StepSeguridad';

const StepPago = React.memo<{ isVerificando: boolean; pagoExitoso: boolean; }>(({ isVerificando, pagoExitoso }) => (
  <Stack alignItems="center" justifyContent="center" height="100%" minHeight="40vh" spacing={4}>
    {pagoExitoso ? <CheckCircle sx={{ fontSize: 60, color: 'success.main' }} /> : <CircularProgress size={80} />}
    <Typography variant="h5" fontWeight={700}>{pagoExitoso ? '¡Pago Acreditado!' : 'Procesando...'}</Typography>
  </Stack>
));
StepPago.displayName = 'StepPago';