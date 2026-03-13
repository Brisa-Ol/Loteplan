// src/pages/client/MiCuenta/components/Disable2FADialog.tsx

import { Close, Visibility, VisibilityOff } from '@mui/icons-material';
import {
    Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
    IconButton, InputAdornment, Stack, TextField, useTheme
} from '@mui/material';
import React from 'react';
import type { use2FADisable } from '../hooks/use2FADisable';

interface Props { disable: ReturnType<typeof use2FADisable>; }

const Disable2FADialog: React.FC<Props> = ({ disable }) => {
    const theme = useTheme();
    return (
        <Dialog open={disable.isOpen} onClose={disable.close} maxWidth="xs" fullWidth>
            <DialogTitle display="flex" justifyContent="space-between" alignItems="center" sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                Desactivar 2FA
                <IconButton onClick={disable.close} size="small"><Close /></IconButton>
            </DialogTitle>

            <DialogContent sx={{ mt: 2 }}>
                <Alert severity="warning" sx={{ mb: 3 }}>Tu cuenta quedará menos protegida.</Alert>
                {disable.error && <Alert severity="error" sx={{ mb: 2 }}>{disable.error}</Alert>}

                <Stack spacing={2}>
                    <TextField
                        fullWidth label="Contraseña Actual"
                        type={disable.showPassword ? 'text' : 'password'}
                        value={disable.password}
                        onChange={(e) => disable.setPassword(e.target.value)}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => disable.setShowPassword(!disable.showPassword)} edge="end">
                                        {disable.showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                    <TextField
                        fullWidth label="Código 2FA" placeholder="000000"
                        value={disable.code}
                        onChange={(e) => disable.setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        inputProps={{ maxLength: 6, style: { textAlign: 'center', letterSpacing: 4, fontWeight: 600 } }}
                    />
                </Stack>
            </DialogContent>

            <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Button onClick={disable.close} color="inherit">Cancelar</Button>
                <Button onClick={disable.confirm} color="error" variant="contained"
                    disabled={disable.isLoading || !disable.password || disable.code.length !== 6}>
                    {disable.isLoading ? <CircularProgress size={20} color="inherit" /> : 'Confirmar Desactivación'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default Disable2FADialog;