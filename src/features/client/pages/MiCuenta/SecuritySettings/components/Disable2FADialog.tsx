import {
    ShieldOutlined as ShieldIcon,
    Visibility, VisibilityOff
} from '@mui/icons-material';
import {
    Alert, IconButton, InputAdornment, Stack, TextField, Typography
} from '@mui/material';
import React from 'react';
// Importación adicional necesaria para el Box interno si no estaba
import { Box } from '@mui/material';

import { BaseModal } from '@/shared';
import type { use2FADisable } from '../hooks/use2FADisable';

interface Props {
    disable: ReturnType<typeof use2FADisable>;
}

const Disable2FADialog: React.FC<Props> = ({ disable }) => {
    return (
        <BaseModal
            open={disable.isOpen}
            onClose={disable.close}
            title="Desactivar 2FA"
            subtitle="Confirmación de seguridad requerida"
            icon={<ShieldIcon />}
            headerColor="error" // Usamos error porque es una acción destructiva/sensible
            confirmText="Desactivar Seguridad"
            confirmButtonColor="error"
            onConfirm={disable.confirm}
            isLoading={disable.isLoading}
            disableConfirm={!disable.password || disable.code.length !== 6}
            maxWidth="xs"
        >
            <Stack spacing={3}>
                <Box>
                    <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                        Al desactivar la verificación en dos pasos, tu cuenta quedará menos protegida ante accesos no autorizados.
                    </Alert>

                    {disable.error && (
                        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                            {disable.error}
                        </Alert>
                    )}
                </Box>

                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    Por favor, confirma tu identidad para continuar:
                </Typography>

                <TextField
                    fullWidth
                    label="Contraseña Actual"
                    type={disable.showPassword ? 'text' : 'password'}
                    value={disable.password}
                    onChange={(e) => disable.setPassword(e.target.value)}
                    placeholder="Tu contraseña de ingreso"
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={() => disable.setShowPassword(!disable.showPassword)}
                                    edge="end"
                                    size="small"
                                >
                                    {disable.showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        )
                    }}
                />

                <TextField
                    fullWidth
                    label="Código 2FA"
                    placeholder="000 000"
                    value={disable.code}
                    onChange={(e) => disable.setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputProps={{
                        maxLength: 6,
                        style: {
                            textAlign: 'center',
                            letterSpacing: 8,
                            fontWeight: 800,
                            fontSize: '1.2rem'
                        }
                    }}
                    helperText="Introduce el código de 6 dígitos de tu app de autenticación"
                />
            </Stack>
        </BaseModal>
    );
};



export default Disable2FADialog;