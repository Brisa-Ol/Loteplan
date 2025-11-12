// src/services/lote.service.ts
import httpService from './httpService';
import type { LoteDTO, CreateLoteDTO, UpdateLoteDTO } from '../types/dto/lote.dto';

const ENDPOINT = '/lotes';

const loteService = {
  // ══════════════════════════════════════════════════════════
  // 🛡️ FUNCIONES DE ADMINISTRADOR
  // ══════════════════════════════════════════════════════════

  /** Llama a: GET /api/lotes */
  async getAllLotes(): Promise<LoteDTO[]> {
    const { data } = await httpService.get<LoteDTO[]>(ENDPOINT);
    return data;
  },
  
  /** Llama a: GET /api/lotes/sin_proyecto */
  async getUnassignedLotes(): Promise<LoteDTO[]> {
    const { data } = await httpService.get<LoteDTO[]>(`${ENDPOINT}/sin_proyecto`);
    return data;
  },
  
  /** Llama a: GET /api/lotes/proyecto/:idProyecto */
  async getLotesByProyecto(idProyecto: string): Promise<LoteDTO[]> {
    const { data } = await httpService.get<LoteDTO[]>(`${ENDPOINT}/proyecto/${idProyecto}`);
    return data;
  },

  /** Llama a: POST /api/lotes */
  async createLote(loteData: CreateLoteDTO): Promise<LoteDTO> {
    const { data } = await httpService.post<LoteDTO>(ENDPOINT, loteData);
    return data;
  },

  /** Llama a: PUT /api/lotes/:id */
  async updateLote(id: string, loteData: UpdateLoteDTO): Promise<LoteDTO> {
    const { data } = await httpService.put<LoteDTO>(`${ENDPOINT}/${id}`, loteData);
    return data;
  },

  /** Llama a: DELETE /api/lotes/:id */
  async deleteLote(id: string): Promise<{ mensaje: string }> {
    const { data } = await httpService.delete<{ mensaje: string }>(`${ENDPOINT}/${id}`);
    return data;
  },
};

export default loteService;