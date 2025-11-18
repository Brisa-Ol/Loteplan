// src/services/suscripcion_proyecto.service.ts
import type { Confirmar2FADto, Confirmar2FAResponseDto, ConfirmarPagoDto, IniciarSuscripcionDto, IniciarSuscripcionResponseDto, MetricasCancelacionDto, MetricasMorosidadDto, SuscripcionProyectoDto } from '../types/dto/suscripcionProyecto.dto';
import httpService from './httpService';


/**
 * Servicio para gestionar operaciones relacionadas con Suscripciones a Proyectos
 */
export const suscripcionProyectoService = {
  /**
   * 🟢 USUARIO: Inicia el proceso de suscripción (Paso 1)
   * Genera la transacción pendiente y solicita 2FA
   */
  async iniciarSuscripcion(data: IniciarSuscripcionDto): Promise<IniciarSuscripcionResponseDto> {
    const { data: response } = await httpService.post<IniciarSuscripcionResponseDto>(
      '/suscripciones-proyectos/iniciar-pago',
      data
    );
    return response;
  },

  /**
   * 🟢 USUARIO: Confirma el código 2FA y genera URL de checkout (Paso 2)
   */
  async confirmarCon2FA(data: Confirmar2FADto): Promise<Confirmar2FAResponseDto> {
    const { data: response } = await httpService.post<Confirmar2FAResponseDto>(
      '/suscripciones-proyectos/confirmar-2fa',
      data
    );
    return response;
  },

  /**
   * 🟡 WEBHOOK: Confirma el pago exitoso (llamado por MercadoPago o el frontend)
   * ⚠️ NOTA: Si es webhook de MP, no necesita autenticación
   */
  async confirmarPago(data: ConfirmarPagoDto): Promise<SuscripcionProyectoDto> {
    const { data: response } = await httpService.post<SuscripcionProyectoDto>(
      '/suscripciones-proyectos/confirmar-pago',
      data
    );
    return response;
  },

  /**
   * 🟢 USUARIO: Obtiene todas las suscripciones activas
   */
  async getSuscripcionesActivas(): Promise<SuscripcionProyectoDto[]> {
    const { data } = await httpService.get<SuscripcionProyectoDto[]>(
      '/suscripciones-proyectos/activas'
    );
    return data;
  },

  /**
   * 🟢 USUARIO: Obtiene mis suscripciones
   */
  async getMisSuscripciones(): Promise<SuscripcionProyectoDto[]> {
    const { data } = await httpService.get<SuscripcionProyectoDto[]>(
      '/suscripciones-proyectos/mis_suscripciones'
    );
    return data;
  },

  /**
   * 🟢 USUARIO: Obtiene una de mis suscripciones por ID
   */
  async getMiSuscripcionById(id: number): Promise<SuscripcionProyectoDto> {
    const { data } = await httpService.get<SuscripcionProyectoDto>(
      `/suscripciones-proyectos/mis_suscripciones/${id}`
    );
    return data;
  },

  /**
   * 🟢 USUARIO: Cancela una de mis suscripciones
   */
  async cancelarMiSuscripcion(id: number): Promise<{ message: string }> {
    const { data } = await httpService.delete<{ message: string }>(
      `/suscripciones-proyectos/mis_suscripciones/${id}`
    );
    return data;
  },

  /**
   * 🔴 ADMIN: Obtiene todas las suscripciones (activas e inactivas)
   */
  async getAllSuscripciones(): Promise<SuscripcionProyectoDto[]> {
    const { data } = await httpService.get<SuscripcionProyectoDto[]>(
      '/suscripciones-proyectos'
    );
    return data;
  },

  /**
   * 🔴 ADMIN: Obtiene una suscripción por ID
   */
  async getSuscripcionById(id: number): Promise<SuscripcionProyectoDto> {
    const { data } = await httpService.get<SuscripcionProyectoDto>(
      `/suscripciones-proyectos/${id}`
    );
    return data;
  },

  /**
   * 🔴 ADMIN: Cancela una suscripción (por ID, sin validación de usuario)
   */
  async cancelarSuscripcion(id: number): Promise<{ message: string }> {
    const { data } = await httpService.delete<{ message: string }>(
      `/suscripciones-proyectos/${id}`
    );
    return data;
  },

  /**
   * 🔴 ADMIN: Obtiene todas las suscripciones activas de un proyecto
   */
  async getSuscripcionesActivasByProyecto(proyectoId: number): Promise<SuscripcionProyectoDto[]> {
    const { data } = await httpService.get<SuscripcionProyectoDto[]>(
      `/suscripciones-proyectos/proyecto/${proyectoId}`
    );
    return data;
  },

  /**
   * 🔴 ADMIN: Obtiene TODAS las suscripciones de un proyecto (activas e inactivas)
   */
  async getAllSuscripcionesByProyecto(proyectoId: number): Promise<SuscripcionProyectoDto[]> {
    const { data } = await httpService.get<SuscripcionProyectoDto[]>(
      `/suscripciones-proyectos/proyecto/${proyectoId}/all`
    );
    return data;
  },

  /**
   * 🔴 ADMIN: Obtiene métricas de morosidad (KPI 4)
   */
  async getMetricasMorosidad(): Promise<MetricasMorosidadDto> {
    const { data } = await httpService.get<MetricasMorosidadDto>(
      '/suscripciones-proyectos/metrics/morosidad'
    );
    return data;
  },

  /**
   * 🔴 ADMIN: Obtiene métricas de tasa de cancelación (KPI 5)
   */
  async getMetricasCancelacion(): Promise<MetricasCancelacionDto> {
    const { data } = await httpService.get<MetricasCancelacionDto>(
      '/suscripciones-proyectos/metrics/cancelacion'
    );
    return data;
  }
};