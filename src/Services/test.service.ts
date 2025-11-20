import type { SimularImpagoResponseDto } from '../types/dto/test.dto';
import httpService from './httpService';
import type { AxiosResponse } from 'axios';


// Asumimos que registraste la ruta en tu app.js como '/api/test'
const BASE_ENDPOINT = '/test'; 

const TestService = {

  // =================================================
  // 🧪 UTILIDADES DE PRUEBA (DEV/ADMIN)
  // =================================================

  /**
   * Fuerza el vencimiento de una puja ganadora pendiente para probar la lógica de reasignación.
   * Endpoint: POST /api/test/simular-impago/:loteId
   */
  simularImpago: async (loteId: number): Promise<AxiosResponse<SimularImpagoResponseDto>> => {
    return await httpService.post(`${BASE_ENDPOINT}/simular-impago/${loteId}`);
  }

};

export default TestService;