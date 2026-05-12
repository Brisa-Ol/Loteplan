import type { AuditLogRequestDto } from "@/core/types/auditLog.dto";
import httpService from "../httpService";

const BASE_ENDPOINT = "/audit";

"/api/audit?page=1&limit=2"

export const getAuditLogs = async (data: AuditLogRequestDto) => {
    return await httpService.get(`${BASE_ENDPOINT}`, { params: { ...data } });
}

export const getAuditLogsByEntidad = async (data: AuditLogRequestDto) => {
    return await httpService.get(`${BASE_ENDPOINT}/entidad/${data.entidadTipo}/${data.entidadId}`, { params: { ...data } });
}

export const limpiarAuditLogs = async () => {
    return await httpService.delete(`${BASE_ENDPOINT}/limpiar`,);
}
