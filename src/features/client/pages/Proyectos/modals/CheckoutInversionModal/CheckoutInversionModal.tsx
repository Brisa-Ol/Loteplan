// src/features/client/pages/Proyectos/modals/CheckoutInversionModal.tsx

import {
  ArrowBack,
  ArrowForward,
  Business,
  Clear,
  Close,
  CloudUpload,
  Description,
  Draw,
  Payment,
  Refresh,
  Save,
  Security,
  ShoppingCart,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Step,
  StepLabel,
  Stepper,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Services
import ContratoFirmadoService from '@/core/api/services/contrato-firmado.service';
import ContratoPlantillaService from '@/core/api/services/contrato-plantilla.service';
import MercadoPagoService from '@/core/api/services/pagoMercado.service';

// Components
import BaseModal from '@/shared/components/domain/modals/BaseModal';

// Hooks
import { useCheckoutWizard } from '@/features/client/hooks/Usecheckoutwizard';
import { useCurrencyFormatter } from '@/features/client/hooks/useCurrencyFormatter';
import useSnackbar from '@/shared/hooks/useSnackbar';
import { CheckoutStateManager } from '../Checkout persistence';

// Types
import CuotaMensualService from '@/core/api/services/cuotaMensual.service';
import { env } from '@/core/config/env';
import type { ContratoTrackingResponse } from '@/core/types/contrato.dto';
import type { TrackPaymentAndContractResponseDto } from '@/core/types/contrato-firmado.dto';
import type { ProyectoDto } from '@/core/types/proyecto.dto';

// Steps — reutilizamos los mismos del WizardModal
import { StepConfirmacion } from '../StepsModal/StepConfirmacion';
import { StepContrato } from '../StepsModal/StepContrato';
import { StepFirma } from '../StepsModal/StepFirma';
import { StepSeguridad } from '../StepsModal/StepSeguridad';
import { PagoExitosoBanner } from '../StepsModal/PagoExitosoBanner';

// ============================================================================
// STEP SYSTEM — igual que CheckoutWizardModal pero sin Adhesion ni Pago
// ============================================================================
type CheckoutStep = 'Resumen' | 'Contrato' | 'Seguridad' | 'Pago' | 'Firma';

const STEP_ORDER: CheckoutStep[] = ['Resumen', 'Contrato', 'Seguridad', 'Pago', 'Firma'];

const stepIndex = (step: CheckoutStep) => STEP_ORDER.indexOf(step);
const nextStep  = (step: CheckoutStep): CheckoutStep | null => STEP_ORDER[stepIndex(step) + 1] ?? null;
const prevStep  = (step: CheckoutStep): CheckoutStep | null => STEP_ORDER[stepIndex(step) - 1] ?? null;

// ============================================================================
// TYPES
// ============================================================================
export interface CheckoutInversionModalProps {
  open: boolean;
  onClose: () => void;
  proyecto: ProyectoDto;
  tipo: 'suscripcion' | 'inversion';
  inversionId?: number;
  pagoId?: number;
  trackingData?: ContratoTrackingResponse | TrackPaymentAndContractResponseDto | null;
}

interface SignaturePosition { x: number; y: number; page: number; }
interface Location { lat: string; lng: string; }

// ============================================================================
// UTILS
// ============================================================================
function isPaymentApproved(data: any): boolean {
  const estado =
    data?.transaccion?.estado ??
    data?.inversion?.estado ??
    data?.estado ??
    '';
  return estado === 'pagado' || estado === 'approved';
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export const CheckoutInversionModal: React.FC<CheckoutInversionModalProps> = ({
  open,
  onClose,
  proyecto,
  tipo,
  inversionId: initialInversionId,
  pagoId: initialPagoId,
  trackingData,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { showSuccess, showInfo, showError } = useSnackbar();
  const formatCurrency = useCurrencyFormatter({
    currency: 'ARS',
    //currency: proyecto.moneda === 'USD' ? 'USD' : 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // ── STATE ──────────────────────────────────────────────────────────────────
  const [activeStep, setActiveStep] = useState<CheckoutStep>('Resumen');
  const [codigo2FA, setCodigo2FA] = useState('');
  const [codigo2FAFirma, setCodigo2FAFirma] = useState('');
  const [location, setLocation] = useState<Location | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signaturePosition, setSignaturePosition] = useState<SignaturePosition | null>(null);

  const hasAttemptedRecovery = useRef(false);

  // ── QUERIES ────────────────────────────────────────────────────────────────
  const { data: plantillas, isLoading: loadingPlantilla } = useQuery({
    queryKey: ['plantillaContrato', proyecto.id],
    queryFn: async () => (await ContratoPlantillaService.findByProject(proyecto.id)).data,
    enabled: open,
    staleTime: env.queryStaleTime,
  });

  const plantillaActual = useMemo(
    () => (plantillas && plantillas.length > 0 ? plantillas[0] : null),
    [plantillas],
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

  // ── CHECKOUT WIZARD HOOK ───────────────────────────────────────────────────
  const {
    isProcessing,
    paymentStatus,
    isVerificandoPago,
    transaccionId,
    inversionId,
    error2FA,
    handleConfirmInvestment,
    handleConfirmarPago2FA,
    handleSignContract,
    setPaymentStatus,
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
    },
  });

  const effectiveInversionId = inversionId || initialInversionId;
  const effectivePagoId      = transaccionId || initialPagoId;

  // ── RECOVERY EFFECT ────────────────────────────────────────────────────────
  // Adaptado del WizardModal: para inversiones directas el trackingData
  // no tiene suscripciones_detalle, solo tiene_pago + puede_firmar.
  useEffect(() => {
    if (!open || hasAttemptedRecovery.current) return;

    // PRIORIDAD MÁXIMA: trackingData con pago confirmado y sin firma
    if (trackingData?.tiene_pago && trackingData?.puede_firmar && !trackingData?.tiene_contrato_firmado) {
      setPaymentStatus('success');
      setActiveStep('Firma');
      hasAttemptedRecovery.current = true;
      return;
    }

    // Si ya firmó, no hay nada que hacer
    if (trackingData?.tiene_contrato_firmado) {
      hasAttemptedRecovery.current = true;
      return;
    }

    // Verificar estado del pago por ID (props o estado guardado)
    const txId = effectivePagoId || effectiveInversionId;
    if (txId) {
      (async () => {
        try {
          setTransaccionId(txId);
          const res = await MercadoPagoService.getPaymentStatus(txId, true);
          if (isPaymentApproved(res.data)) {
            setPaymentStatus('success');
            setActiveStep('Firma');
            showInfo(
              tipo === 'suscripcion'
                ? '¡Pago confirmado! Firmá el contrato para activar tu suscripción.'
                : '¡Pago confirmado! Firmá el contrato para finalizar tu inversión.',
            );
          } else {
            // Pago pendiente → paso de pago
            setActiveStep('Pago');
          }
        } catch (err) {
          console.warn('⚠️ Error verificando pago:', err);
        } finally {
          hasAttemptedRecovery.current = true;
        }
      })();
      return;
    }

    hasAttemptedRecovery.current = true;
  }, [
    open, proyecto.id, tipo, trackingData, effectiveInversionId, effectivePagoId,
    showInfo, setTransaccionId, setPaymentStatus,
  ]);

  // ── GEOLOCATION EFFECT ─────────────────────────────────────────────────────
  useEffect(() => {
    const needsLocation = activeStep === 'Seguridad' || activeStep === 'Firma';
    if (needsLocation && open && !location) {
      ContratoFirmadoService.getCurrentPosition()
        .then(pos => { if (pos) setLocation(pos); })
        .catch(err => console.warn('Error obteniendo ubicación:', err));
    }
  }, [activeStep, open, location]);

  // ── STEP ACTION ────────────────────────────────────────────────────────────
  const handleStepAction = useCallback(async () => {
    switch (activeStep) {
      case 'Resumen': {
        // Si ya hay pago exitoso, saltar directo a firma
        const yaIniciado = paymentStatus === 'success' && (inversionId || transaccionId);
        if (yaIniciado) { setActiveStep('Firma'); return; }
        await handleConfirmInvestment();
        setActiveStep('Contrato');
        break;
      }

      case 'Contrato':
        setActiveStep('Seguridad');
        break;

      case 'Seguridad': {
        const CODIGO_2FA_LENGTH = 6;
        if (codigo2FA.length !== CODIGO_2FA_LENGTH) {
          showError('Debes ingresar el código completo');
          return;
        }
        // Si el pago ya está aprobado (recovery), ir directo a firma
        if (paymentStatus === 'success' && transaccionId) {
          setActiveStep('Firma');
          return;
        }
        // Crear inversión + iniciar pago con 2FA
        await handleConfirmInvestment(codigo2FA, location);
        setActiveStep('Pago');
        break;
      }

      case 'Pago':
        // Este paso es de espera (redirect de MercadoPago),
        // el botón solo es visible si paymentStatus === 'success'
        if (paymentStatus === 'success') setActiveStep('Firma');
        break;

      case 'Firma': {
        const CODIGO_2FA_LENGTH = 6;
        if (!codigo2FAFirma || codigo2FAFirma.length !== CODIGO_2FA_LENGTH) {
          showError('Debes ingresar tu código 2FA para firmar el contrato');
          return;
        }
        if (!signaturePosition) {
          showError('Debes colocar tu firma sobre el contrato antes de continuar');
          return;
        }
        if (signatureDataUrl && location) {
          // Para inversiones directas, el id a usar viene del trackingData
          await handleSignContract(
            signatureDataUrl,
            signaturePosition,
            location,
            codigo2FAFirma,
            undefined,                                    // id_suscripcion → no aplica
            trackingData ? trackingData : undefined,      // trackingData con proyecto.id
          );
        }
        break;
      }
    }
  }, [
    activeStep, transaccionId, paymentStatus, inversionId, tipo,
    codigo2FA, codigo2FAFirma, signatureDataUrl, signaturePosition, location,
    handleConfirmInvestment, handleConfirmarPago2FA, handleSignContract, showError,
  ]);

  // ── CLOSE ──────────────────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    if (isVerificandoPago || isProcessing) return;
    onClose();
    setTimeout(() => {
      if (paymentStatus !== 'success' || activeStep === 'Resumen') setActiveStep('Resumen');
      setCodigo2FA('');
      setCodigo2FAFirma('');
      setPaymentStatus('idle');
      setSignatureDataUrl(null);
      setSignaturePosition(null);
      setLocation(null);
      setTransaccionId(null);
      hasAttemptedRecovery.current = false;
    }, 300);
  }, [isVerificandoPago, isProcessing, onClose, paymentStatus, activeStep, setPaymentStatus, setTransaccionId]);

  // ── VALIDATION ─────────────────────────────────────────────────────────────
  const CODIGO_2FA_LENGTH = 6;
  const isStepValid = useMemo(() => {
    switch (activeStep) {
      case 'Seguridad': return codigo2FA.length === CODIGO_2FA_LENGTH && !!location;
      case 'Firma':     return !!signatureDataUrl && codigo2FAFirma.length === CODIGO_2FA_LENGTH && !!signaturePosition;
      case 'Pago':      return paymentStatus === 'success'; // solo avanzar si está aprobado
      default:          return true;
    }
  }, [activeStep, codigo2FA, codigo2FAFirma, location, signatureDataUrl, signaturePosition, paymentStatus]);

  const getButtonText = () => {
    if(!plantillaActual) return "No hay contrato disponible"
    if (isProcessing) return 'Procesando...';
    if (activeStep === 'Firma') return 'Firmar Contrato';
    if (activeStep === 'Seguridad' && paymentStatus === 'success') return 'Continuar a Firma';
    return 'Continuar';
  };

  // ── RENDER STEP CONTENT ────────────────────────────────────────────────────
  const renderStepContent = () => {
    switch (activeStep) {
      case 'Resumen':
        return (
          <StepConfirmacion
            proyecto={proyecto}
            tipo={tipo}
            montoTotalStr={montoAMostrar}
            cuotaActiva={cuotaActiva}
            formatCurrency={formatCurrency}
          />
        );
      case 'Contrato':
        return <StepContrato plantilla={plantillaActual} isLoading={loadingPlantilla} />;

      case 'Seguridad':
        return (
          <StepSeguridad
            codigo2FA={codigo2FA}
            setCodigo2FA={setCodigo2FA}
            location={location}
            isProcessing={isProcessing}
            error={error2FA}
          />
        );

      case 'Pago':
        return (
          // Paso de espera: el usuario fue redirigido a MercadoPago y volvió
          <Stack alignItems="center" justifyContent="center" minHeight="40vh" spacing={3}>
            {paymentStatus === 'processing' && (
              <>
                <CircularProgress size={64} />
                <Alert severity="info" sx={{ maxWidth: 420 }}>
                  Estamos verificando tu pago. Esto puede demorar unos segundos...
                </Alert>
              </>
            )}
            {paymentStatus === 'success' && <PagoExitosoBanner tipo={tipo} />}
            {paymentStatus === 'failed' && (
              <Alert severity="error" sx={{ maxWidth: 420 }}>
                El pago fue rechazado. Volvé al inicio para intentarlo nuevamente.
              </Alert>
            )}
          </Stack>
        );

      case 'Firma':
        return (
          <Stack spacing={3}>
            <PagoExitosoBanner tipo={tipo} />
            <StepFirma
              codigo2FAFirma={codigo2FAFirma}
              setCodigo2FAFirma={setCodigo2FAFirma}
              plantillaActual={plantillaActual}
              signatureDataUrl={signatureDataUrl}
              setSignatureDataUrl={setSignatureDataUrl}
              signaturePosition={signaturePosition}
              setSignaturePosition={setSignaturePosition}
              isProcessing={isProcessing}
            />
          </Stack>
        );
    }
  };

  // ── JSX ────────────────────────────────────────────────────────────────────
  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      title={tipo === 'suscripcion' ? 'Nueva Suscripción' : 'Nueva Inversión'}
      subtitle={proyecto.nombre_proyecto}
      icon={<Business />}
      headerColor={activeStep === 'Firma' ? 'success' : 'primary'}
      maxWidth="md"
      disableClose={isVerificandoPago || isProcessing}
      PaperProps={{
        sx: {
          height: isMobile ? '100%' : '95vh',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
      customActions={
        <Stack
          direction={{ xs: 'column-reverse', sm: 'row' }}
          spacing={2}
          width="100%"
          justifyContent="space-between"
          alignItems="center"
        >
          <Button
            onClick={
              activeStep === 'Resumen'
                ? handleClose
                : () => {
                    if (activeStep === 'Firma') {
                      setSignatureDataUrl(null);
                      setSignaturePosition(null);
                    }
                    const prev = prevStep(activeStep);
                    if (prev) setActiveStep(prev);
                  }
            }
            // Bloquear "Atrás" en Pago: el usuario ya fue a MercadoPago
            disabled={isProcessing || isVerificandoPago || activeStep === 'Pago'}
            startIcon={activeStep === 'Resumen' ? <Close /> : <ArrowBack />}
            color="inherit"
            fullWidth={isMobile}
            sx={{ fontWeight: 700, px: 3 }}
          >
            {activeStep === 'Resumen' ? 'Cancelar' : 'Atrás'}
          </Button>

          {/* Ocultar "Continuar" en Pago si el pago aún no se confirmó */}
          {(activeStep !== 'Pago' || paymentStatus === 'success') && (
            <Button
              variant="contained"
              color={activeStep === 'Firma' ? 'success' : 'primary'}
              onClick={handleStepAction}
              disabled={!isStepValid || isProcessing || !plantillaActual}
              endIcon={
                isProcessing
                  ? <CircularProgress size={20} color="inherit" />
                  : activeStep === 'Firma'
                    ? <CloudUpload />
                    : <ArrowForward />
              }
              fullWidth={isMobile}
              sx={{ px: 4, py: 1.2, fontWeight: 800, borderRadius: 2, minWidth: { sm: 200 } }}
            >
              {getButtonText()}
            </Button>
          )}
        </Stack>
      }
    >
      <Stack spacing={3} height="100%" minHeight={0}>
        {/* Stepper */}
        {!isMobile && (
          <Stepper activeStep={stepIndex(activeStep)} alternativeLabel sx={{ pt: 1 }}>
            {STEP_ORDER.map((step) => (
              <Step key={step}>
                <StepLabel
                  StepIconProps={{
                    sx: {
                      '&.Mui-active': {
                        color: step === 'Firma'
                          ? theme.palette.success.main
                          : theme.palette.primary.main,
                        transform: 'scale(1.1)',
                      },
                      '&.Mui-completed': { color: theme.palette.success.main },
                    },
                  }}
                >
                  {step}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        )}

        {/* Contenido del paso */}
        <Box flex={1} sx={{ overflowY: 'auto', px: { xs: 0, md: 1 } }}>
          {renderStepContent()}
        </Box>
      </Stack>
    </BaseModal>
  );
};