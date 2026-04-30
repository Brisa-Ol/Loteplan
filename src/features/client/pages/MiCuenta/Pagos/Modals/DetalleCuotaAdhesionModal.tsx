// src/features/client/pages/Pagos/DetalleCuotaAdhesionModal.tsx

import type { AdhesionDto, PagoAdhesionDto } from "@/core/types/adhesion.dto";
import { BaseModal } from "@/shared/components/domain/modals/BaseModal";
import {
	CheckCircle,
	Lock,
	PriorityHigh,
	ReceiptLong,
	Schedule,
} from "@mui/icons-material";
import { Box, Button, Chip, Divider, Stack, Typography } from "@mui/material";
import React from "react";

interface Props {
	open: boolean;
	onClose: () => void;
	adhesion: AdhesionDto | null;
	formatCurrency: (val: number) => string;
	isPaymentPending: boolean;
	onPagar: (adhesion: AdhesionDto, cuota: PagoAdhesionDto) => void;
}

const getEstadoCuotaConfig = (estado: string) => {
	switch (estado) {
		case "pendiente":
			return {
				label: "Pendiente",
				color: "info" as const,
				icon: <Schedule fontSize="small" />,
			};
		case "pagado":
		case "forzado":
		case "cubierto_por_puja":
			return {
				label: "Pagado",
				color: "success" as const,
				icon: <CheckCircle fontSize="small" />,
			};
		case "vencido":
			return {
				label: "Vencido",
				color: "error" as const,
				icon: <PriorityHigh fontSize="small" />,
			};
		default:
			return { label: estado, color: "default" as const, icon: undefined };
	}
};

export const DetalleCuotaAdhesionModal: React.FC<Props> = ({
	open,
	onClose,
	adhesion,
	formatCurrency,
	isPaymentPending,
	onPagar,
}) => {
	if (!adhesion) return null;

	const planText =
		adhesion.plan_pago === "contado"
			? "Contado (1 Pago)"
			: adhesion.plan_pago === "6_cuotas"
				? "6 Cuotas"
				: "12 Cuotas";

	const nombreProyecto =
		adhesion.proyecto?.nombre_proyecto || `Adhesión #${adhesion.id}`;

	// Próxima cuota pendiente o vencida
	const nextPago = (adhesion.pagos || []).find((p) =>
		["pendiente", "vencido"].includes(p.estado),
	);

	const cuotasPagadas = (adhesion.pagos || []).filter((p) =>
		["pagado", "forzado", "cubierto_por_puja"].includes(p.estado),
	).length;

	const cuotasTotales = adhesion.pagos?.length || 0;

	return (
		<BaseModal
			open={open}
			onClose={onClose}
			title="Detalle de Adhesión"
			subtitle={`${nombreProyecto} • ${planText}`}
			icon={<ReceiptLong />}
			headerColor="primary"
			maxWidth="sm"
			hideConfirmButton
			cancelText="Cerrar"
		>
			<Stack spacing={3}>
				{/* Resumen superior */}
				<Stack direction="row" spacing={2} justifyContent="space-between">
					<Box>
						<Typography variant="caption" color="text.secondary" fontWeight={600}>
							Plan de pago
						</Typography>
						<Typography variant="body1" fontWeight={700}>
							{planText}
						</Typography>
					</Box>
					<Box textAlign="center">
						<Typography variant="caption" color="text.secondary" fontWeight={600}>
							Cuotas abonadas
						</Typography>
						<Typography variant="body1" fontWeight={700}>
							{cuotasPagadas} / {cuotasTotales}
						</Typography>
					</Box>
					<Box textAlign="right">
						<Typography variant="caption" color="text.secondary" fontWeight={600}>
							Monto total
						</Typography>
						<Typography variant="body1" fontWeight={700} color="primary.main">
							{formatCurrency(Number(adhesion.monto_total_adhesion))}
						</Typography>
					</Box>
				</Stack>

				<Divider />

				{/* Lista de cuotas */}
				<Box>
					<Typography
						variant="overline"
						color="text.secondary"
						fontWeight={700}
						mb={1}
						display="block"
					>
						Detalle de cuotas
					</Typography>

					{!adhesion.pagos || adhesion.pagos.length === 0 ? (
						<Typography
							variant="body2"
							color="text.secondary"
							textAlign="center"
							py={3}
						>
							No hay cuotas registradas para esta adhesión.
						</Typography>
					) : (
						<Stack spacing={1.5}>
							{adhesion.pagos.map((cuota) => {
								const { label, color, icon } = getEstadoCuotaConfig(cuota.estado);
								const isPaid = ["pagado", "forzado", "cubierto_por_puja"].includes(
									cuota.estado,
								);
								const isVencida = cuota.estado === "vencido";
								const isNext = nextPago?.id === cuota.id;

								return (
									<Box
										key={cuota.id}
										sx={{
											display: "flex",
											alignItems: "center",
											justifyContent: "space-between",
											p: 1.5,
											borderRadius: 2,
											border: "1px solid",
											borderColor: isNext
												? isVencida
													? "error.light"
													: "primary.light"
												: "divider",
											bgcolor: isNext
												? isVencida
													? "error.50"
													: "primary.50"
												: isPaid
													? "action.hover"
													: "background.paper",
											opacity: isPaid ? 0.75 : 1,
										}}
									>
										{/* Número y fechas */}
										<Box sx={{ flex: 1 }}>
											<Stack direction="row" spacing={1} alignItems="center">
												<Typography variant="body2" fontWeight={700}>
													Cuota #{cuota.numero_cuota}
												</Typography>
												{isNext && (
													<Chip
														label="Próxima"
														size="small"
														color={isVencida ? "error" : "primary"}
														sx={{ height: 18, fontSize: "0.6rem", fontWeight: 700 }}
													/>
												)}
											</Stack>

											{isPaid && cuota.fecha_pago ? (
												<Typography variant="caption" color="success.main" fontWeight={600}>
													Pagado el {new Date(cuota.fecha_pago).toLocaleDateString("es-AR")}
												</Typography>
											) : (
												<Typography
													variant="caption"
													color={isVencida ? "error.main" : "text.secondary"}
													fontWeight={isVencida ? 700 : 400}
												>
													Vence:{" "}
													{new Date(cuota.fecha_vencimiento).toLocaleDateString("es-AR")}
												</Typography>
											)}
										</Box>

										{/* Monto */}
										<Typography
											variant="body2"
											fontWeight={800}
											sx={{ mx: 2, minWidth: 90, textAlign: "right" }}
										>
											{formatCurrency(Number(cuota.monto))}
										</Typography>

										{/* Estado o Botón */}
										{isPaid ? (
											<Chip
												label={label}
												color={color}
												size="small"
												icon={icon}
												variant="outlined"
												sx={{ fontWeight: 600, minWidth: 90 }}
											/>
										) : isNext ? (
											<Button
												variant="contained"
												color={isVencida ? "error" : "primary"}
												size="small"
												onClick={() => onPagar(adhesion, cuota)}
												disabled={isPaymentPending}
												startIcon={<Lock fontSize="small" />}
												sx={{ borderRadius: 2, minWidth: 100, fontWeight: 800 }}
											>
												{isPaymentPending ? "..." : "Pagar"}
											</Button>
										) : (
											<Chip
												label={label}
												color={color}
												size="small"
												icon={icon}
												variant="outlined"
												sx={{ fontWeight: 600, minWidth: 90 }}
											/>
										)}
									</Box>
								);
							})}
						</Stack>
					)}
				</Box>
			</Stack>
		</BaseModal>
	);
};
