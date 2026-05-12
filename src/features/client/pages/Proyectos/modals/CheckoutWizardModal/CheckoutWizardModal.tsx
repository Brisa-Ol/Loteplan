// src/features/client/pages/Proyectos/modals/CheckoutWizardModal.tsx

import {
  ArrowBack,
  ArrowForward,
  Business,
  Close,
  CloudUpload,
  Description,
  Draw,
  Payment,
  Security,
  ShoppingCart,
  VerifiedUser,
} from '@mui/icons-material';
import {
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
import { confirmarPagoCuota, createAdhesion, iniciarPagoCuota } from '@/core/api/services/adhesion.service';
import CuotaMensualService from '@/core/api/services/cuotaMensual.service';
import { env } from '@/core/config/env';
import type { IniciarPagoCuotaResponse, PlanPagoAdhesion } from '@/core/types/adhesion.dto';
import type { TrackPaymentAndContractResponseDto } from '@/core/types/contrato-firmado.dto';
import type { ContratoTrackingResponse } from '@/core/types/contrato.dto';
import type { ProyectoDto } from '@/core/types/proyecto.dto';
import { PagoExitosoBanner } from '../StepsModal/PagoExitosoBanner';
import { StepAdhesion } from '../StepsModal/StepAdhesion';
import { StepConfirmacion } from '../StepsModal/StepConfirmacion';
import { StepContrato } from '../StepsModal/StepContrato';
import { StepFirma } from '../StepsModal/StepFirma';
import { StepPago, type PagoDecision } from '../StepsModal/StepPago';
import { StepSeguridad } from '../StepsModal/StepSeguridad';

// ============================================================================
// STEP SYSTEM
// ============================================================================

type CheckoutStep = 'Resumen' | 'Contrato' | 'Adhesion' | 'Pago' | 'Seguridad' | 'Firma';

// Fuente de verdad del orden. Para añadir un paso: agregar aquí y en el switch de renderStep.
const STEP_ORDER: CheckoutStep[] = ['Resumen', 'Contrato', 'Adhesion', 'Pago', 'Seguridad', 'Firma'];

const STEP_ICONS: Record<CheckoutStep, React.ReactNode> = {
  Resumen: <ShoppingCart />,
  Adhesion: <Business />,
  Contrato: <Description />,
  Seguridad: <Security />,
  Pago: <Payment />,
  Firma: <Draw />,
};

// Helpers de navegación — nunca exponen índices numéricos al componente
const stepIndex = (step: CheckoutStep) => STEP_ORDER.indexOf(step);
const nextStep = (step: CheckoutStep): CheckoutStep | null => STEP_ORDER[stepIndex(step) + 1] ?? null;
const prevStep = (step: CheckoutStep): CheckoutStep | null => STEP_ORDER[stepIndex(step) - 1] ?? null;


// ============================================================================
// TYPES
// ============================================================================
export interface CheckoutWizardModalProps {
  open: boolean;
  onClose: () => void;
  proyecto: ProyectoDto;
  tipo: 'suscripcion' | 'inversion';
  inversionId?: number;
  pagoId?: number;
  trackingData?: ContratoTrackingResponse | TrackPaymentAndContractResponseDto | null;
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

export interface IPlan {
  value: PlanPagoAdhesion;
  label: string;
  cuotas: number;
  badge?: string
}
// ============================================================================
// CONSTANTS
// ============================================================================
const CODIGO_2FA_LENGTH = 6;

const PLANES: IPlan[] = [
  { value: "contado", label: "Contado", cuotas: 1, badge: "Sin recargo" },
  { value: "3_cuotas", label: "3 cuotas", cuotas: 3 },
  { value: "6_cuotas", label: "6 cuotas", cuotas: 6 },
];

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
export const CheckoutWizardModal: React.FC<CheckoutWizardModalProps> = ({
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
    currency: proyecto.moneda === 'USD' ? 'USD' : 'ARS',
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
  const [planPago, setPlanPago] = useState<PlanPagoAdhesion>('contado');
  const [adhesionId, setAdhesionId] = useState<number | null>(null);
  const [startPaymentCuotaAdhesion, setStartPaymentCuotaAdhesion] = useState<IniciarPagoCuotaResponse | null>(null);
  const [isCreatingAdhesion, setIsCreatingAdhesion] = useState(false);
  const [targetSuscripcionId, setTargetSuscripcionId] = useState<number | null>(null);

  const PORCENTAJE_ADHESION = 4.0;
  const [pagoDecision, setPagoDecision] = useState<PagoDecision>(null);


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
  const valorMovil = Number(cuotaActiva?.valor_movil ?? 0);
  const montoTotalAdhesion = valorMovil * (PORCENTAJE_ADHESION / 100);
  const cuotasPlan = PLANES.find(p => p.value === planPago)?.cuotas ?? 1;
  const montoPorCuota = montoTotalAdhesion / cuotasPlan;

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
  const effectivePagoId = transaccionId || initialPagoId;

  // ── RECOVERY EFFECT ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open || hasAttemptedRecovery.current) return;

    if (trackingData?.tiene_pago && trackingData?.puede_firmar) {
      const suscripciones = (trackingData as any).suscripciones_detalle ?? [];

      // Buscar la suscripción que tiene pago de adhesión PERO aún NO tiene contrato firmado
      const pendienteDeFirma = suscripciones.find(
        (s: any) => s.tiene_pago_adhesion === true && !s.contrato_firmado
      );

      if (pendienteDeFirma) {
        setTargetSuscripcionId(pendienteDeFirma.suscripcion_id);
        setPaymentStatus('success');
        setActiveStep('Firma');
        hasAttemptedRecovery.current = true;
        return;
      }

      // Si todas ya tienen contrato firmado, no hay nada que firmar → no abrir en Firma
      // (puede_firmar=true pero ya está todo firmado — edge case del backend)
      hasAttemptedRecovery.current = true;
      return;
    }

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
        const yaIniciado =
          tipo === 'inversion'
            ? paymentStatus === 'success' && inversionId
            : paymentStatus === 'success' && transaccionId;

        if (yaIniciado) { setActiveStep('Firma'); return; }
        await handleConfirmInvestment();
        setActiveStep('Contrato');
        break;
      }

      case 'Adhesion': {
        setActiveStep('Pago');
        break;
      }

      case 'Contrato':
        setActiveStep('Adhesion');
        break;

      case 'Seguridad':
        if (codigo2FA.length !== CODIGO_2FA_LENGTH) {
          showError('Debes ingresar el código completo');
          return;
        }

        // --- Flujo de inversión (ya existe un pago) ---
        if (paymentStatus === 'success' && transaccionId) {
          setActiveStep('Firma');
          return;
        }
        if (tipo === 'inversion' && transaccionId) {
          await handleConfirmarPago2FA(codigo2FA);
          setActiveStep('Firma');
          return;
        }

        // --- Flujo de adhesión (debe haber decisión de pago) ---
        if (!pagoDecision) {
          showError('Debe seleccionar una opción de pago');
          return;
        }

        try {
          // Cancelar → no se crea nada, se cierra el wizard
          if (pagoDecision === 'cancelar') {
            showInfo('Adhesión cancelada. Podés iniciar el proceso nuevamente cuando quieras.');
            handleClose();
            return;
          }

          setIsCreatingAdhesion(true);

          // Crear la adhesión si no existe
          let currentAdhesionId = adhesionId;
          if (!currentAdhesionId) {
            const res = await createAdhesion({
              proyectoId: proyecto.id,
              planPago,
            });
            const nuevaAdhesion = res.data.data;
            currentAdhesionId = nuevaAdhesion.id;
            setAdhesionId(currentAdhesionId);
          }

          // Pagar después → adhesión creada, mensaje y cierre
          if (pagoDecision === 'pagar_despues') {
            showSuccess('Adhesión creada exitosamente. Podés pagar la primera cuota desde <Billetera => Pagar Cuotas> cuando quieras.');
            handleClose();
            return;
          }

          // Pagar ahora → iniciar y confirmar el pago de la primera cuota
          if (pagoDecision === 'pagar_ahora') {
            const pagoResp = await iniciarPagoCuota({
              adhesionId: currentAdhesionId,
              numeroCuota: 1
            });
            setStartPaymentCuotaAdhesion(pagoResp.data);
            const pagoAdhesionId = pagoResp.data.pagoAdhesionId;
            if (!pagoAdhesionId) throw new Error('No se obtuvo ID de pago');

            console.log("procesando")
            setTimeout(() => {

            }, 3000)
            const confirmRes = await confirmarPagoCuota({
              pagoAdhesionId,
              codigo_2fa: codigo2FA,
            });
            if (confirmRes.data.redirectUrl) {
              window.location.href = confirmRes.data.redirectUrl;
              return;
            }
            // Si no hay redirección, el pago ya está aprobado
            setPaymentStatus('success');
            setActiveStep('Firma');
          }
        } catch (err: any) {
          showError(err?.message || 'Error al procesar la adhesión. Intenta nuevamente.');
        } finally {
          setIsCreatingAdhesion(false);
        }
        break;

      case 'Pago':
        if (!pagoDecision) {
          showError('Debes seleccionar una opción de pago');
          return;
        }
        if (pagoDecision === 'cancelar') {
          showInfo("Cancelaste la adhesión. Podés iniciar el proceso nuevamente cuando quieras.");
          handleClose();
          return;
        } else {
          setActiveStep('Seguridad');
        }
        break;

      case 'Firma':
        if (!codigo2FAFirma || codigo2FAFirma.length !== CODIGO_2FA_LENGTH) {
          showError('Debes ingresar tu código 2FA para firmar el contrato');
          return;
        }
        if (!signaturePosition) {
          showError('Debes colocar tu firma sobre el contrato antes de continuar');
          return;
        }
        if (signatureDataUrl && location) {
          await handleSignContract(
            signatureDataUrl,
            signaturePosition,
            location,
            codigo2FAFirma,
            targetSuscripcionId ?? undefined  // ← pasar el id específico
          );
        }
        break;
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
      setPlanPago('contado');
      setAdhesionId(null);
      setSignatureDataUrl(null);
      setSignaturePosition(null);
      setLocation(null);
      setTransaccionId(null);
      setTargetSuscripcionId(null);
      hasAttemptedRecovery.current = false;
    }, 300);
  }, [isVerificandoPago, isProcessing, onClose, paymentStatus, activeStep, setPaymentStatus, setTransaccionId]);

  // ── VALIDATION ─────────────────────────────────────────────────────────────
  const isStepValid = useMemo(() => {
    switch (activeStep) {
      case 'Seguridad': return codigo2FA.length === CODIGO_2FA_LENGTH && !!location;
      case 'Firma': return !!signatureDataUrl && codigo2FAFirma.length === CODIGO_2FA_LENGTH && !!signaturePosition;
      default: return true;
    }
  }, [activeStep, codigo2FA, codigo2FAFirma, location, signatureDataUrl, signaturePosition]);

  const getButtonText = () => {
    if (isCreatingAdhesion) return 'Procesando...'
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
      case 'Adhesion':
        return (
          <StepAdhesion
            valorMovil={Number(cuotaActiva?.valor_movil ?? 0)}
            planPago={planPago}
            setPlanPago={setPlanPago}
            formatCurrency={formatCurrency}
            PLANES={PLANES}
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
        return <StepPago
          paymentStatus={paymentStatus}
          onRetry={() => setActiveStep('Resumen')}
          decision={pagoDecision}
          onDecisionChange={setPagoDecision}
          montoPorCuota={formatCurrency(montoPorCuota)}
          cuotasPlan={cuotasPlan}
          isProcessing={isCreatingAdhesion || isProcessing}
        />
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
      icon={tipo === 'suscripcion' ? <VerifiedUser /> : <Business />}
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
            disabled={isProcessing || isVerificandoPago}
            startIcon={activeStep === 'Resumen' ? <Close /> : <ArrowBack />}
            color="inherit"
            fullWidth={isMobile}
            sx={{ fontWeight: 700, px: 3 }}
          >
            {activeStep === 'Resumen' ? 'Cancelar' : 'Atrás'}
          </Button>


          <Button
            variant="contained"
            color={activeStep === 'Firma' ? 'success' : 'primary'}
            onClick={handleStepAction}
            disabled={!isStepValid || isProcessing || isCreatingAdhesion}
            endIcon={
              isProcessing || isCreatingAdhesion
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