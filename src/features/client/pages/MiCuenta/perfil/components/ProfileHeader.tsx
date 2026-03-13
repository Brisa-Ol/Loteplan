// src/pages/client/MiCuenta/Perfil/components/ProfileHeader.tsx

import { VerifiedUser } from '@mui/icons-material';
import { alpha, Avatar, Box, Card, CardContent, Chip, Stack, Typography, useTheme } from '@mui/material';
import React from 'react';

interface Props { user: any; }

const ProfileHeader: React.FC<Props> = ({ user }) => {
    const theme = useTheme();
    return (
        <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, overflow: 'visible', mt: 4, borderRadius: 4 }}>
            <Box sx={{
                height: 140,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                borderRadius: '16px 16px 0 0',
            }} />

            <CardContent sx={{ pt: 0, pb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box sx={{ position: 'relative', mt: -7, mb: 2 }}>
                    <Avatar sx={{
                        width: 120, height: 120,
                        bgcolor: 'background.paper', color: 'primary.main', fontSize: '3rem',
                        border: `4px solid ${theme.palette.background.paper}`,
                        boxShadow: theme.shadows[3],
                    }}>
                        {user?.nombre?.charAt(0).toUpperCase()}
                    </Avatar>

                </Box>

                <Typography variant="h4" fontWeight={800} textAlign="center">
                    {user?.nombre} {user?.apellido}
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom textAlign="center">
                    @{user?.nombre_usuario}
                </Typography>

                <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" justifyContent="center" gap={1}>
                    <Chip
                        label={user?.rol === 'admin' ? 'Administrador' : 'Cliente'}
                        color="primary" size="small" variant="filled" sx={{ fontWeight: 700 }}
                    />
                    {user?.confirmado_email && (
                        <Chip
                            icon={<VerifiedUser sx={{ fontSize: '16px !important' }} />}
                            label="Verificado" color="success" size="small" variant="outlined"
                            sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.success.main, 0.05), borderColor: alpha(theme.palette.success.main, 0.3) }}
                        />
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
};

export default ProfileHeader;