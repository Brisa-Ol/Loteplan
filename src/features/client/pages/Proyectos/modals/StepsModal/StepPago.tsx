import { CheckCircle } from "@mui/icons-material";
import { Alert, Button, CircularProgress, Stack, Typography } from "@mui/material";
import type { FC } from "react";
import styles from '../CheckoutWizardModal/CheckoutWizardModal.module.css';

interface IStepPagoProps {
    paymentStatus: string;
    onRetry: () => void;
}

export const StepPago: FC<IStepPagoProps> = ({ paymentStatus, onRetry }) => {
return (
    <>
        <Stack alignItems="center" justifyContent="center" height="100%" minHeight="40vh" spacing={4}>
            {paymentStatus === "success" && <CheckCircle sx={{ fontSize: 60, color: 'success.main' }} />}
            {paymentStatus === "processing" && <CircularProgress size={80} />}
            {paymentStatus === "failed" && <Alert severity="error">El pago fue rechazado. Intenta nuevamente.</Alert>}
            <Typography variant="h5" fontWeight={700}>
            {paymentStatus === "success" && "¡Pago Acreditado!"}
            {paymentStatus === "processing" && "Procesando pago..."}
            {paymentStatus === "failed" && "Pago rechazado"}
            </Typography>
            {paymentStatus === "failed" && <Button className={styles.retryButton} onClick={onRetry}>Intentar Nuevamente</Button>}
        </Stack>
    </>
)
}
StepPago.displayName = 'StepPago';