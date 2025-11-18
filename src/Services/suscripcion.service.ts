// src/services/suscripcion.service.ts
import type { SuscripcionCanceladaDto } from '../types/dto/suscripcionProyecto.dto';
import httpService from './httpService';


/**
 * Servicio para gestionar operaciones relacionadas con Suscripciones Canceladas
 * Este servicio maneja específicamente las consultas de suscripciones canceladas
 */
export const suscripcionService = {
  /**
   * 🟢 USUARIO: Cancela una suscripción propia
   * @deprecated Use suscripcionProyectoService.cancelarMiSuscripcion() instead
   */
  async cancelarSuscripcion(id: number): Promise<{ message: string }> {
    const { data } = await httpService.put<{ message: string }>(
      `/suscripciones/${id}/cancelar`
    );
    return data;
  },

  /**
   * 🟢 USUARIO: Obtiene mis suscripciones canceladas
   */
  async getMisSuscripcionesCanceladas(): Promise<SuscripcionCanceladaDto[]> {
    const { data } = await httpService.get<SuscripcionCanceladaDto[]>(
      '/suscripciones/mis_canceladas'
    );
    return data;
  },

  /**
   * 🔴 ADMIN: Obtiene TODAS las suscripciones canceladas
   */
  async getAllSuscripcionesCanceladas(): Promise<SuscripcionCanceladaDto[]> {
    const { data } = await httpService.get<SuscripcionCanceladaDto[]>(
      '/suscripciones/canceladas'
    );
    return data;
  },

  /**
   * 🔴 ADMIN: Obtiene las suscripciones canceladas de un proyecto específico
   */
  async getSuscripcionesCanceladasByProyecto(proyectoId: number): Promise<SuscripcionCanceladaDto[]> {
    const { data } = await httpService.get<SuscripcionCanceladaDto[]>(
      `/suscripciones/proyecto/canceladas/${proyectoId}`
    );
    return data;
  }
};

// Named export (no default export)