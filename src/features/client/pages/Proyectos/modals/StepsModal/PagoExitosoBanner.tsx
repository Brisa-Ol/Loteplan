import { CheckCircle } from "@mui/icons-material";
import { alpha, Box, Typography, useTheme } from "@mui/material";
import type { FC } from "react"

interface IPagoExitosoBannerProps {
    tipo: 'suscripcion' | 'inversion';
}

export const PagoExitosoBanner: FC<IPagoExitosoBannerProps> = ({ tipo }) => {
    const theme = useTheme();
  return (
    <>
        <Box sx={{
            p: 2.5, borderRadius: 2,
            bgcolor: alpha(theme.palette.success.main, 0.08),
            border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
            display: 'flex', alignItems: 'center', gap: 2,
            }}>
            <Box sx={{
                bgcolor: 'success.main', borderRadius: '50%',
                width: 48, height: 48, minWidth: 48,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 4px 14px ${alpha(theme.palette.success.main, 0.45)}`,
            }}>
                <CheckCircle sx={{ color: 'white', fontSize: 28 }} />
            </Box>
            <Box>
                <Typography variant="subtitle2" fontWeight={800} color="success.dark">
                ¡Pago acreditado exitosamente!
                </Typography>
                <Typography variant="caption" color="text.secondary">
                Tu {tipo === 'suscripcion' ? 'suscripción' : 'inversión'} fue procesada.
                Completá la firma del contrato para finalizar.
                </Typography>
            </Box>
            </Box>
    </>
)
}

