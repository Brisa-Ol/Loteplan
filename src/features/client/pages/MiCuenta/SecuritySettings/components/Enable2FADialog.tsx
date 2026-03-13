// src/pages/client/MiCuenta/components/Enable2FADialog.tsx

import { Close, ContentCopy, GppGood } from '@mui/icons-material';
import {
    Alert, Box, Button, CircularProgress, Dialog, DialogContent, DialogTitle,
    IconButton, Stack, Step, StepLabel, Stepper, TextField, Tooltip, Typography, useTheme
} from '@mui/material';
import React from 'react';
import type { use2FASetup } from '../hooks/use2FASetup';

interface Props { setup: ReturnType<typeof use2FASetup>; }

const Enable2FADialog: React.FC<Props> = ({ setup }) => {
    const theme = useTheme();
    return (
        <Dialog open={setup.isOpen} onClose={setup.close} maxWidth="sm" fullWidth>
            <DialogTitle display="flex" justifyContent="space-between" alignItems="center" sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                Configurar 2FA
                <IconButton onClick={setup.close} size="small"><Close /></IconButton>
            </DialogTitle>

            <DialogContent>
                <Stepper activeStep={setup.activeStep} sx={{ mb: 4, mt: 3 }} alternativeLabel>
                    {['Escanear QR', 'Verificar Código'].map(label => (
                        <Step key={label}><StepLabel>{label}</StepLabel></Step>
                    ))}
                </Stepper>

                {setup.error && <Alert severity="error" sx={{ mb: 3 }}>{setup.error}</Alert>}

                {/* PASO 0: QR */}
                {setup.activeStep === 0 && setup.qrImage && (
                    <Stack spacing={3} alignItems="center">
                        <Typography variant="body2" textAlign="center">
                            Abre <strong>Google Authenticator</strong> en tu celular y selecciona "Escanear código QR".
                        </Typography>

                        <Box p={2} border={`1px solid ${theme.palette.divider}`} borderRadius={2}>
                            <img src={setup.qrImage} alt="QR Code" style={{ width: '100%', maxWidth: 200, display: 'block' }} />
                        </Box>

                        {setup.secret && (
                            <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 2, width: '100%' }}>
                                <Typography variant="caption" color="text.secondary" display="block" mb={1} fontWeight={600}>
                                    ¿No puedes escanear? Usa esta clave:
                                </Typography>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Typography variant="body2" fontFamily="monospace" sx={{ flex: 1, wordBreak: 'break-all', fontWeight: 600 }}>
                                        {setup.secret}
                                    </Typography>
                                    <Tooltip title="Copiar código">
                                        <IconButton onClick={setup.copySecret} size="small" color="primary">
                                            {setup.copiedSecret ? <GppGood color="success" fontSize="small" /> : <ContentCopy fontSize="small" />}
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </Box>
                        )}

                        <Button variant="contained" onClick={() => setup.setActiveStep(1)} fullWidth>
                            Continuar
                        </Button>
                    </Stack>
                )}

                {/* PASO 1: Verificar */}
                {setup.activeStep === 1 && (
                    <Stack spacing={3} mt={2}>
                        <Typography variant="body2" textAlign="center">
                            Ingresa el código de 6 dígitos que aparece en tu aplicación para confirmar la vinculación.
                            <Typography variant="caption" color="text.secondary" display="block">
                                Esto activará la protección inmediatamente.
                            </Typography>
                        </Typography>

                        <TextField
                            fullWidth
                            placeholder="000 000"
                            value={setup.verificationCode}
                            onChange={(e) => setup.setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            inputProps={{ maxLength: 6, style: { textAlign: 'center', letterSpacing: 8, fontSize: '1.5rem', fontWeight: 700 } }}
                        />

                        <Stack direction="row" spacing={2}>
                            <Button variant="outlined" onClick={() => setup.setActiveStep(0)} fullWidth>Atrás</Button>
                            <Button variant="contained" onClick={setup.verify} fullWidth
                                disabled={setup.isLoading || setup.verificationCode.length !== 6}>
                                {setup.isLoading ? <CircularProgress size={24} color="inherit" /> : 'Verificar y Activar'}
                            </Button>
                        </Stack>
                    </Stack>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default Enable2FADialog;