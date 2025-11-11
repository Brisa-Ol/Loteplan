// src/services/admin.service.ts

import type { User, CompletionRateDTO, MonthlyProgressItem } from '../types/dto/auth.types';
import type { ProyectoDTO } from '../types/dto/proyecto.dto';
import httpService from './httpService';

/**
 * Servicio centralizado para todas las operaciones del panel de administración.
 * Cada método corresponde a una ruta del backend con permisos de administrador.
 */
class AdminService {
  // ══════════════════════════════════════════════════════════
  // MÉTRICAS DEL DASHBOARD
  // ══════════════════════════════════════════════════════════

  /**
   * Obtiene la tasa de culminación de proyectos.
   * Endpoint: GET /proyectos/metricas/culminacion
   */
  async getCompletionRate(): Promise<CompletionRateDTO> {
    const response = await httpService.get<CompletionRateDTO>(
      '/proyectos/metricas/culminacion'
    );
    return response;
  }

  /**
   * Obtiene el progreso mensual de proyectos.
   * Endpoint: GET /proyectos/metricas/avance-mensual
   */
  async getMonthlyProgress(): Promise<MonthlyProgressItem[]> {
    const response = await httpService.get<MonthlyProgressItem[]>(
      '/proyectos/metricas/avance-mensual'
    );
    return response;
  }

  // ══════════════════════════════════════════════════════════
  // GESTIÓN DE USUARIOS
  // ══════════════════════════════════════════════════════════

  /**
   * Obtiene la lista completa de usuarios.
   * Endpoint: GET /usuarios
   */
  async getAllUsers(): Promise<User[]> {
    const response = await httpService.get<User[]>('/usuarios');
    return response;
  }

  // ══════════════════════════════════════════════════════════
  // GESTIÓN DE PROYECTOS
  // ══════════════════════════════════════════════════════════

  /**
   * Obtiene todos los proyectos registrados en el sistema.
   * Endpoint: GET /proyectos
   */
  async getAllProjects(): Promise<ProyectoDTO[]> {
    const response = await httpService.get<ProyectoDTO[]>('/proyectos');
    return response;
  }

  // ══════════════════════════════════════════════════════════
  // FUTURAS FUNCIONES ADMIN (ejemplos)
  // ══════════════════════════════════════════════════════════

  /**
   * (Ejemplo) Resetea el 2FA de un usuario.
   * Endpoint: POST /admin/usuarios/:id/reset-2fa
   */
  async resetUser2FA(userId: number): Promise<void> {
    await httpService.post(`/admin/usuarios/${userId}/reset-2fa`);
  }

  /**
   * (Ejemplo) Cambia el rol de un usuario.
   * Endpoint: PATCH /admin/usuarios/:id/rol
   */
  async updateUserRole(userId: number, newRole: string): Promise<void> {
    await httpService.patch(`/admin/usuarios/${userId}/rol`, { rol: newRole });
  }
}

export default new AdminService();
