// src/features/client/hooks/useCheckoutWizard.ts

import ContratoFirmadoService from '@/core/api/services/contrato-firmado.service';
import ImagenService from '@/core/api/services/imagen.service';
import InversionService from '@/core/api/services/inversion.service';
import MercadoPagoService from '@/core/api/services/pagoMercado.service';
import SuscripcionService from '@/core/api/services/suscripcion.service';
import { useAuth } from '@/core/context';
import type { ContratoPlantillaDto } from '@/core/types/contrato-plantilla.dto';
import type { ProyectoDto } from '@/core/types/proyecto.dto';
import useSnackbar from '@/shared/hooks/useSnackbar';
import { calculateFileHash } from '@/shared/utils/fileUtils';
import { PDFDocument } from 'pdf-lib';
import { useCallback, useRef, useState } from 'react';
import { CheckoutStateManager } from '../pages/Proyectos/modals/Checkout persistence';

import type { ContratoTrackingResponse } from '@/core/types/contrato.dto';

// ===================================================
// TYPES
// ===================================================
interface SignaturePosition {
  x: number;
  y: number;
  page: number;
}

interface Location {
  lat: string;
  lng: string;
}

interface UseCheckoutWizardProps {
  proyecto: ProyectoDto;
  tipo: 'suscripcion' | 'inversion';
  plantillaContrato: ContratoPlantillaDto | null;
  onSuccess?: () => void;
}

type PaymentStatus =
  | "idle"
  | "processing"
  | "success"
  | "failed";

// ===================================================
// CONSTANTS
// ===================================================
const SIGNATURE_WIDTH = 150;
const SIGNATURE_HEIGHT = 50;
const MAX_PAYMENT_VERIFICATION_ATTEMPTS = 8;
const PAYMENT_VERIFICATION_INTERVAL_MS = 3000;

