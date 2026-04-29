import { Lock } from "@mui/icons-material";
import { Alert, Avatar, Box, CircularProgress, Stack, TextField, Typography } from "@mui/material";
import type { FC } from "react";

interface IStepSeguridadProps {
    codigo2FA: string;
    setCodigo2FA: (v: string) => void;
    location: any;
    isProcessing: boolean;
    error: any;
}

export const StepSeguridad: FC<IStepSeguridadProps> = ({codigo2FA, setCodigo2FA, location, isProcessing, error}) => {

    return (
    <>
        <Stack spacing={4} alignItems="center" py={2} maxWidth="sm" mx="auto">
            <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}><Lock /></Avatar>
            <Box textAlign="center">
            <Typography variant="h5" fontWeight={700}>Verificación 2FA</Typography>
            <Typography variant="body2" color="text.secondary">Ingresa el código de Google Authenticator.</Typography>
            </Box>
            {!location && 
                <>
                    
                    <Stack alignItems="center" spacing={1}>
                        <Alert severity="warning" sx={{ width: '100%' }}>Acceso a Ubicación Requerido</Alert>
                        <CircularProgress size={28} />
                        <Typography variant="caption" color="text.secondary">
                            Obteniendo ubicación...
                        </Typography>
                    </Stack>
    
                </>
            }
            <TextField
            autoFocus value={codigo2FA}
            onChange={(e) => setCodigo2FA(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000 000" disabled={isProcessing || !location}
            error={!!error} helperText={error} fullWidth inputProps={{ maxLength: 6 }} sx={{ maxWidth: 300 }}
            />
        </Stack>
    </>
  )
}

StepSeguridad.displayName = 'StepSeguridad';