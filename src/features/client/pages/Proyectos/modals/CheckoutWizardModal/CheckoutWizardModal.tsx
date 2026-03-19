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
  HistoryEdu,
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

//Estilos
import styles from './CheckoutWizardModal.module.css';

// Services
import ContratoFirmadoService from '@/core/api/services/contrato-firmado.service';
import ContratoPlantillaService from '@/core/api/services/contrato-plantilla.service';
import ImagenService from '@/core/api/services/imagen.service';
import MercadoPagoService from '@/core/api/services/pagoMercado.service';

// Components
import BaseModal from '@/shared/components/domain/modals/BaseModal';
import PDFViewerMejorado from '../../../Contratos/components/PDFViewerMejorado';

// Hooks
import { useCheckoutWizard } from '@/features/client/hooks/Usecheckoutwizard';
import { useCurrencyFormatter } from '@/features/client/hooks/useCurrencyFormatter';
import useSnackbar from '@/shared/hooks/useSnackbar';
import { CheckoutStateManager, type CheckoutPersistedState } from '../Checkout persistence';

// Types
import CuotaMensualService from '@/core/api/services/cuotaMensual.service';
import { env } from '@/core/config/env';
import type { ProyectoDto } from '@/core/types/proyecto.dto';

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
// UTILIDAD: detectar pago aprobado en cualquier
// estructura de respuesta de la API.
//
// Suscripciones: { transaccion: { estado: 'pagado' } }
// Inversiones:   { inversion: { estado: 'pagado' } }
// Respuesta plana: { estado: 'pagado' }
// ===================================================
function isPaymentApproved(data: any): boolean {
  const estado =
    data?.transaccion?.estado   // suscripciones / pagos mensuales
    ?? data?.inversion?.estado  // inversiones directas
    ?? data?.estado             // respuesta plana
    ?? '';
  return estado === 'pagado' || estado === 'approved';
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
    return () => { window.removeEventListener('resize', setupCanvas); clearTimeout(timeoutId); };
  }, [setupCanvas]);

  const getPointerPosition = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const isTouchEvent = 'touches' in e;
    const clientX = isTouchEvent ? e.touches[0].clientX : e.clientX;
    const clientY = isTouchEvent ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
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
    if (isDrawing && ctx) { ctx.closePath(); setIsDrawing(false); }
  }, [isDrawing, ctx]);

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (ctx && canvas) { ctx.clearRect(0, 0, canvas.width, canvas.height); setHasSignature(false); onClear(); }
  }, [ctx, onClear]);

  const handleSave = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas && hasSignature) onSave(canvas.toDataURL('image/png'));
  }, [hasSignature, onSave]);

  return (
    <Box>
      <Paper variant="outlined" sx={{
        mb: 2, overflow: 'hidden', touchAction: 'none',
        bgcolor: 'background.default',
        border: `2px dashed ${theme.palette.divider}`,
        borderRadius: 2, position: 'relative',
        height: { xs: 180, sm: 220 },
        transition: 'all 0.3s ease',
        '&:hover': { borderColor: 'primary.main' }
      }}>
        {!hasSignature && !isDrawing && (
          <Box position="absolute" top="50%" left="50%"
            sx={{ transform: 'translate(-50%, -50%)', pointerEvents: 'none', textAlign: 'center' }}>
            <Draw sx={{ fontSize: 40, color: 'action.disabled', mb: 1 }} />
            <Typography variant="caption" color="text.disabled">Firma aquí dentro</Typography>
          </Box>
        )}
        <canvas ref={canvasRef}
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
        <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', p: 2 }}>
          <Typography variant="h6" fontWeight={700}>{proyecto.nombre_proyecto}</Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {isSuscripcion ? 'Plan de Ahorro Mensual' : 'Inversión Directa (Pago Único)'}
          </Typography>
        </Box>
        <Stack spacing={0}>
          <Box p={2} borderBottom={`1px solid ${theme.palette.divider}`}>
            <Stack direction="row" justifyContent="space-between" mb={isSuscripcion && proyecto.plazo_inversion ? 1 : 0}>
              <Typography color="text.secondary">Modalidad</Typography>
              <Typography fontWeight={600}>{isSuscripcion ? 'Suscripción Mensual' : 'Aporte Único'}</Typography>
            </Stack>
            {isSuscripcion && proyecto.plazo_inversion && (
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">Plazo de financiación</Typography>
                <Typography fontWeight={600}>{proyecto.plazo_inversion} meses</Typography>
              </Stack>
            )}
          </Box>
          {isSuscripcion && cuotaActiva && (
            <Box p={2} bgcolor={alpha(theme.palette.primary.main, 0.02)}>
              <Typography variant="overline" color="primary.main" fontWeight={800} sx={{ display: 'block', mb: 1, lineHeight: 1 }}>1. Cálculo del Valor Móvil</Typography>
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
              <Typography variant="overline" color="primary.main" fontWeight={800} sx={{ display: 'block', mb: 1, lineHeight: 1 }}>2. Base a Financiar</Typography>
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
              <Typography variant="overline" color="primary.main" fontWeight={800} sx={{ display: 'block', mb: 1, lineHeight: 1 }}>3. Composición de tu Cuota</Typography>
              <Stack spacing={1} sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: 1, border: `1px solid ${theme.palette.divider}` }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" fontWeight={600}>Cuota Pura Mínima</Typography>
                    <Typography variant="caption" color="text.disabled">{formatCurrency(Number(cuotaActiva.total_del_plan))} ÷ {cuotaActiva.total_cuotas_proyecto} meses</Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={600}>{formatCurrency(Number(cuotaActiva.valor_mensual))}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" color="text.secondary">Gastos Administrativos</Typography>
                    <Typography variant="caption" color="text.disabled">({Number(cuotaActiva.porcentaje_administrativo) * 100}% sobre Cuota Pura)</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">+ {formatCurrency(Number(cuotaActiva.carga_administrativa))}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" color="text.secondary">IVA</Typography>
                    <Typography variant="caption" color="text.disabled">({Number(cuotaActiva.porcentaje_iva) * 100}% sobre Gastos)</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">+ {formatCurrency(Number(cuotaActiva.iva_carga_administrativa))}</Typography>
                </Stack>
                <Box borderTop={`2px dashed ${theme.palette.divider}`} pt={1} mt={1}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2" fontWeight={800} color="text.primary">Valor Final de la Cuota</Typography>
                    <Typography variant="subtitle2" fontWeight={800} color="text.primary">= {formatCurrency(Number(cuotaActiva.valor_mensual_final))}</Typography>
                  </Stack>
                </Box>
              </Stack>
            </Box>
          )}
          <Box p={3} display="flex" justifyContent="space-between" alignItems="center" bgcolor={alpha(theme.palette.success.main, 0.1)}>
            <Box>
              <Typography fontWeight={800} color="text.primary" variant="subtitle1">
                {isSuscripcion ? 'Valor Final de la Cuota' : 'Monto a Invertir'}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                {isSuscripcion ? 'A pagar hoy para activar el plan' : 'A pagar hoy'}
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight={900} color="success.main">{montoTotalStr}</Typography>
          </Box>
        </Stack>
      </Paper>
      {isSuscripcion && (
        <Alert severity="success" icon={<Token />} sx={{ borderRadius: 2 }}>
          <Typography variant="body2" fontWeight={700} mb={0.5}>¡Beneficio Exclusivo!</Typography>
          <Typography variant="caption">Al abonar esta primera cuota recibes <strong>1 Token de Subasta</strong> para participar por la adjudicación de lotes.</Typography>
        </Alert>
      )}
    </Stack>
  );
});
StepConfirmacion.displayName = 'StepConfirmacion';