// ===================================================
// HOOK PRINCIPAL
// ===================================================
export const useCheckoutWizard = ({
  proyecto,
  tipo,
  plantillaContrato,
  onSuccess
}: UseCheckoutWizardProps) => {
  const { showSuccess, showError, showWarning } = useSnackbar();
  const { user } = useAuth(); // ✅ OBTENER USUARIO AUTENTICADO

  // ===================================================
  // STATE
  // ===================================================
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerificandoPago, setIsVerificandoPago] = useState(false);
  //const [pagoExitoso, setPagoExitoso] = useState(false);

  //probando 3 estados de pago
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle");

  const [transaccionId, setTransaccionId] = useState<number | null>(null);
  const [inversionId, setInversionId]   = useState<number | null>(null); 
  const [error2FA, setError2FA] = useState<string | null>(null);

  const isVerifyingRef = useRef(false);

  // ===================================================
  // CONFIRMACIÓN DE INVERSIÓN/SUSCRIPCIÓN
  // ===================================================
  const handleConfirmInvestment = useCallback(async (codigo2FA?:string, location?: Location | null) => {
  try {
    setIsProcessing(true);
    setError2FA(null);

    let txId: number | null = null;
    let invId: number | null = null;
      console.log("Antes de if inversion")
    if (tipo === 'inversion' && codigo2FA) {
      console.log("Entró a if inversion")
      // ===================================================
      // 1. CREAR INVERSIÓN
      // ===================================================
      const response = await InversionService.crearInversion({
        id_proyecto: proyecto.id,
      });

      invId = response.data.inversionId!;
      console.log(invId)

      if (!invId) {
        throw new Error('No se recibió el ID de la inversión');
      }

      setInversionId(invId);

      // ===================================================
      // 2. INICIAR PAGO (ACÁ SALE LA TRANSACCIÓN)
      // ===================================================
      console.log(invId)
      const paymentResponse = await InversionService.startPayment({
        inversionId: invId,
        codigo_2fa: codigo2FA 
      });
      console.log(invId)
      console.log(paymentResponse)
      txId = paymentResponse.transaccionId!;
      console.log(txId)
      setTransaccionId(txId);

      // 👉 redirección directa
      const redirectUrl = paymentResponse.redirectUrl;

      CheckoutStateManager.saveState({
            projectId: proyecto.id,
            tipo,
            activeStep: 3,
            transactionId: transaccionId,
            inversionId: inversionId,
            paymentSuccess: paymentStatus === 'success',
            signatureDataUrl: redirectUrl,
            location: location || null,
            timestamp: Date.now()
          })
          console.log("💾 GUARDANDO ESTADO:", {
            projectId: proyecto.id,
            inversionId,
            transaccionId,
            activeStep:3
          });


      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }

    } else {
      // SUSCRIPCIÓN (ya viene todo junto)
      const response = await SuscripcionService.iniciar({
        id_proyecto: proyecto.id,
      });

      txId = response.data.transaccionId;
    }

    // ===================================================
    // VALIDACIÓN FINAL
    // ===================================================
    if (txId) {
      setTransaccionId(txId);
      showSuccess('Registro creado. Procede con el pago.');
    } else {
      throw new Error('No se recibió ID de transacción');
    }

  } catch (error: any) {
    const msg = error.response?.data?.message || error.message || 'Error al crear el registro';
    showError(msg);
    throw error;
  } finally {
    setIsProcessing(false);
  }
}, [tipo, proyecto, showSuccess, showError]);

  // ===================================================
  // CONFIRMACIÓN DE PAGO CON 2FA
  // ===================================================
  const handleConfirmarPago2FA = useCallback(async (codigo2FA: string) => {
    if (!transaccionId) {
      showError('Falta el ID de transacción');
      return;
    }

    // ✅ VALIDACIÓN CRÍTICA: El código 2FA debe ser un código FRESCO
    if (!codigo2FA || codigo2FA.length !== 6) {
      showError('Debes ingresar un código 2FA válido');
      return;
    }

    try {
      setIsProcessing(true);
      let response;

      if (tipo === 'inversion') {
        response = await InversionService.confirmar2FA({
          inversionId: transaccionId,
          codigo_2fa: codigo2FA
        });
      } else {
        response = await SuscripcionService.confirmar2FA({
          transaccionId: transaccionId,
          codigo_2fa: codigo2FA
        });
      }

      const data = response?.data as any;
      const urlPago = data?.redirectUrl || data?.init_point || data?.url;

      if (urlPago) {
        CheckoutStateManager.saveState({
          projectId: proyecto.id,
          tipo,
          activeStep: 3,
          transactionId: transaccionId,
          inversionId: inversionId,
          paymentSuccess: false,
          signatureDataUrl: null,
          location: null,
          timestamp: Date.now()
        });

        window.location.href = urlPago;
      } else {
        throw new Error('No se recibió el link de pago.');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Error al procesar el pago';
      showError(msg);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [tipo, transaccionId, inversionId, proyecto, showError]);

  // ===================================================
  // VERIFICACIÓN DE PAGO
  // ===================================================
  const iniciarVerificacionPago = useCallback(async (id: number) => {
    if (isVerifyingRef.current) return;
    isVerifyingRef.current = true;
    setPaymentStatus("processing");

    try {
      for (let i = 0; i < MAX_PAYMENT_VERIFICATION_ATTEMPTS; i++) {
        try {
          const res = await MercadoPagoService.getPaymentStatus(id, true);
          const estado = (res.data?.transaccion?.estado || (res.data as any)?.estado) as any;

          if (estado === 'pagado' || estado === 'approved') {
            //setPagoExitoso(true);
            setPaymentStatus("success");
            setIsVerificandoPago(false);
            showSuccess('¡Pago confirmado exitosamente!');
            return true;
          }

          if (estado === 'fallido' || estado === 'rejected') {
            //setIsVerificandoPago(false);
            setPaymentStatus("failed")
            showError('El pago fue rechazado.');
            return false;
          }

          await new Promise(resolve => setTimeout(resolve, PAYMENT_VERIFICATION_INTERVAL_MS));
        } catch (error) {
          console.error('Error verificando pago:', error);
        }
      }

      setIsVerificandoPago(false);
      setPaymentStatus("processing")
      showWarning('El pago sigue procesándose. Puedes cerrar y volver más tarde.');
      return false;
    } finally {
      isVerifyingRef.current = false;
    }
  }, [showSuccess, showError, showWarning]);

  // ===================================================
  // GENERACIÓN Y FIRMA DEL PDF
  // ===================================================
  const handleSignContract = useCallback(async (
    signatureDataUrl: string,
    signaturePosition: SignaturePosition | null,
    location: Location | null,
    codigo2FA: string, // ✅ Código 2FA FRESCO para la firma
    trackingData?: ContratoTrackingResponse | null
  ) => {
    if (!plantillaContrato) {
      showError('No hay plantilla de contrato disponible');
      return;
    }

    if (trackingData?.puede_firmar === false && trackingData?.tiene_pago === false) {
      showError('Ya se ha firmado este contrato o el pago no se ha registrado.');
      return;
    }

    // ✅ VALIDACIÓN CRÍTICA: El código 2FA debe ser un código FRESCO
    if (!codigo2FA || codigo2FA.length !== 6) {
      showError('Debes ingresar un código 2FA válido para firmar el contrato');
      return;
    }

    // ✅ VALIDACIÓN: Usuario debe estar autenticado
    if (!user || !user.id) {
      showError('Debes estar autenticado para firmar el contrato');
      return;
    }

    try {
      setIsProcessing(true);

      // 1. DESCARGAR LA PLANTILLA PDF
      const pdfUrl = ImagenService.resolveImageUrl(plantillaContrato.url_archivo);
      const pdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(pdfBytes, {
        ignoreEncryption: true
      });

      // ===================================================
      // 2. EMBEBER LA FIRMA EN EL PDF
      // ===================================================
      const signatureImage = await pdfDoc.embedPng(signatureDataUrl);

      let page, x, y;

      if (signaturePosition) {
        // Usuario colocó la firma manualmente
        const pages = pdfDoc.getPages();
        page = pages[Math.min((signaturePosition.page || 1) - 1, pages.length - 1)];

        // Obtenemos el tamaño real y físico del PDF (ej. 595 x 842)
        const { width, height } = page.getSize();

        // Multiplicamos los porcentajes (0.0 - 1.0) por el tamaño real
        const realX = signaturePosition.x * width;
        const realY = signaturePosition.y * height;

        // Centramos la firma exactamente en el cursor y corregimos el eje Y (invertido en PDF)
        x = realX - (SIGNATURE_WIDTH / 2);
        y = height - realY - (SIGNATURE_HEIGHT / 2);

      } else {
        // Firma por defecto al final del documento
        const pages = pdfDoc.getPages();
        page = pages[pages.length - 1];
        const { width } = page.getSize();
        x = (width / 2) - (SIGNATURE_WIDTH / 2);
        y = 50;
      }

      page.drawImage(signatureImage, {
        x,
        y,
        width: SIGNATURE_WIDTH,
        height: SIGNATURE_HEIGHT,
      });

      // 3. GENERAR PDF FIRMADO
      const signedPdfBytes = await pdfDoc.save();
      const signedFile = new File(
        [new Uint8Array(signedPdfBytes)],
        `contrato_firmado_${proyecto.id}_${Date.now()}.pdf`,
        { type: 'application/pdf' }
      );

      // 4. CALCULAR HASH SHA-256
      const hash = await calculateFileHash(signedFile);

      console.log('📄 PDF Firmado generado:', {
        size: signedFile.size,
        hash: hash.substring(0, 16) + '...',
        name: signedFile.name,
        userId: user.id,
        transactionId: transaccionId
      });

      // ===================================================
      // 5. ENVIAR AL BACKEND
      // ===================================================

      // Enviamos el objeto normal (el Service internamente lo convierte a FormData)
      const response = await ContratoFirmadoService.registrarFirma({
        file: signedFile,
        id_contrato_plantilla: plantillaContrato.id,
        id_proyecto: proyecto.id,
        id_usuario_firmante: user.id,
        hash_archivo_firmado: hash,
        codigo_2fa: codigo2FA,
        latitud_verificacion: location?.lat,
        longitud_verificacion: location?.lng,
      });

      console.log('✅ Contrato firmado registrado:', response.data);

      showSuccess('¡Contrato firmado exitosamente!');

      if (onSuccess) {
        onSuccess();
      }

      return response.data;

    } catch (error: any) {
      console.error('❌ Error firmando contrato:', error);
      const msg = error.response?.data?.message || error.message || 'Error al firmar el contrato';
      showError(msg);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [plantillaContrato, transaccionId, proyecto, user, showSuccess, showError, onSuccess]); // ✅ Dependencia "user" agregada

  // ===================================================
  // RETURN
  // ===================================================
  return {
    isProcessing,
    paymentStatus,
    isVerificandoPago,
    //pagoExitoso,
    transaccionId,
    inversionId,
    error2FA,
    handleConfirmInvestment,
    handleConfirmarPago2FA,
    handleSignContract,
    iniciarVerificacionPago,
    setPaymentStatus,
    //setPagoExitoso,
    setTransaccionId,
    setInversionId,
    setError2FA,
  };
};