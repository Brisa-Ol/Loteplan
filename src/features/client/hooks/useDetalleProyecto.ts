// src/features/client/hooks/useDetalleProyecto.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
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

// Types
import type { ContratoFirmadoDto } from '@/core/types/contrato-firmado.dto';
import { ROUTES } from '@/routes';
import { CheckoutStateManager } from '../pages/Proyectos/modals/Checkout persistence';

// ============================================================================
// UTILIDADES
// ============================================================================

async function calculateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export const useDetalleProyecto = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useSnackbar();

  // --- ESTADOS ---
  const [error2FA, setError2FA] = useState<string | null>(null);
  const [contratoFirmadoSeleccionado, setContratoFirmadoSeleccionado] = useState<ContratoFirmadoDto | null>(null);

  const [pendingTransactionId, setPendingTransactionId] = useState<number | null>(() => {
    if (!id) return null;
    const savedState = CheckoutStateManager.loadState(Number(id));
    return savedState?.transactionId || null;
  });

  // --- MODALES ---
  const checkoutWizardModal = useModal();
  const firmadoModal = useModal();
  const contratoModal = useModal();
  const checkoutInversionModal = useModal();

  const modales = {
    checkoutWizard: checkoutWizardModal,
    firmado: firmadoModal,
    contrato: contratoModal,
    checkoutInversion: checkoutInversionModal
  };

  // --- QUERIES ---
  const { data: proyecto, isLoading: loadingProyecto } = useQuery({
    queryKey: ['proyecto', id],
    queryFn: async () => (await ProyectoService.getByIdActive(Number(id))).data,
    retry: 1,
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });

  const { data: misContratos } = useQuery({
    queryKey: ['misContratos'],
    queryFn: async () => (await ContratoService.getMyContracts()).data,
    enabled: isAuthenticated,
  });

  const { data: misInversiones } = useQuery({
    queryKey: ['misInversiones'],
    queryFn: async () => (await InversionService.getMisInversiones()).data,
    enabled: isAuthenticated && proyecto?.tipo_inversion === 'directo',
  });

  const { data: misSuscripciones } = useQuery({
    queryKey: ['misSuscripciones'],
    queryFn: async () => (await SuscripcionService.getMisSuscripciones()).data,
    enabled: isAuthenticated && proyecto?.tipo_inversion === 'mensual',
  });

  // --- ESTADOS DERIVADOS ---
