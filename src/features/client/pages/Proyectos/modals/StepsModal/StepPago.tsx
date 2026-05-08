// src/features/client/pages/Proyectos/StepsModal/StepPago.tsx

import {
	AccessTime,
	Cancel,
	CheckCircle,
	HourglassEmpty,
	Payments,
} from "@mui/icons-material";
import {
	Alert,
	alpha,
	Box,
	CircularProgress,
	Paper,
	Stack,
	Typography,
	useTheme,
} from "@mui/material";
import type { FC } from "react";

export type PagoDecision = "pagar_ahora" | "pagar_despues" | "cancelar" | null;

interface IStepPagoProps {
	paymentStatus: string;
	onRetry: () => void;
	// ── Nuevas props para el selector de decisión ──
	decision: PagoDecision;
	onDecisionChange: (d: PagoDecision) => void;
	montoPorCuota: string; // ej. "$12.400"
	cuotasPlan: number;
	isProcessing?: boolean;
}

const OPCIONES: {
	value: Exclude<PagoDecision, null>;
	icon: React.ReactNode;
	title: string;
	description: string;
	color: "success" | "warning" | "error";
}[] = [
	{
		value: "pagar_ahora",
		icon: <Payments />,
		title: "Pagar ahora",
		description:
			"Serás redirigido a Mercado Pago para abonar la primera cuota y continuar al paso de firma.",
		color: "success",
	},
	{
		value: "pagar_despues",
		icon: <AccessTime />,
		title: "Pagar después",
		description:
			"Tu adhesión queda reservada. Podrás abonar desde <<Billetera => Pagar Cuotas>> cuando quieras.",
		color: "warning",
	},
	{
		value: "cancelar",
		icon: <Cancel />,
		title: "Cancelar",
		description:
			"No se creará ninguna adhesión. Podés iniciar el proceso nuevamente cuando lo desees.",
		color: "error",
	},
];

