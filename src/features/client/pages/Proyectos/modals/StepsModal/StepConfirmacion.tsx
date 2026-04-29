import type { ProyectoDto } from "@/core/types/proyecto.dto";
import { Token } from "@mui/icons-material";
import {
	Alert,
	alpha,
	Box,
	Paper,
	Stack,
	Typography,
	useTheme,
} from "@mui/material";
import  { type FC } from "react";

interface IStepConfirmacionProps {
	proyecto: ProyectoDto;
	tipo: "suscripcion" | "inversion";
	montoTotalStr: string;
	cuotaActiva?: any;
	formatCurrency: (value: number) => string;
}

export const StepConfirmacion: FC<IStepConfirmacionProps> = ({
	proyecto,
	tipo,
	montoTotalStr,
	cuotaActiva,
	formatCurrency,
}) => {
	const theme = useTheme();
	const isSuscripcion = tipo === "suscripcion";

	return (
		<>
			<Stack spacing={3} maxWidth="sm" mx="auto">
				<Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
					Revisa los detalles de tu {isSuscripcion ? "suscripción" : "inversión"}{" "}
					antes de iniciar el pago.
				</Alert>
				<Paper variant="outlined" sx={{ overflow: "hidden", borderRadius: 2 }}>
					<Box sx={{ bgcolor: "primary.main", color: "primary.contrastText", p: 2 }}>
						<Typography variant="h6" fontWeight={700}>
							{proyecto.nombre_proyecto}
						</Typography>
						<Typography variant="body2" sx={{ opacity: 0.9 }}>
							{isSuscripcion
								? "Plan de Ahorro Mensual"
								: "Inversión Directa (Pago Único)"}
						</Typography>
					</Box>
					<Stack spacing={0}>
						<Box p={2} borderBottom={`1px solid ${theme.palette.divider}`}>
							<Stack
								direction="row"
								justifyContent="space-between"
								mb={isSuscripcion && proyecto.plazo_inversion ? 1 : 0}
							>
								<Typography color="text.secondary">Modalidad</Typography>
								<Typography fontWeight={600}>
									{isSuscripcion ? "Suscripción Mensual" : "Aporte Único"}
								</Typography>
							</Stack>
							{isSuscripcion && proyecto.plazo_inversion && (
								<Stack direction="row" justifyContent="space-between">
									<Typography color="text.secondary">Plazo de financiación</Typography>
									<Typography fontWeight={600}>
										{proyecto.plazo_inversion} meses
									</Typography>
								</Stack>
							)}
						</Box>
						{isSuscripcion && cuotaActiva && (
							<Box p={2} bgcolor={alpha(theme.palette.primary.main, 0.02)}>
								<Typography
									variant="overline"
									color="primary.main"
									fontWeight={800}
									sx={{ display: "block", mb: 1, lineHeight: 1 }}
								>
									1. Cálculo del Valor Móvil
								</Typography>
								<Stack spacing={0.5} mb={3}>
									<Stack direction="row" justifyContent="space-between">
										<Typography variant="body2" color="text.secondary">
											Precio {cuotaActiva.nombre_cemento_cemento}
										</Typography>
										<Typography variant="body2" fontWeight={500}>
											{formatCurrency(Number(cuotaActiva.valor_cemento))}
										</Typography>
									</Stack>
									<Stack direction="row" justifyContent="space-between">
										<Typography variant="body2" color="text.secondary">
											Multiplicado por unidades
										</Typography>
										<Typography variant="body2" fontWeight={500}>
											× {cuotaActiva.valor_cemento_unidades}
										</Typography>
									</Stack>
									<Box
										borderTop={`1px solid ${theme.palette.divider}`}
										pt={0.5}
										mt={0.5}
									>
										<Stack direction="row" justifyContent="space-between">
											<Typography variant="body2" fontWeight={700}>
												= Valor Móvil Total
											</Typography>
											<Typography variant="body2" fontWeight={700}>
												{formatCurrency(Number(cuotaActiva.valor_movil))}
											</Typography>
										</Stack>
									</Box>
								</Stack>
								<Typography
									variant="overline"
									color="primary.main"
									fontWeight={800}
									sx={{ display: "block", mb: 1, lineHeight: 1 }}
								>
									2. Base a Financiar
								</Typography>
								<Stack spacing={0.5} mb={3}>
									<Stack direction="row" justifyContent="space-between">
										<Typography variant="body2" color="text.secondary">
											Valor Móvil Total
										</Typography>
										<Typography variant="body2" fontWeight={500}>
											{formatCurrency(Number(cuotaActiva.valor_movil))}
										</Typography>
									</Stack>
									<Stack direction="row" justifyContent="space-between">
										<Typography variant="body2" color="text.secondary">
											Porcentaje del plan
										</Typography>
										<Typography variant="body2" fontWeight={500}>
											× {Number(cuotaActiva.porcentaje_plan)}%
										</Typography>
									</Stack>
									<Box
										borderTop={`1px solid ${theme.palette.divider}`}
										pt={0.5}
										mt={0.5}
									>
										<Stack direction="row" justifyContent="space-between">
											<Typography variant="body2" fontWeight={700}>
												= Base a financiar
											</Typography>
											<Typography variant="body2" fontWeight={700}>
												{formatCurrency(Number(cuotaActiva.total_del_plan))}
											</Typography>
										</Stack>
									</Box>
								</Stack>
								<Typography
									variant="overline"
									color="primary.main"
									fontWeight={800}
									sx={{ display: "block", mb: 1, lineHeight: 1 }}
								>
									3. Composición de tu Cuota
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
									<Stack
										direction="row"
										justifyContent="space-between"
										alignItems="center"
									>
										<Box>
											<Typography variant="body2" fontWeight={600}>
												Cuota Pura Mínima
											</Typography>
											<Typography variant="caption" color="text.disabled">
												{formatCurrency(Number(cuotaActiva.total_del_plan))} ÷{" "}
												{cuotaActiva.total_cuotas_proyecto} meses
											</Typography>
										</Box>
										<Typography variant="body2" fontWeight={600}>
											{formatCurrency(Number(cuotaActiva.valor_mensual))}
										</Typography>
									</Stack>
									<Stack
										direction="row"
										justifyContent="space-between"
										alignItems="center"
									>
										<Box>
											<Typography variant="body2" color="text.secondary">
												Gastos Administrativos
											</Typography>
											<Typography variant="caption" color="text.disabled">
												({Number(cuotaActiva.porcentaje_administrativo) * 100}% sobre Valor Movil)
											</Typography>
										</Box>
										<Typography variant="body2" color="text.secondary">
											+ {formatCurrency(Number(cuotaActiva.carga_administrativa))}
										</Typography>
									</Stack>
									<Stack
										direction="row"
										justifyContent="space-between"
										alignItems="center"
									>
										<Box>
											<Typography variant="body2" color="text.secondary">
												IVA
											</Typography>
											<Typography variant="caption" color="text.disabled">
												({Number(cuotaActiva.porcentaje_iva) * 100}% sobre Gastos)
											</Typography>
										</Box>
										<Typography variant="body2" color="text.secondary">
											+ {formatCurrency(Number(cuotaActiva.iva_carga_administrativa))}
										</Typography>
									</Stack>
									<Box borderTop={`2px dashed ${theme.palette.divider}`} pt={1} mt={1}>
										<Stack
											direction="row"
											justifyContent="space-between"
											alignItems="center"
										>
											<Typography
												variant="subtitle2"
												fontWeight={800}
												color="text.primary"
											>
												Valor Final de la Cuota
											</Typography>
											<Typography
												variant="subtitle2"
												fontWeight={800}
												color="text.primary"
											>
												= {formatCurrency(Number(cuotaActiva.valor_mensual_final))}
											</Typography>
										</Stack>
									</Box>
								</Stack>
							</Box>
						)}
						<Box
							p={3}
							display="flex"
							justifyContent="space-between"
							alignItems="center"
							bgcolor={alpha(theme.palette.success.main, 0.1)}
						>
							<Box>
								<Typography fontWeight={800} color="text.primary" variant="subtitle1">
									{isSuscripcion ? "Valor Final de la Cuota" : "Monto a Invertir"}
								</Typography>
								<Typography variant="caption" color="text.secondary" fontWeight={500}>
									{isSuscripcion ? "A pagar hoy para activar el plan" : "A pagar hoy"}
								</Typography>
							</Box>
							<Typography variant="h4" fontWeight={900} color="success.main">
								{montoTotalStr}
							</Typography>
						</Box>
					</Stack>
				</Paper>
				{isSuscripcion && (
					<Alert severity="success" icon={<Token />} sx={{ borderRadius: 2 }}>
						<Typography variant="body2" fontWeight={700} mb={0.5}>
							¡Beneficio Exclusivo!
						</Typography>
						<Typography variant="caption">
							Al abonar esta primera cuota recibes <strong>1 Token de Subasta</strong>{" "}
							para participar por la adjudicación de lotes.
						</Typography>
					</Alert>
				)}
			</Stack>
		</>
	);
};

StepConfirmacion.displayName = "StepConfirmacion";
