// src/pages/client/MiCuenta/hooks/use2FADisable.ts

import type { ApiError } from '@/core/api/httpService';
import { useAuth } from '@/core/context/AuthContext';
import { useState } from 'react';

export const use2FADisable = (onSuccess: (msg: string) => void) => {
    const { disable2FA } = useAuth();

    const [isOpen, setIsOpen] = useState(false);
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const confirm = async () => {
        if (!password || code.length !== 6) {
            setError('Completa todos los campos correctamente');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            await disable2FA(password, code);
            onSuccess('Verificación en dos pasos desactivada.');
            close();
        } catch (err) {
            setError((err as ApiError).message || 'Error al desactivar 2FA');
        } finally {
            setIsLoading(false);
        }
    };

    const close = () => {
        setIsOpen(false);
        setPassword('');
        setCode('');
        setShowPassword(false);
        setError(null);
    };

    return {
        isOpen, setIsOpen,
        password, setPassword,
        code, setCode,
        showPassword, setShowPassword,
        isLoading, error,
        confirm, close,
    };
};