export const StepPago: FC<IStepPagoProps> = ({
	paymentStatus,
	onRetry,
	decision,
	onDecisionChange,
	montoPorCuota,
	cuotasPlan,
	isProcessing,
}) => {
	const theme = useTheme();

	// ── Estado de pago en curso (después de redirigir a MP y volver) ──────────
	if (paymentStatus === "processing") {
		return (
			<Stack
				alignItems="center"
				justifyContent="center"
				height="100%"
				minHeight="40vh"
				spacing={3}
			>
				<CircularProgress size={72} thickness={3} />
				<Typography variant="h6" fontWeight={700} color="text.secondary">
					Procesando pago...
				</Typography>
			</Stack>
		);
	}

	if (paymentStatus === "success") {
		return (
			<Stack
				alignItems="center"
				justifyContent="center"
				height="100%"
				minHeight="40vh"
				spacing={3}
			>
				<CheckCircle sx={{ fontSize: 72, color: "success.main" }} />
				<Typography variant="h5" fontWeight={800} color="success.main">
					¡Pago Acreditado!
				</Typography>
			</Stack>
		);
	}

	if (paymentStatus === "failed") {
		return (
			<Stack
				alignItems="center"
				justifyContent="center"
				height="100%"
				minHeight="40vh"
				spacing={3}
			>
				<Alert
					severity="error"
					action={
						<Typography
							variant="caption"
							sx={{ cursor: "pointer", fontWeight: 700, textDecoration: "underline" }}
							onClick={onRetry}
						>
							Reintentar
						</Typography>
					}
				>
					El pago fue rechazado. Intentá nuevamente.
				</Alert>
			</Stack>
		);
	}

	// ── "Pagar después" confirmado — mostrar mensaje informativo ──────────────
	if (paymentStatus === "deferred") {
		return (
			<Stack
				alignItems="center"
				justifyContent="center"
				height="100%"
				minHeight="40vh"
				spacing={3}
				px={2}
			>
				<HourglassEmpty sx={{ fontSize: 64, color: "warning.main" }} />
				<Typography variant="h6" fontWeight={800} textAlign="center">
					Adhesión reservada
				</Typography>
				<Alert severity="warning" sx={{ borderRadius: 2, maxWidth: 480 }}>
					<Typography variant="body2" fontWeight={700} mb={0.5}>
						Recordá abonar para activar tu suscripción
					</Typography>
					<Typography variant="caption">
						Tu adhesión fue creada pero{" "}
						<strong>aún no podés firmar el contrato</strong> hasta abonar la primera
						cuota. Ingresá a <strong>Billetera → Pagar Cuotas</strong> cuando estés
						listo.
					</Typography>
				</Alert>
			</Stack>
		);
	}

	// ── Vista principal: selector de decisión ────────────────────────────────
	return (
		<Stack spacing={3} maxWidth="sm" mx="auto">
			<Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
				<Typography variant="body2" fontWeight={700} mb={0.5}>
					¿Cómo querés continuar?
				</Typography>
				<Typography variant="caption">
					Primera cuota: <strong>{montoPorCuota}</strong>
					{cuotasPlan > 1 && ` (de ${cuotasPlan} cuotas en total)`}
				</Typography>
			</Alert>

			<Stack spacing={2}>
				{OPCIONES.map((op) => {
					const isSelected = decision === op.value;
					const palette = theme.palette[op.color];

					return (
						<Paper
							key={op.value}
							variant="outlined"
							onClick={() => onDecisionChange(op.value)}
							sx={{
								p: 2.5,
								borderRadius: 2,
								cursor: "pointer",
								border: `2px solid`,
								borderColor: isSelected ? palette.main : theme.palette.divider,
								bgcolor: isSelected ? alpha(palette.main, 0.06) : "background.paper",
								transition: "all 0.18s ease",
								"&:hover": {
									borderColor: palette.main,
									bgcolor: alpha(palette.main, 0.04),
								},
							}}
						>
							<Stack direction="row" spacing={2} alignItems="flex-start">
								{/* Ícono */}
								<Box
									sx={{
										width: 40,
										height: 40,
										borderRadius: "50%",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										flexShrink: 0,
										bgcolor: isSelected
											? alpha(palette.main, 0.15)
											: alpha(theme.palette.text.disabled, 0.08),
										color: isSelected ? palette.main : "text.disabled",
										transition: "all 0.18s ease",
									}}
								>
									{op.icon}
								</Box>

								{/* Texto */}
								<Box flex={1}>
									<Typography
										variant="subtitle2"
										fontWeight={800}
										color={isSelected ? `${op.color}.main` : "text.primary"}
									>
										{op.title}
									</Typography>
									<Typography
										variant="caption"
										color="text.secondary"
										sx={{ lineHeight: 1.5 }}
									>
										{op.description}
									</Typography>
								</Box>

								{/* Check de selección */}
								<Box
									sx={{
										width: 20,
										height: 20,
										borderRadius: "50%",
										border: `2px solid`,
										borderColor: isSelected ? palette.main : theme.palette.divider,
										bgcolor: isSelected ? palette.main : "transparent",
										flexShrink: 0,
										mt: 0.25,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										transition: "all 0.18s ease",
									}}
								>
									{isSelected && (
										<Box
											sx={{
												width: 8,
												height: 8,
												borderRadius: "50%",
												bgcolor: "#fff",
											}}
										/>
									)}
								</Box>
							</Stack>
						</Paper>
					);
				})}
			</Stack>

			{isProcessing && (
				<Stack
					direction="row"
					spacing={1.5}
					alignItems="center"
					justifyContent="center"
					pt={1}
				>
					<CircularProgress size={18} />
					<Typography variant="caption" color="text.secondary" fontWeight={600}>
						Procesando tu selección...
					</Typography>
				</Stack>
			)}
		</Stack>
	);
};

StepPago.displayName = "StepPago";
