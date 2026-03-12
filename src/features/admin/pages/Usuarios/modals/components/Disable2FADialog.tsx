// src/features/admin/pages/Usuarios/modals/components/Disable2FADialog.tsx

import { BaseModal, useSnackbar } from '@/shared';
import { Warning as WarningIcon } from '@mui/icons-material';
import { Alert, TextField } from '@mui/material';
import React, { useState } from 'react';

interface Props {
    open: boolean;
    onClose: () => void;
    onConfirm: (justificacion: string) => void;
    isLoading: boolean;
    userName: string;
}

const Disable2FADialog: React.FC<Props> = ({ open, onClose, onConfirm, isLoading, userName }) => {
    const [justificacion, setJustificacion] = useState('');
    const { showError } = useSnackbar();

    const handleConfirm = () => {
        if (justificacion.trim().length < 10) return showError('La justificación debe tener al menos 10 caracteres');
        onConfirm(justificacion);
        setJustificacion('');
    };

    return (
        <BaseModal
            open={open} onClose={onClose}
            title="Confirmar Desactivación 2FA"
            subtitle={`Acción de seguridad para: ${userName}`}
            icon={<WarningIcon />} headerColor="warning"
            confirmText="Confirmar Desactivación" confirmButtonColor="warning"
            onConfirm={handleConfirm} isLoading={isLoading}
            disableConfirm={justificacion.trim().length < 10 || isLoading} maxWidth="sm"
        >
            <Alert severity="warning" variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
                Esta acción reducirá la seguridad de la cuenta. Se requiere justificación obligatoria para auditoría.
            </Alert>
            <TextField
                fullWidth multiline rows={4}
                label="Justificación obligatoria"
                placeholder="Ingrese el motivo por el cual se desactiva el 2FA..."
                value={justificacion}
                onChange={(e) => setJustificacion(e.target.value)}
                disabled={isLoading}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
        </BaseModal>
    );
};

export default Disable2FADialog;