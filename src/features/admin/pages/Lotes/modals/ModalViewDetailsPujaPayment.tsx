import type { LoteDto } from "@/core/types/lote.dto";
import type { PujaDto } from "@/core/types/puja.dto";
import { BaseModal, StatusBadge } from "@/shared";
import { MailOutline } from "@mui/icons-material";
import HistoryIcon from "@mui/icons-material/History";
import {
	alpha,
	Box,
	Chip,
	Paper,
	Stack,
	Typography,
	useTheme,
} from "@mui/material";
import type { FC } from "react";

// ============================================================================
// HELPERS
// ============================================================================
const getEstadoChipProps = (estadoPuja: string) => {
	const theme = useTheme();
	if (estadoPuja === "ganadora_pagada") {
		return {
			label: "PAGADO",
			sx: {
				bgcolor: alpha(theme.palette.success.main, 0.12),
				color: theme.palette.success.dark,
				borderColor: theme.palette.success.light,
				fontWeight: 800,
				fontSize: "0.6rem",
				height: 20,
			},
		};
	}
	if (estadoPuja === "ganadora_incumplimiento") {
		return {
			label: "INCUMPLIMIENTO",
			sx: {
				bgcolor: alpha(theme.palette.warning.main, 0.12),
				color: theme.palette.warning.dark,
				borderColor: theme.palette.warning.light,
				fontWeight: 800,
				fontSize: "0.6rem",
				height: 20,
			},
		};
	}
	if (estadoPuja.startsWith("ganadora")) {
		return {
			label: estadoPuja.replace(/_/g, " ").toUpperCase(),
			sx: {
				bgcolor: alpha(theme.palette.info.main, 0.1),
				color: theme.palette.info.dark,
				borderColor: theme.palette.info.light,
				fontWeight: 800,
				fontSize: "0.6rem",
				height: 20,
			},
		};
	}
	return {
		label: estadoPuja.replace(/_/g, " ").toUpperCase(),
		sx: {
			fontWeight: 700,
			fontSize: "0.6rem",
			height: 20,
		},
	};
};

const medals = ["🥇", "🥈", "🥉"];

// ============================================================================
// INTERFACES
// ============================================================================
interface IModalViewDetailsPujaPaymentProps {
	open: boolean;
	onClose: () => void;
	lote: LoteDto | null;
	pujas: PujaDto[];
}

// ============================================================================
// COMPONENTE
// ============================================================================
export const ModalViewDetailsPujaPayment: FC<
	IModalViewDetailsPujaPaymentProps
> = ({ open, onClose, lote, pujas }) => {
	const theme = useTheme();

	if (!lote) return null;

	const top3 = [pujas[0], pujas[1], pujas[2]];

	return (
		<BaseModal
			open={open}
			onClose={onClose}
			title={lote.nombre_lote}
			subtitle={`Subasta finalizada · ID: ${lote.id}`}
			icon={<HistoryIcon />}
			headerColor="success"
			hideConfirmButton
			cancelText="Cerrar"
			maxWidth="sm"
		>
			{/* ── Monto adjudicado ── */}
			<Paper
				variant="outlined"
				sx={{
					p: 2,
					mb: 3,
					borderRadius: 2,
					bgcolor: alpha(theme.palette.success.main, 0.04),
					borderColor: "success.light",
				}}
			>
				<Stack direction="row" justifyContent="space-between" alignItems="center">
					<Box>
						<Typography variant="caption" color="text.secondary" fontWeight={700}>
							MONTO ADJUDICADO
						</Typography>
						<Typography variant="h5" fontWeight={900} color="success.main">
							$
							{Number(lote.monto_ganador_lote || lote.precio_base).toLocaleString(
								"es-AR",
							)}
						</Typography>
					</Box>
					<Box textAlign="right">
						<Typography variant="caption" color="text.secondary" fontWeight={700}>
							ESTADO
						</Typography>
						<Box>
							<StatusBadge status="completed" customLabel="PAGADO" />
						</Box>
					</Box>
				</Stack>
				{lote.fecha_fin && (
					<Typography
						variant="caption"
						color="text.secondary"
						sx={{ mt: 1, display: "block" }}
					>
						Finalizado el{" "}
						{new Date(lote.fecha_fin).toLocaleDateString("es-AR", {
							day: "2-digit",
							month: "long",
							year: "numeric",
						})}
					</Typography>
				)}
			</Paper>

			{/* ── Top 3 postores ── */}
			<Typography
				variant="subtitle2"
				fontWeight={800}
				sx={{
					mb: 1.5,
					textTransform: "uppercase",
					letterSpacing: "0.05em",
					color: "text.secondary",
				}}
			>
				Top 3 Postores
			</Typography>

			<Stack spacing={1.5}>
				{top3.map((puja, idx) => {
					if (!puja) {
						return (
							<Paper
								key={`empty-${idx}`}
								variant="outlined"
								sx={{ p: 1.5, borderRadius: 2, opacity: 0.4 }}
							>
								<Typography variant="caption" color="text.disabled" fontStyle="italic">
									{medals[idx]} Sin postor en posición {idx + 1}
								</Typography>
							</Paper>
						);
					}

					const u = puja.usuario;
					const chipProps = getEstadoChipProps(puja.estado_puja);

					// Todos los puestos tienen el mismo peso visual; solo el chip
					// y el color del monto cambian según el estado real de la puja.
					return (
						<Paper
							key={puja.id}
							variant="outlined"
							sx={{
								p: 2,
								borderRadius: 2,
								// Borde sutil diferenciado, pero sin "inflar" el primer puesto
								borderColor:
									puja.estado_puja === "ganadora_pagada"
										? "success.light"
										: puja.estado_puja === "ganadora_incumplimiento"
											? "warning.light"
											: "divider",
								bgcolor:
									puja.estado_puja === "ganadora_pagada"
										? alpha(theme.palette.success.main, 0.03)
										: puja.estado_puja === "ganadora_incumplimiento"
											? alpha(theme.palette.warning.main, 0.03)
											: "transparent",
							}}
						>
							<Stack
								direction="row"
								justifyContent="space-between"
								alignItems="flex-start"
							>
								{/* Medalla + datos del postor */}
								<Stack direction="row" spacing={1.5} alignItems="center">
									<Typography fontSize={20}>{medals[idx]}</Typography>
									<Box>
										<Typography variant="body2" fontWeight={700}>
											{u ? `${u.nombre} ${u.apellido}` : `ID #${puja.id_usuario}`}
										</Typography>
										{u?.email && (
											<Typography
												variant="caption"
												color="text.secondary"
												sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
											>
												<MailOutline sx={{ fontSize: 11 }} /> {u.email}
											</Typography>
										)}
										{u?.nombre_usuario && (
											<Typography variant="caption" color="text.disabled">
												@{u.nombre_usuario}
											</Typography>
										)}
									</Box>
								</Stack>

								{/* Monto + chip de estado */}
								<Box textAlign="right">
									<Typography
										variant="body2"
										fontWeight={900}
										color={
											puja.estado_puja === "ganadora_pagada"
												? "success.main"
												: puja.estado_puja === "ganadora_incumplimiento"
													? "warning.main"
													: "text.primary"
										}
									>
										${Number(puja.monto_puja).toLocaleString("es-AR")}
									</Typography>
									<Chip
										variant="outlined"
										{...chipProps}
										sx={{ mt: 0.5, ...chipProps.sx }}
									/>
								</Box>
							</Stack>
						</Paper>
					);
				})}
			</Stack>
		</BaseModal>
	);
};
