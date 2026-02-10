// src/features/client/hooks/useDetalleProyecto.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, type SyntheticEvent } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '@/core/context/AuthContext';
import { useModal } from '@/shared/hooks/useModal';
import useSnackbar from '@/shared/hooks/useSnackbar';

// Services
import ContratoFirmadoService from '@/core/api/services/contrato-firmado.service';
import ContratoPlantillaService from '@/core/api/services/contrato-plantilla.service';
import ContratoService from '@/core/api/services/contrato.service';
import ImagenService from '@/core/api/services/imagen.service';
import InversionService from '@/core/api/services/inversion.service';
import MercadoPagoService from '@/core/api/services/pagoMercado.service';
import ProyectoService from '@/core/api/services/proyecto.service';
import SuscripcionService from '@/core/api/services/suscripcion.service';
import TransaccionService from '@/core/api/services/transaccion.service';

// Types
import type { ContratoFirmadoDto } from '@/core/types/dto/contrato-firmado.dto';
import { ROUTES } from '@/routes';
import { CheckoutStateManager } from '../pages/Proyectos/modals/Checkout persistence';

// Utility: Calcular SHA-256 hash
async function calculateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const useDetalleProyecto = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { showSuccess, showError, showInfo } = useSnackbar();

  // --- Estados ---
  const [tabValue, setTabValue] = useState(0);
  const [verificandoPago, setVerificandoPago] = useState(false);
  const [error2FA, setError2FA] = useState<string | null>(null);
  const [contratoFirmadoSeleccionado, setContratoFirmadoSeleccionado] = useState<ContratoFirmadoDto | null>(null);

  const [pendingTransactionId, setPendingTransactionId] = useState<number | null>(() => {
    if (id) {
      const savedState = CheckoutStateManager.loadState(Number(id));
      return savedState?.transactionId || null;
    }
    return null;
  });

  const modales = {
    checkoutWizard: useModal(),
    firmado: useModal(),
    contrato: useModal(),
  };

  // --- Queries ---
  const { data: proyecto, isLoading: loadingProyecto } = useQuery({
    queryKey: ['proyecto', id],
    queryFn: async () => (await ProyectoService.getByIdActive(Number(id))).data,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const { data: misContratos } = useQuery({
    queryKey: ['misContratos'],
    queryFn: async () => (await ContratoService.getMyContracts()).data,
    enabled: !!isAuthenticated,
  });

  const { data: misInversiones } = useQuery({
    queryKey: ['misInversiones'],
    queryFn: async () => (await InversionService.getMisInversiones()).data,
    enabled: !!isAuthenticated && proyecto?.tipo_inversion === 'directo',
  });

  const { data: misSuscripciones } = useQuery({
    queryKey: ['misSuscripciones'],
    queryFn: async () => (await SuscripcionService.getMisSuscripciones()).data,
    enabled: !!isAuthenticated && proyecto?.tipo_inversion === 'mensual',
  });

  // --- Estados Derivados ---
  const yaFirmo = useMemo(() => {
    if (!isAuthenticated || !misContratos || !proyecto) return false;
    return !!misContratos.find(c => c.id_proyecto === proyecto.id && c.estado_firma === 'FIRMADO');
  }, [misContratos, proyecto, isAuthenticated]);

  const puedeFirmar = useMemo(() => {
    if (!proyecto || !isAuthenticated) return false;
    if (CheckoutStateManager.hasRecoverableState(proyecto.id)) return true;
    if (proyecto.tipo_inversion === 'directo' && misInversiones) {
      return !!misInversiones.find(i => i.id_proyecto === proyecto.id && i.estado === 'pagado');
    } else if (proyecto.tipo_inversion === 'mensual' && misSuscripciones) {
      return !!misSuscripciones.find(s => s.id_proyecto === proyecto.id && s.activo);
    }
    return false;
  }, [proyecto, isAuthenticated, misInversiones, misSuscripciones]);

  const coverImage = useMemo(() =>
    proyecto?.imagenes?.[0] ? ImagenService.resolveImageUrl(proyecto.imagenes[0].url) : '/assets/placeholder-project.jpg',
    [proyecto]);

  const porcentaje = useMemo(() => {
    if (proyecto?.tipo_inversion === 'mensual' && proyecto?.obj_suscripciones > 0) {
      return (proyecto.suscripciones_actuales / proyecto.obj_suscripciones) * 100;
    }
    return 0;
  }, [proyecto]);

  const mostrarTabLotes = proyecto?.tipo_inversion === 'directo' || (proyecto?.lotes && proyecto.lotes.length > 0);
  const is2FAMissing = !!(user && !user.is_2fa_enabled);

  // --- Helpers de Pago (Omitidos los detalles internos por brevedad, se mantienen igual) ---
  const limpiarUrl = () => window.history.replaceState({}, document.title, window.location.pathname);
  const encontrarTransaccionAsociada = async (): Promise<number | null> => {
    if (!proyecto || !isAuthenticated) return null;
    try {
      const { data: transacciones } = await TransaccionService.getMyTransactions();
      if (!transacciones || transacciones.length === 0) return null;
      const transaccionesProyecto = transacciones.filter(t => t.id_proyecto === proyecto.id && t.estado_transaccion === 'pagado');
      if (transaccionesProyecto.length === 0) return null;
      let transaccionEncontrada = null;
      if (proyecto.tipo_inversion === 'mensual') {
        transaccionEncontrada = transaccionesProyecto.find(t => t.tipo_transaccion === 'pago_suscripcion_inicial' && t.id_suscripcion !== null);
      } else if (proyecto.tipo_inversion === 'directo') {
        transaccionEncontrada = transaccionesProyecto.find(t => t.tipo_transaccion === 'directo' && t.id_inversion !== null);
      }
      return transaccionEncontrada ? transaccionEncontrada.id : null;
    } catch (error) { return null; }
  };

  const verificarEstadoPago = async (transaccionId: number) => {
    setVerificandoPago(true);
    try {
      const { data } = await TransaccionService.getMyTransactionById(transaccionId);
      if (data.estado_transaccion === 'pagado') {
        setPendingTransactionId(transaccionId);
        if (proyecto?.id) CheckoutStateManager.markPaymentSuccess(proyecto.id, transaccionId);
        showSuccess("Pago verificado exitosamente. Procediendo a la firma.");
        queryClient.invalidateQueries({ queryKey: ['misInversiones'] });
        queryClient.invalidateQueries({ queryKey: ['misSuscripciones'] });
        limpiarUrl();
        setTimeout(() => { modales.checkoutWizard.open(); }, 500);
      } else {
        showError("El pago no pudo ser verificado.");
        limpiarUrl();
      }
    } catch (error) { showError("Error al verificar el pago."); } finally { setVerificandoPago(false); }
  };

  // --- Mutations (handleConfirmInvestment, handleSubmit2FA, handleSignContract se mantienen igual) ---
  const handleConfirmInvestment = useMutation({
    mutationFn: async () => {
      if (!proyecto) throw new Error("Proyecto no cargado");
      const savedState = CheckoutStateManager.loadState(proyecto.id);
      if (savedState?.paymentSuccess && savedState.transactionId) {
        setPendingTransactionId(savedState.transactionId);
        return { skipPayment: true, existingTxId: savedState.transactionId };
      }
      if (proyecto.tipo_inversion === 'mensual') return (await SuscripcionService.iniciar({ id_proyecto: proyecto.id })).data;
      else return (await InversionService.iniciar({ id_proyecto: proyecto.id })).data;
    },
    onSuccess: (data: any) => {
      if (data?.skipPayment) return;
      const txId = data.transaccionId || data.id || data.data?.id;
      if (txId) {
        setPendingTransactionId(txId);
        if (proyecto) CheckoutStateManager.saveState({ projectId: proyecto.id, tipo: proyecto.tipo_inversion === 'mensual' ? 'suscripcion' : 'inversion', activeStep: 0, transactionId: txId, paymentSuccess: false, signatureDataUrl: null, location: null, timestamp: Date.now() });
      }
      showSuccess('Operación iniciada correctamente');
    }
  });

  const handleSubmit2FA = useMutation({
    mutationFn: async (codigo: string) => {
      if (!pendingTransactionId || !proyecto) throw new Error("Datos insuficientes.");
      if (proyecto.tipo_inversion === 'mensual') await SuscripcionService.confirmar2FA({ transaccionId: pendingTransactionId, codigo_2fa: codigo });
      else await InversionService.confirmar2FA({ inversionId: pendingTransactionId, codigo_2fa: codigo });
      const modelType = proyecto.tipo_inversion === 'mensual' ? 'pago' : 'inversion';
      const checkoutRes = await MercadoPagoService.iniciarCheckoutModelo(modelType, pendingTransactionId);
      return checkoutRes.data;
    },
    onSuccess: () => setError2FA(null),
    onError: (err: any) => { setError2FA(err.response?.data?.message || "Código incorrecto."); throw err; }
  });

  const handleSignContract = useMutation({
    mutationFn: async ({ file, location, codigo2FA }: { file: File; location: { lat: string; lng: string } | null; codigo2FA: string }) => {
      if (!user || !proyecto || !pendingTransactionId) throw new Error('Faltan datos para firmar');
      const plantillasResponse = await ContratoPlantillaService.findByProject(proyecto.id);
      const plantilla = plantillasResponse.data?.[0];
      if (!plantilla) throw new Error('No se encontró la plantilla');
      const hashArchivo = await calculateFileHash(file);
      const firmaDto = { file, id_contrato_plantilla: plantilla.id, id_proyecto: proyecto.id, id_usuario_firmante: user.id, hash_archivo_firmado: hashArchivo, codigo_2fa: codigo2FA, latitud_verificacion: location?.lat, longitud_verificacion: location?.lng };
      const contratoResponse = await ContratoFirmadoService.registrarFirma(firmaDto);
      return { success: true, contratoId: contratoResponse.data.contrato.id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['misContratos'] });
      showSuccess("🎉 ¡Contrato firmado exitosamente!");
      CheckoutStateManager.clearState();
      setPendingTransactionId(null);
      modales.checkoutWizard.close();
    }
  });

  // --- ACTIONS CORREGIDAS ---

  const handleMainAction = () => {
    if (!isAuthenticated) return navigate(ROUTES.LOGIN, { state: { from: location.pathname } });
    if (is2FAMissing) return navigate('/client/MiCuenta/SecuritySettings');
    setError2FA(null);
    modales.checkoutWizard.open();
  };

  /**
   * ✅ CORRECCIÓN CRÍTICA: Búsqueda + Visualización + Descarga Automática
   */
  const handleVerContratoFirmado = async () => {
    if (!misContratos || !proyecto) return;

    // 1. Buscar el contrato firmado de este proyecto
    const contrato = misContratos.find(
      c => c.id_proyecto === proyecto.id && c.estado_firma === 'FIRMADO'
    );

    if (contrato) {
      // 2. Preparar el modal de visualización
      setContratoFirmadoSeleccionado(contrato);
      modales.firmado.open();

      // 3. Disparar la descarga física del archivo
      try {
        await ContratoService.downloadAndSave(
          contrato.id,
          contrato.nombre_archivo || `contrato_${proyecto.id}.pdf`
        );
        showSuccess("Descarga iniciada");
      } catch (error) {
        console.error("Error descargando contrato:", error);
        showError("No se pudo iniciar la descarga automática.");
      }
    } else {
      showError("No se encontró tu contrato firmado.");
    }
  };

  return {
    id, user, proyecto, loadingProyecto, tabValue, coverImage, porcentaje, mostrarTabLotes, verificandoPago, yaFirmo, puedeFirmar, is2FAMissing, error2FA, contratoFirmadoSeleccionado, modales,
    setContratoFirmadoSeleccionado, setTabValue, handleTabChange: (_: SyntheticEvent, n: number) => setTabValue(n),
    handleMainAction,
    handleVerContratoFirmado, // 👈 Versión asíncrona corregida
    setError2FA,
    handleClickFirmar: handleMainAction,
    handleInversion: { isPending: false, mutate: handleMainAction },
    inversionId: proyecto?.tipo_inversion === 'directo' ? pendingTransactionId ?? undefined : undefined,
    pagoId: proyecto?.tipo_inversion === 'mensual' ? pendingTransactionId ?? undefined : undefined,
    wizardCallbacks: {
      onConfirmInvestment: async () => await handleConfirmInvestment.mutateAsync(),
      onSubmit2FA: async (code: string) => await handleSubmit2FA.mutateAsync(code),
      onSignContract: async (file: File, loc: { lat: string; lng: string } | null, c2fa: string) => await handleSignContract.mutateAsync({ file, location: loc, codigo2FA: c2fa })
    },
    isProcessingWizard: handleConfirmInvestment.isPending || handleSubmit2FA.isPending || handleSignContract.isPending
  };
};