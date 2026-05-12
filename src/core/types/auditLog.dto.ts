
export interface AuditLog {
    id: number;
    activo: boolean; // opcional, dependiendo de si quieres heredar esta propiedad

    //ID del usuario que realizó la acción (admin o sistema)
    usuario_id: number,

    //Ej: FORZAR_PAGO, CANCELAR_ADHESION, MODIFICAR_MONTO
    accion: string,

    //Nombre de la tabla/modelo afectado: Adhesion, PagoAdhesion, SuscripcionProyecto, etc.
    entidad_tipo: string,

    //ID del registro afectado (ej. ID de la adhesión o pago modificado)
    entidad_id: number

    //"Estado completo o campos relevantes después del cambio"
    datos_previos?: Record<string, any>; // JSON con estado antes del cambio

    //Estado completo o campos relevantes después del cambio
    datos_nuevos?: Record<string, any>; // JSON con estado después del cambio

    //Razón de la acción (ingresada por el admin)
    motivo?: string

    //Dirección IP del administrador que ejecuta la acción
    ip_origen?: string

    //User-Agent del navegador/cliente
    user_agent?: string

    created_at: string; // Timestamp de creación del log


}

export interface AuditLogRequestDto {
    usuario_id?: number,
    accion?: string,
    entidadTipo?: string,
    entidadId?: number,
    fechaDesde?: string,
    fechaHasta?: string,
    page: number,
    limit: number
}

/*
      { fields: ["entidad_tipo", "entidad_id"] }, // Búsqueda por entidad
      { fields: ["created_at"] }, // Limpieza por fecha
      { fields: ["usuario_id"] }, // Auditoría por admin
      { fields: ["accion"] }, // Filtrar por tipo de acción
*/