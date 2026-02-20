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
  alpha,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Fade,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Services
import ContratoFirmadoService from '@/core/api/services/contrato-firmado.service';
import ContratoPlantillaService from '@/core/api/services/contrato-plantilla.service';
import ImagenService from '@/core/api/services/imagen.service';
import MercadoPagoService from '@/core/api/services/pagoMercado.service';

// Components
import BaseModal from '@/shared/components/domain/modals/BaseModal/BaseModal';
import PDFViewerMejorado from '../../Contratos/components/PDFViewerMejorado';

// Hooks
import { useCheckoutWizard } from '@/features/client/hooks/Usecheckoutwizard';
import { useCurrencyFormatter } from '@/features/client/hooks/useCurrencyFormatter';
import useSnackbar from '@/shared/hooks/useSnackbar';
import { CheckoutStateManager, type CheckoutPersistedState } from './Checkout persistence';

// Types
import CuotaMensualService from '@/core/api/services/cuotaMensual.service';
import type { ProyectoDto } from '@/core/types/dto/proyecto.dto';

// ===================================================
// CONSTANTS
// ===================================================
const CODIGO_2FA_LENGTH = 6;

const STEPS = [
  { label: 'Resumen', icon: <ShoppingCart /> },
  { label: 'Contrato', icon: <Description /> },
  { label: 'Seguridad', icon: <Security /> },
  { label: 'Pago', icon: <Payment /> },
  { label: 'Firma', icon: <Draw /> },
] as const;

// ===================================================
// TYPES
// ===================================================
export interface CheckoutWizardModalProps {
  open: boolean;
  onClose: () => void;
  proyecto: ProyectoDto;
  tipo: 'suscripcion' | 'inversion';
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
        <Button size="small" onClick={handleClear} startIcon={<Clear />} variant="outlined" color="error">
          Borrar
        </Button>
        <Button size="small" variant="contained" onClick={handleSave} startIcon={<Save />} disabled={!hasSignature}>
          Usar Firma
        </Button>
      </Stack>
    </Box>
  );
});

SignatureCanvas.displayName = 'SignatureCanvas';

