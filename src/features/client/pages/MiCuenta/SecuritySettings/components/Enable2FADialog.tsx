// src/pages/client/MiCuenta/components/Enable2FADialog.tsx

import { ContentCopy, GppGood, QrCodeScanner as QrIcon } from '@mui/icons-material';
import {
    Alert, Box, Button, CircularProgress,
    IconButton, Stack, Step, StepLabel, Stepper, TextField, Tooltip, Typography, useTheme
} from '@mui/material';
import React from 'react';
import { BaseModal } from '@/shared'; // Asegúrate de importar BaseModal desde su ruta correcta
import type { use2FASetup } from '../hooks/use2FASetup';

interface Props { setup: ReturnType<typeof use2FASetup>; }

const Enable2FADialog: React.FC<Props> = ({ setup }) => {
    const theme = useTheme();

    return (
        <BaseModal
            open={setup.isOpen}
            onClose={setup.close}
            maxWidth="sm"
            title="Configurar Autenticación 2FA"
            subtitle="Protege tu cuenta con verificación de dos pasos"
            icon={<QrIcon />}
            headerColor="primary"
            disableClose={setup.isLoading}
            // En este modal la lógica de los botones es muy específica (cambia según el paso),
            // así que inyectamos los botones directamente en customActions.
            customActions={
                <Stack direction="row" spacing={2} width="100%" justifyContent="flex-end">
                    <Button
                        variant="text"
                        color="inherit"
                        onClick={setup.activeStep === 1 ? () => setup.setActiveStep(0) : setup.close}
                        disabled={setup.isLoading}
                        sx={{ fontWeight: 700, color: 'text.secondary' }}
                    >
                        {setup.activeStep === 1 ? 'Atrás' : 'Cancelar'}
                    </Button>

                    {setup.activeStep === 0 ? (
                        <Button
                            variant="contained"
                            onClick={() => setup.setActiveStep(1)}
                            sx={{ fontWeight: 800, px: 4, borderRadius: 2 }}
                        >
                            Continuar
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={setup.verify}
                            disabled={setup.isLoading || setup.verificationCode.length !== 6}
                            sx={{
                                fontWeight: 800,
                                px: 4,
                                borderRadius: 2,
                                boxShadow: `0 8px 16px ${theme.palette.primary.main}40`, // Sombra suave naranja
                            }}
                        >
                            {setup.isLoading ? <CircularProgress size={20} color="inherit" /> : 'Verificar y Activar'}
                        </Button>
                    )}
                </Stack>
            }
        >
            <Stepper activeStep={setup.activeStep} sx={{ mb: 4, mt: 1 }} alternativeLabel>
                {['Escanear QR', 'Verificar Código'].map(label => (
                    <Step key={label}><StepLabel>{label}</StepLabel></Step>
                ))}
            </Stepper>

            {setup.error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{setup.error}</Alert>}

            {/* PASO 0: QR */}
            {setup.activeStep === 0 && setup.qrImage && (
                <Stack spacing={3} alignItems="center">
                    <Typography variant="body2" textAlign="center">
                        Abre <strong>Google Authenticator</strong> en tu celular y selecciona "Escanear código QR".
                    </Typography>

                    <Box p={2} border={`1px solid ${theme.palette.divider}`} borderRadius={3} bgcolor="background.paper">
                        <img src={setup.qrImage} alt="QR Code" style={{ width: '100%', maxWidth: 200, display: 'block' }} />
                    </Box>

                    {setup.secret && (
                        <Box sx={{ p: 2, bgcolor: theme.palette.secondary.light, borderRadius: 2, width: '100%', border: `1px solid ${theme.palette.secondary.main}` }}>
                            <Typography variant="overline" color="text.secondary" display="block" mb={1}>
                                ¿No puedes escanear? Usa esta clave:
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="body1" fontFamily="monospace" sx={{ flex: 1, wordBreak: 'break-all', fontWeight: 600 }}>
                                    {setup.secret}
                                </Typography>
                                <Tooltip title="Copiar código">
                                    <IconButton onClick={setup.copySecret} size="small" color="primary" sx={{ bgcolor: theme.palette.background.default }}>
                                        {setup.copiedSecret ? <GppGood color="success" fontSize="small" /> : <ContentCopy fontSize="small" />}
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Box>
                    )}
                </Stack>
            )}

            {/* PASO 1: Verificar */}
            {setup.activeStep === 1 && (
                <Stack spacing={3} mt={1} alignItems="center">
                    <Typography variant="body2" textAlign="center">
                        Ingresa el código de 6 dígitos que aparece en tu aplicación para confirmar la vinculación.
                    </Typography>

                    <TextField
                        fullWidth
                        placeholder="000 000"
                        value={setup.verificationCode}
                        onChange={(e) => setup.setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        sx={{
                            maxWidth: 300,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 3,
                            }
                        }}
                        inputProps={{
                            maxLength: 6,
                            style: {
                                textAlign: 'center',
                                letterSpacing: 12,
                                fontSize: '2rem',
                                fontWeight: 800,
                                padding: '16px 14px'
                            }
                        }}
                    />
                    <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
                        Esto activará la protección inmediatamente.
                    </Typography>
                </Stack>
            )}
        </BaseModal>
    );
};

export default Enable2FADialog;