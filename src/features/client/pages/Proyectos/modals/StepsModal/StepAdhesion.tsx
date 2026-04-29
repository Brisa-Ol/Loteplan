// src/features/client/pages/Proyectos/StepsModal/StepAdhesion.tsx

import {
	Alert,
	alpha,
	Box,
	Chip,
	Divider,
	Paper,
	Stack,
	ToggleButton,
	ToggleButtonGroup,
	Typography,
	useTheme,
} from "@mui/material";
import { CalendarMonth, CheckCircle, Payments, Token } from "@mui/icons-material";
import { type FC, useMemo } from "react";

import type { PlanPagoAdhesion } from "@/core/types/adhesion.dto";

interface IStepAdhesionProps {
	valorMovil: number;
	planPago: PlanPagoAdhesion;
	setPlanPago: (plan: PlanPagoAdhesion) => void;
	formatCurrency: (value: number) => string;
}

const PORCENTAJE_ADHESION = 4.0;

const PLANES: { value: PlanPagoAdhesion; label: string; cuotas: number; badge?: string }[] = [
	{ value: "contado", label: "Contado", cuotas: 1, badge: "Sin recargo" },
	{ value: "3_cuotas", label: "3 cuotas", cuotas: 3 },
	{ value: "6_cuotas", label: "6 cuotas", cuotas: 6 },
];

