// src/features/admin/pages/Audit/modal/ModalDetalleAuditLog.tsx

import {
	Close,
	Computer,
	DevicesOther,
	History,
	NewReleases,
	Person,
	Schedule,
	Wifi,
} from "@mui/icons-material";
import {
	Box,
	Chip,
	Dialog,
	DialogContent,
	DialogTitle,
	Divider,
	IconButton,
	Stack,
	Tab,
	Tabs,
	Typography,
	alpha,
	useTheme,
} from "@mui/material";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import React, { useState } from "react";

import type { AuditLog } from "@/core/types/auditLog.dto";

// ============================================================================
// HELPERS
// ============================================================================

/** Formatea un objeto JSON como una lista de filas clave → valor */
const JsonRows: React.FC<{ data: Record<string, any> }> = ({ data }) => {
	const theme = useTheme();
	return (
		<Stack spacing={0.5}>
			{Object.entries(data).map(([key, val]) => {
				const display =
					val === null ? (
						<Typography variant="body2" color="text.disabled" fontStyle="italic">
							null
						</Typography>
					) : typeof val === "boolean" ? (
						<Chip
							label={val ? "true" : "false"}
							size="small"
							color={val ? "success" : "default"}
							sx={{ height: 20, fontSize: "0.7rem", fontWeight: 700 }}
						/>
					) : typeof val === "object" ? (
						<Typography variant="body2" fontFamily="monospace" color="text.secondary">
							{JSON.stringify(val)}
						</Typography>
					) : (
						<Typography variant="body2" fontFamily="monospace">
							{String(val)}
						</Typography>
					);

				return (
					<Stack
						key={key}
						direction="row"
						spacing={1.5}
						alignItems="flex-start"
						sx={{
							px: 1.5,
							py: 0.75,
							borderRadius: 1,
							"&:nth-of-type(odd)": {
								bgcolor: alpha(theme.palette.primary.light, 0.7),
							},
						}}
					>
						<Typography
							variant="body2"
							fontWeight={700}
							color="text.secondary"
							sx={{ minWidth: 160, flexShrink: 0 }}
						>
							{key}
						</Typography>
						{display}
					</Stack>
				);
			})}
		</Stack>
	);
};

// ============================================================================
// PROPS
// ============================================================================

interface ModalDetalleAuditLogProps {
	open: boolean;
	log: AuditLog | null;
	onClose: () => void;
}

// ============================================================================
// COMPONENTE
// ============================================================================

