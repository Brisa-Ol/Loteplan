import type { PagoDto } from "@/core/types/pago.dto";
import type { ResumenCuentaDto } from "@/core/types/resumenCuenta.dto";
import type { SuscripcionDto } from "@/core/types/suscripcion.dto";
import {
	Assessment,
	PauseCircleOutline
} from "@mui/icons-material";
import {
	alpha,
	Box,
	Card,
	CardContent,
	Chip,
	IconButton,
	LinearProgress,
	Stack,
	Typography,
	useTheme
} from "@mui/material";
import type { FC } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./MiInversions.module.css";

interface MiInversionsProps {
	resumenes?: ResumenCuentaDto[];
	suscripciones?: SuscripcionDto[];
	pagos?: PagoDto[];
}

export const MiInversions: FC<MiInversionsProps> = ({
	resumenes,
	suscripciones,
	pagos,
}) => {
	const theme = useTheme();
	const navigate = useNavigate();

	return (
		<>
			<Stack spacing={3}>
				{resumenes
					?.filter((resumen) => {
						if (resumen.id_suscripcion) {
							const subActiva = suscripciones?.find(
								(s) => s.id === resumen.id_suscripcion,
							);
							return subActiva ? subActiva.activo === true : false;
						}
						if (resumen.hasOwnProperty("activo")) {
							return resumen.activo === true;
						}
						return true;
					})
					.map((resumen) => {
						const tieneMora = pagos?.some(
							(p) =>
								p.id_suscripcion === resumen.id_suscripcion &&
								p.estado_pago === "pendiente" &&
								new Date(p.fecha_vencimiento) < new Date(),
						);
						const subActiva = suscripciones?.find(
							(s) => s.id === resumen.id_suscripcion,
						);

						return (
							<Card
								key={resumen.id}
								elevation={0}
								sx={{
									borderRadius: 3,
									border: `1px solid ${theme.palette.divider}`,
									transition: "all 0.2s",
									"&:hover": {
										transform: "translateY(-4px)",
										borderColor: "primary.main",
										boxShadow: theme.shadows[4],
									},
								}}
							>
								<CardContent sx={{ p: 3 }}>
									<Stack
										direction="row"
										justifyContent="space-between"
										alignItems="center"
										mb={3}
									>
										<Box>
											<Box className={styles.resumenHeader}>
												<Typography variant="h6" fontWeight={800}>
													{resumen.nombre_proyecto}
												</Typography>
												{subActiva && Number(subActiva.saldo_a_favor) > 0 && (
													<Typography className={styles.saldoAFavor} variant="h5">
														Saldo a favor: ${subActiva.saldo_a_favor}
													</Typography>
												)}
											</Box>
											{/* 🆕 Agrupamos las etiquetas para que se vean alineadas, incluyendo la de pausa */}
											<Stack
												direction="row"
												spacing={1}
												sx={{ mt: 1 }}
												flexWrap="wrap"
												useFlexGap
											>
												<Chip
													label={`${resumen.cuotas_pagadas}/${resumen.meses_proyecto || 0} cuotas`}
													size="small"
													variant="outlined"
													sx={{ fontWeight: 700 }}
												/>
												{tieneMora && (
													<Chip
														label="Mora"
														color="error"
														size="small"
														sx={{ fontWeight: 800 }}
													/>
												)}
												{subActiva?.standby_active && (
													<Chip
														icon={<PauseCircleOutline sx={{ fontSize: "14px !important" }} />}
														label={
															subActiva.standby_end_date
																? `PAUSADO HASTA ${new Date(subActiva.standby_end_date + "T00:00:00").toLocaleDateString("es-AR")}`
																: "EN PAUSA"
														}
														color="warning"
														size="small"
														variant="outlined"
														sx={{ fontWeight: 800 }}
													/>
												)}
											</Stack>
										</Box>
										<IconButton
											onClick={() => navigate("/client/finanzas/resumenes")}
											sx={{
												bgcolor: alpha(theme.palette.primary.main, 0.1),
												color: "primary.main",
											}}
										>
											<Assessment />
										</IconButton>
									</Stack>
									<Stack spacing={1}>
										<Stack direction="row" justifyContent="space-between">
											<Typography variant="body2" fontWeight={700} color="text.secondary">
												Avance del Plan
											</Typography>
											<Typography variant="body2" fontWeight={800} color="primary.main">
												{Number(resumen.porcentaje_pagado || 0).toFixed(0)}%
											</Typography>
										</Stack>
										<LinearProgress
											variant="determinate"
											value={Number(resumen.porcentaje_pagado || 0)}
											sx={{
												height: 10,
												borderRadius: 5,
												bgcolor: alpha(theme.palette.primary.main, 0.1),
											}}
										/>
									</Stack>
								</CardContent>
							</Card>
						);
					})}
			</Stack>
		</>
	);
};
