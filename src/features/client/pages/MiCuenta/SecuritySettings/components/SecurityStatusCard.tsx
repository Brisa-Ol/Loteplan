// src/pages/client/MiCuenta/components/SecurityStatusCard.tsx

import { GppGood, GppMaybe } from '@mui/icons-material';
import { alpha, Avatar, Box, Card, CardContent, Chip, Typography, useTheme } from '@mui/material';
import React from 'react';

interface Props { is2FAEnabled: boolean; }

const SecurityStatusCard: React.FC<Props> = ({ is2FAEnabled }) => {
    const theme = useTheme();
    const color = is2FAEnabled ? 'success' : 'warning';
    const colorMain = theme.palette[color].main;

    return (
        <Card elevation={0} sx={{ mb: 4, border: '1px solid', borderColor: `${color}.main`, bgcolor: alpha(colorMain, 0.05), borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
                    <Box display="flex" alignItems="center" gap={3}>
                        <Avatar sx={{ width: 56, height: 56, bgcolor: alpha(colorMain, 0.2), color: `${color}.main` }}>
                            {is2FAEnabled ? <GppGood fontSize="large" /> : <GppMaybe fontSize="large" />}
                        </Avatar>
                        <Box>
                            <Typography variant="h6" fontWeight={700} color={`${color}.main`}>
                                {is2FAEnabled ? 'Protección Activada' : 'Protección Desactivada'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {is2FAEnabled
                                    ? 'Tu cuenta cuenta con una capa extra de seguridad.'
                                    : 'Activa el 2FA para proteger tus inversiones.'}
                            </Typography>
                        </Box>
                    </Box>
                    <Chip label={is2FAEnabled ? 'ACTIVO' : 'INACTIVO'} color={color} sx={{ fontWeight: 700 }} />
                </Box>
            </CardContent>
        </Card>
    );
};

export default SecurityStatusCard;