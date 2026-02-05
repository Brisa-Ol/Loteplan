// src/features/client/hooks/useDetalleProyecto.ts

import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import useSnackbar from '@/shared/hooks/useSnackbar';
import { useAuth } from '@/core/context/AuthContext';
import { useModal } from '@/shared/hooks/useModal';

// Services
import ContratoService from '@/core/api/services/contrato.service';
import ImagenService from '@/core/api/services/imagen.service';
import InversionService from '@/core/api/services/inversion.service';
import ProyectoService from '@/core/api/services/proyecto.service';
import SuscripcionService from '@/core/api/services/suscripcion.service';
import MercadoPagoService from '@/core/api/services/pagoMercado.service';
import TransaccionService from '@/core/api/services/transaccion.service';

// Types
import type { ContratoFirmadoDto } from '@/core/types/dto/contrato-firmado.dto';
import { ROUTES } from '@/routes';

export const useDetalleProyecto = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated } = useAuth();
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
        checkoutWizard: useModal(),
        firmado: useModal(),
        contrato: useModal(),
    };

    // --- QUERIES PÚBLICAS ---
    const { data: proyecto, isLoading: loadingProyecto } = useQuery({
        queryKey: ['proyecto', id],
        queryFn: async () => (await ProyectoService.getByIdActive(Number(id))).data,
        retry: 1,
        staleTime: 5 * 60 * 1000,
    });

    // --- QUERIES PRIVADAS (Solo si el usuario está autenticado) ---
    const { data: misContratos } = useQuery({
        queryKey: ['misContratos'],
        queryFn: async () => (await ContratoService.getMyContracts()).data,
        enabled: !!isAuthenticated, // ✅ Solo se ejecuta si hay sesión
    });

    const { data: misInversiones } = useQuery({
        queryKey: ['misInversiones'],
        queryFn: async () => (await InversionService.getMisInversiones()).data,
        enabled: !!isAuthenticated && proyecto?.tipo_inversion === 'directo', // ✅ Solo se ejecuta si hay sesión
    });

    const { data: misSuscripciones } = useQuery({
        queryKey: ['misSuscripciones'],
        queryFn: async () => (await SuscripcionService.getMisSuscripciones()).data,
        enabled: !!isAuthenticated && proyecto?.tipo_inversion === 'mensual', // ✅ Solo se ejecuta si hay sesión
    });

    // --- ESTADOS DERIVADOS (Seguros para invitados) ---
    const yaFirmo = useMemo(() => {
        if (!isAuthenticated || !misContratos || !proyecto) return false;
        return !!misContratos.find(c => c.id_proyecto === proyecto.id && c.estado_firma === 'FIRMADO');
    }, [misContratos, proyecto, isAuthenticated]);

    const puedeFirmar = useMemo(() => {
        if (!proyecto || !isAuthenticated) return false;
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

    // --- EFECTOS (RETORNO DE MERCADO PAGO) ---
    useEffect(() => {
        const query = new URLSearchParams(location.search);
        const status = query.get('status');
        const externalReference = query.get('external_reference');

        if (status === 'approved' && externalReference) {
            verificarEstadoPago(Number(externalReference));
        } else if (status === 'failure' || status === 'rejected') {
            showError("El pago fue rechazado o no se completó.");
            limpiarUrl();
        }
        
        return () => { 
            if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current); 
        };
    }, [location.search]);

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
                
                sessionStorage.setItem('checkout_step', '4');
                modales.checkoutWizard.open();
            } else {
                if (intentos < 8) {
                    pollingTimeoutRef.current = setTimeout(() => verificarEstadoPago(transaccionId, intentos + 1), 3000 + (intentos * 1000));
                } else {
                    setVerificandoPago(false);
                    showInfo("Pago aprobado. Espera unos minutos a que impacte en el sistema.");
                    limpiarUrl();
                }
            }
        } catch (error) {
            setVerificandoPago(false);
            showError("Error al verificar el pago.");
        }
    };

    // --- MUTACIONES (WIZARD) ---
    const handleConfirmInvestment = useMutation({
        mutationFn: async () => {
            if (!proyecto) throw new Error("Proyecto no cargado");
            let response: any;
            if (proyecto.tipo_inversion === 'mensual') {
                response = (await SuscripcionService.iniciar({ id_proyecto: proyecto.id })).data;
            } else {
                response = (await InversionService.iniciar({ id_proyecto: proyecto.id })).data;
            }
            return response;
        },
        onSuccess: (data: any) => {
            const txId = data.transaccionId || data.id || data.data?.id;
            if (txId) setPendingTransactionId(txId);
            showSuccess('Operación iniciada correctamente');
        },
        onError: (error: any) => showError(error.response?.data?.message || 'Error al iniciar la operación')
    });

    const handleSubmit2FA = useMutation({
        mutationFn: async (codigo: string) => {
            if (!pendingTransactionId) throw new Error("ID de transacción perdido.");
            if (!proyecto) throw new Error("Datos de proyecto no disponibles.");
            
            if (proyecto.tipo_inversion === 'mensual') {
                await SuscripcionService.confirmar2FA({ transaccionId: pendingTransactionId, codigo_2fa: codigo });
            } else {
                await InversionService.confirmar2FA({ inversionId: pendingTransactionId, codigo_2fa: codigo });
            }
            
            const modelType = proyecto.tipo_inversion === 'mensual' ? 'pago' : 'inversion';
            const checkoutRes = await MercadoPagoService.iniciarCheckoutModelo(modelType, pendingTransactionId);
            return checkoutRes.data;
        },
        onSuccess: (data: any) => {
            setError2FA(null);
            if (data.redirectUrl || data.init_point) {
                sessionStorage.setItem('checkout_step', '3');
                sessionStorage.setItem('checkout_proyecto_id', String(proyecto?.id));
            }
        },
        onError: (err: any) => {
            setError2FA(err.response?.data?.message || "Código incorrecto.");
            throw err;
        }
    });

    const handleSignContract = useMutation({
        mutationFn: async (signatureData: any) => {
            // Lógica de firma de contrato
            await new Promise(resolve => setTimeout(resolve, 1000));
            return { success: true };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['misContratos'] });
            showSuccess("Contrato firmado correctamente");
            modales.checkoutWizard.close();
            sessionStorage.removeItem('checkout_step');
            sessionStorage.removeItem('checkout_proyecto_id');
        },
        onError: () => showError('Error al firmar el contrato')
    });

    // --- ACTIONS ---
    const handleTabChange = (_: SyntheticEvent, newValue: number) => setTabValue(newValue);

    /**
     * ✅ ACCIÓN PRINCIPAL CORREGIDA
     * Ahora esta función es la única que redirige al login si no hay sesión.
     */
    const handleMainAction = () => {
        if (!isAuthenticated) {
            // Guardamos la ruta actual para volver después del login
            return navigate(ROUTES.LOGIN, { state: { from: location.pathname } });
        }
        
        if (is2FAMissing) return navigate('/client/MiCuenta/SecuritySettings');
        
        sessionStorage.removeItem('checkout_step');
        setError2FA(null);
        setPendingTransactionId(null);
        modales.checkoutWizard.open();
    };

    const handleVerContratoFirmado = () => {
        if (!misContratos || !proyecto) return;
        const contrato = misContratos.find(c => c.id_proyecto === proyecto.id && c.estado_firma === 'FIRMADO');
        if (contrato) {
            setContratoFirmadoSeleccionado(contrato);
            modales.firmado.open();
        }
    };

    return {
        // Datos
        id,
        user,
        proyecto,
        loadingProyecto,
        tabValue,
        coverImage,
        porcentaje,
        mostrarTabLotes,
        
        // Estados UI
        verificandoPago,
        yaFirmo,
        puedeFirmar,
        is2FAMissing,
        error2FA,
        contratoFirmadoSeleccionado,
        modales,
        setContratoFirmadoSeleccionado,
        
        // Handlers
        setTabValue,
        handleTabChange,
        handleMainAction,
        handleVerContratoFirmado,
        setError2FA,

        // Compatibilidad con Sidebar y componentes hijos
        handleClickFirmar: handleMainAction, 
        handleInversion: {
            isPending: false,
            mutate: handleMainAction
        }, 

        // IDs para el Wizard de pago
        inversionId: proyecto?.tipo_inversion === 'directo' ? pendingTransactionId ?? undefined : undefined,
        pagoId: proyecto?.tipo_inversion === 'mensual' ? pendingTransactionId ?? undefined : undefined,

        wizardCallbacks: {
            onConfirmInvestment: async () => await handleConfirmInvestment.mutateAsync(),
            onSubmit2FA: async (code: string) => await handleSubmit2FA.mutateAsync(code),
            onSignContract: async (signatureData: any) => await handleSignContract.mutateAsync(signatureData)
        },
        isProcessingWizard: handleConfirmInvestment.isPending || handleSubmit2FA.isPending || handleSignContract.isPending
    };
};