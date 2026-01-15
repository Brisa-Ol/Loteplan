import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import useSnackbar from '../../../shared/hooks/useSnackbar';
import { useAuth } from '@/core/context/AuthContext';
import { useModal } from '@/shared/hooks/useModal';
import ContratoService from '@/core/api/services/contrato.service';
import ImagenService from '@/core/api/services/imagen.service';
import InversionService from '@/core/api/services/inversion.service';
import type { ContratoFirmadoDto } from '@/core/types/dto/contrato-firmado.dto';
import TransaccionService from '@/core/api/services/transaccion.service';
import ProyectoService from '@/core/api/services/proyecto.service';
import SuscripcionService from '@/core/api/services/suscripcion.service';
import MercadoPagoService from '@/core/api/services/pagoMercado.service';



export const useDetalleProyecto = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showSuccess, showError, showInfo } = useSnackbar();

  // --- ESTADOS ---
  const [tabValue, setTabValue] = useState(0);
  const [verificandoPago, setVerificandoPago] = useState(false);
  const [pendingTransactionId, setPendingTransactionId] = useState<number | null>(null);
  const [error2FA, setError2FA] = useState<string | null>(null);
  const [contratoFirmadoSeleccionado, setContratoFirmadoSeleccionado] = useState<ContratoFirmadoDto | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- MODALES ---
  const modales = {
    firma: useModal(),
    contrato: useModal(),
    firmado: useModal(),
    suscribirse: useModal(),
    inversion: useModal(),
    pagoExitoso: useModal(),
    twoFA: useModal(),
  };

  // --- QUERIES ---
  const { data: proyecto, isLoading: loadingProyecto } = useQuery({
    queryKey: ['proyecto', id],
    queryFn: async () => (await ProyectoService.getByIdActive(Number(id))).data,
    retry: false,
  });

  const { data: misContratos } = useQuery({
    queryKey: ['misContratos'],
    queryFn: async () => (await ContratoService.getMyContracts()).data,
    enabled: !!user,
  });

  const { data: misInversiones } = useQuery({
    queryKey: ['misInversiones'],
    queryFn: async () => (await InversionService.getMisInversiones()).data,
    enabled: !!user && proyecto?.tipo_inversion === 'directo',
  });

  const { data: misSuscripciones } = useQuery({
    queryKey: ['misSuscripciones'],
    queryFn: async () => (await SuscripcionService.getMisSuscripciones()).data,
    enabled: !!user && proyecto?.tipo_inversion === 'mensual',
  });

  // --- ESTADOS DERIVADOS ---
  const yaFirmo = useMemo(() => {
    if (!misContratos || !proyecto) return false;
    return !!misContratos.find(c => c.id_proyecto === proyecto.id && c.estado_firma === 'FIRMADO');
  }, [misContratos, proyecto]);

  const puedeFirmar = useMemo(() => {
    if (!proyecto || !user) return false;
    if (proyecto.tipo_inversion === 'directo' && misInversiones) {
      return !!misInversiones.find(i => i.id_proyecto === proyecto.id && i.estado === 'pagado');
    } else if (proyecto.tipo_inversion === 'mensual' && misSuscripciones) {
      return !!misSuscripciones.find(s => s.id_proyecto === proyecto.id && s.activo);
    }
    return false;
  }, [proyecto, user, misInversiones, misSuscripciones]);

  const is2FAMissing = !!(user && !user.is_2fa_enabled);

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

  // --- EFECTOS (PAGO MP) ---
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const status = query.get('status');
    const externalReference = query.get('external_reference');

    if (status === 'approved' && externalReference && !modales.pagoExitoso.isOpen) {
      verificarEstadoPago(Number(externalReference));
    } else if (status === 'failure' || status === 'rejected') {
      showError("El pago fue rechazado o no se completó.");
      limpiarUrl();
    }
    return () => { if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current); };
  }, [location]);

  const limpiarUrl = () => window.history.replaceState({}, document.title, window.location.pathname);

  const verificarEstadoPago = async (transaccionId: number, intentos = 0) => {
    setVerificandoPago(true);
    try {
      const { data } = await TransaccionService.getMyTransactionById(transaccionId);
      if (data.estado_transaccion === 'pagado') {
        setVerificandoPago(false);
        limpiarUrl();
        queryClient.invalidateQueries({ queryKey: ['misInversiones'] });
        queryClient.invalidateQueries({ queryKey: ['misSuscripciones'] });
        modales.pagoExitoso.open();
      } else {
        if (intentos < 10) {
          pollingTimeoutRef.current = setTimeout(() => verificarEstadoPago(transaccionId, intentos + 1), 3000);
        } else {
          setVerificandoPago(false);
          showInfo("Pago aprobado en MP. Espera unos minutos a que impacte en el sistema.");
          limpiarUrl();
        }
      }
    } catch (error) {
      setVerificandoPago(false);
    }
  };

  // --- MUTACIONES ---
  const handleInversion = useMutation({
    mutationFn: async () => {
      if (!proyecto) throw new Error("Proyecto no cargado");
      let initResponse: any;
      const modelType = proyecto.tipo_inversion === 'mensual' ? 'pago' : 'inversion';

      if (proyecto.tipo_inversion === 'mensual') {
        initResponse = (await SuscripcionService.iniciar({ id_proyecto: proyecto.id })).data;
      } else {
        initResponse = (await InversionService.iniciar({ id_proyecto: proyecto.id })).data;
      }

      if (initResponse.redirectUrl) return initResponse;
      
      const idParaCheckout = initResponse.pagoId || initResponse.inversionId || initResponse.id;
      if (!idParaCheckout) return initResponse;

      const checkoutRes = await MercadoPagoService.iniciarCheckoutModelo(modelType, idParaCheckout);
      return { ...initResponse, ...checkoutRes.data };
    },
    onSuccess: (data: any) => {
      modales.suscribirse.close();
      modales.inversion.close();
      
      if (data.is2FARequired && data.transaccionId) {
        setPendingTransactionId(data.transaccionId);
        modales.twoFA.open();
        return;
      }
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['misInversiones'] });
      queryClient.invalidateQueries({ queryKey: ['misSuscripciones'] });
      modales.pagoExitoso.open();
    },
    onError: () => {
      modales.suscribirse.close();
      modales.inversion.close();
    }
  });

  const confirmar2FAMutation = useMutation({
    mutationFn: async (codigo: string) => {
      if (!pendingTransactionId) throw new Error("ID perdido");
      return (await SuscripcionService.confirmar2FA({ transaccionId: pendingTransactionId, codigo_2fa: codigo })).data;
    },
    onSuccess: (data: any) => {
      modales.twoFA.close();
      setError2FA(null);
      if (data.redirectUrl) window.location.href = data.redirectUrl;
      else {
        queryClient.invalidateQueries({ queryKey: ['misInversiones'] });
        queryClient.invalidateQueries({ queryKey: ['misSuscripciones'] });
        modales.pagoExitoso.open();
      }
    },
    onError: (err: any) => setError2FA(err.response?.data?.message || "Código incorrecto")
  });

  // --- HANDLERS UI ---
  const handleContinuarAFirma = () => {
    modales.pagoExitoso.close();
    setTimeout(() => { modales.firma.open(); }, 500);
  };

  const handleFirmaExitosa = () => {
    modales.firma.close();
    queryClient.invalidateQueries({ queryKey: ['misContratos'] });
    showSuccess("Contrato firmado correctamente");
  };

  const handleVerContratoFirmado = () => {
    if (!misContratos || !proyecto) return;
    const contrato = misContratos.find(c => c.id_proyecto === proyecto.id && c.estado_firma === 'FIRMADO');
    if (contrato) {
      setContratoFirmadoSeleccionado(contrato);
      modales.firmado.open();
    }
  };

  const handleMainAction = () => {
    if (!user) return navigate('/login', { state: { from: location.pathname } });
    if (proyecto?.tipo_inversion === 'mensual') modales.suscribirse.open();
    else modales.inversion.open();
  };

  const handleClickFirmar = () => {
    if (!user) return;
    if (is2FAMissing) { navigate('/client/MiCuenta/SecuritySettings'); return; }
    modales.firma.open();
  };

  return {
    id,
    user,
    proyecto,
    loadingProyecto,
    tabValue,
    setTabValue,
    yaFirmo,
    puedeFirmar,
    is2FAMissing,
    coverImage,
    porcentaje,
    mostrarTabLotes,
    verificandoPago,
    handleInversion,
    confirmar2FAMutation,
    modales,
    handleContinuarAFirma,
    handleFirmaExitosa,
    handleVerContratoFirmado,
    handleMainAction,
    handleClickFirmar,
    contratoFirmadoSeleccionado,
    setContratoFirmadoSeleccionado,
    error2FA,
    setError2FA
  };
};