const StepContrato = React.memo<{ plantilla: any; isLoading: boolean; }>(({ plantilla, isLoading }) => {
  if (isLoading || !plantilla) return <CircularProgress />;
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: { xs: '70vh', md: '75vh' }, bgcolor: 'grey.100', borderRadius: 2, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
      <iframe src={ImagenService.resolveImageUrl(plantilla.url_archivo)} title="Contrato" style={{ width: '100%', height: '100%', border: 'none', flex: 1 }} />
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
    <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}><Lock /></Avatar>
    <Box textAlign="center">
      <Typography variant="h5" fontWeight={700}>Verificación 2FA</Typography>
      <Typography variant="body2" color="text.secondary">Ingresa el código de Google Authenticator.</Typography>
    </Box>
    {!location && <Alert severity="warning" sx={{ width: '100%' }}>Acceso a Ubicación Requerido</Alert>}
    <TextField
      autoFocus value={codigo2FA}
      onChange={(e) => setCodigo2FA(e.target.value.replace(/\D/g, '').slice(0, 6))}
      placeholder="000 000" disabled={isProcessing || !location}
      error={!!error} helperText={error} fullWidth inputProps={{ maxLength: 6 }} sx={{ maxWidth: 300 }}
    />
  </Stack>
));
StepSeguridad.displayName = 'StepSeguridad';

