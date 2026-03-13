// src/pages/client/MiCuenta/components/SecurityInfoCard.tsx

import { Info, Payment, Security, Timer } from '@mui/icons-material';
import {
    Alert, Box, Card, CardContent, Divider, List, ListItem,
    ListItemIcon, ListItemText, Stack, Typography, useTheme
} from '@mui/material';
import React from 'react';

const SecurityInfoCard: React.FC = () => {
    const theme = useTheme();
    return (
        <Card elevation={0} sx={{ mb: 4, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 6 }}>

                    {/* COLUMNA IZQUIERDA: Cómo funciona */}
                    <Box>
                        <Box display="flex" alignItems="center" gap={1} mb={3}>
                            <Info color="primary" />
                            <Typography variant="h6" fontWeight={700}>¿Cómo funciona?</Typography>
                        </Box>
                        <Stack spacing={3}>
                            <Box>
                                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                                    1. Descarga "Google Authenticator" en tu celular
                                </Typography>
                                <Box
                                    component="img"
                                    src="https://play-lh.googleusercontent.com/NntMALIH4odanPPYSqUOXsX8zy_giiK2olJiqkcxwFIOOspVrhMi9Miv6LYdRnKIg-3R=w480-h960-rw"
                                    alt="Google Authenticator Logo"
                                    sx={{ width: 48, height: 48, mb: 1 }}
                                />
                                <Typography variant="subtitle2" fontWeight={400}>
                                    Disponible en Google Play y App Store
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" fontWeight={700}>2. Inicia sesión</Typography>
                                <Typography variant="body2" color="text.secondary">Entra a la app con tu cuenta de Google.</Typography>
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" fontWeight={700}>3. Vincula tu cuenta</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Escanea el código QR que te brindamos o escribe el código manualmente. ¡Listo, ya protegiste tu cuenta!
                                </Typography>
                            </Box>
                            <Alert severity="warning" sx={{ borderRadius: 2 }}>
                                <Typography variant="caption" fontWeight={700} display="block">4. IMPORTANTE:</Typography>
                                <Typography variant="caption">No borres el token de la app, lo vas a necesitar para operar en la página.</Typography>
                            </Alert>
                        </Stack>
                    </Box>

                    {/* COLUMNA DERECHA: Reglas */}
                    <Box>
                        <Box display="flex" alignItems="center" gap={1} mb={3}>
                            <Security color="primary" />
                            <Typography variant="h6" fontWeight={700}>Reglas de Seguridad</Typography>
                        </Box>
                        <List dense sx={{ bgcolor: 'background.default', borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
                            <ListItem sx={{ py: 2 }}>
                                <ListItemIcon><Timer color="action" /></ListItemIcon>
                                <ListItemText
                                    primary="Inicio de Sesión"
                                    secondary="Se solicitará el token la primera vez y luego cada 15 días en este dispositivo."
                                    primaryTypographyProps={{ fontWeight: 700, fontSize: '0.9rem' }}
                                />
                            </ListItem>
                            <Divider variant="middle" component="li" />
                            <ListItem sx={{ py: 2 }}>
                                <ListItemIcon><Payment color="action" /></ListItemIcon>
                                <ListItemText
                                    primary="Pagos y Retiros"
                                    secondary="Por seguridad, siempre pediremos el token al realizar transacciones monetarias."
                                    primaryTypographyProps={{ fontWeight: 700, fontSize: '0.9rem' }}
                                />
                            </ListItem>
                        </List>
                    </Box>

                </Box>
            </CardContent>
        </Card>
    );
};

export default SecurityInfoCard;