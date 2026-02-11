// src/features/client/utils/inversionStatus.ts

import {
    AccountBalanceWallet,
    CheckCircle,
    ErrorOutline,
    HelpOutline, HourglassEmpty,
    Refresh,
    Schedule
} from '@mui/icons-material';

export const getStatusConfig = (estado: string) => {
    const configs: Record<string, any> = {
        // Estados de Éxito
        pagado: { label: 'Pagado', color: 'success', icon: <CheckCircle fontSize="small" /> },
        cubierto_por_puja: { label: 'Cubierto (Puja)', color: 'success', icon: <AccountBalanceWallet fontSize="small" /> },

        // Estados de Alerta / Pendientes
        pendiente: { label: 'Pendiente', color: 'info', icon: <Schedule fontSize="small" /> },
        en_proceso: { label: 'En Proceso', color: 'warning', icon: <HourglassEmpty fontSize="small" /> },

        // Estados de Error / Peligro
        vencido: { label: 'Vencido', color: 'error', icon: <ErrorOutline fontSize="small" /> },
        fallido: { label: 'Fallido', color: 'error', icon: <ErrorOutline fontSize="small" /> },
        expirado: { label: 'Expirado', color: 'error', icon: <ErrorOutline fontSize="small" /> },

        // Otros
        reembolsado: { label: 'Reembolsado', color: 'info', icon: <Refresh fontSize="small" /> },
    };

    return configs[estado] || {
        label: estado,
        color: 'default',
        icon: <HelpOutline fontSize="small" />
    };
};