// ===================================================
// STEP COMPONENTS
// ===================================================
const StepConfirmacion = React.memo<{
  proyecto: ProyectoDto;
  tipo: 'suscripcion' | 'inversion';
  montoTotalStr: string;
  cuotaActiva?: any;
  formatCurrency: (value: number) => string;
}>(({ proyecto, tipo, montoTotalStr, cuotaActiva, formatCurrency }) => {
  const theme = useTheme();
  const isSuscripcion = tipo === 'suscripcion';

  return (
    <Stack spacing={3} maxWidth="sm" mx="auto">
      <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
        Revisa los detalles de tu {isSuscripcion ? 'suscripción' : 'inversión'} antes de iniciar el pago.
      </Alert>

      <Paper variant="outlined" sx={{ overflow: 'hidden', borderRadius: 2 }}>
        {/* Cabecera del Resumen */}
        <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', p: 2 }}>
          <Typography variant="h6" fontWeight={700}>
            {proyecto.nombre_proyecto}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {isSuscripcion ? 'Plan de Ahorro Mensual' : 'Inversión Directa (Pago Único)'}
          </Typography>
        </Box>

        <Stack spacing={0}>
          {/* Modalidad y Plazo */}
          <Box p={2} borderBottom={`1px solid ${theme.palette.divider}`}>
            <Stack direction="row" justifyContent="space-between" mb={isSuscripcion && proyecto.plazo_inversion ? 1 : 0}>
              <Typography color="text.secondary">Modalidad</Typography>
              <Typography fontWeight={600}>
                {isSuscripcion ? 'Suscripción Mensual' : 'Aporte Único'}
              </Typography>
            </Stack>
            {isSuscripcion && proyecto.plazo_inversion && (
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">Plazo de financiación</Typography>
                <Typography fontWeight={600}>{proyecto.plazo_inversion} meses</Typography>
              </Stack>
            )}
          </Box>

          {/* ✨ DESGLOSE MATEMÁTICO ESTILO TICKET ✨ */}
          {isSuscripcion && cuotaActiva && (
            <Box p={2} bgcolor={alpha(theme.palette.primary.main, 0.02)}>

              {/* BLOQUE 1: VALOR MÓVIL */}
              <Typography variant="overline" color="primary.main" fontWeight={800} sx={{ display: 'block', mb: 1, lineHeight: 1 }}>
                1. Cálculo del Valor Móvil
              </Typography>
              <Stack spacing={0.5} mb={3}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Precio {cuotaActiva.nombre_cemento_cemento}</Typography>
                  <Typography variant="body2" fontWeight={500}>{formatCurrency(Number(cuotaActiva.valor_cemento))}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Multiplicado por unidades</Typography>
                  <Typography variant="body2" fontWeight={500}>× {cuotaActiva.valor_cemento_unidades}</Typography>
                </Stack>
                <Box borderTop={`1px solid ${theme.palette.divider}`} pt={0.5} mt={0.5}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" fontWeight={700}>= Valor Móvil Total</Typography>
                    <Typography variant="body2" fontWeight={700}>{formatCurrency(Number(cuotaActiva.valor_movil))}</Typography>
                  </Stack>
                </Box>
              </Stack>

              {/* BLOQUE 2: FINANCIACIÓN */}
              <Typography variant="overline" color="primary.main" fontWeight={800} sx={{ display: 'block', mb: 1, lineHeight: 1 }}>
                2. Base a Financiar
              </Typography>
              <Stack spacing={0.5} mb={3}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Valor Móvil Total</Typography>
                  <Typography variant="body2" fontWeight={500}>{formatCurrency(Number(cuotaActiva.valor_movil))}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Porcentaje del plan</Typography>
                  <Typography variant="body2" fontWeight={500}>× {Number(cuotaActiva.porcentaje_plan) * 100}%</Typography>
                </Stack>
                <Box borderTop={`1px solid ${theme.palette.divider}`} pt={0.5} mt={0.5}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" fontWeight={700}>= Base a financiar</Typography>
                    <Typography variant="body2" fontWeight={700}>{formatCurrency(Number(cuotaActiva.total_del_plan))}</Typography>
                  </Stack>
                </Box>
              </Stack>

              {/* BLOQUE 3: COMPOSICIÓN DE LA CUOTA */}
             {/* BLOQUE 3: COMPOSICIÓN DE LA CUOTA */}
              <Typography variant="overline" color="primary.main" fontWeight={800} sx={{ display: 'block', mb: 1, lineHeight: 1 }}>
                3. Composición de tu Cuota
              </Typography>
              
              <Stack spacing={1} sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: 1, border: `1px solid ${theme.palette.divider}` }}>
                
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" fontWeight={600}>Cuota Pura Mínima</Typography>
                    {/* 👇 AQUÍ MOSTRAMOS LA CUENTA EXACTA (ej: $1.40 ÷ 12 meses) 👇 */}
                    <Typography variant="caption" color="text.disabled">
                      {formatCurrency(Number(cuotaActiva.total_del_plan))} ÷ {cuotaActiva.total_cuotas_proyecto} meses
                    </Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={600}>{formatCurrency(Number(cuotaActiva.valor_mensual))}</Typography>
                </Stack>

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" color="text.secondary">Gastos Administrativos</Typography>
                    <Typography variant="caption" color="text.disabled">
                      ({Number(cuotaActiva.porcentaje_administrativo) * 100}% sobre Cuota Pura)
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">+ {formatCurrency(Number(cuotaActiva.carga_administrativa))}</Typography>
                </Stack>

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" color="text.secondary">IVA</Typography>
                    <Typography variant="caption" color="text.disabled">
                      ({Number(cuotaActiva.porcentaje_iva) * 100}% sobre Gastos)
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">+ {formatCurrency(Number(cuotaActiva.iva_carga_administrativa))}</Typography>
                </Stack>

                {/* Línea divisoria punteada antes del total */}
                <Box borderTop={`2px dashed ${theme.palette.divider}`} pt={1} mt={1}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2" fontWeight={800} color="text.primary">Valor Final de la Cuota</Typography>
                    <Typography variant="subtitle2" fontWeight={800} color="text.primary">= {formatCurrency(Number(cuotaActiva.valor_mensual_final))}</Typography>
                  </Stack>
                </Box>
              </Stack>

            </Box>
          )}

          {/* Gran Total a Pagar Hoy */}
          <Box p={3} display="flex" justifyContent="space-between" alignItems="center" bgcolor={alpha(theme.palette.success.main, 0.1)}>
            <Box>
              <Typography fontWeight={800} color="text.primary" variant="subtitle1">
                {isSuscripcion ? 'Valor Final de la Cuota' : 'Monto a Invertir'}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                {isSuscripcion ? 'A pagar hoy para activar el plan' : 'A pagar hoy'}
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight={900} color="success.main">
              {montoTotalStr}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Beneficio de la Suscripción */}
      {isSuscripcion && (
        <Alert severity="success" icon={<Token />} sx={{ borderRadius: 2 }}>
          <Typography variant="body2" fontWeight={700} mb={0.5}>
            ¡Beneficio Exclusivo!
          </Typography>
          <Typography variant="caption">
            Al abonar esta primera cuota recibes <strong>1 Token de Subasta</strong> para participar por la adjudicación de lotes.
          </Typography>
        </Alert>
      )}
    </Stack>
  );
});

