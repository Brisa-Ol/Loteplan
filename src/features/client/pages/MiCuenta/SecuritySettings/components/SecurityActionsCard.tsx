// src/pages/client/MiCuenta/components/SecurityActionsCard.tsx

import { Lock, QrCode2, Smartphone } from '@mui/icons-material';
import {
    Alert, alpha, Avatar, Box, Button, Card, CardContent,
    CircularProgress, Divider, Stack, Typography, useTheme
} from '@mui/material';
import React from 'react';

interface Props {
    is2FAEnabled: boolean;
    isLoading: boolean;
    onEnable: () => void;
    onDisable: () => void;
}

const SecurityActionsCard: React.FC<Props> = ({ is2FAEnabled, isLoading, onEnable, onDisable }) => {
    const theme = useTheme();
    return (
        <Card elevation={0} sx={{ mb: 4, border: `1px solid ${theme.palette.secondary.dark}`, bgcolor: 'background.default', borderRadius: 3 }}>
            <CardContent sx={{ p: 4 }}>
                <Stack direction="row" spacing={2} alignItems="flex-start" mb={3}>
                    <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                        <Smartphone />
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight={700} gutterBottom>Configuración</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {is2FAEnabled
                                ? 'Tu cuenta está protegida. Si necesitas cambiar de dispositivo, deberás desactivarlo primero.'
                                : 'Escanea el código QR con Google Authenticator para vincular tu cuenta.'}
                        </Typography>
                    </Box>
                </Stack>

                <Divider sx={{ my: 3, borderColor: 'secondary.dark' }} />

                {!is2FAEnabled ? (
                    <Button variant="contained" size="large" fullWidth startIcon={<QrCode2 />}
                        onClick={onEnable} disabled={isLoading} sx={{ borderRadius: 2, py: 1.5 }}>
                        {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Configurar Ahora'}
                    </Button>
                ) : (
                    <Box>
                        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                            Para desactivar la verificación, necesitarás confirmar tu contraseña actual y un código 2FA válido.
                        </Alert>
                        <Button variant="outlined" color="error" size="large" fullWidth startIcon={<Lock />}
                            onClick={onDisable} disabled={isLoading} sx={{ borderRadius: 2, py: 1.5 }}>
                            Desactivar Verificación
                        </Button>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default SecurityActionsCard;


// ─────────────────────────────────────────────────────────────────────────────

// src/pages/client/MiCuenta/components/SecurityHelpSection.tsx

import { SupportAgent } from '@mui/icons-material';

export const SecurityHelpSection: React.FC = () => {
    const helpTheme = useTheme();
    return (
        <Box sx={{ textAlign: 'center', p: 3, bgcolor: alpha(helpTheme.palette.info.main, 0.05), borderRadius: 3 }}>
            <Stack direction="row" justifyContent="center" alignItems="center" gap={1} mb={1}>
                <SupportAgent color="info" />
                <Typography variant="subtitle1" fontWeight={700} color="info.main">
                    ¿Perdiste acceso a tu autenticador?
                </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto' }}>
                Si perdiste tu celular o borraste la app por error, no podrás ingresar a tu cuenta automáticamente.
                Por favor, ponte en contacto con un administrador para verificar tu identidad y restablecer el acceso manual.
            </Typography>
        </Box>
    );
};