// src/pages/client/MiCuenta/Inversiones/hooks/useInversionPayment.ts
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import MercadoPagoService from '@/core/api/services/pagoMercado.service';
import InversionService from '@/core/api/services/inversion.service';

import type { ApiError } from '@/core/api/httpService';
import useSnackbar from '@/shared/hooks/useSnackbar';
import { useModal } from '@/shared/hooks/useModal';

export const useInversionPayment = () => {
    const navigate = useNavigate();
    const { showInfo } = useSnackbar();
    const twoFaModal = useModal();
    
    const [selectedInversionId, setSelectedInversionId] = useState<number | null>(null);
    const [twoFAError, setTwoFAError] = useState<string | null>(null);

    // 1. Iniciar Pago
    const payMutation = useMutation({
        mutationFn: async (inversionId: number) => {
            setSelectedInversionId(inversionId);
            setTwoFAError(null);
            return await MercadoPagoService.iniciarCheckoutModelo('inversion', inversionId);
        },
        onSuccess: (response) => {
            const data = response.data;
            // Lógica de negocio encapsulada aquí
            if (response.status === 202 || data.is2FARequired) {
                twoFaModal.open();
            } else {
                MercadoPagoService.handleRedirect(data);
            }
        },
        onError: (error: unknown) => {
            const err = error as ApiError;
            if (err.type === 'SECURITY_ACTION') {
                showInfo("⚠️ Para pagar debes configurar tu 2FA primero.");
                navigate('/client/MiCuenta/SecuritySettings');
            }
        }
    });

    // 2. Confirmar 2FA
    const confirmar2FAMutation = useMutation({
        mutationFn: async (codigo: string) => {
            if (!selectedInversionId) throw new Error("ID de inversión perdido.");
            return await InversionService.confirmar2FA({ 
                inversionId: selectedInversionId, 
                codigo_2fa: codigo 
            });
        },
        onSuccess: (response) => {
            twoFaModal.close();
            MercadoPagoService.handleRedirect(response.data);
        },
        onError: (err: unknown) => {
            const apiError = err as ApiError;
            setTwoFAError(apiError.message || "Código inválido.");
        }
    });

    return {
        // Estado
        selectedInversionId,
        twoFAError,
        setTwoFAError,
        // Modal 2FA
        is2FAOpen: twoFaModal.isOpen,
        close2FA: twoFaModal.close,
        // Acciones
        iniciarPago: payMutation.mutate,
        isIniciandoPago: payMutation.isPending,
        confirmar2FA: confirmar2FAMutation.mutate,
        isConfirmando2FA: confirmar2FAMutation.isPending
    };
};