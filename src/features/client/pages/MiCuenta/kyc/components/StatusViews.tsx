import { AccountBalance, CheckCircle, Gavel, HourglassEmpty, Info, Security, VerifiedUser } from '@mui/icons-material';
import { Avatar, Box, Button, Card, CardContent, Divider, List, ListItem, ListItemIcon, ListItemText, Stack, Typography, alpha, useTheme } from '@mui/material';
import React from 'react';
export const ApprovedView = () => {
    const theme = useTheme();
    return (
        <Card elevation={0} sx={{ p: 6, textAlign: 'center', bgcolor: alpha(theme.palette.success.main, 0.05), border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`, borderRadius: 4 }}>
            <Avatar sx={{ width: 96, height: 96, mx: 'auto', mb: 3, bgcolor: alpha(theme.palette.success.main, 0.15), color: 'success.main' }}>
                <VerifiedUser sx={{ fontSize: 48 }} />
            </Avatar>
            <Typography variant="h3" fontWeight="bold" color="success.dark">¡Identidad Verificada!</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>Tu cuenta está operativa al 100%.</Typography>
            <Button variant="contained" color="success" size="large" sx={{ mt: 4, borderRadius: 2 }} onClick={() => window.location.href = '/client/dashboard'} startIcon={<AccountBalance />}>
                Ir al Dashboard
            </Button>
        </Card>
    );
};

export const PendingView = () => {
    const theme = useTheme();
    return (
        <Card elevation={0} sx={{ p: 6, textAlign: 'center', bgcolor: alpha(theme.palette.warning.main, 0.05), border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`, borderRadius: 4 }}>
            <Avatar sx={{ width: 96, height: 96, mx: 'auto', mb: 3, bgcolor: alpha(theme.palette.warning.main, 0.15), color: 'warning.main' }}>
                <HourglassEmpty sx={{ fontSize: 48 }} />
            </Avatar>
            <Typography variant="h3" fontWeight="bold" color="warning.dark">Verificación en Proceso</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>Tus documentos están siendo analizados por nuestro equipo.</Typography>
        </Card>
    );
};

export const KycInfoCard = () => {
    const theme = useTheme();
    return (
       <Card elevation={0} sx={{ mb: 4, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
    <CardContent sx={{ p: 4 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
            
            {/* LADO IZQUIERDO: ¿Qué es KYC? */}
            <Stack spacing={2}>
                <Box display="flex" alignItems="center" gap={1}>
                    <Info color="primary" />
                    <Typography variant="h6" fontWeight={700}>
                        ¿Qué es KYC y para qué sirve?
                    </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                    KYC significa <strong>"Conoce a tu Cliente"</strong>. Es un proceso estándar y obligatorio que utilizamos para verificar tu identidad real antes de que comiences a operar.
                </Typography>

                <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
                    <List dense disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <ListItem disablePadding alignItems="flex-start">
                            <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                                <Security color="success" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText 
                                primary="Protección de tu cuenta" 
                                secondary="Garantizamos que nadie más pueda suplantar tu identidad."
                                primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                                secondaryTypographyProps={{ variant: 'caption' }}
                            />
                        </ListItem>
                        
                        <ListItem disablePadding alignItems="flex-start">
                            <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                                <VerifiedUser color="info" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText 
                                primary="Prevención de fraudes" 
                                secondary="Mantenemos una plataforma segura y transparente para la comunidad."
                                primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                                secondaryTypographyProps={{ variant: 'caption' }}
                            />
                        </ListItem>

                        <ListItem disablePadding alignItems="flex-start">
                            <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                                <Gavel color="warning" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText 
                                primary="Cumplimiento legal" 
                                secondary="Operamos bajo las estrictas normativas financieras vigentes."
                                primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                                secondaryTypographyProps={{ variant: 'caption' }}
                            />
                        </ListItem>
                    </List>
                </Box>
            </Stack>

            {/* LADO DERECHO: Proceso */}
            <Stack spacing={2}>
                <Box display="flex" alignItems="center" gap={1}>
                    <CheckCircle color="primary" />
                    <Typography variant="h6" fontWeight={700}>
                        Pasos a seguir
                    </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary">
                    El proceso de verificación es rápido, seguro y te tomará menos de 5 minutos.
                </Typography>

                <Box sx={{ p: 1, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                    <List dense disablePadding>
                        {[
                            { title: 'Datos Personales', desc: 'Ingresa tu información básica.' },
                            { title: 'Documentación', desc: 'Sube tu documento y una selfie.' },
                            { title: 'Confirmación', desc: 'Revisa y envía tu solicitud.' }
                        ].map((step, i, arr) => (
                            <React.Fragment key={i}>
                                <ListItem sx={{ py: 1.5 }}>
                                    <ListItemIcon sx={{ minWidth: 46 }}>
                                        <Avatar 
                                            sx={{ 
                                                width: 32, 
                                                height: 32, 
                                                bgcolor: alpha(theme.palette.primary.main, 0.1), 
                                                color: 'primary.main',
                                                fontSize: '0.875rem',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            {i + 1}
                                        </Avatar>
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary={step.title}
                                        secondary={step.desc}
                                        primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                                        secondaryTypographyProps={{ variant: 'caption' }}
                                    />
                                </ListItem>
                                {/* Añade un divisor entre los elementos, excepto en el último */}
                                {i < arr.length - 1 && <Divider component="li" sx={{ mx: 2 }} />}
                            </React.Fragment>
                        ))}
                    </List>
                </Box>
            </Stack>

        </Box>
    </CardContent>
</Card>
    );
};

