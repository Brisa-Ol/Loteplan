// src/pages/client/MiCuenta/hooks/use2FASetup.ts

import { useAuth } from '@/core/context/AuthContext';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

export const use2FASetup = (onSuccess: (msg: string) => void) => {
    const { generate2FASecret, enable2FA } = useAuth();

    const [isOpen, setIsOpen] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [secret, setSecret] = useState<string | null>(null);
    const [otpAuthUrl, setOtpAuthUrl] = useState<string | null>(null);
    const [qrImage, setQrImage] = useState<string | null>(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copiedSecret, setCopiedSecret] = useState(false);

    useEffect(() => {
        if (!otpAuthUrl) return;
        QRCode.toDataURL(otpAuthUrl)
            .then(setQrImage)
            .catch(() => setError('Error generando imagen QR'));
    }, [otpAuthUrl]);

    const open = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await generate2FASecret();
            setSecret(data.secret);
            setOtpAuthUrl(data.otpauthUrl);
            setIsOpen(true);
            setActiveStep(0);
        } catch {
            setError('Error generando secreto 2FA. Intenta nuevamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const verify = async () => {
        if (verificationCode.length !== 6) return;
        setIsLoading(true);
        try {
            await enable2FA(verificationCode);
            onSuccess('¡Autenticación de dos factores activada exitosamente!');
            close();
        } catch {
            setError('Código incorrecto. Verifica e intenta de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    const close = () => {
        setIsOpen(false);
        setActiveStep(0);
        setVerificationCode('');
        setQrImage(null);
        setSecret(null);
        setOtpAuthUrl(null);
        setError(null);
    };

    const copySecret = () => {
        if (!secret) return;
        navigator.clipboard.writeText(secret);
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
    };

    return {
        isOpen, activeStep, setActiveStep,
        qrImage, secret, verificationCode, setVerificationCode,
        isLoading, error, copiedSecret,
        open, verify, close, copySecret,
    };
};