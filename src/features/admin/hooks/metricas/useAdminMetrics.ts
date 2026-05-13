// src/features/admin/hooks/audit/useAdminMetrics.ts

import { getAuditLogs } from "@/core/api/services/auditLog.service";
import type { AuditLog, AuditLogRequestDto } from "@/core/types/auditLog.dto";
import { useCallback, useEffect, useMemo, useState } from "react";

// ============================================================================
// TIPOS INTERNOS
// ============================================================================

export interface AuditLogFilters {
	searchTerm: string;
	accion: string;
	entidadTipo: string;
	dateFrom: string;
	dateTo: string;
}

// ============================================================================
// HOOK
// ============================================================================

export const useAdminMetrics = () => {
	// --------------------------------------------------------------------------
	// Estado de datos
	// --------------------------------------------------------------------------
	const [logs, setLogs] = useState<AuditLog[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	// Paginación server-side
	const [page, setPage] = useState(1);
	const [limit] = useState(50);
	const [total, setTotal] = useState(0);
	const [totalPages, setTotalPages] = useState(0);

	// --------------------------------------------------------------------------
	// Filtros
	// --------------------------------------------------------------------------
	const [filters, setFilters] = useState<AuditLogFilters>({
		searchTerm: "",
		accion: "all",
		entidadTipo: "all",
		dateFrom: "",
		dateTo: "",
	});

	// --------------------------------------------------------------------------
	// Fetch
	// --------------------------------------------------------------------------
	const fetchLogs = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const params: AuditLogRequestDto = {
				page,
				limit,
				...(filters.accion !== "all" && { accion: filters.accion }),
				...(filters.entidadTipo !== "all" && { entidadTipo: filters.entidadTipo }),
				...(filters.dateFrom && { fechaDesde: filters.dateFrom }),
				...(filters.dateTo && { fechaHasta: filters.dateTo }),
			};
			const res = await getAuditLogs(params);

			console.log("Respuesta completa del servicio:", res);
			console.log("res.data:", res.data);
			console.log("res.data.data:", res.data?.data);
			console.log("pagination:", res.data?.pagination);
			setLogs(res.data.data);
			setTotal(res.data.pagination.total);
			setTotalPages(res.data.pagination.totalPages);
		} catch (err) {
			setError(err instanceof Error ? err : new Error("Error al cargar logs"));
		} finally {
			setIsLoading(false);
		}
	}, [page, limit, filters]);

	useEffect(() => {
		fetchLogs();
	}, [fetchLogs]);

	// Cuando cambian los filtros volvemos a página 1
	const handleFilterChange = useCallback(
		<K extends keyof AuditLogFilters>(key: K, value: AuditLogFilters[K]) => {
			setFilters((prev) => ({ ...prev, [key]: value }));
			setPage(1);
		},
		[],
	);

	// --------------------------------------------------------------------------
	// Filtrado client-side: sólo searchTerm (el resto va al backend)
	// --------------------------------------------------------------------------
	const filteredData = useMemo(() => {
		const term = filters.searchTerm.toLowerCase().trim();
		if (!term) return logs;
		return logs.filter(
			(log) =>
				log.accion.toLowerCase().includes(term) ||
				log.entidad_tipo.toLowerCase().includes(term) ||
				String(log.usuario_id).includes(term) ||
				(log.motivo?.toLowerCase().includes(term) ?? false),
		);
	}, [logs, filters.searchTerm]);

	// --------------------------------------------------------------------------
	// KPIs — calculados sobre TODOS los logs de la página actual
	// --------------------------------------------------------------------------
	const stats = useMemo(() => {
		const accionCount = filteredData.reduce<Record<string, number>>(
			(acc, log) => {
				acc[log.accion] = (acc[log.accion] ?? 0) + 1;
				return acc;
			},
			{},
		);

		const entidadCount = filteredData.reduce<Record<string, number>>(
			(acc, log) => {
				acc[log.entidad_tipo] = (acc[log.entidad_tipo] ?? 0) + 1;
				return acc;
			},
			{},
		);

		const accionMasFrecuente =
			Object.entries(accionCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";

		const entidadMasAfectada =
			Object.entries(entidadCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";

		// Admins únicos en la página actual
		const adminsUnicos = new Set(filteredData.map((l) => l.usuario_id)).size;

		return {
			totalLogs: total, // total real del backend
			totalEnPagina: filteredData.length,
			accionMasFrecuente,
			entidadMasAfectada,
			adminsUnicos,
			accionCount,
			entidadCount,
		};
	}, [filteredData, total]);

	// --------------------------------------------------------------------------
	// Opciones únicas para los selects (derivadas de los datos cargados)
	// NUEVO CÓDIGO
	const [accionOptions, setAccionOptions] = useState<string[]>([]);
	const [entidadOptions, setEntidadOptions] = useState<string[]>([]);

	// Este effect acumula las opciones nuevas sin borrar las viejas
	useEffect(() => {
		if (logs.length > 0) {
			setAccionOptions((prev) => {
				const nuevasAcciones = logs.map((l) => l.accion);
				// Combina las anteriores con las nuevas y quita duplicados
				return Array.from(new Set([...prev, ...nuevasAcciones])).sort();
			});

			setEntidadOptions((prev) => {
				const nuevasEntidades = logs.map((l) => l.entidad_tipo);
				return Array.from(new Set([...prev, ...nuevasEntidades])).sort();
			});
		}
	}, [logs]);

	return {
		// datos
		filteredData,
		isLoading,
		error,
		// paginación
		page,
		limit,
		total,
		totalPages,
		setPage,
		// filtros
		filters,
		handleFilterChange,
		// métricas
		stats,
		// opciones selects
		accionOptions,
		entidadOptions,
		// acciones
		refetch: fetchLogs,
	};
};