const yaFirmo = useMemo(() => {
  if (!isAuthenticated || !misContratos || !proyecto) return false;
  const contratoFirmado = misContratos.some(
    c => c.id_proyecto === proyecto.id && c.estado_firma === 'FIRMADO'
  );
  if (proyecto.tipo_inversion === 'mensual') {
    const suscripcionActiva = misSuscripciones?.some(
      s => s.id_proyecto === proyecto.id && s.activo
    ) ?? false;
    return contratoFirmado && suscripcionActiva;
  }
  return contratoFirmado;
}, [misContratos, misSuscripciones, proyecto, isAuthenticated]);

  const puedeFirmar = useMemo(() => {
    if (!proyecto || !isAuthenticated) return false;

    if (CheckoutStateManager.hasRecoverableState(proyecto.id)) return true;

if (proyecto.tipo_inversion === 'directo') {
  return misInversiones?.some(
    i => i.id_proyecto === proyecto.id && i.estado === 'pagado'
  ) ?? false;
}

    if (proyecto.tipo_inversion === 'mensual') {
      return misSuscripciones?.some(
        s => s.id_proyecto === proyecto.id && s.activo
      ) ?? false;
    }

    return false;
  }, [proyecto, isAuthenticated, misInversiones, misSuscripciones]);
  const tieneFirmaPendiente = useMemo(() => {
    if (!proyecto) return false;
    const saved = CheckoutStateManager.loadState(proyecto.id);
    return !!(saved?.paymentSuccess && saved?.transactionId);
  }, [proyecto]);
  const coverImage = useMemo(() => {
    if (!proyecto?.imagenes?.[0]) return '/assets/placeholder-project.jpg';
    return ImagenService.resolveImageUrl(proyecto.imagenes[0].url);
  }, [proyecto]);

  const porcentaje = useMemo(() => {
    if (proyecto?.tipo_inversion !== 'mensual' || !proyecto?.obj_suscripciones) {
      return 0;
    }
    return (proyecto.suscripciones_actuales / proyecto.obj_suscripciones) * 100;
  }, [proyecto]);

  // ✅ CORREGIDO: Los lotes pertenecen a proyectos de tipo 'mensual', no 'directo'
  const mostrarTabLotes = useMemo(() => {
    return proyecto?.tipo_inversion === 'mensual';
  }, [proyecto]);

  const is2FAMissing = !!(user && !user.is_2fa_enabled);

  // --- MUTACIONES ---

  const handleConfirmInvestment = useMutation({
    mutationFn: async () => {
      if (!proyecto) throw new Error("Proyecto no cargado");

      const savedState = CheckoutStateManager.loadState(proyecto.id);
      if (savedState?.paymentSuccess && savedState.transactionId) {
        setPendingTransactionId(savedState.transactionId);
        return { skipPayment: true, existingTxId: savedState.transactionId };
      }

      if (proyecto.tipo_inversion === 'mensual') {
        return (await SuscripcionService.iniciar({ id_proyecto: proyecto.id })).data;
      } else {
        return (await InversionService.iniciar({ id_proyecto: proyecto.id })).data;
      }
    },
    onSuccess: (data: any) => {
      if (data?.skipPayment) return;

      const txId = data.transaccionId || data.id || data.data?.id;

      if (txId && proyecto) {
        setPendingTransactionId(txId);
        CheckoutStateManager.saveState({
          projectId: proyecto.id,
          tipo: proyecto.tipo_inversion === 'mensual' ? 'suscripcion' : 'inversion',
          activeStep: 0,
          transactionId: txId,
          inversionId: null,
          paymentSuccess: false,
          signatureDataUrl: null,
          location: null,
          timestamp: Date.now()
        });
      }
      showSuccess('Operación iniciada correctamente');
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Error al iniciar la operación');
    }
  });

  const handleSubmit2FA = useMutation({
    mutationFn: async (codigo: string) => {
      if (!pendingTransactionId || !proyecto) {
        throw new Error("Datos insuficientes para confirmar 2FA");
      }

      if (proyecto.tipo_inversion === 'mensual') {
        await SuscripcionService.confirmar2FA({
          transaccionId: pendingTransactionId,
          codigo_2fa: codigo
        });
      } else {
        await InversionService.confirmar2FA({
          inversionId: pendingTransactionId,
          codigo_2fa: codigo
        });
      }

      const modelType = proyecto.tipo_inversion === 'mensual' ? 'pago' : 'inversion';
      const checkoutRes = await MercadoPagoService.iniciarCheckoutModelo(
        modelType,
        pendingTransactionId
      );

      return checkoutRes.data;
    },
    onSuccess: () => {
      setError2FA(null);
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.message || "Código incorrecto";
      setError2FA(errorMessage);
      showError(errorMessage);
    }
  });

  const handleSignContract = useMutation({
    mutationFn: async ({ file, location, codigo2FA }: { file: File; location: { lat: string; lng: string } | null; codigo2FA: string }) => {
      if (!user || !proyecto || !pendingTransactionId) {
        throw new Error('Faltan datos necesarios para firmar');
      }

      const plantillasResponse = await ContratoPlantillaService.findByProject(proyecto.id);
      const plantilla = plantillasResponse.data?.[0];

      if (!plantilla) throw new Error('No se encontró la plantilla del contrato');

      const hashArchivo = await calculateFileHash(file);

      const firmaDto = {
        file,
        id_contrato_plantilla: plantilla.id,
        id_proyecto: proyecto.id,
        id_usuario_firmante: user.id,
        hash_archivo_firmado: hashArchivo,
        codigo_2fa: codigo2FA,
        latitud_verificacion: location?.lat,
        longitud_verificacion: location?.lng
      };

      const contratoResponse = await ContratoFirmadoService.registrarFirma(firmaDto);

      return {
        success: true,
        contratoId: contratoResponse.data.contrato.id
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['misContratos'] });
      showSuccess("🎉 ¡Contrato firmado exitosamente!");
      CheckoutStateManager.clearState();
      setPendingTransactionId(null);
      modales.checkoutWizard.close();
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Error al firmar el contrato');
    }
  });

  // --- ACCIONES ---

  const handleMainAction = () => {
    if (!isAuthenticated) {
      return navigate(ROUTES.LOGIN, { state: { from: location.pathname } });
    }
    if (is2FAMissing) {
      return navigate('/client/MiCuenta/SecuritySettings');
    }
    setError2FA(null);
    if(proyecto?.tipo_inversion === 'directo') {
      modales.checkoutInversion.open();
    }else{
      modales.checkoutWizard.open();
    }
  };

  const handleVerContratoFirmado = async () => {
    if (!misContratos || !proyecto) {
      showError("No hay contratos disponibles");
      return;
    }

    const contrato = misContratos.find(
      c => c.id_proyecto === proyecto.id && c.estado_firma === 'FIRMADO'
    );

    if (!contrato) {
      showError("No se encontró tu contrato firmado");
      return;
    }

    setContratoFirmadoSeleccionado(contrato);
    modales.firmado.open();

    try {
      const nombreArchivo = contrato.nombre_archivo || `contrato_proyecto_${proyecto.id}.pdf`;
      await ContratoService.downloadAndSave(contrato.id, nombreArchivo);
      showSuccess("Descarga iniciada");
    } catch (error) {
      console.error("Error descargando contrato:", error);
    }
  };

  return {
    id,
    user,
    proyecto,
    loadingProyecto,
    coverImage,
    porcentaje,
    mostrarTabLotes,   // ✅ Lógica corregida: true solo para tipo 'mensual'
    yaFirmo,
    tieneFirmaPendiente,
    puedeFirmar,
    is2FAMissing,
    error2FA,
    setError2FA,
    contratoFirmadoSeleccionado,
    setContratoFirmadoSeleccionado,
    modales,
    handleMainAction,
    handleClickFirmar: handleMainAction,
    handleVerContratoFirmado,
    inversionId: proyecto?.tipo_inversion === 'directo' ? pendingTransactionId ?? undefined : undefined,
    pagoId: proyecto?.tipo_inversion === 'mensual' ? pendingTransactionId ?? undefined : undefined,
    wizardCallbacks: {
      onConfirmInvestment: async () => await handleConfirmInvestment.mutateAsync(),
      onSubmit2FA: async (code: string) => await handleSubmit2FA.mutateAsync(code),
      onSignContract: async (file: File, loc: { lat: string; lng: string } | null, c2fa: string) => await handleSignContract.mutateAsync({ file, location: loc, codigo2FA: c2fa })
    },
    isProcessingWizard: handleConfirmInvestment.isPending || handleSubmit2FA.isPending || handleSignContract.isPending,
    handleInversion: {
      isPending: false,
      mutate: handleMainAction
    },
  };
};