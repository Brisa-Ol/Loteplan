// src/services/contrato.service.ts (ACTUALIZADO Y COMBINADO)
import httpService from './httpService';

// Importamos los DTOs existentes
import type { 
  ContratoDTO,
  CreateContratoDTO,
  RegisterSignatureDTO
} from '../types/dto/contrato.dto.ts';

// La ruta base es /api/contratos (según tu index.js)
const ENDPOINT = '/contratos';

// ======================================================
// FUNCIONES CRUD (Las que ya tenías)
// ======================================================

/**
 * Obtiene un contrato específico por su ID.
 * Llama a: GET /api/contratos/:id
 */
export const getContratoById = (id: number): Promise<ContratoDTO> => {
  return httpService.get(`${ENDPOINT}/${id}`);
};

/**
 * Obtiene todos los contratos firmados por el usuario logueado.
 * Llama a: GET /api/contratos/mis-contratos
 */
export const getMisContratos = (): Promise<ContratoDTO[]> => {
  return httpService.get(`${ENDPOINT}/mis-contratos`); 
};

/**
 * (Admin) Crea un nuevo contrato base (plantilla).
 * Llama a: POST /api/contratos
 */
export const createContrato = (data: CreateContratoDTO): Promise<ContratoDTO> => {
  return httpService.post(ENDPOINT, data);
};

/**
 * Registra la firma de un usuario en un contrato existente.
 * Llama a: PUT /api/contratos/:id/firmar
 */
export const registerSignature = (id: number, data: RegisterSignatureDTO): Promise<ContratoDTO> => {
  return httpService.put(`${ENDPOINT}/${id}/firmar`, data);
};

/**
 * (Admin) Marca un contrato como inactivo.
 * Llama a: DELETE /api/contratos/:id
 */
export const deleteContrato = (id: number): Promise<void> => {
  return httpService.delete(`${ENDPOINT}/${id}`);
};

// ======================================================
// ❗ NUEVAS INTERFACES Y FUNCIÓN (Para el Flujo de Pago)
// ======================================================

// DTO para enviar al backend (Paso A del flujo)
export interface IniciarSuscripcionDTO {
  id_proyecto: number;
  firma_digital: string; // El nombre tipeado por el usuario
}

// DTO que devuelve el backend (Respuesta del Paso A)
export interface IniciarSuscripcionResponseDTO {
  signingUrl: string; // La URL de DocuSign para redirigir
  pagoId: number;     // El ID del pago que se creó
}

/**
 * ❗ NUEVA FUNCIÓN
 * Llama al backend para crear el Pago, generar el Contrato en la
 * API de firmas (DocuSign, etc.), y obtener la URL para que el usuario firme.
 *
 * Llama a: POST /api/contratos/iniciar-suscripcion
 */
export const iniciarFlujoDeFirma = (data: IniciarSuscripcionDTO): Promise<IniciarSuscripcionResponseDTO> => {
  return httpService.post(`${ENDPOINT}/iniciar-suscripcion`, data);
};