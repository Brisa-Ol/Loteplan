
import { CheckCircle, Schedule, ErrorOutline, Refresh, HelpOutline } from '@mui/icons-material';
import type { ChipProps } from 'node_modules/@mui/material/esm/Chip/Chip';
import type { ReactNode } from 'react';


type InversionStatus = 'pagado' | 'pendiente' | 'fallido' | 'reembolsado' | string;

interface StatusConfig {
    label: string;
    color: ChipProps['color'];
    icon: ReactNode;
}

export const getStatusConfig = (estado: InversionStatus): StatusConfig => {
    const configs: Record<string, StatusConfig> = {
        pagado: { label: 'Pagado', color: 'success', icon: <CheckCircle fontSize="small" /> },
        pendiente: { label: 'Pendiente', color: 'warning', icon: <Schedule fontSize="small" /> },
        fallido: { label: 'Fallido', color: 'error', icon: <ErrorOutline fontSize="small" /> },
        reembolsado: { label: 'Reembolsado', color: 'info', icon: <Refresh fontSize="small" /> },
    };

    return configs[estado] || { 
        label: estado, 
        color: 'default', 
        icon: <HelpOutline fontSize="small" /> 
    };
};