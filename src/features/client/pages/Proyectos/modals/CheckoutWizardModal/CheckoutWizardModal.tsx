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
  Lock,
  Payment,
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
import { CheckoutStateManager } from '../Checkout persistence';

// Types
import CuotaMensualService from '@/core/api/services/cuotaMensual.service';
import { env } from '@/core/config/env';
import type { ContratoTrackingResponse } from '@/core/types/contrato.dto';
import type { ProyectoDto } from '@/core/types/proyecto.dto';
import { StepConfirmacion } from '../StepsModal/StepConfirmacion';
import { StepContrato } from '../StepsModal/StepContrato';
import { StepSeguridad } from '../StepsModal/StepSeguridad';
import { StepPago } from '../StepsModal/StepPago';
import { PagoExitosoBanner } from '../StepsModal/PagoExitosoBanner';
import { StepFirma } from '../StepsModal/StepFirma';

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
  trackingData?: ContratoTrackingResponse | null
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


// ===================================================
// MAIN COMPONENT
// ===================================================
export const CheckoutWizardModal: React.FC<CheckoutWizardModalProps> = ({
  open,
  onClose,
  proyecto,
  tipo,
  inversionId: initialInversionId,
  pagoId: initialPagoId,
  trackingData
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
  // const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false);
  // const [recoveredState, setRecoveredState] = useState<CheckoutPersistedState | null>(null);

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
    inversionId,
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
  const effectiveInversionId = inversionId || initialInversionId;   // registro de negocio
  const effectivePagoId = transaccionId || initialPagoId;        // transacción de pago

  useEffect(() => {
    if (!open || hasAttemptedRecovery.current) return;

    // 🔥 PRIORIDAD MÁXIMA: trackingData manda sobre todo
    if (
      trackingData &&
      trackingData.tiene_pago &&
      trackingData.puede_firmar
    ) {
      setPaymentStatus('success');
      setActiveStep(4);
      hasAttemptedRecovery.current = true;
      return;
    }

    // Sin trackingData: verificar por IDs de props si los hay
    const txId = effectivePagoId || effectiveInversionId;
    if (txId) {
      (async () => {
        try {
          setTransaccionId(txId);
          const res = await MercadoPagoService.getPaymentStatus(txId, true);

          if (isPaymentApproved(res.data)) {
            setPaymentStatus('success');
            setActiveStep(4);
            showInfo(
              tipo === 'suscripcion'
                ? '¡Pago confirmado! Firmá el contrato para activar tu suscripción.'
                : '¡Pago confirmado! Firmá el contrato para finalizar tu inversión.'
            );
          }
          // Si no está aprobado, flujo limpio desde paso 0
        } catch (err) {
          console.warn('⚠️ Error verificando pago:', err);
        } finally {
          hasAttemptedRecovery.current = true;
        }
      })();
      return;
    }

    hasAttemptedRecovery.current = true;
  }, [open, proyecto.id, tipo, trackingData, effectiveInversionId, effectivePagoId,
    showInfo, setTransaccionId, setPaymentStatus]);

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
        const yaIniciado = tipo === 'inversion'
          ? (paymentStatus === 'success' && inversionId)
          : (paymentStatus === 'success' && transaccionId);

        if (yaIniciado) { setActiveStep(4); return; }
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
      if (paymentStatus !== 'success' || activeStep === 0) //CheckoutStateManager.clearState();
        setActiveStep(0);
      setCodigo2FA('');
      setCodigo2FAFirma('');
      setPaymentStatus('idle');
      setSignatureDataUrl(null);
      setSignaturePosition(null);
      setLocation(null);
      setTransaccionId(null);
      // setShowRecoveryPrompt(false);
      // setRecoveredState(null);
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

      {/* MODAL PRINCIPAL */}
      <BaseModal
        open={open}
        onClose={handleClose}
        title={tipo === 'suscripcion' ? 'Nueva Suscripción' : 'Nueva Inversión'}
        subtitle={proyecto.nombre_proyecto}
        icon={tipo === 'suscripcion' ? <VerifiedUser /> : <Business />}
        headerColor={activeStep === 4 ? 'success' : 'primary'}
        maxWidth="md"
        disableClose={isVerificandoPago || isProcessing}
        PaperProps={{
          sx: {
            height: isMobile ? '100%' : '95vh',
            display: 'flex',
            flexDirection: 'column'
          }
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
              onClick={activeStep === 0 ? handleClose : () => {
                if (activeStep === 4) { setSignatureDataUrl(null); setSignaturePosition(null); }
                setActiveStep(p => p - 1);
              }}
              disabled={isProcessing || isVerificandoPago || activeStep === 3}
              startIcon={activeStep === 0 ? <Close /> : <ArrowBack />}
              color="inherit"
              fullWidth={isMobile}
              sx={{ fontWeight: 700, px: 3 }}
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
                sx={{
                  px: 4,
                  py: 1.2,
                  fontWeight: 800,
                  borderRadius: 2,
                  minWidth: { sm: 200 }
                }}
              >
                {getButtonText()}
              </Button>
            )}
          </Stack>
        }
      >
        <Stack spacing={3} height="100%" minHeight={0}>
          {/* Stepper dinámico */}
          {!isMobile && (
            <Stepper activeStep={activeStep} alternativeLabel sx={{ pt: 1 }}>
              {STEPS.map((step, index) => (
                <Step key={step.label}>
                  <StepLabel
                    StepIconProps={{
                      sx: {
                        '&.Mui-active': {
                          color: index === 4 ? theme.palette.success.main : theme.palette.primary.main,
                          transform: 'scale(1.1)'
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

          {/* Área de contenido con scroll interno gestionado por BaseModal */}
          <Box flex={1} sx={{ overflowY: 'auto', px: { xs: 0, md: 1 } }}>
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

            {activeStep === 4 && (
              <Stack spacing={3}>
                <PagoExitosoBanner tipo={tipo} />

                <StepFirma 
                  codigo2FAFirma={codigo2FAFirma} setCodigo2FAFirma={setCodigo2FAFirma} 
                  plantillaActual={plantillaActual}
                  signatureDataUrl={signatureDataUrl}
                  setSignatureDataUrl={setSignatureDataUrl}
                  signaturePosition={signaturePosition}
                  setSignaturePosition={setSignaturePosition}
                  isProcessing={isProcessing}
                />
                
              </Stack>
            )}
          </Box>
        </Stack>
      </BaseModal>
    </>
  );
};