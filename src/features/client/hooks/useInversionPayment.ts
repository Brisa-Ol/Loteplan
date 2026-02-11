// src/pages/client/MiCuenta/Inversiones/hooks/useInversionPayment.ts
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import InversionService from '@/core/api/services/inversion.service';
import MercadoPagoService from '@/core/api/services/pagoMercado.service';

import type { ApiError } from '@/core/api/httpService';
import { useModal } from '@/shared/hooks/useModal';
import useSnackbar from '@/shared/hooks/useSnackbar';

export const useInversionPayment = () => {
    const navigate = useNavigate();
    const { showInfo, showError } = useSnackbar();
    const twoFaModal = useModal();

    const [selectedInversionId, setSelectedInversionId] = useState<number | null>(null);
    const [twoFAError, setTwoFAError] = useState<string | null>(null);

    // 1. Iniciar Flujo de Pago
    const payMutation = useMutation({
        mutationFn: async (inversionId: number) => {
            setSelectedInversionId(inversionId);
            setTwoFAError(null);
            // ✅ CORRECCIÓN: Usamos el endpoint específico de inversión que maneja la lógica de negocio
            return await InversionService.iniciarPago(inversionId);
        },
        onSuccess: (response) => {
            const data = response.data;

            // Manejo de 2FA (Código 202 Accepted)
            if (response.status === 202 || (data as any).is2FARequired) {
                twoFaModal.open();
            } else {
                // Redirección directa a Mercado Pago si no requiere 2FA
                MercadoPagoService.handleRedirect(data as any);
            }
        },
        onError: (error: unknown) => {
            const err = error as ApiError;

            // Caso: El usuario tiene 2FA activo pero no lo ha configurado/validado en esta sesión
            if (err.type === 'SECURITY_ACTION' || err.status === 403) {
                showInfo("⚠️ Acción protegida. Verifica tu configuración de seguridad.");
                navigate('/client/MiCuenta/SecuritySettings');
            } else {
                showError(err.message || "No se pudo iniciar el proceso de pago.");
            }
        }
    });

    // 2. Confirmar con código 2FA
    const confirmar2FAMutation = useMutation({
        mutationFn: async (codigo: string) => {
            if (!selectedInversionId) throw new Error("Referencia de inversión perdida.");
            return await InversionService.confirmar2FA({
                inversionId: selectedInversionId,
                codigo_2fa: codigo
            });
        },
        onSuccess: (response) => {
            twoFaModal.close();
            // Una vez validado el 2FA, el backend devuelve la URL de Mercado Pago
            MercadoPagoService.handleRedirect(response.data as any);
        },
        onError: (err: unknown) => {
            const apiError = err as ApiError;
            setTwoFAError(apiError.message || "Código de seguridad incorrecto.");
        }
    });

    return {
        // Estado
        selectedInversionId,
        twoFAError,
        setTwoFAError,
        // Modal 2FA (Controladores para el componente TwoFactorAuthModal)
        is2FAOpen: twoFaModal.isOpen,
        close2FA: () => {
            twoFaModal.close();
            setTwoFAError(null);
        },
        // Acciones expuestas a la UI
        iniciarPago: payMutation.mutate,
        isIniciandoPago: payMutation.isPending,
        confirmar2FA: confirmar2FAMutation.mutate,
        isConfirmando2FA: confirmar2FAMutation.isPending
    };
};