export const ModalDetalleAuditLog: React.FC<ModalDetalleAuditLogProps> = ({
	open,
	log,
	onClose,
}) => {
	const theme = useTheme();
	const [tab, setTab] = useState(0);

	if (!log) return null;

	// Parsea user-agent en partes legibles
	const parseUserAgent = (ua: string) => {
		const isMobile = /mobile/i.test(ua);
		const isChrome = /chrome/i.test(ua);
		const isFirefox = /firefox/i.test(ua);
		const isSafari = /safari/i.test(ua) && !isChrome;
		const isWindows = /windows/i.test(ua);
		const isMac = /macintosh|mac os/i.test(ua);
		const isLinux = /linux/i.test(ua);

		const browser = isChrome
			? "Chrome"
			: isFirefox
				? "Firefox"
				: isSafari
					? "Safari"
					: "Desconocido";
		const os = isWindows
			? "Windows"
			: isMac
				? "macOS"
				: isLinux
					? "Linux"
					: "Desconocido";

		return { browser, os, isMobile, raw: ua };
	};

	const ua = log.user_agent ? parseUserAgent(log.user_agent) : null;

	const hasPrev =
		!!log.datos_previos && Object.keys(log.datos_previos).length > 0;
	const hasNew = !!log.datos_nuevos && Object.keys(log.datos_nuevos).length > 0;

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="md"
			fullWidth
			PaperProps={{
				sx: {
					borderRadius: 3,
					border: "1px solid",
					borderColor: "divider",
					backgroundImage: "none",
				},
			}}
		>
			{/* ---- HEADER ---- */}
			<DialogTitle sx={{ p: 0 }}>
				<Stack
					direction="row"
					alignItems="center"
					justifyContent="space-between"
					sx={{ px: 3, pt: 2.5, pb: 1.5 }}
				>
					<Stack spacing={0.5}>
						<Stack direction="row" alignItems="center" spacing={1.5}>
							<Typography variant="h6" fontWeight={800}>
								Detalle del Log
							</Typography>
							<Chip
								label={`#${log.id}`}
								size="small"
								sx={{ fontWeight: 700, fontFamily: "monospace" }}
							/>
						</Stack>
						<Chip
							label={log.accion.replace(/_/g, " ")}
							size="small"
							sx={{
								alignSelf: "flex-start",
								fontWeight: 700,
								fontSize: "0.72rem",
								bgcolor: alpha(theme.palette.warning.main, 0.12),
								color: "warning.dark",
								border: "1px solid",
								borderColor: alpha(theme.palette.warning.main, 0.3),
							}}
						/>
					</Stack>
					<IconButton onClick={onClose} size="small">
						<Close fontSize="small" />
					</IconButton>
				</Stack>

				{/* Metadatos rápidos */}
				<Stack
					direction="row"
					spacing={3}
					flexWrap="wrap"
					sx={{ px: 3, pb: 2, gap: 1.5 }}
				>
					<Stack direction="row" alignItems="center" spacing={0.75}>
						<Person sx={{ fontSize: 16, color: "text.secondary" }} />
						<Typography variant="caption" color="text.secondary">
							Admin ID{" "}
							<strong style={{ color: theme.palette.text.primary }}>
								{log.usuario_id}
							</strong>
						</Typography>
					</Stack>
					<Stack direction="row" alignItems="center" spacing={0.75}>
						<Schedule sx={{ fontSize: 16, color: "text.secondary" }} />
						<Typography variant="caption" color="text.secondary">
							{format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: es })}
						</Typography>
					</Stack>
					<Stack direction="row" alignItems="center" spacing={0.75}>
						<Wifi sx={{ fontSize: 16, color: "text.secondary" }} />
						<Typography
							variant="caption"
							fontFamily="monospace"
							color="text.secondary"
						>
							{log.ip_origen ?? "—"}
						</Typography>
					</Stack>
					<Stack direction="row" alignItems="center" spacing={0.75}>
						<DevicesOther sx={{ fontSize: 16, color: "text.secondary" }} />
						<Typography variant="caption" color="text.secondary">
							{log.entidad_tipo}{" "}
							<strong style={{ color: theme.palette.text.primary }}>
								#{log.entidad_id}
							</strong>
						</Typography>
					</Stack>
				</Stack>

				<Divider />

				{/* Tabs */}
				<Tabs
					value={tab}
					onChange={(_, v) => setTab(v)}
					sx={{ px: 2, minHeight: 42 }}
					TabIndicatorProps={{ style: { height: 3, borderRadius: 2 } }}
				>
					<Tab
						label="Cambios"
						sx={{ fontWeight: 700, minHeight: 42, fontSize: "0.82rem" }}
					/>
					<Tab
						label="Contexto"
						sx={{ fontWeight: 700, minHeight: 42, fontSize: "0.82rem" }}
					/>
				</Tabs>
				<Divider />
			</DialogTitle>

			{/* ---- CONTENIDO ---- */}
			<DialogContent sx={{ p: 0 }}>
				{/* TAB 0 — CAMBIOS */}
				{tab === 0 && (
					<Box sx={{ p: 3 }}>
						{/* Motivo */}
						{log.motivo && (
							<Box
								sx={{
									mb: 3,
									p: 2,
									borderRadius: 2,
									bgcolor: alpha(theme.palette.info.main, 0.06),
									border: "1px solid",
									borderColor: alpha(theme.palette.info.main, 0.2),
								}}
							>
								<Typography
									variant="caption"
									fontWeight={700}
									color="info.main"
									display="block"
									mb={0.5}
								>
									MOTIVO
								</Typography>
								<Typography variant="body2">{log.motivo}</Typography>
							</Box>
						)}

						{/* Datos previos / nuevos lado a lado */}
						<Stack
							direction={{ xs: "column", md: "row" }}
							spacing={2}
							alignItems="flex-start"
						>
							{/* Datos previos */}
							<Box sx={{ flex: 1, width: "100%" }}>
								<Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
									<History sx={{ fontSize: 18, color: "text.secondary" }} />
									<Typography
										variant="subtitle2"
										fontWeight={700}
										color="text.secondary"
									>
										Estado anterior
									</Typography>
								</Stack>
								{hasPrev ? (
									<Box
										sx={{
											borderRadius: 2,
											border: "1px solid",
											borderColor: alpha(theme.palette.error.main, 0.2),
											bgcolor: alpha(theme.palette.error.main, 0.03),
											overflow: "hidden",
										}}
									>
										<JsonRows data={log.datos_previos!} />
									</Box>
								) : (
									<Typography variant="body2" color="text.disabled" fontStyle="italic">
										Sin datos previos registrados
									</Typography>
								)}
							</Box>

							{/* Datos nuevos */}
							<Box sx={{ flex: 1, width: "100%" }}>
								<Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
									<NewReleases sx={{ fontSize: 18, color: "text.secondary" }} />
									<Typography
										variant="subtitle2"
										fontWeight={700}
										color="text.secondary"
									>
										Estado nuevo
									</Typography>
								</Stack>
								{hasNew ? (
									<Box
										sx={{
											borderRadius: 2,
											border: "1px solid",
											borderColor: alpha(theme.palette.success.main, 0.2),
											bgcolor: alpha(theme.palette.success.main, 0.03),
											overflow: "hidden",
										}}
									>
										<JsonRows data={log.datos_nuevos!} />
									</Box>
								) : (
									<Typography variant="body2" color="text.disabled" fontStyle="italic">
										Sin datos nuevos registrados
									</Typography>
								)}
							</Box>
						</Stack>
					</Box>
				)}

				{/* TAB 1 — CONTEXTO */}
				{tab === 1 && (
					<Box sx={{ p: 3 }}>
						{/* User Agent */}
						<Typography variant="subtitle2" fontWeight={700} mb={1.5}>
							Información del cliente
						</Typography>

						{ua ? (
							<Stack spacing={2}>
								{/* Resumen visual */}
								<Stack direction="row" spacing={2} flexWrap="wrap">
									<Box
										sx={{
											px: 2,
											py: 1.5,
											borderRadius: 2,
											border: "1px solid",
											borderColor: "divider",
											bgcolor: alpha(theme.palette.background.paper, 0.5),
											minWidth: 120,
										}}
									>
										<Typography variant="caption" color="text.secondary" display="block">
											Navegador
										</Typography>
										<Typography variant="body2" fontWeight={700}>
											{ua.browser}
										</Typography>
									</Box>
									<Box
										sx={{
											px: 2,
											py: 1.5,
											borderRadius: 2,
											border: "1px solid",
											borderColor: "divider",
											bgcolor: alpha(theme.palette.background.paper, 0.5),
											minWidth: 120,
										}}
									>
										<Typography variant="caption" color="text.secondary" display="block">
											Sistema operativo
										</Typography>
										<Typography variant="body2" fontWeight={700}>
											{ua.os}
										</Typography>
									</Box>
									<Box
										sx={{
											px: 2,
											py: 1.5,
											borderRadius: 2,
											border: "1px solid",
											borderColor: "divider",
											bgcolor: alpha(theme.palette.background.paper, 0.5),
											minWidth: 120,
										}}
									>
										<Typography variant="caption" color="text.secondary" display="block">
											Dispositivo
										</Typography>
										<Stack direction="row" alignItems="center" spacing={0.5}>
											<Computer sx={{ fontSize: 16 }} />
											<Typography variant="body2" fontWeight={700}>
												{ua.isMobile ? "Mobile" : "Desktop"}
											</Typography>
										</Stack>
									</Box>
								</Stack>

								{/* Raw UA */}
								<Box
									sx={{
										p: 2,
										borderRadius: 2,
										bgcolor: alpha(theme.palette.secondary.dark, 2),
										border: "1px solid",
										borderColor: "divider",
									}}
								>
									<Typography
										variant="caption"
										fontWeight={700}
										color="text.secondary"
										display="block"
										mb={0.5}
									>
										USER-AGENT COMPLETO
									</Typography>
									<Typography
										variant="caption"
										fontFamily="monospace"
										color="text.secondary"
										sx={{ wordBreak: "break-all" }}
									>
										{ua.raw}
									</Typography>
								</Box>
							</Stack>
						) : (
							<Typography variant="body2" color="text.disabled" fontStyle="italic">
								Sin información de cliente registrada
							</Typography>
						)}

						{/* IP */}
						<Divider sx={{ my: 3 }} />
						<Typography variant="subtitle2" fontWeight={700} mb={1.5}>
							IP de origen
						</Typography>
						<Stack direction="row" alignItems="center" spacing={1}>
							<Wifi color="action" />
							<Typography variant="body1" fontFamily="monospace" fontWeight={600}>
								{log.ip_origen ?? "—"}
							</Typography>
						</Stack>
					</Box>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default ModalDetalleAuditLog;
