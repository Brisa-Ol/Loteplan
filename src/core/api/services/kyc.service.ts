// frontend/src/core/api/services/kyc.service.ts

import httpService from "../httpService";
import type { KycDTO, KycStatusDTO, SubmitKycDto, RejectKycDTO } from "@/core/types/dto/kyc.dto";

const ENDPOINT = '/kyc';

const kycService = {
  // ===================================================================
  // MÉTODOS DE USUARIO
  // ===================================================================

  /**
   * Envía la solicitud de verificación KYC con documentos.
   * POST /kyc/submit → 202 { success, mensaje, detalles, registro }
   * Errores posibles: 409 (YA_VERIFICADO | SOLICITUD_PENDIENTE), 400 (ARCHIVOS_FALTANTES)
   */
  async submit(submitData: SubmitKycDto): Promise<any> {
    const formData = new FormData();

    // 1. Campos de texto (coinciden con req.body en el controlador)
    formData.append('tipo_documento', submitData.tipo_documento);
    formData.append('numero_documento', submitData.numero_documento);
    formData.append('nombre_completo', submitData.nombre_completo);

    if (submitData.fecha_nacimiento)
      formData.append('fecha_nacimiento', submitData.fecha_nacimiento);
    if (submitData.latitud_verificacion)
      formData.append('latitud_verificacion', submitData.latitud_verificacion.toString());
    if (submitData.longitud_verificacion)
      formData.append('longitud_verificacion', submitData.longitud_verificacion.toString());

    // 2. Archivos (nombres coinciden con uploadKYCData .fields() del middleware)
    formData.append('documento_frente', submitData.documento_frente);
    if (submitData.documento_dorso)
      formData.append('documento_dorso', submitData.documento_dorso);

    formData.append('selfie_con_documento', submitData.selfie_con_documento);

    if (submitData.video_verificacion)
      formData.append('video_verificacion', submitData.video_verificacion);

    // Axios detecta FormData automáticamente → Content-Type: multipart/form-data
    const { data } = await httpService.post(`${ENDPOINT}/submit`, formData);
    return data;
  },

  /**
   * Obtiene el estado actual de verificación del usuario autenticado.
   * GET /kyc/status → 200
   *
   * Respuesta sin registro:  { success, estado_verificacion: 'NO_INICIADO', mensaje, puede_enviar: true }
   * Respuesta con registro:  { success, ...registro.toJSON(), puede_enviar, mensaje_estado, verificador? }
   *
   * Nota: el backend ya excluye las URLs de archivos (url_foto_documento_*) y la IP via el servicio.
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
   * GET /kyc/pending → 200 { success, estado, total, solicitudes: KycDTO[] }
   * Retorna solo el array de solicitudes.
   */
  async getPendingVerifications(): Promise<KycDTO[]> {
    const { data } = await httpService.get(`${ENDPOINT}/pending`);
    return data.solicitudes;
  },

  /**
   * Lista solicitudes APROBADAS.
   * GET /kyc/approved → 200 { success, estado, total, solicitudes: KycDTO[] }
   */
  async getApprovedVerifications(): Promise<KycDTO[]> {
    const { data } = await httpService.get(`${ENDPOINT}/approved`);
    return data.solicitudes;
  },

  /**
   * Lista solicitudes RECHAZADAS.
   * GET /kyc/rejected → 200 { success, estado, total, solicitudes: KycDTO[] }
   */
  async getRejectedVerifications(): Promise<KycDTO[]> {
    const { data } = await httpService.get(`${ENDPOINT}/rejected`);
    return data.solicitudes;
  },

  /**
   * Lista TODAS las verificaciones procesadas (APROBADAS + RECHAZADAS).
   * GET /kyc/all → 200 { success, total, estadisticas, solicitudes: KycDTO[] }
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
   * POST /kyc/approve/:idUsuario → 200 { success, mensaje, registro }
   *
   * @param idUsuario - ID del usuario (NO el ID del registro KYC)
   */
  async approveVerification(idUsuario: number): Promise<any> {
    const { data } = await httpService.post(`${ENDPOINT}/approve/${idUsuario}`);
    return data;
  },

  /**
   * Rechaza la verificación de un usuario.
   * POST /kyc/reject/:idUsuario → 200 { success, mensaje, registro }
   * Body requerido: { motivo_rechazo: string }
   *
   * @param idUsuario - ID del usuario (NO el ID del registro KYC)
   * @param body      - Objeto con el motivo de rechazo
   */
  async rejectVerification(idUsuario: number, body: RejectKycDTO): Promise<any> {
    const { data } = await httpService.post(`${ENDPOINT}/reject/${idUsuario}`, body);
    return data;
  },
};

export default kycService;