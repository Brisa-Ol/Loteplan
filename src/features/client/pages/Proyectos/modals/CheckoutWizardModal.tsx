// src/features/client/pages/Proyectos/modals/CheckoutWizardModal.optimized.tsx

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box, Stepper, Step, StepLabel, Button, Typography, Paper, Stack,
  Divider, Alert, CircularProgress, TextField, alpha, useTheme,
  Avatar, Zoom, Fade, useMediaQuery, Chip, keyframes
} from '@mui/material';
import {
  ShoppingCart, Description, Security, Payment, Draw, CheckCircle,
  ArrowForward, ArrowBack, Close, Info, VpnKey,
  Business, VerifiedUser, Lock, Clear, Save, CloudUpload,
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
import { useCurrencyFormatter } from '@/features/client/hooks/useCurrencyFormatter';

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
  onSignContract?: (file: File, location: { lat: string; lng: string } | null) => void;
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
}>(({ onSave, onClear }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const theme = useTheme();

  // ✅ Setup canvas context
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
    }
  }, [theme.palette.text.primary]);

  // ✅ Initialize canvas
  useEffect(() => {
    const timeoutId = setTimeout(setupCanvas, 100);
    window.addEventListener('resize', setupCanvas);

    return () => {
      window.removeEventListener('resize', setupCanvas);
      clearTimeout(timeoutId);
    };
  }, [setupCanvas]);

  // ✅ Get pointer position (mouse/touch)
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

  // ✅ Drawing handlers
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

  // ✅ Clear signature
  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
      onClear();
    }
  }, [ctx, onClear]);

  // ✅ Save signature
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
  inversionId,
  pagoId
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { showSuccess, showError, showWarning } = useSnackbar();
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

  // ✅ Ref para evitar múltiples verificaciones simultáneas
  const isVerifyingRef = useRef(false);

  // ===================================================
  // MEMOIZED VALUES
  // ===================================================
  const montoFormateado = useMemo(
    () => formatCurrency(Number(proyecto.monto_inversion)),
    [formatCurrency, proyecto.monto_inversion]
  );

  // ✅ Query contract template
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
  // GEOLOCATION
  // ===================================================
  useEffect(() => {
    // Solo obtener ubicación en los pasos que la requieren
    if ((activeStep === 2 || activeStep === 4) && open && !location) {
      ContratoFirmadoService.getCurrentPosition()
        .then(pos => {
          if (pos) setLocation(pos);
        })
        .catch(err => {
          console.warn('Error obteniendo ubicación:', err);
        });
    }
  }, [activeStep, open, location]);

  // ===================================================
  // TRANSACTION RECOVERY
  // ===================================================
  useEffect(() => {
    if (!open) return;

    const savedTxId = sessionStorage.getItem('checkout_tx_id');
    const savedProjId = sessionStorage.getItem('checkout_proj_id');

    if (savedTxId && savedProjId === String(proyecto.id)) {
      const txId = Number(savedTxId);
      setTransaccionId(txId);
      setActiveStep(3);
      
      // Limpiar inmediatamente para evitar loops
      sessionStorage.removeItem('checkout_tx_id');
      sessionStorage.removeItem('checkout_proj_id');
      
      // Iniciar verificación
      iniciarVerificacionPago(txId);
    }
  }, [open, proyecto.id]);

  // ===================================================
  // PAYMENT VERIFICATION
  // ===================================================
  const iniciarVerificacionPago = useCallback(async (id: number) => {
    // ✅ Prevenir múltiples verificaciones simultáneas
    if (isVerifyingRef.current) return;
    
    isVerifyingRef.current = true;
    setIsVerificandoPago(true);

    try {
      for (let i = 0; i < MAX_PAYMENT_VERIFICATION_ATTEMPTS; i++) {
        try {
          const res = await MercadoPagoService.getPaymentStatus(id, true);
          const estado = (res.data?.transaccion?.estado || (res.data as any)?.estado) as string;

          if (estado === 'pagado' || estado === 'approved') {
            setPagoExitoso(true);
            setIsVerificandoPago(false);
            showSuccess('¡Pago confirmado!');
            
            setTimeout(() => {
              setActiveStep(4);
            }, 2000);
            
            return;
          }

          if (estado === 'fallido' || estado === 'rejected') {
            setIsVerificandoPago(false);
            showError('El pago fue rechazado.');
            setActiveStep(0);
            return;
          }

          // ✅ Esperar antes del siguiente intento
          await new Promise(resolve => setTimeout(resolve, PAYMENT_VERIFICATION_INTERVAL_MS));
        } catch (error) {
          console.error('Error verificando pago:', error);
        }
      }

      // Si llegamos aquí, agotamos los intentos
      setIsVerificandoPago(false);
      showWarning('El pago sigue procesándose. Verifica en "Mis Inversiones".');
      handleClose();
    } finally {
      isVerifyingRef.current = false;
    }
  }, [showSuccess, showError, showWarning]);

  // ===================================================
  // 2FA SUBMISSION
  // ===================================================
  const handleSubmit2FA = useCallback(async () => {
    // ✅ Validación previa
    if (codigo2FA.length !== CODIGO_2FA_LENGTH) {
      showError('El código 2FA debe tener 6 dígitos');
      return;
    }

    if (!location) {
      showError('Se requiere la ubicación para continuar');
      return;
    }

    try {
      setIsInternalProcessing(true);
      let response;

      if (tipo === 'inversion' && inversionId) {
        response = await InversionService.confirmar2FA({
          inversionId,
          codigo_2fa: codigo2FA
        });
      } else if (tipo === 'suscripcion') {
        const idTransaccion = pagoId || inversionId;
        if (!idTransaccion) {
          throw new Error('Falta el ID de transacción.');
        }
        response = await SuscripcionService.confirmar2FA({
          transaccionId: idTransaccion,
          codigo_2fa: codigo2FA
        });
      } else {
        throw new Error('Error interno: IDs faltantes.');
      }

      const data = response?.data as any;
      const urlPago = data?.redirectUrl || data?.init_point || data?.url || data?.preference?.init_point;
      const txId = data?.transaccionId || data?.id || data?.data?.transaccionId;

      if (urlPago) {
        // ✅ Guardar ID de transacción ANTES de redirigir
        if (txId) {
          sessionStorage.setItem('checkout_tx_id', String(txId));
          sessionStorage.setItem('checkout_proj_id', String(proyecto.id));
        }
        
        // ✅ Redirigir a Mercado Pago
        window.location.href = urlPago;
      } else {
        throw new Error('No se recibió el link de pago.');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al procesar el pago';
      showError(errorMessage);
      setCodigo2FA('');
      setIsInternalProcessing(false);
    }
  }, [tipo, inversionId, pagoId, codigo2FA, location, proyecto.id, showError]);

  // ===================================================
  // PDF SIGNING
  // ===================================================
  const handleGenerateSignedPdf = useCallback(async () => {
    if (!plantillaActual || !signatureDataUrl || !onSignContract) {
      showError('Faltan datos para generar el PDF firmado');
      return;
    }

    try {
      setIsSigningPdf(true);

      // ✅ Cargar PDF original
      const pdfUrl = ImagenService.resolveImageUrl(plantillaActual.url_archivo);
      const pdfBytes = await fetch(pdfUrl).then(res => {
        if (!res.ok) throw new Error('Error al cargar el PDF');
        return res.arrayBuffer();
      });

      const pdfDoc = await PDFDocument.load(pdfBytes);
      const signatureImage = await pdfDoc.embedPng(signatureDataUrl);

      // ✅ Determinar posición de la firma
      let page, x, y;
      if (signaturePosition) {
        const pageIndex = Math.max(0, (signaturePosition.page || 1) - 1);
        const pages = pdfDoc.getPages();
        page = pages[Math.min(pageIndex, pages.length - 1)];
        const { height } = page.getSize();
        x = signaturePosition.x;
        y = height - signaturePosition.y - SIGNATURE_HEIGHT;
      } else {
        // ✅ Firma en la última página por defecto
        const pages = pdfDoc.getPages();
        page = pages[pages.length - 1];
        const { width } = page.getSize();
        x = (width / 2) - (SIGNATURE_WIDTH / 2);
        y = 50;
      }

      // ✅ Dibujar firma
      page.drawImage(signatureImage, {
        x,
        y,
        width: SIGNATURE_WIDTH,
        height: SIGNATURE_HEIGHT
      });

      // ✅ Guardar PDF firmado
      const signedPdfBytes = await pdfDoc.save();
      // Convertir explícitamente a Uint8Array estándar para evitar errores de tipo
      const uint8Array = new Uint8Array(signedPdfBytes);
      const signedFile = new File(
        [uint8Array],
        `firmado_${plantillaActual.nombre_archivo}`,
        { type: 'application/pdf' }
      );

      // ✅ Enviar al callback
      onSignContract(signedFile, location);
      showSuccess('Documento firmado exitosamente');
      handleClose();
    } catch (error) {
      console.error('Error al generar PDF firmado:', error);
      showError('Error al generar el documento firmado.');
    } finally {
      setIsSigningPdf(false);
    }
  }, [plantillaActual, signatureDataUrl, signaturePosition, location, onSignContract, showSuccess, showError]);

  // ===================================================
  // STEP NAVIGATION
  // ===================================================
  const handleStepAction = useCallback(async () => {
    switch (activeStep) {
      case 0:
        // Paso 1: Confirmación
        if (onConfirmInvestment) onConfirmInvestment();
        setActiveStep(1);
        break;

      case 1:
        // Paso 2: Contrato (solo lectura)
        setActiveStep(2);
        break;

      case 2:
        // Paso 3: Seguridad y 2FA
        if (codigo2FA.length === CODIGO_2FA_LENGTH) {
          await handleSubmit2FA();
        }
        break;

      case 4:
        // Paso 5: Firma
        if (signatureDataUrl) {
          await handleGenerateSignedPdf();
        }
        break;
    }
  }, [activeStep, onConfirmInvestment, codigo2FA, signatureDataUrl, handleSubmit2FA, handleGenerateSignedPdf]);

  // ===================================================
  // MODAL CLOSE
  // ===================================================
  const handleClose = useCallback(() => {
    // ✅ Prevenir cierre durante operaciones críticas
    if (isVerificandoPago || isProcessing || isInternalProcessing || isSigningPdf) {
      return;
    }

    onClose();

    // ✅ Reset state después de cerrar
    setTimeout(() => {
      setActiveStep(0);
      setCodigo2FA('');
      setPagoExitoso(false);
      setSignatureDataUrl(null);
      setSignaturePosition(null);
      setLocation(null);
      setTransaccionId(null);
    }, 300);
  }, [isVerificandoPago, isProcessing, isInternalProcessing, isSigningPdf, onClose]);

  // ===================================================
  // VALIDATION
  // ===================================================
  const isStepValid = useMemo(() => {
    switch (activeStep) {
      case 0:
      case 1:
        return true;
      case 2:
        return codigo2FA.length === CODIGO_2FA_LENGTH && !!location;
      case 4:
        return !!signatureDataUrl;
      default:
        return true;
    }
  }, [activeStep, codigo2FA, location, signatureDataUrl]);

  const loading = isProcessing || isInternalProcessing || isSigningPdf;

  // ===================================================
  // RENDER
  // ===================================================
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
        <Stack
          direction={{ xs: 'column-reverse', sm: 'row' }}
          spacing={2}
          width="100%"
          justifyContent="space-between"
        >
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
              endIcon={
                loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : activeStep === 4 ? (
                  <CloudUpload />
                ) : (
                  <ArrowForward />
                )
              }
              fullWidth={isMobile}
            >
              {loading
                ? 'Procesando...'
                : activeStep === 4
                ? 'Finalizar Firma'
                : activeStep === 2
                ? 'Ir a Pagar'
                : 'Continuar'}
            </Button>
          )}
        </Stack>
      }
    >
      <Stack spacing={3} height="100%">
        {/* Desktop Stepper */}
        {!isMobile && (
          <Stepper activeStep={activeStep} alternativeLabel sx={{ pt: 2 }}>
            {STEPS.map((step, index) => (
              <Step key={step.label}>
                <StepLabel
                  StepIconProps={{
                    sx: {
                      '&.Mui-active': {
                        color: index === 4 ? theme.palette.success.main : theme.palette.primary.main,
                        transform: 'scale(1.2)'
                      },
                      '&.Mui-completed': {
                        color: theme.palette.success.main
                      }
                    }
                  }}
                >
                  {step.label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        )}

        {/* Mobile Progress Bar */}
        {isMobile && (
          <Box
            py={1}
            px={2}
            borderBottom={`1px solid ${theme.palette.divider}`}
            bgcolor="background.paper"
          >
            <Typography variant="subtitle2" color="primary.main" fontWeight={700}>
              Paso {activeStep + 1} / {STEPS.length}: {STEPS[activeStep].label}
            </Typography>
            <Box width="100%" height={4} bgcolor="secondary.light" mt={1} borderRadius={2}>
              <Box
                width={`${((activeStep + 1) / STEPS.length) * 100}%`}
                height="100%"
                bgcolor="primary.main"
                borderRadius={2}
              />
            </Box>
          </Box>
        )}

        {/* Step Content */}
        <Box flex={1} overflow="auto" p={{ xs: 2, md: 4 }}>
          {activeStep === 0 && (
            <StepConfirmacion proyecto={proyecto} tipo={tipo} monto={montoFormateado} />
          )}
          {activeStep === 1 && (
            <StepContrato plantilla={plantillaActual} isLoading={loadingPlantilla} />
          )}
          {activeStep === 2 && (
            <StepSeguridad
              codigo2FA={codigo2FA}
              setCodigo2FA={setCodigo2FA}
              location={location}
              isProcessing={loading}
              error={error2FA}
            />
          )}
          {activeStep === 3 && (
            <StepPago isVerificando={isVerificandoPago} pagoExitoso={pagoExitoso} />
          )}
          {activeStep === 4 && (
            <Stack spacing={3} height="100%">
              <Fade in={!signatureDataUrl} unmountOnExit>
                <Box>
                  <Alert severity="info" icon={<Draw />} sx={{ borderRadius: 2, mb: 3 }}>
                    <Typography variant="body2">
                      Dibuja tu firma en el recuadro a continuación.
                    </Typography>
                  </Alert>
                  <SignatureCanvas
                    onSave={setSignatureDataUrl}
                    onClear={() => setSignatureDataUrl(null)}
                  />
                </Box>
              </Fade>
              <Fade in={!!signatureDataUrl} unmountOnExit>
                <Box height="100%" display="flex" flexDirection="column">
                  <Alert severity="success" variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
                      <Typography variant="body2" fontWeight={600}>
                        ¡Firma capturada correctamente!
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => setSignatureDataUrl(null)}
                        sx={{ fontWeight: 700 }}
                      >
                        Cambiar Firma
                      </Button>
                    </Stack>
                  </Alert>
                  <Box
                    flex={1}
                    borderRadius={2}
                    overflow="hidden"
                    border={`1px solid ${theme.palette.divider}`}
                  >
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
  );
};

// ===================================================
// STEP COMPONENTS
// ===================================================
const StepConfirmacion = React.memo<{
  proyecto: ProyectoDto;
  tipo: string;
  monto: string;
}>(({ proyecto, tipo, monto }) => (
  <Stack spacing={3} maxWidth="sm" mx="auto">
    <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
      Revisa los detalles antes de iniciar la operación.
    </Alert>
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, bgcolor: 'background.default' }}>
      <Stack spacing={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle1" color="text.secondary">
            Total a Pagar
          </Typography>
          <Typography variant="h4" fontWeight={700} color="success.main">
            {monto}
          </Typography>
        </Box>
        <Divider />
        <Box display="flex" justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">
            Proyecto
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {proyecto.nombre_proyecto}
          </Typography>
        </Box>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color="text.secondary">
            Modalidad
          </Typography>
          <Chip
            label={tipo.toUpperCase()}
            size="small"
            color="primary"
            sx={{ fontWeight: 700, borderRadius: 1 }}
          />
        </Box>
        {tipo === 'suscripcion' && (
          <>
            <Divider />
            <Stack direction="row" spacing={2} alignItems="center" sx={{ color: 'primary.main' }}>
              <Token color="inherit" />
              <Box>
                <Typography variant="body2" fontWeight={700}>
                  Beneficio de Bienvenida
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Esta suscripción incluye 1 Token de Subasta.
                </Typography>
              </Box>
            </Stack>
          </>
        )}
      </Stack>
    </Paper>
  </Stack>
));

StepConfirmacion.displayName = 'StepConfirmacion';

const StepContrato = React.memo<{
  plantilla: any;
  isLoading: boolean;
}>(({ plantilla, isLoading }) => {
  if (isLoading) {
    return (
      <Box p={4} textAlign="center">
        <CircularProgress />
      </Box>
    );
  }

  if (!plantilla) {
    return (
      <Stack alignItems="center" justifyContent="center" height="50vh" spacing={2} color="text.secondary">
        <Info sx={{ fontSize: 60, opacity: 0.5 }} />
        <Typography>No hay contrato disponible.</Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={2} height="100%">
      <Box>
        <Typography variant="h6" fontWeight={700} gutterBottom display="flex" alignItems="center" gap={1}>
          <Description color="primary" /> Contrato de Participación
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Este documento detalla los términos legales. Lo firmarás digitalmente en el último paso.
        </Typography>
      </Box>
      <Alert severity="info" variant="outlined" icon={<GppGood />} sx={{ borderRadius: 2 }}>
        Respaldo jurídico de tu operación.
      </Alert>
      <Box
        sx={{
          flex: 1,
          minHeight: { xs: '60vh', md: '70vh' },
          bgcolor: 'grey.100',
          borderRadius: 2,
          overflow: 'hidden',
          border: '1px solid #e0e0e0'
        }}
      >
        <iframe
          src={ImagenService.resolveImageUrl(plantilla.url_archivo)}
          width="100%"
          height="100%"
          title="Contrato"
          style={{ border: 'none' }}
        />
      </Box>
    </Stack>
  );
});

StepContrato.displayName = 'StepContrato';

const StepSeguridad = React.memo<{
  codigo2FA: string;
  setCodigo2FA: (value: string) => void;
  location: Location | null;
  isProcessing: boolean;
  error: string | null | undefined;
}>(({ codigo2FA, setCodigo2FA, location, isProcessing, error }) => {
  const theme = useTheme();

  // ✅ Sanitizar input (solo números)
  const handleCodigoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, CODIGO_2FA_LENGTH);
    setCodigo2FA(value);
  }, [setCodigo2FA]);

  return (
    <Stack spacing={4} alignItems="center" py={2} maxWidth="sm" mx="auto">
      <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', boxShadow: 3 }}>
        <Lock fontSize="large" />
      </Avatar>

      <Box textAlign="center">
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Verificación de Identidad
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Ingresa el código de tu aplicación <b>Google Authenticator</b>.
        </Typography>
      </Box>

      {!location ? (
        <Alert
          severity="warning"
          icon={<Explore sx={{ animation: `${pulse} 2s infinite` }} />}
          sx={{
            width: '100%',
            borderRadius: 2,
            border: `1px solid ${theme.palette.warning.main}`
          }}
        >
          <Typography variant="subtitle2" fontWeight={700}>
            Acceso a Ubicación Requerido
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
            Para obtener las coordenadas debes <b>concedernos el permiso para acceder a tu ubicación</b> y
            recarga la página si lo habías denegado anteriormente.
          </Typography>
          <Typography variant="caption" display="block" fontWeight={700} sx={{ mt: 1 }}>
            Este paso es obligatorio para la validez legal de tu firma.
          </Typography>
        </Alert>
      ) : (
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.success.main, 0.05),
            borderColor: 'success.main',
            width: '100%'
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <MyLocation color="success" />
            <Box flex={1} overflow="hidden">
              <Typography variant="caption" fontWeight={700} color="success.main" display="block">
                UBICACIÓN VERIFICADA
              </Typography>
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
        onChange={handleCodigoChange}
        placeholder="000 000"
        disabled={isProcessing || !location}
        error={!!error}
        helperText={error}
        fullWidth
        inputProps={{
          inputMode: 'numeric',
          pattern: '[0-9]*',
          maxLength: CODIGO_2FA_LENGTH
        }}
        InputProps={{
          startAdornment: <VpnKey color="action" sx={{ mr: 2 }} />,
          style: {
            fontSize: '1.5rem',
            letterSpacing: 4,
            textAlign: 'center',
            fontWeight: 700
          }
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
});

StepSeguridad.displayName = 'StepSeguridad';

const StepPago = React.memo<{
  isVerificando: boolean;
  pagoExitoso: boolean;
}>(({ isVerificando, pagoExitoso }) => {
  const theme = useTheme();

  return (
    <Stack alignItems="center" justifyContent="center" height="100%" minHeight="40vh" spacing={4}>
      {pagoExitoso ? (
        <Zoom in>
          <Stack alignItems="center" spacing={2}>
            <Avatar sx={{ width: 100, height: 100, bgcolor: 'success.main', boxShadow: 4 }}>
              <CheckCircle sx={{ fontSize: 60 }} />
            </Avatar>
            <Chip
              icon={<Token style={{ color: 'white' }} />}
              label="+1 Token Acreditado"
              color="warning"
              sx={{
                fontWeight: 800,
                px: 2,
                py: 2.5,
                fontSize: '1rem',
                animation: `${bounce} 1s infinite`,
                boxShadow: theme.shadows[4]
              }}
            />
          </Stack>
        </Zoom>
      ) : (
        <CircularProgress size={80} thickness={4} />
      )}
      <Box textAlign="center">
        <Typography variant="h5" fontWeight={700} gutterBottom>
          {pagoExitoso ? '¡Pago Acreditado!' : 'Procesando Transacción...'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {pagoExitoso
            ? 'Tu operación ha sido registrada exitosamente. Vamos a firmar.'
            : 'Estamos validando el pago con Mercado Pago. No cierres esta ventana.'}
        </Typography>
      </Box>
    </Stack>
  );
});

StepPago.displayName = 'StepPago';