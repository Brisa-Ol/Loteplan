// src/features/admin/pages/Audit/AdminMetrics.tsx

import {
	AssignmentLate,
	BarChart as BarChartIcon,
	Category,
	ManageAccounts,
	PersonSearch,
	ViewList,
	Visibility,
} from "@mui/icons-material";
import {
	Avatar,
	Box,
	Chip,
	IconButton,
	MenuItem,
	Stack,
	TextField,
	Typography,
	alpha,
	useTheme,
} from "@mui/material";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import React, { useMemo, useState } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Tooltip as RechartsTooltip,
	ResponsiveContainer,
	XAxis,
	YAxis,
} from "recharts";

import type { AuditLog } from "@/core/types/auditLog.dto";
import { useAdminMetrics } from "@/features/admin/hooks/metricas/useAdminMetrics";
import { AdminPageHeader } from "@/shared/components/admin/Adminpageheader";
import MetricsGrid from "@/shared/components/admin/Metricsgrid";
import {
	ViewModeToggle,
	type ViewMode,
} from "@/shared/components/admin/Viewmodetoggle";
import {
	DataTable,
	type DataTableColumn,
} from "@/shared/components/data-grid/DataTable";
import { QueryHandler } from "@/shared/components/data-grid/QueryHandler";
import { StatCard } from "@/shared/components/domain/cards/StatCard";
import {
	FilterBar,
	FilterSearch,
	FilterSelect,
} from "@/shared/components/forms/FilterBar";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import AlertBanner from "@/shared/components/ui/Alertbanner";
import ModalDetalleAuditLog from "../ModalDetalleAuditLog/ModalDetalleAuditLog";
import { colors } from "@/core/theme/globalStyles";

// ============================================================================
// SUB-COMPONENTE: ANALYTICS
// ============================================================================

const AuditAnalytics = React.memo<{
	accionCount: Record<string, number>;
	entidadCount: Record<string, number>;
}>(({ accionCount, entidadCount }) => {
	const theme = useTheme();
	const colores = colors

	const accionData = Object.entries(accionCount)
		.map(([name, cantidad]) => ({ name, cantidad }))
		.sort((a, b) => b.cantidad - a.cantidad)
		.slice(0, 8); // top 8

	const entidadData = Object.entries(entidadCount)
		.map(([name, cantidad]) => ({ name, cantidad }))
		.sort((a, b) => b.cantidad - a.cantidad);

	const BAR_COLORS = [
		theme.palette.primary.main,
		colores.success.main,
		theme.palette.warning.main,
		theme.palette.primary.light,
		theme.palette.primary.dark,
		theme.palette.error.main,
		theme.palette.info.main,
	];

	return (
		<Stack spacing={3}>
			{/* Acciones más frecuentes */}
			<Box
				sx={{
					bgcolor: alpha(theme.palette.background.paper, 0.5),
					p: 3,
					borderRadius: 3,
					border: "1px solid",
					borderColor: "divider",
				}}
			>
				<Typography variant="h6" fontWeight={800} mb={3}>
					Acciones más frecuentes
				</Typography>
				<ResponsiveContainer width="100%" height={300}>
					<BarChart
						data={accionData}
						margin={{ top: 10, right: 20, left: 10, bottom: 60 }}
					>
						<CartesianGrid
							strokeDasharray="3 3"
							vertical={false}
							stroke={theme.palette.divider}
						/>
						<XAxis
							dataKey="name"
							tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
							axisLine={false}
							angle={-35}
							textAnchor="end"
							interval={0}
						/>
						<YAxis
							tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
							axisLine={false}
							allowDecimals={false}
						/>
						<RechartsTooltip
							cursor={{ fill: alpha(theme.palette.primary.main, 0.1) }}
							contentStyle={{
								borderRadius: 8,
								border: "none",
								boxShadow: theme.shadows[3],
							}}
							formatter={(val: number) => [val, "Ocurrencias"]}
						/>
						<Bar
							dataKey="cantidad"
							name="Ocurrencias"
							radius={[4, 4, 0, 0]}
							barSize={40}
						>
							{accionData.map((_, i) => (
								<Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
							))}
						</Bar>
					</BarChart>
				</ResponsiveContainer>
			</Box>

			{/* Entidades afectadas */}
			<Box
				sx={{
					bgcolor: alpha(theme.palette.background.paper, 0.5),
					p: 3,
					borderRadius: 3,
					border: "1px solid",
					borderColor: "divider",
				}}
			>
				<Typography variant="h6" fontWeight={800} mb={2}>
					Entidades más afectadas
				</Typography>
				<Stack spacing={1.5}>
					{entidadData.map((item, i) => {
						const max = entidadData[0]?.cantidad ?? 1;
						const pct = Math.round((item.cantidad / max) * 100);
						return (
							<Stack key={item.name} direction="row" alignItems="center" spacing={2}>
								<Typography
									variant="body2"
									fontWeight={600}
									sx={{ minWidth: 160, color: "text.secondary" }}
									noWrap
								>
									{item.name}
								</Typography>
								<Box
									sx={{
										flex: 1,
										height: 10,
										bgcolor: alpha(theme.palette.divider, 0.4),
										borderRadius: 99,
										overflow: "hidden",
									}}
								>
									<Box
										sx={{
											height: "100%",
											width: `${pct}%`,
											bgcolor: BAR_COLORS[i % BAR_COLORS.length],
											borderRadius: 99,
											transition: "width 0.4s ease",
										}}
									/>
								</Box>
								<Typography
									variant="caption"
									fontWeight={700}
									sx={{ minWidth: 30, textAlign: "right" }}
								>
									{item.cantidad}
								</Typography>
							</Stack>
						);
					})}
				</Stack>
			</Box>
		</Stack>
	);
});

