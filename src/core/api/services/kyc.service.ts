// frontend/src/core/api/services/kyc.service.ts

import httpService from "../httpService";
import type { KycDTO, KycStatusDTO, SubmitKycDto, RejectKycDTO } from "@/core/types/kyc.dto";
import { env } from "@/core/config/env"; // 👈 Importamos la configuración global

const ENDPOINT = '/kyc';

/**
 * kycService: Gestiona la verificación de identidad.
 * Integra configuraciones de entorno para optimizar subidas de archivos pesados.
 */
const kycService = {
  // ===================================================================
  // MÉTODOS DE USUARIO
  // ===================================================================

  /**
   * Envía la solicitud de verificación KYC con documentos (Multipart).
   * POST /kyc/submit → 202
   */
  async submit(submitData: SubmitKycDto): Promise<any> {
    const formData = new FormData();

    // 1. Campos de texto
    formData.append('tipo_documento', submitData.tipo_documento);
    formData.append('numero_documento', submitData.numero_documento);
    formData.append('nombre_completo', submitData.nombre_completo);

    if (submitData.fecha_nacimiento)
      formData.append('fecha_nacimiento', submitData.fecha_nacimiento);
    if (submitData.latitud_verificacion)
      formData.append('latitud_verificacion', submitData.latitud_verificacion.toString());
    if (submitData.longitud_verificacion)
      formData.append('longitud_verificacion', submitData.longitud_verificacion.toString());

    // 2. Archivos (Multipart)
    formData.append('documento_frente', submitData.documento_frente);
    if (submitData.documento_dorso)
      formData.append('documento_dorso', submitData.documento_dorso);

    formData.append('selfie_con_documento', submitData.selfie_con_documento);

    if (submitData.video_verificacion)
      formData.append('video_verificacion', submitData.video_verificacion);

    // 🚀 MEJORA: Solo logueamos el contenido en desarrollo para evitar fugas de datos
    if (env.enableDebugLogs && !env.isProduction) {
      console.log('[KYC Service] Iniciando subida de documentos:', {
        tipo: submitData.tipo_documento,
        nombre: submitData.nombre_completo,
        hasVideo: !!submitData.video_verificacion
      });
    }

    // 🚀 MEJORA: Aplicamos un timeout extendido (env.uploadTimeout) para evitar cortes en subidas lentas
    const { data } = await httpService.post(`${ENDPOINT}/submit`, formData, {
      timeout: env.uploadTimeout || 60000, // 60s por defecto si no está definido
    });
    
    return data;
  },

  /**
   * Obtiene el estado actual de verificación del usuario autenticado.
   */
  async getStatus(): Promise<KycStatusDTO> {
    const { data } = await httpService.get(`${ENDPOINT}/status`);
    return data;
  },

  // ===================================================================
  // MÉTODOS DE ADMINISTRADOR — Listados
  // ===================================================================

  /**
   * Lista solicitudes PENDIENTES.
   */
  async getPendingVerifications(): Promise<KycDTO[]> {
    const { data } = await httpService.get(`${ENDPOINT}/pending`);
    return data.solicitudes;
  },

  /**
   * Lista solicitudes APROBADAS.
   */
  async getApprovedVerifications(): Promise<KycDTO[]> {
    const { data } = await httpService.get(`${ENDPOINT}/approved`);
    return data.solicitudes;
  },

  /**
   * Lista solicitudes RECHAZADAS.
   */
  async getRejectedVerifications(): Promise<KycDTO[]> {
    const { data } = await httpService.get(`${ENDPOINT}/rejected`);
    return data.solicitudes;
  },

  /**
   * Lista TODAS las verificaciones procesadas.
   */
  async getAllProcessedVerifications(): Promise<KycDTO[]> {
    const { data } = await httpService.get(`${ENDPOINT}/all`);
    return data.solicitudes;
  },

  // ===================================================================
  // MÉTODOS DE ADMINISTRADOR — Acciones
  // ===================================================================

  /**
   * Aprueba la verificación de un usuario.
   */
  async approveVerification(idUsuario: number): Promise<any> {
    const { data } = await httpService.post(`${ENDPOINT}/approve/${idUsuario}`);
    return data;
  },

  /**
   * Rechaza la verificación de un usuario.
   */
  async rejectVerification(idUsuario: number, body: RejectKycDTO): Promise<any> {
    const { data } = await httpService.post(`${ENDPOINT}/reject/${idUsuario}`, body);
    return data;
  },
};

export default kycService;