// ==========================================
// 📦 TIPOS GENÉRICOS DE CONTRATOS
// ==========================================

export interface ContratoActionResponse {
  message: string;
  error?: string;
}

//DResponse del tracking de Contratos, incluye estado de pago y estado de firma
export interface ContratoTrackingResponse {
  contrato_firmado?: null
  entidad_pagadora: {
    tipo: string,
    id: number, 
    monto: string, 
    fecha: string, 
    estado: string
  }
  mensaje: string
  proyecto: 
    {id: number, 
      nombre: string, 
      tipo_inversion: string
    }
  puede_firmar: boolean
  tiene_contrato_firmado: boolean
  tiene_pago: boolean
}