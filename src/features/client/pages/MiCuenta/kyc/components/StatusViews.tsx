import { AccountBalance, CheckCircle, Gavel, HourglassEmpty, Info, Security, VerifiedUser } from '@mui/icons-material';
import { Avatar, Box, Button, Card, CardContent, List, ListItem, ListItemIcon, ListItemText, Stack, Typography, alpha, useTheme } from '@mui/material';
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
                    <Stack spacing={2}>
                        <Box display="flex" alignItems="center" gap={1}><Info color="primary" /><Typography variant="h6" fontWeight={700}>¿Qué es KYC?</Typography></Box>
                        <Typography variant="body2" color="text.secondary">Proceso obligatorio para seguridad y cumplimiento legal.</Typography>
                        <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
                            <List dense>
                                <ListItem disablePadding><ListItemIcon><Security color="success" fontSize="small" /></ListItemIcon><ListItemText primary="Seguridad" /></ListItem>
                                <ListItem disablePadding><ListItemIcon><Gavel color="warning" fontSize="small" /></ListItemIcon><ListItemText primary="Legalidad" /></ListItem>
                            </List>
                        </Box>
                    </Stack>
                    <Box>
                        <Box display="flex" alignItems="center" gap={1} mb={2}><CheckCircle color="primary" /><Typography variant="h6" fontWeight={700}>Proceso</Typography></Box>
                        <List dense sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                            {['Datos Personales', 'Documentación', 'Selfie'].map((step, i) => (
                                <ListItem key={i}><ListItemIcon><Typography variant="h6" color="primary">{i + 1}</Typography></ListItemIcon><ListItemText primary={step} /></ListItem>
                            ))}
                        </List>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