AuditAnalytics.displayName = "AuditAnalytics";

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const AdminMetrics: React.FC = () => {
	const theme = useTheme();
	const {
		filteredData,
		isLoading,
		error,
		page,
		totalPages,
		setPage,
		filters,
		handleFilterChange,
		stats,
		accionOptions,  // <-- DESCOMENTADO
		entidadOptions, // <-- DESCOMENTADO
	} = useAdminMetrics();

	const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
	const [modalOpen, setModalOpen] = useState(false);

	const handleViewDetail = (log: AuditLog) => {
		setSelectedLog(log);
		setModalOpen(true);
	};
	const handleCloseModal = () => setModalOpen(false);

	const [viewMode, setViewMode] = useState<ViewMode>("table");

	const dateInputStyles = {
		width: { xs: "50%", sm: 140 },
		bgcolor: "background.paper",
		borderRadius: 1,
		"& input::-webkit-calendar-picker-indicator": {
			cursor: "pointer",
			filter:
				"brightness(0) saturate(100%) invert(46%) sepia(50%) saturate(1637%) hue-rotate(345deg) brightness(90%) contrast(85%)",
		},
	};

	// --------------------------------------------------------------------------
	// COLUMNAS
	// --------------------------------------------------------------------------
	const columns = useMemo<DataTableColumn<AuditLog>[]>(
		() => [
			{
				id: "id",
				label: "ID",
				minWidth: 60,
				render: (row) => (
					<Typography variant="caption" fontWeight={700} color="text.secondary">
						#{row.id}
					</Typography>
				),
			},
			{
				id: "usuario_id",
				label: "Admin",
				minWidth: 100,
				render: (row) => (
					<Stack direction="row" alignItems="center" spacing={1}>
						<Avatar
							sx={{
								width: 30,
								height: 30,
								fontSize: "0.8rem",
								bgcolor: alpha(theme.palette.primary.main, 0.1),
								color: "primary.main",
								fontWeight: 700,
							}}
						>
							Id: {row.usuario_id}
						</Avatar>
					</Stack>
				),
			},
			{
				id: "accion",
				label: "Acción",
				minWidth: 180,
				render: (row) => (
					<Chip
						label={row.accion.replace(/_/g, " ")}
						size="small"
						sx={{
							fontWeight: 700,
							fontSize: "0.7rem",
							bgcolor: alpha(theme.palette.warning.main, 0.12),
							color: "warning.dark",
							border: "1px solid",
							borderColor: alpha(theme.palette.warning.main, 0.3),
						}}
					/>
				),
			},
			{
				id: "entidad_tipo",
				label: "Entidad",
				minWidth: 140,
				render: (row) => (
					<Box>
						<Typography variant="body2" fontWeight={600}>
							{row.entidad_tipo}
						</Typography>
						<Typography variant="caption" color="text.secondary">
							ID #{row.entidad_id}
						</Typography>
					</Box>
				),
			},
			{
				id: "motivo",
				label: "Motivo",
				minWidth: 200,
				render: (row) => (
					<Typography
						variant="body2"
						color={row.motivo ? "text.primary" : "text.disabled"}
						sx={{
							maxWidth: 260,
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap",
						}}
					>
						{row.motivo ?? "Sin motivo registrado"}
					</Typography>
				),
			},
			{
				id: "ip_origen",
				label: "IP Origen",
				minWidth: 120,
				render: (row) => (
					<Typography
						variant="caption"
						fontFamily="monospace"
						color="text.secondary"
					>
						{row.ip_origen ?? "-"}
					</Typography>
				),
			},
			{
				id: "created_at",
				label: "Fecha",
				minWidth: 120,
				render: (row) => (
					<Box>
						<Typography variant="body2">
							{format(new Date(row.created_at), "dd/MM/yyyy", { locale: es })}
						</Typography>
						<Typography variant="caption" color="text.secondary">
							{format(new Date(row.created_at), "HH:mm", { locale: es })} hs
						</Typography>
					</Box>
				),
			},
			{
				id: "acciones", label: "Ver Detalles", minWidth: 60, align: "right",
				render: (row) => (
					<Box>
						<IconButton
							size="small"
							onClick={() => handleViewDetail(row)}
							sx={{ color: "primary.main", bgcolor: alpha(theme.palette.primary.main, 0.05), "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.15) } }}
						>
							<Visibility fontSize="small" />
						</IconButton>
					</Box>
				),
			},
		],
		[theme],
	);

	// --------------------------------------------------------------------------
	// RENDER
	// --------------------------------------------------------------------------
	return (
		<PageContainer maxWidth="xl" sx={{ py: 3 }}>
			{/* 1. HEADER */}
			<AdminPageHeader
				title="Métricas de Administradores"
				subtitle="Auditoría de acciones administrativas sobre el sistema."
			/>

			{/* 2. ERRORES */}
			{error && (
				<AlertBanner
					severity="error"
					title="Error de Sistema"
					message={error.message || "No se pudieron cargar los logs de auditoría."}
				/>
			)}

			{/* 3. KPIs */}
			<MetricsGrid columns={{ xs: 1, sm: 2, lg: 4 }}>
				<StatCard
					title="Total de Logs"
					value={stats.totalLogs.toLocaleString("es-AR")}
					subtitle="Registros en el sistema"
					icon={<AssignmentLate />}
					color="primary"
					loading={isLoading}
				/>
				<StatCard
					title="Admins Activos"
					value={stats.adminsUnicos}
					subtitle="En la página actual"
					icon={<ManageAccounts />}
					color="info"
					loading={isLoading}
				/>
				<StatCard
					title="Acción más frecuente"
					value={stats.accionMasFrecuente}
					subtitle="En el período filtrado"
					icon={<PersonSearch />}
					color="warning"
					loading={isLoading}
				/>
				<StatCard
					title="Entidad más afectada"
					value={stats.entidadMasAfectada}
					subtitle="Modelo con más cambios"
					icon={<Category />}
					color="error"
					loading={isLoading}
				/>
			</MetricsGrid>

			{/* 4. CONTROLES */}
			<Stack spacing={2} mb={3}>
				<Stack direction="row" justifyContent="flex-end">
					<ViewModeToggle
						value={viewMode}
						onChange={setViewMode}
						options={[
							{ value: "table", label: "Tabla", icon: <ViewList fontSize="small" /> },
							{
								value: "analytics",
								label: "Métricas",
								icon: <BarChartIcon fontSize="small" />,
							},
						]}
					/>
				</Stack>

				<FilterBar sx={{ p: 2, bgcolor: 'background.paper', borderRadius: '12px', border: '1px solid', borderColor: 'divider' }}>
					<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', width: '100%' }}>

						{/* Buscador: Toma el espacio restante */}
						<Box sx={{ flex: 1, minWidth: { xs: '100%', md: 280 } }}>
							<FilterSearch
								placeholder="Buscar por acción, entidad, motivo..."
								value={filters.searchTerm || ""}
								onSearch={(value) => handleFilterChange("searchTerm", value)}
								fullWidth
							/>
						</Box>

						{/* Controles Derecha: Fechas y Selects */}
						<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', width: { xs: '100%', xl: 'auto' } }}>

							{/* Fechas */}
							<Stack direction="row" spacing={1} alignItems="center" sx={{ width: { xs: '100%', sm: 'auto' } }}>
								<TextField
									label="Desde"
									type="date"
									size="small"
									InputLabelProps={{ shrink: true }}
									value={filters.dateFrom || ""}
									onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
									sx={dateInputStyles}
								/>
								<Typography color="text.secondary">-</Typography>
								<TextField
									label="Hasta"
									type="date"
									size="small"
									InputLabelProps={{ shrink: true }}
									value={filters.dateTo || ""}
									onChange={(e) => handleFilterChange("dateTo", e.target.value)}
									sx={dateInputStyles}
								/>
							</Stack>

							{/* Selects: Dinámicos con fondo blanco */}
							<FilterSelect
								label="Acción"
								value={filters.accion || "all"}
								onChange={(e) => handleFilterChange("accion", e.target.value)}
								sx={{ minWidth: 160, flex: { xs: 1, sm: 'none' }, bgcolor: 'background.paper' }}
							>
								<MenuItem value="all">Todas</MenuItem>
								{accionOptions.map((a) => (
									<MenuItem key={a} value={a}>
										{a.replace(/_/g, " ")}
									</MenuItem>
								))}
							</FilterSelect>

							<FilterSelect
								label="Entidad"
								value={filters.entidadTipo || "all"}
								onChange={(e) => handleFilterChange("entidadTipo", e.target.value)}
								sx={{ minWidth: 160, flex: { xs: 1, sm: 'none' }, bgcolor: 'background.paper' }}
							>
								<MenuItem value="all">Todas</MenuItem>
								{entidadOptions.map((e) => (
									<MenuItem key={e} value={e}>
										{e}
									</MenuItem>
								))}
							</FilterSelect>

						</Box>
					</Box>
				</FilterBar>
			</Stack>

			{/* 5. CONTENIDO */}
			{viewMode === "analytics" ? (
				<AuditAnalytics
					accionCount={stats.accionCount}
					entidadCount={stats.entidadCount}
				/>
			) : (
				<QueryHandler isLoading={isLoading} error={error}>
					<DataTable
						columns={columns}
						data={filteredData}
						getRowKey={(row) => row.id}
						emptyMessage="No se encontraron logs con los filtros actuales."
						pagination={true}
						defaultRowsPerPage={10}
					/>
				</QueryHandler>
			)}

			{/* Paginación server-side (si DataTable no la maneja) */}
			{totalPages > 1 && viewMode === "table" && (
				<Stack direction="row" justifyContent="center" spacing={1} mt={2}>
					{Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
						<Chip
							key={p}
							label={p}
							size="small"
							onClick={() => setPage(p)}
							color={p === page ? "primary" : "default"}
							sx={{ fontWeight: 700, cursor: "pointer" }}
						/>
					))}
				</Stack>
			)}

			<ModalDetalleAuditLog
				open={modalOpen}
				log={selectedLog}
				onClose={handleCloseModal}
			/>
		</PageContainer>
	);
};

export default AdminMetrics;