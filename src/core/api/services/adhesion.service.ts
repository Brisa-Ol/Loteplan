import type {
  AdhesionDto,
  AdhesionMetricsDto,
  ConfirmarPagoCuotaDto,
  CrearAdhesionDto,
  ForzarPagoCuotaDto,
  IniciarPagoCuotaResponse,
  PagarCuotaAdhesionDto,
  PagoAdhesionDto
} from '@/core/types/adhesion.dto';
import type { AxiosResponse } from 'axios';
import httpService from '../httpService';

const BASE_ENDPOINT = '/adhesion';



  // =================================================
  // 👤 RUTAS DE USUARIO
  // =================================================
  
  // Crear una nueva adhesión (plan de pago)
  export const createAdhesion = async (data: CrearAdhesionDto): Promise<AxiosResponse<{ success: boolean, data: AdhesionDto }>> => {
    return await httpService.post(`${BASE_ENDPOINT}/`, data);
  }

  // Obtener una adhesión específica por su ID (solo si pertenece al usuario)
  export const getAdhesionById = async (id: number): Promise<AxiosResponse<{ success: boolean, data: AdhesionDto }>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}`);
  }

  // Listar todas las adhesiones del usuario autenticado
  export const getAllAdhesionsByUser = async (): Promise<AxiosResponse<{ success: boolean, data: AdhesionDto[] }>> => {
    return await httpService.get(`${BASE_ENDPOINT}/usuario`);
  }

  // Obtener la adhesión asociada a una suscripción (útil desde el perfil de suscripción)
  export const getAdhesionBySubscriptionId = async (suscripcionId: number): Promise<AxiosResponse<{ success: boolean, data: AdhesionDto }>> => {
    return await httpService.get(`${BASE_ENDPOINT}/suscripcion/${suscripcionId}`);
  }

// adhesion.service.ts
export const iniciarCancelacionAdhesion = async (
  id: number,
  motivo?: string
): Promise<AxiosResponse<any>> => {
  return await httpService.post(`${BASE_ENDPOINT}/${id}/iniciar-cancelacion`, {
    motivo: motivo ?? "Baja solicitada por el usuario"
  });
}
// Confirmar cancelación de adhesión (Paso 2 - Valida código 2FA)
export const confirmarCancelacionAdhesion = async (data: { adhesionId: number, codigo_2fa: string }): Promise<AxiosResponse<any>> => {
  return await httpService.post(`${BASE_ENDPOINT}/confirmar-cancelacion`, data);
}

// Paso 1: Iniciar pago de cuota (sin 2FA → redirige directo; con 2FA → devuelve 202)
export const iniciarPagoCuota = async (
  data: PagarCuotaAdhesionDto
): Promise<AxiosResponse<IniciarPagoCuotaResponse>> => {
  return await httpService.post(`${BASE_ENDPOINT}/iniciar-pago-cuota`, data);
};

// Paso 2: Confirmar pago de cuota con código 2FA
export const confirmarPagoCuota = async (
  data: ConfirmarPagoCuotaDto
): Promise<AxiosResponse<{ success: boolean; redirectUrl: string }>> => {
  return await httpService.post(`${BASE_ENDPOINT}/confirmar-pago-cuota`, data);
};
  // =================================================
  // 👮 RUTAS DE ADMINISTRADOR
  // =================================================

  // Forzar el pago de una cuota de adhesión (admin)
  export const forzarPagoCuota = async (data: ForzarPagoCuotaDto): Promise<AxiosResponse<{ success: boolean, message: string, adhesionId: number, completada: boolean }>> => {
    return await httpService.post(`${BASE_ENDPOINT}/admin/forzar-pago`, data);
  }

  // Listar todas las adhesiones del sistema (auditoría)
  export const getAllAdhesiones = async (): Promise<AxiosResponse<{ success: boolean, total: number, data: AdhesionDto[] }>> => {
    return await httpService.get(`${BASE_ENDPOINT}/admin/all`);
  }

  // 📊 MÉTRICAS Y AUDITORÍA PARA ADMINISTRADORES

  // Obtener métricas generales de adhesiones (recaudación, morosidad, etc.)
  export const getAdhesionMetrics = async (): Promise<AxiosResponse<{ success: boolean, data: AdhesionMetricsDto }>> => {
    return await httpService.get(`${BASE_ENDPOINT}/admin/metrics`);
  }

  // Obtener lista de cuotas de adhesión vencidas (con datos de usuario y proyecto)
  export const getOverdueAdhesionPayments = async (): Promise<AxiosResponse<{ success: boolean, data: PagoAdhesionDto[] }>> => {
    return await httpService.get(`${BASE_ENDPOINT}/admin/overdue`);
  }

  // Obtener historial completo de pagos de una adhesión específica (para auditoría)
  export const getAdhesionHistory = async (adhesionId: number): Promise<AxiosResponse<{ success: boolean, data: AdhesionDto }>> => {
    return await httpService.get(`${BASE_ENDPOINT}/admin/payment-history/${adhesionId}`);
  };