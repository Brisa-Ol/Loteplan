import React from 'react';
import { Card, Typography, Divider, Stack, Box, LinearProgress, Alert, Button, Tooltip, alpha, useTheme } from '@mui/material';
import { MonetizationOn, Security, ArrowForward, CheckCircle, GppGood, Description } from '@mui/icons-material';

// Nota: Define una interfaz para el "logic" si quieres ser estricto con TS, 
// o pasa props individuales si prefieres desacoplarlo.
export const ProjectSidebar: React.FC<{ logic: any; proyecto: any }> = ({ logic, proyecto }) => {
  const theme = useTheme();

  return (
    <Card elevation={0} sx={{ 
        p: { xs: 2, sm: 3 }, borderRadius: 3, 
        position: { lg: 'sticky' }, top: { lg: 100 }, 
        border: `1px solid ${theme.palette.divider}`, boxShadow: theme.shadows[2] 
    }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>Resumen de Inversión</Typography>
      <Divider sx={{ my: 2 }} />
      
      <Stack spacing={3}>
        {/* Precio */}
        <Box sx={{ 
            position: 'relative', overflow: 'hidden', bgcolor: 'background.paper', p: 3, borderRadius: 3, 
            border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`, boxShadow: `0 8px 30px ${alpha(theme.palette.primary.main, 0.12)}`
        }}>
            <Box sx={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, bgcolor: alpha(theme.palette.primary.main, 0.08), borderRadius: '50%' }} />
            <Stack direction="row" spacing={1} alignItems="center" color="text.secondary" mb={1}>
                <MonetizationOn color="primary" fontSize="small" />
                <Typography variant="overline" fontWeight={700}>Valor del Proyecto</Typography>
            </Stack>
            <Typography variant="h3" color="primary.main" fontWeight={800} sx={{ fontSize: { xs: '2rem', md: '2.5rem' }, letterSpacing: -1 }}>
                {Number(proyecto.monto_inversion).toLocaleString()}
                <Typography component="span" variant="h6" color="text.secondary" fontWeight={600} ml={1}>{proyecto.moneda}</Typography>
            </Typography>
        </Box>

        {/* Progreso */}
        {proyecto.tipo_inversion === 'mensual' && (
            <Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="caption" fontWeight="bold" color="text.secondary">PROGRESO DE FONDEO</Typography>
                    <Typography variant="caption" fontWeight="bold" color="primary">{logic.porcentaje.toFixed(0)}%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={logic.porcentaje} sx={{ height: 10, borderRadius: 5, bgcolor: alpha(theme.palette.primary.main, 0.1), '& .MuiLinearProgress-bar': { borderRadius: 5 } }} />
            </Box>
        )}

        {/* Alerta 2FA */}
        {logic.is2FAMissing && logic.user && (
            <Alert severity="warning" icon={<Security fontSize="inherit" />} sx={{ borderRadius: 2 }}>
                <Typography variant="body2" fontWeight="bold">Seguridad Requerida</Typography>
                <Button size="small" color="warning" onClick={logic.handleClickFirmar} sx={{ mt: 1, textTransform: 'none', fontWeight: 600 }}>Configurar 2FA ahora</Button>
            </Alert>
        )}

        {/* Botón Principal (Invertir) */}
        {!logic.yaFirmo && !logic.puedeFirmar && (
            <Tooltip title={logic.is2FAMissing && logic.user ? "Activa 2FA para continuar" : ""}>
                <Box>
                    <Button 
                        variant="contained" size="large" fullWidth 
                        disabled={logic.handleInversion.isPending || (logic.is2FAMissing && !!logic.user)}
                        onClick={logic.handleMainAction}
                        endIcon={!logic.handleInversion.isPending && <ArrowForward />}
                        sx={{ py: 1.5, fontSize: '1rem', fontWeight: 700, borderRadius: 2, boxShadow: theme.shadows[4] }}
                    >
                        {logic.handleInversion.isPending ? 'Procesando...' : proyecto.tipo_inversion === 'mensual' ? 'Suscribirme Ahora' : 'Invertir Ahora'}
                    </Button>
                </Box>
            </Tooltip>
        )}

        {/* Botones de Gestión (Firmar/Ver) */}
        {logic.user && (proyecto.tipo_inversion === 'mensual' || proyecto.tipo_inversion === 'directo') && (
            <Stack spacing={2}>
                {logic.yaFirmo ? (
                    <Button variant="contained" color="success" fullWidth startIcon={<CheckCircle />} onClick={logic.handleVerContratoFirmado} sx={{ fontWeight: 700, borderRadius: 2 }}>
                        Ver Contrato Firmado
                    </Button>
                ) : logic.puedeFirmar ? (
                    <Button variant="outlined" color="success" startIcon={<GppGood />} fullWidth onClick={logic.handleClickFirmar} disabled={logic.is2FAMissing} sx={{ borderWidth: 2, fontWeight: 700, borderRadius: 2 }}>
                        Firmar Contrato (Pendiente)
                    </Button>
                ) : (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                        <Typography variant="caption">Realiza el pago inicial para habilitar la firma.</Typography>
                    </Alert>
                )}
                
                {!logic.yaFirmo && (
                    <Button variant="text" fullWidth startIcon={<Description />} onClick={logic.modales.contrato.open} sx={{ color: 'text.secondary', borderRadius: 2 }}>
                        Ver Modelo de Contrato
                    </Button>
                )}
            </Stack>
        )}
      </Stack>
    </Card>
  );
};