export const StepAdhesion: FC<IStepAdhesionProps> = ({
	valorMovil,
	planPago,
	setPlanPago,
	formatCurrency,
}) => {
	const theme = useTheme();

	const montoTotal = useMemo(
		() => valorMovil * (PORCENTAJE_ADHESION / 100),
		[valorMovil],
	);

	const cuotasPlan = useMemo(
		() => PLANES.find((p) => p.value === planPago)?.cuotas ?? 1,
		[planPago],
	);

	const montoPorCuota = useMemo(
		() => montoTotal / cuotasPlan,
		[montoTotal, cuotasPlan],
	);

	return (
		<Stack spacing={3} maxWidth="sm" mx="auto">
			<Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
				La adhesión es un aporte inicial para activar tu suscripción. Elegí cómo
				querés pagarlo.
			</Alert>

			<Paper variant="outlined" sx={{ overflow: "hidden", borderRadius: 2 }}>
				{/* Header */}
				<Box sx={{ bgcolor: "primary.main", color: "primary.contrastText", p: 2 }}>
					<Typography variant="h6" fontWeight={700}>
						Adhesión al Plan
					</Typography>
					<Typography variant="body2" sx={{ opacity: 0.9 }}>
						Pago de entrada para activar tu suscripción mensual
					</Typography>
				</Box>

				<Stack spacing={0}>
					{/* Cálculo del monto total */}
					<Box p={2} bgcolor={alpha(theme.palette.primary.main, 0.02)}>
						<Typography
							variant="overline"
							color="primary.main"
							fontWeight={800}
							sx={{ display: "block", mb: 1, lineHeight: 1 }}
						>
							1. Cálculo del Monto de Adhesión
						</Typography>

						<Stack spacing={0.5} mb={0}>
							<Stack direction="row" justifyContent="space-between">
								<Typography variant="body2" color="text.secondary">
									Valor Móvil de referencia
								</Typography>
								<Typography variant="body2" fontWeight={500}>
									{formatCurrency(valorMovil)}
								</Typography>
							</Stack>

							<Stack direction="row" justifyContent="space-between">
								<Typography variant="body2" color="text.secondary">
									Porcentaje de adhesión
								</Typography>
								<Typography variant="body2" fontWeight={500}>
									× {PORCENTAJE_ADHESION}%
								</Typography>
							</Stack>

							<Box
								borderTop={`1px solid ${theme.palette.divider}`}
								pt={0.5}
								mt={0.5}
							>
								<Stack direction="row" justifyContent="space-between">
									<Typography variant="body2" fontWeight={700}>
										= Monto total de adhesión
									</Typography>
									<Typography variant="body2" fontWeight={700}>
										{formatCurrency(montoTotal)}
									</Typography>
								</Stack>
							</Box>
						</Stack>
					</Box>

					<Divider />

					{/* Selector de plan */}
					<Box p={2}>
						<Typography
							variant="overline"
							color="primary.main"
							fontWeight={800}
							sx={{ display: "block", mb: 2, lineHeight: 1 }}
						>
							2. Elegí tu Plan de Pago
						</Typography>

						<ToggleButtonGroup
							value={planPago}
							exclusive
							onChange={(_, val) => { if (val) setPlanPago(val); }}
							fullWidth
							sx={{ gap: 1 }}
						>
							{PLANES.map((plan) => (
								<ToggleButton
									key={plan.value}
									value={plan.value}
									sx={{
										flex: 1,
										flexDirection: "column",
										gap: 0.5,
										py: 1.5,
										borderRadius: "8px !important",
										border: `1px solid ${theme.palette.divider} !important`,
										"&.Mui-selected": {
											bgcolor: alpha(theme.palette.primary.main, 0.08),
											borderColor: `${theme.palette.primary.main} !important`,
											color: "primary.main",
										},
									}}
								>
									<Stack direction="row" alignItems="center" spacing={0.5}>
										<CalendarMonth fontSize="small" />
										<Typography variant="body2" fontWeight={700}>
											{plan.label}
										</Typography>
									</Stack>
									<Typography variant="caption" color="text.secondary">
										{formatCurrency(montoTotal / plan.cuotas)}
										{plan.cuotas > 1 ? " / cuota" : " único"}
									</Typography>
									
								</ToggleButton>
							))}
						</ToggleButtonGroup>
					</Box>

					<Divider />

					{/* Resumen de la cuota seleccionada */}
					<Box p={2}>
						<Typography
							variant="overline"
							color="primary.main"
							fontWeight={800}
							sx={{ display: "block", mb: 1.5, lineHeight: 1 }}
						>
							3. Resumen
						</Typography>

						<Stack
							spacing={1}
							sx={{
								p: 1.5,
								bgcolor: "background.paper",
								borderRadius: 1,
								border: `1px solid ${theme.palette.divider}`,
							}}
						>
							<Stack direction="row" justifyContent="space-between" alignItems="center">
								<Typography variant="body2" color="text.secondary">
									Monto total de adhesión
								</Typography>
								<Typography variant="body2" fontWeight={600}>
									{formatCurrency(montoTotal)}
								</Typography>
							</Stack>

							<Stack direction="row" justifyContent="space-between" alignItems="center">
								<Typography variant="body2" color="text.secondary">
									Cantidad de cuotas
								</Typography>
								<Typography variant="body2" fontWeight={600}>
									{cuotasPlan} {cuotasPlan === 1 ? "pago" : "cuotas"}
								</Typography>
							</Stack>

							<Box borderTop={`2px dashed ${theme.palette.divider}`} pt={1} mt={0.5}>
								<Stack direction="row" justifyContent="space-between" alignItems="center">
									<Box>
										<Typography variant="subtitle2" fontWeight={800} color="text.primary">
											{cuotasPlan === 1 ? "Monto a pagar hoy" : `${cuotasPlan} cuotas a pagar de`}
										</Typography>
										
									</Box>
									<Typography variant="subtitle2" fontWeight={800} color="text.primary">
										= {formatCurrency(montoPorCuota)}
									</Typography>
								</Stack>
							</Box>
						</Stack>
					</Box>

					{/* Monto destacado */}
					<Box
						p={3}
						display="flex"
						justifyContent="space-between"
						alignItems="center"
						bgcolor={alpha(theme.palette.success.main, 0.1)}
					>
						<Box>
							<Typography fontWeight={800} color="text.primary" variant="subtitle1">
								{cuotasPlan === 1 ? "Total a pagar hoy" : "1ª cuota a pagar hoy"}
							</Typography>
							<Typography variant="caption" color="text.secondary" fontWeight={500}>
								Serás redirigido a Mercado Pago
							</Typography>
						</Box>
						<Stack alignItems="flex-end">
							<Typography variant="h4" fontWeight={900} color="success.main">
								{formatCurrency(montoPorCuota)}
							</Typography>
							{cuotasPlan > 1 && (
								<Typography variant="caption" color="text.secondary">
									de {formatCurrency(montoTotal)} total
								</Typography>
							)}
						</Stack>
					</Box>
				</Stack>
			</Paper>

			<Alert
				severity="success"
				icon={<CheckCircle />}
				sx={{ borderRadius: 2 }}
			>
				<Typography variant="body2" fontWeight={700} mb={0.5}>
					¿Para qué sirve la adhesión?
				</Typography>
				<Typography variant="caption">
					Es el aporte inicial requerido para activar tu suscripción al plan de ahorro.
					Una vez abonada la primera cuota, podrás <strong>firmar</strong> tu contrato. Abonada la totalidad de la adhesión, tu <strong>Suscripcion</strong> quedará activa y podrás participar en subastas de lotes con tus <strong>Tokens</strong>.
				</Typography>
			</Alert>
		</Stack>
	);
};

StepAdhesion.displayName = "StepAdhesion";