StepConfirmacion.displayName = 'StepConfirmacion';

const StepContrato = React.memo<{ plantilla: any; isLoading: boolean; }>(({ plantilla, isLoading }) => {
  if (isLoading) return <CircularProgress />;
  if (!plantilla) return <Typography>No hay contrato disponible.</Typography>;
  return (
    <Box sx={{
      display: 'flex',          // ✅ CRÍTICO: Activa flexbox interno
      flexDirection: 'column',  // ✅ CRÍTICO: Apila en columna
      flex: 1,                  // ✅ CRÍTICO: Le dice al Box que llene el modal
      minHeight: { xs: '70vh', md: '75vh' }, // Altura responsiva
      bgcolor: 'grey.100',
      borderRadius: 2,
      border: '1px solid #e0e0e0',
      overflow: 'hidden'
    }}>
      <iframe
        src={ImagenService.resolveImageUrl(plantilla.url_archivo)}
        title="Contrato"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          flex: 1                 // ✅ CRÍTICO: Obliga al iframe a estirarse
        }}
      />
    </Box>
  );
});
StepContrato.displayName = 'StepContrato';

const StepSeguridad = React.memo<{
  codigo2FA: string;
  setCodigo2FA: (v: string) => void;
  location: any;
  isProcessing: boolean;
  error: any;
}>(({ codigo2FA, setCodigo2FA, location, isProcessing, error }) => (
  <Stack spacing={4} alignItems="center" py={2} maxWidth="sm" mx="auto">
    <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
      <Lock />
    </Avatar>
    <Box textAlign="center">
      <Typography variant="h5" fontWeight={700}>Verificación 2FA</Typography>
      <Typography variant="body2" color="text.secondary">
        Ingresa el código de Google Authenticator.
      </Typography>
    </Box>
    {!location && <Alert severity="warning" sx={{ width: '100%' }}>Acceso a Ubicación Requerido</Alert>}
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

const StepPago = React.memo<{ pagoExitoso: boolean; }>(
  ({ pagoExitoso }) => (
    <Stack alignItems="center" justifyContent="center" height="100%" minHeight="40vh" spacing={4}>
      {pagoExitoso ? (
        <CheckCircle sx={{ fontSize: 60, color: 'success.main' }} />
      ) : (
        <CircularProgress size={80} />
      )}
      <Typography variant="h5" fontWeight={700}>
        {pagoExitoso ? '¡Pago Acreditado!' : 'Procesando...'}
      </Typography>
    </Stack>
  )
);
StepPago.displayName = 'StepPago';

// ===================================================
// MAIN COMPONENT
// ===================================================
export const CheckoutWizardModal: React.FC<CheckoutWizardModalProps> = ({
  open,
  onClose,
  proyecto,
  tipo,
  inversionId: initialInversionId,
  pagoId: initialPagoId
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { showSuccess, showInfo, showError } = useSnackbar();
  const formatCurrency = useCurrencyFormatter({
    currency: proyecto.moneda === 'USD' ? 'USD' : 'ARS',
    minimumFractionDigits: 2, // 👈 Agrega esto
    maximumFractionDigits: 2  // 👈 Agrega esto
  });

  // STATE
  const [activeStep, setActiveStep] = useState(0);
  const [codigo2FA, setCodigo2FA] = useState('');
  const [codigo2FAFirma, setCodigo2FAFirma] = useState(''); // ✅ NUEVO estado para la firma
  const [location, setLocation] = useState<Location | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signaturePosition, setSignaturePosition] = useState<SignaturePosition | null>(null);
  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false);
  const [recoveredState, setRecoveredState] = useState<CheckoutPersistedState | null>(null);

  const hasAttemptedRecovery = useRef(false);

  // PLANTILLA
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
  // 2. ✨ AQUÍ FALTA DEFINIR cuotaActiva ✨ (Copia y pega esto)
  const { data: cuotaActiva, isLoading: loadingCuota } = useQuery({
    queryKey: ['cuotaActiva', proyecto.id],
    queryFn: async () => {
      const response = await CuotaMensualService.getLastByProjectId(proyecto.id);
      return response.data.cuota; // Importante el .cuota al final
    },
    enabled: open && tipo === 'suscripcion',
    staleTime: 5 * 60 * 1000,
  });

  const montoAMostrar = useMemo(() => {
    if (tipo === 'inversion') {
      return formatCurrency(Number(proyecto.monto_inversion || 0));
    }
    if (loadingCuota) return "Calculando...";

    const valor = cuotaActiva?.valor_mensual_final || proyecto.valor_cuota_referencia || 0;

    // 👇 Retorna el valor en crudo (sin formatear) agregando un "$" en texto
    return `$ ${valor}`;
  }, [formatCurrency, proyecto, tipo, cuotaActiva, loadingCuota]);
  // CHECKOUT WIZARD HOOK
  const {
    isProcessing,
    isVerificandoPago,
    pagoExitoso,
    transaccionId,
    error2FA,
    handleConfirmInvestment,
    handleConfirmarPago2FA,
    handleSignContract,
    iniciarVerificacionPago,
    setPagoExitoso,
    setTransaccionId,
  } = useCheckoutWizard({
    proyecto,
    tipo,
    plantillaContrato: plantillaActual,
    onSuccess: () => {
      showSuccess('¡Proceso completado exitosamente!');
      CheckoutStateManager.clearState();
      setTimeout(() => {
        handleClose();
        window.location.reload();
      }, 2000);
    }
  });


  const effectiveInversionId = transaccionId || initialInversionId;
  const effectivePagoId = transaccionId || initialPagoId;

  // PERSISTENCIA
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

  // RECUPERACIÓN DE ESTADO
  useEffect(() => {
    if (!open || hasAttemptedRecovery.current) return;

    const savedState = CheckoutStateManager.loadState(proyecto.id);

    if (savedState) {
      if (savedState.paymentSuccess && savedState.transactionId) {
        setTransaccionId(savedState.transactionId);
        setPagoExitoso(true);
        setLocation(savedState.location);
        setActiveStep(4); // ✅ Ir directo a FIRMA (paso 4)
        showInfo('Pago confirmado. Firma tu contrato para finalizar.');
        hasAttemptedRecovery.current = true;
        return;
      }

      if (savedState.activeStep >= 3 && savedState.transactionId) {
        setRecoveredState(savedState);
        setShowRecoveryPrompt(true);
        hasAttemptedRecovery.current = true;
        return;
      }
    }

    if (!savedState && (effectiveInversionId || effectivePagoId)) {
      const txId = effectiveInversionId || effectivePagoId;
      MercadoPagoService.getPaymentStatus(txId!, true)
        .then(res => {
          const estado = (res.data?.transaccion?.estado || (res.data as any)?.estado) as any;
          if (estado === 'pagado' || estado === 'approved') {
            setTransaccionId(txId!);
            setPagoExitoso(true);
            CheckoutStateManager.markPaymentSuccess(proyecto.id, txId!);
            setActiveStep(4); // ✅ Ir directo a FIRMA (paso 4)
            showInfo('Pago confirmado. Firma tu contrato para finalizar.');
          }
        })
        .catch(err => console.warn('⚠️ Error verificando pago:', err));
    }

    hasAttemptedRecovery.current = true;
  }, [open, proyecto.id, effectiveInversionId, effectivePagoId, showInfo, setTransaccionId, setPagoExitoso]);

  const handleRecoverState = useCallback(() => {
    if (!recoveredState) return;
    setTransaccionId(recoveredState.transactionId);
    setPagoExitoso(recoveredState.paymentSuccess);
    setSignatureDataUrl(recoveredState.signatureDataUrl);
    setLocation(recoveredState.location);

    if (recoveredState.paymentSuccess) {
      // ✅ Si el pago ya fue exitoso, ir directo a FIRMA (paso 4)
      setActiveStep(4);
      showInfo('Pago confirmado. Firma tu contrato para finalizar.');
    } else {
      setActiveStep(recoveredState.activeStep);
      if (recoveredState.transactionId && recoveredState.activeStep >= 3) {
        iniciarVerificacionPago(recoveredState.transactionId);
      }
    }
    setShowRecoveryPrompt(false);
  }, [recoveredState, showInfo, iniciarVerificacionPago, setTransaccionId, setPagoExitoso]);

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
          if (pos) setLocation(pos);
        })
        .catch(err => console.warn('Error obteniendo ubicación:', err));
    }
  }, [activeStep, open, location]);

  // ✅ MODIFICAR handleStepAction
  const handleStepAction = useCallback(async () => {
    switch (activeStep) {
      case 0:
        if (pagoExitoso && transaccionId) {
          setActiveStep(4); // ✅ Saltar directo a firma si ya pagó
          return;
        }
        await handleConfirmInvestment();
        setActiveStep(1);
        break;

      case 1:
        setActiveStep(2);
        break;

      case 2:
        if (codigo2FA.length === CODIGO_2FA_LENGTH) {
          if (pagoExitoso && transaccionId) {
            // ✅ Si ya pagó antes, vamos directo a firma
            setActiveStep(4);
          } else {
            // ✅ Si es la primera vez, confirmar pago
            await handleConfirmarPago2FA(codigo2FA);
          }
        }
        break;

      case 4:
        // ✅ CAMBIO CRÍTICO: Pedir 2FA fresco para la firma
        if (!codigo2FAFirma || codigo2FAFirma.length !== CODIGO_2FA_LENGTH) {
          showError('Debes ingresar tu código 2FA para firmar el contrato');
          return;
        }

        if (signatureDataUrl && location) {
          await handleSignContract(
            signatureDataUrl,
            signaturePosition,
            location,
            codigo2FAFirma // ✅ Usar el código 2FA de firma
          );
        }
        break;
    }
  }, [
    activeStep,
    pagoExitoso,
    transaccionId,
    codigo2FA,
    codigo2FAFirma,
    signatureDataUrl,
    signaturePosition,
    location,
    handleConfirmInvestment,
    handleConfirmarPago2FA,
    handleSignContract,
    showError
  ]);

  const handleClose = useCallback(() => {
    if (isVerificandoPago || isProcessing) return;
    onClose();
    setTimeout(() => {
      if (!pagoExitoso || activeStep === 0) CheckoutStateManager.clearState();
      setActiveStep(0);
      setCodigo2FA('');
      setCodigo2FAFirma(''); // ✅ Limpiar código de firma
      setPagoExitoso(false);
      setSignatureDataUrl(null);
      setSignaturePosition(null);
      setLocation(null);
      setTransaccionId(null);
      setShowRecoveryPrompt(false);
      setRecoveredState(null);
      hasAttemptedRecovery.current = false;
    }, 300);
  }, [isVerificandoPago, isProcessing, onClose, pagoExitoso, activeStep, setPagoExitoso, setTransaccionId]);

  // ✅ ACTUALIZAR isStepValid
  const isStepValid = useMemo(() => {
    switch (activeStep) {
      case 0: return true;
      case 1: return true;
      case 2: return codigo2FA.length === CODIGO_2FA_LENGTH && !!location;
      case 4:
        // ✅ Validar que tenga firma Y código 2FA fresco
        return !!signatureDataUrl && codigo2FAFirma.length === CODIGO_2FA_LENGTH;
      default: return true;
    }
  }, [activeStep, codigo2FA, codigo2FAFirma, location, signatureDataUrl]);

  const getButtonText = () => {
    if (isProcessing) return 'Procesando...';
    if (activeStep === 4) return 'Finalizar Firma';
    if (activeStep === 2 && pagoExitoso) return 'Continuar a Firma';
    if (activeStep === 2) return 'Ir a Pagar';
    return 'Continuar';
  };

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
          maxWidth="lg"
        >
          <Stack spacing={3} p={2}>
            <Alert severity="info" icon={<Info />}>
              <Typography variant="body2" fontWeight={600}>Encontramos una sesión anterior</Typography>
              <Typography variant="caption">Puedes continuar donde lo dejaste.</Typography>
            </Alert>
            <Stack direction="row" spacing={2}>
              <Button variant="outlined" fullWidth onClick={handleDiscardRecovery} startIcon={<Close />}>
                Empezar de Nuevo
              </Button>
              <Button variant="contained" fullWidth onClick={handleRecoverState} startIcon={<Refresh />} color="primary">
                Continuar
              </Button>
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
        disableClose={isVerificandoPago || isProcessing}
        PaperProps={{ sx: { height: { xs: '100%', md: '95vh' } } }}
        customActions={
          <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={2} width="100%" justifyContent="space-between">
            <Button
              onClick={activeStep === 0 ? handleClose : () => setActiveStep(p => p - 1)}
              disabled={isProcessing || isVerificandoPago || activeStep === 3}
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
                disabled={!isStepValid || isProcessing}
                endIcon={
                  isProcessing ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : activeStep === 4 ? (
                    <CloudUpload />
                  ) : (
                    <ArrowForward />
                  )
                }
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
                  <StepLabel
                    StepIconProps={{
                      sx: {
                        '&.Mui-active': {
                          color: index === 4 ? theme.palette.success.main : theme.palette.primary.main,
                          transform: 'scale(1.2)'
                        },
                        '&.Mui-completed': { color: theme.palette.success.main }
                      }
                    }}
                  >
                    {step.label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          )}

          <Box flex={1} overflow="auto" p={{ xs: 2, md: 2 }} display="flex" flexDirection="column">
            {activeStep === 0 && (
              <StepConfirmacion
                proyecto={proyecto}
                tipo={tipo}
                montoTotalStr={montoAMostrar}      // 👈 Coincide con el nombre en el componente
                cuotaActiva={cuotaActiva}          // 👈 Le pasas el desglose que trajiste de la BD
                formatCurrency={formatCurrency}    // 👈 Le pasas la función para formatear la moneda
              />
            )}
            {activeStep === 1 && <StepContrato plantilla={plantillaActual} isLoading={loadingPlantilla} />}
            {activeStep === 2 && (
              <StepSeguridad
                codigo2FA={codigo2FA}
                setCodigo2FA={setCodigo2FA}
                location={location}
                isProcessing={isProcessing}
                error={error2FA}
              />
            )}
            {activeStep === 3 && <StepPago pagoExitoso={pagoExitoso} />}
            {activeStep === 4 && (
              <Stack spacing={3} height="100%">
                {/* ✅ AGREGAR INPUT DE 2FA ANTES DE LA FIRMA */}
                <Alert severity="warning" icon={<Lock />} sx={{ borderRadius: 2 }}>
                  <Typography variant="body2" fontWeight={600} mb={1}>
                    Verificación de seguridad requerida
                  </Typography>
                  <Typography variant="caption">
                    Para firmar el contrato necesitas ingresar tu código 2FA actual.
                  </Typography>
                </Alert>

                <TextField
                  autoFocus
                  label="Código 2FA para firmar"
                  value={codigo2FAFirma}
                  onChange={(e) => setCodigo2FAFirma(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000 000"
                  disabled={isProcessing}
                  fullWidth
                  inputProps={{ maxLength: 6 }}
                  sx={{ maxWidth: 400, mx: 'auto' }}
                  helperText="Ingresa el código de tu aplicación Google Authenticator"
                />

                <Fade in={!signatureDataUrl} unmountOnExit>
                  <Box>
                    <Alert severity="info" icon={<Draw />} sx={{ borderRadius: 2, mb: 3 }}>
                      <Typography variant="body2">Dibuja tu firma digital en el recuadro.</Typography>
                    </Alert>
                    <SignatureCanvas
                      onSave={setSignatureDataUrl}
                      onClear={() => setSignatureDataUrl(null)}
                      initialSignature={signatureDataUrl}
                    />
                  </Box>
                </Fade>

                <Fade in={!!signatureDataUrl} unmountOnExit>
                  {/* ✅ Agregamos flex={1} a este Box principal */}
                  <Box flex={1} display="flex" flexDirection="column" sx={{ minHeight: { xs: '65vh', md: '70vh' }, mt: 2 }}>
                    <Alert severity="success" variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
                      <Typography variant="body2" fontWeight={600}>✓ Firma capturada correctamente</Typography>
                      <Button size="small" onClick={() => setSignatureDataUrl(null)}>Cambiar Firma</Button>
                    </Alert>

                    <Box
                      flex={1}
                      borderRadius={2}
                      overflow="hidden"
                      border={`1px solid ${theme.palette.divider}`}
                      sx={{ display: 'flex', flexDirection: 'column' }} // ✅ Mantiene el PDF expandido
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
    </>
  );
};