const StepPago = React.memo<{ paymentStatus: string; onRetry: () => void }>(({ paymentStatus, onRetry }) => (
  <Stack alignItems="center" justifyContent="center" height="100%" minHeight="40vh" spacing={4}>
    {paymentStatus === "success" && <CheckCircle sx={{ fontSize: 60, color: 'success.main' }} />}
    {paymentStatus === "processing" && <CircularProgress size={80} />}
    {paymentStatus === "failed" && <Alert severity="error">El pago fue rechazado. Intenta nuevamente.</Alert>}
    <Typography variant="h5" fontWeight={700}>
      {paymentStatus === "success" && "¡Pago Acreditado!"}
      {paymentStatus === "processing" && "Procesando pago..."}
      {paymentStatus === "failed" && "Pago rechazado"}
    </Typography>
    {paymentStatus === "failed" && <Button className={styles.retryButton} onClick={onRetry}>Intentar Nuevamente</Button>}
  </Stack>
));
StepPago.displayName = 'StepPago';

// ===================================================
// BANNER PAGO EXITOSO — visible al inicio del paso 4
// Funciona igual para inversiones y suscripciones
// ===================================================
const PagoExitosoBanner: React.FC<{ tipo: 'suscripcion' | 'inversion' }> = ({ tipo }) => {
  const theme = useTheme();
  return (
    <Box sx={{
      p: 2.5, borderRadius: 2,
      bgcolor: alpha(theme.palette.success.main, 0.08),
      border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
      display: 'flex', alignItems: 'center', gap: 2,
    }}>
      <Box sx={{
        bgcolor: 'success.main', borderRadius: '50%',
        width: 48, height: 48, minWidth: 48,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 4px 14px ${alpha(theme.palette.success.main, 0.45)}`,
      }}>
        <CheckCircle sx={{ color: 'white', fontSize: 28 }} />
      </Box>
      <Box>
        <Typography variant="subtitle2" fontWeight={800} color="success.dark">
          ¡Pago acreditado exitosamente!
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Tu {tipo === 'suscripcion' ? 'suscripción' : 'inversión'} fue procesada.
          Completá la firma del contrato para finalizar.
        </Typography>
      </Box>
    </Box>
  );
};

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
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  // STATE
  const [activeStep, setActiveStep] = useState(0);
  const [codigo2FA, setCodigo2FA] = useState('');
  const [codigo2FAFirma, setCodigo2FAFirma] = useState('');
  const [location, setLocation] = useState<Location | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signaturePosition, setSignaturePosition] = useState<SignaturePosition | null>(null);
  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false);
  const [recoveredState, setRecoveredState] = useState<CheckoutPersistedState | null>(null);

  const hasAttemptedRecovery = useRef(false);

  // QUERIES
  const { data: plantillas, isLoading: loadingPlantilla } = useQuery({
    queryKey: ['plantillaContrato', proyecto.id],
    queryFn: async () => (await ContratoPlantillaService.findByProject(proyecto.id)).data,
    enabled: open,
    staleTime: env.queryStaleTime,
  });

  const plantillaActual = useMemo(
    () => (plantillas && plantillas.length > 0 ? plantillas[0] : null),
    [plantillas]
  );

  const { data: cuotaActiva, isLoading: loadingCuota } = useQuery({
    queryKey: ['cuotaActiva', proyecto.id],
    queryFn: async () => (await CuotaMensualService.getLastByProjectId(proyecto.id)).data.cuota,
    enabled: open && tipo === 'suscripcion',
    staleTime: env.queryStaleTime,
  });

  const montoAMostrar = useMemo(() => {
    if (tipo === 'inversion') return formatCurrency(Number(proyecto.monto_inversion || 0));
    if (loadingCuota) return 'Calculando...';
    const valor = cuotaActiva?.valor_mensual_final || proyecto.valor_cuota_referencia || 0;
    return `$ ${valor}`;
  }, [formatCurrency, proyecto, tipo, cuotaActiva, loadingCuota]);

  // CHECKOUT WIZARD HOOK
  const {
    isProcessing,
    paymentStatus,
    isVerificandoPago,
    transaccionId,
    error2FA,
    handleConfirmInvestment,
    handleConfirmarPago2FA,
    handleSignContract,
    iniciarVerificacionPago,
    setPaymentStatus,
    setTransaccionId,
  } = useCheckoutWizard({
    proyecto,
    tipo,
    plantillaContrato: plantillaActual,
    onSuccess: () => {
      showSuccess('¡Proceso completado exitosamente!');
      CheckoutStateManager.clearState();
      setTimeout(() => { handleClose(); window.location.reload(); }, 2000);
    }
  });

  // IDs efectivos: combinan el estado interno del hook con los props del padre.
  // Para inversiones usa effectiveInversionId, para suscripciones usa effectivePagoId.
  const effectiveInversionId = transaccionId || initialInversionId;
  const effectivePagoId = transaccionId || initialPagoId;

  // PERSISTENCIA
  const persistState = useCallback(() => {
    CheckoutStateManager.saveState({
      projectId: proyecto.id,
      tipo,
      activeStep,
      transactionId: transaccionId,
      paymentSuccess: paymentStatus === 'success',
      signatureDataUrl,
      location,
      timestamp: Date.now()
    });
  }, [proyecto.id, tipo, paymentStatus, activeStep, transaccionId, signatureDataUrl, location]);

  useEffect(() => {
    if (open && (paymentStatus === 'success' || activeStep >= 3 || transaccionId)) {
      persistState();
    }
  }, [open, activeStep, transaccionId, persistState]);

  // ===================================================
  // RECUPERACIÓN DE ESTADO POST-PAGO
  //
  // Misma lógica para suscripciones e inversiones:
  //
  //  1. Estado guardado con paymentSuccess=true
  //     → abrir directo en paso 4 (firma)
  //
  //  2. Estado guardado a mitad sin pago confirmado
  //     → mostrar prompt de recuperación
  //
  //  3. Sin estado guardado pero con ID en props
  //     (el usuario volvió desde MercadoPago)
  //     → consultar API y, si está pagado, ir al paso 4
  //
  //  isPaymentApproved() cubre la estructura de respuesta
  //  tanto de inversiones como de suscripciones.
  // ===================================================
  useEffect(() => {
    if (!open || hasAttemptedRecovery.current) return;

    const savedState = CheckoutStateManager.loadState(proyecto.id);

    // CASO 1: pago ya confirmado en sesión anterior
    if (savedState?.paymentSuccess && savedState.transactionId) {
      setTransaccionId(savedState.transactionId);
      setPaymentStatus('success');
      setLocation(savedState.location);
      setCodigo2FAFirma('');
      setActiveStep(4);
      showInfo(
        tipo === 'suscripcion'
          ? '¡Pago confirmado! Firmá el contrato para activar tu suscripción.'
          : '¡Pago confirmado! Firmá el contrato para finalizar tu inversión.'
      );
      hasAttemptedRecovery.current = true;
      return;
    }

    // CASO 2: proceso interrumpido sin pago confirmado
   if (savedState && savedState.activeStep >= 3 && savedState.transactionId) {
      setRecoveredState(savedState);
      setShowRecoveryPrompt(true);
      hasAttemptedRecovery.current = true;
      return;
    }

    // CASO 3: sin estado local pero llega ID por props
    // Aplica tanto para inversiones (effectiveInversionId) como suscripciones (effectivePagoId)
    const txId = effectiveInversionId || effectivePagoId;
    if (!savedState && txId) {
      MercadoPagoService.getPaymentStatus(txId, true)
        .then(res => {
          if (isPaymentApproved(res.data)) {
            setTransaccionId(txId);
            setPaymentStatus('success');
            CheckoutStateManager.markPaymentSuccess(proyecto.id, txId);
            setActiveStep(4);
            showInfo(
              tipo === 'suscripcion'
                ? '¡Pago confirmado! Firmá el contrato para activar tu suscripción.'
                : '¡Pago confirmado! Firmá el contrato para finalizar tu inversión.'
            );
          }
        })
        .catch(err => console.warn('⚠️ Error verificando pago:', err));
    }

    hasAttemptedRecovery.current = true;
  }, [open, proyecto.id, tipo, effectiveInversionId, effectivePagoId, showInfo, setTransaccionId, setPaymentStatus]);

  const handleRecoverState = useCallback(() => {
    if (!recoveredState) return;
    setTransaccionId(recoveredState.transactionId);
    setPaymentStatus(recoveredState.paymentSuccess ? 'success' : 'processing');
    setSignatureDataUrl(recoveredState.signatureDataUrl);
    setLocation(recoveredState.location);

    if (recoveredState.paymentSuccess) {
      setCodigo2FAFirma('');
      setActiveStep(4);
      showInfo(
        tipo === 'suscripcion'
          ? '¡Pago confirmado! Firmá el contrato para activar tu suscripción.'
          : '¡Pago confirmado! Firmá el contrato para finalizar tu inversión.'
      );
    } else {
      setActiveStep(recoveredState.activeStep);
      if (recoveredState.transactionId && recoveredState.activeStep >= 3) {
        iniciarVerificacionPago(recoveredState.transactionId);
      }
    }
    setShowRecoveryPrompt(false);
  }, [recoveredState, tipo, showInfo, iniciarVerificacionPago, setTransaccionId, setPaymentStatus]);

  const handleDiscardRecovery = useCallback(() => {
    CheckoutStateManager.clearState();
    setShowRecoveryPrompt(false);
    setRecoveredState(null);
  }, []);

  // GEOLOCATION
  useEffect(() => {
    if ((activeStep === 2 || activeStep === 4) && open && !location) {
      ContratoFirmadoService.getCurrentPosition()
        .then(pos => { if (pos) setLocation(pos); })
        .catch(err => console.warn('Error obteniendo ubicación:', err));
    }
  }, [activeStep, open, location]);

  // ACCIONES POR PASO
  const handleStepAction = useCallback(async () => {
    switch (activeStep) {
      case 0:
        if (paymentStatus === 'success' && transaccionId) { setActiveStep(4); return; }
        await handleConfirmInvestment();
        setActiveStep(1);
        break;
      case 1:
        setActiveStep(2);
        break;
      case 2:
        if (codigo2FA.length === CODIGO_2FA_LENGTH) {
          if (paymentStatus === 'success' && transaccionId) {
            setActiveStep(4);
          } else {
            await handleConfirmarPago2FA(codigo2FA);
          }
        }
        break;
      case 3:
        setActiveStep(4);
        break;
      case 4:
        if (!codigo2FAFirma || codigo2FAFirma.length !== CODIGO_2FA_LENGTH) {
          showError('Debes ingresar tu código 2FA para firmar el contrato');
          return;
        }
        if (!signaturePosition) {
          showError('Debes colocar tu firma sobre el contrato antes de continuar');
          return;
        }
        if (signatureDataUrl && location) {
          await handleSignContract(signatureDataUrl, signaturePosition, location, codigo2FAFirma);
        }
        break;
    }
  }, [
    activeStep, transaccionId, paymentStatus,
    codigo2FA, codigo2FAFirma, signatureDataUrl, signaturePosition, location,
    handleConfirmInvestment, handleConfirmarPago2FA, handleSignContract, showError
  ]);

  const handleClose = useCallback(() => {
    if (isVerificandoPago || isProcessing) return;
    onClose();
    setTimeout(() => {
      if (paymentStatus !== 'success' || activeStep === 0) CheckoutStateManager.clearState();
      setActiveStep(0);
      setCodigo2FA('');
      setCodigo2FAFirma('');
      setPaymentStatus('idle');
      setSignatureDataUrl(null);
      setSignaturePosition(null);
      setLocation(null);
      setTransaccionId(null);
      setShowRecoveryPrompt(false);
      setRecoveredState(null);
      hasAttemptedRecovery.current = false;
    }, 300);
  }, [isVerificandoPago, isProcessing, onClose, paymentStatus, activeStep, setPaymentStatus, setTransaccionId]);

  const isStepValid = useMemo(() => {
    switch (activeStep) {
      case 2: return codigo2FA.length === CODIGO_2FA_LENGTH && !!location;
      case 4: return !!signatureDataUrl && codigo2FAFirma.length === CODIGO_2FA_LENGTH && !!signaturePosition;
      default: return true;
    }
  }, [activeStep, codigo2FA, codigo2FAFirma, location, signatureDataUrl, signaturePosition]);

  const getButtonText = () => {
    if (isProcessing) return 'Procesando...';
    if (activeStep === 4) return 'Firmar Contrato';
    if (activeStep === 2 && paymentStatus === 'success') return 'Continuar a Firma';
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
          maxWidth="md"
        >
          <Stack spacing={3} p={2}>
            <Alert severity="info" icon={<Info />}>
              <Typography variant="body2" fontWeight={600}>Encontramos una sesión anterior</Typography>
              <Typography variant="caption">Podés continuar donde lo dejaste.</Typography>
            </Alert>
            <Button variant="contained" fullWidth onClick={handleRecoverState} startIcon={<Refresh />} color="primary">
              Continuar
            </Button>
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
              onClick={activeStep === 0 ? handleClose : () => {
                if (activeStep === 4) { setSignatureDataUrl(null); setSignaturePosition(null); }
                setActiveStep(p => p - 1);
              }}
              disabled={isProcessing || isVerificandoPago || activeStep === 3}
              startIcon={activeStep === 0 ? <Close /> : <ArrowBack />}
              color="inherit"
              fullWidth={isMobile}
            >
              {activeStep === 0 ? 'Cancelar' : 'Atrás'}
            </Button>
            {(activeStep !== 3 || paymentStatus === 'success') && (
              <Button
                variant="contained"
                color={activeStep === 4 ? 'success' : 'primary'}
                onClick={handleStepAction}
                disabled={!isStepValid || isProcessing}
                endIcon={
                  isProcessing
                    ? <CircularProgress size={20} color="inherit" />
                    : activeStep === 4 ? <CloudUpload /> : <ArrowForward />
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
                    className={styles.containerLabel}
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
                proyecto={proyecto} tipo={tipo}
                montoTotalStr={montoAMostrar} cuotaActiva={cuotaActiva}
                formatCurrency={formatCurrency}
              />
            )}
            {activeStep === 1 && <StepContrato plantilla={plantillaActual} isLoading={loadingPlantilla} />}
            {activeStep === 2 && (
              <StepSeguridad
                codigo2FA={codigo2FA} setCodigo2FA={setCodigo2FA}
                location={location} isProcessing={isProcessing} error={error2FA}
              />
            )}
            {activeStep === 3 && <StepPago paymentStatus={paymentStatus} onRetry={() => setActiveStep(0)} />}

            {/* =====================================================
                PASO 4 — FIRMA DEL CONTRATO
                Flujo idéntico para inversiones y suscripciones:
                  1. Banner de pago exitoso
                  2. Instrucción + código 2FA para autorizar la firma
                  3. Canvas para dibujar la firma
                  4. PDF para posicionar la firma
            ===================================================== */}
            {activeStep === 4 && (
              <Stack spacing={3} height="100%">

                {/* ✅ Confirmación visual del pago */}
                <PagoExitosoBanner tipo={tipo} />

                {/* ✅ Contexto del paso */}
                <Alert severity="info" icon={<HistoryEdu />} sx={{ borderRadius: 2 }}>
                  <Typography variant="body2" fontWeight={600} mb={0.5}>
                    Paso final: firma digital del contrato
                  </Typography>
                  <Typography variant="caption">
                    Ingresá tu código 2FA, dibujá tu firma y posicionala sobre el contrato para completar el proceso.
                  </Typography>
                </Alert>

                {/* ✅ 2FA exclusivo para la firma */}
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
                  helperText="Ingresá el código de tu aplicación Google Authenticator"
                />

                {/* ✅ Canvas de firma */}
                <Fade in={!signatureDataUrl} unmountOnExit>
                  <Box>
                    <Alert severity="warning" icon={<Draw />} sx={{ borderRadius: 2, mb: 3 }}>
                      <Typography variant="body2">Dibujá tu firma digital en el recuadro de abajo.</Typography>
                    </Alert>
                    <SignatureCanvas
                      onSave={setSignatureDataUrl}
                      onClear={() => { setSignatureDataUrl(null); setSignaturePosition(null); }}
                      initialSignature={signatureDataUrl}
                    />
                  </Box>
                </Fade>

                {/* ✅ PDF con posicionamiento de la firma */}
                <Fade in={!!signatureDataUrl} unmountOnExit>
                  <Box flex={1} display="flex" flexDirection="column" sx={{ minHeight: { xs: '65vh', md: '70vh' }, mt: 2 }}>
                    <Alert severity="success" variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
                      <Typography variant="body2" fontWeight={600}>✓ Firma capturada correctamente</Typography>
                      {signaturePosition
                        ? <Typography variant="caption" color="success.main">✓ Firma posicionada en el contrato</Typography>
                        : <Typography variant="caption" color="warning.main">⚠ Hacé clic en el contrato para colocar tu firma</Typography>
                      }
                      <Button size="small" onClick={() => { setSignatureDataUrl(null); setSignaturePosition(null); }}>
                        Cambiar Firma
                      </Button>
                    </Alert>
                    <Box flex={1} borderRadius={2} overflow="hidden"
                      border={`1px solid ${theme.palette.divider}`}
                      sx={{ display: 'flex', flexDirection: 'column' }}>
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