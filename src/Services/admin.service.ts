// src/services/admin.service.ts

import type { User } from '../types/dto/auth.types';
import type { ProyectoDTO } from '../types/dto/proyecto.dto';
import httpService from './httpService';

// ──────────────────────────────────────────────────────────
// Interfaces auxiliares según las métricas del dashboard
// ──────────────────────────────────────────────────────────

export interface CompletionRateDTO {
  tasa_culminacion: number;
  total_iniciados: number;
  total_finalizados: number;
}

export interface MonthlyProgressItem {
  id: number;
  nombre: string;
  estado: string;
  suscripciones_actuales: number;
  meta_suscripciones: number;
  porcentaje_avance: string;
}

// ──────────────────────────────────────────────────────────
// Constantes de endpoints
// ──────────────────────────────────────────────────────────

const PROYECTOS_ENDPOINT = '/proyectos';
const USUARIOS_ENDPOINT = '/usuarios';

// ──────────────────────────────────────────────────────────
// Servicio principal del Admin
// ──────────────────────────────────────────────────────────

class AdminService {
  // --- Métricas del Dashboard ---

  /** 🔹 GET /proyectos/metricas/culminacion */
  async getCompletionRate(): Promise<CompletionRateDTO> {
    const response = await httpService.get<CompletionRateDTO>(
      `${PROYECTOS_ENDPOINT}/metricas/culminacion`
    );
    return response.data; // ✅ Accedemos a data
  }

  /** 🔹 GET /proyectos/metricas/avance-mensual */
  async getMonthlyProgress(): Promise<MonthlyProgressItem[]> {
    const response = await httpService.get<MonthlyProgressItem[]>(
      `${PROYECTOS_ENDPOINT}/metricas/avance-mensual`
    );
    return response.data;
  }

  // --- Estadísticas (Contadores) ---

  /** 🔹 GET /usuarios */
  async getAllUsers(): Promise<User[]> {
    const response = await httpService.get<User[]>(USUARIOS_ENDPOINT);
    return response.data;
  }

  /** 🔹 GET /proyectos */
  async getAllProjects(): Promise<ProyectoDTO[]> {
    const response = await httpService.get<ProyectoDTO[]>(PROYECTOS_ENDPOINT);
    return response.data;
  }

  // 🔸 En el futuro podés agregar acá:
  // async adminUpdateUser(...)
  // async adminReset2FA(...)
}

export default new AdminService();
