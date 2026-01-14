import type { ContratoFirmadoResponseDto, RegistrarFirmaRequestDto } from "@/core/types/dto/contrato-firmado.dto";
import { calculateFileHash } from "@/shared/utils/crypto.utils";
import type { AxiosResponse } from "axios";
import httpService from "../httpService";


const ContratoFirmadoService = {

  // Volvemos a la interfaz original, el backend solo quiere el PDF final
  registrarFirma: async (data: Omit<RegistrarFirmaRequestDto, 'hash_archivo_firmado'>): Promise<AxiosResponse<ContratoFirmadoResponseDto>> => {
    
    // 1. Calcular Hash del PDF YA FIRMADO
    const hashCalculado = await calculateFileHash(data.file);

    const formData = new FormData();
    // Enviamos el PDF (que ya incluye la firma visualmente)
    formData.append('pdfFile', data.file); 
    
    // IDs y Metadata
    formData.append('id_contrato_plantilla', data.id_contrato_plantilla.toString());
    formData.append('id_proyecto', data.id_proyecto.toString());
    formData.append('id_usuario_firmante', data.id_usuario_firmante.toString());
    
    // Seguridad
    formData.append('hash_archivo_firmado', hashCalculado);
    formData.append('codigo_2fa', data.codigo_2fa);
    
    if (data.latitud_verificacion) formData.append('latitud_verificacion', data.latitud_verificacion);
    if (data.longitud_verificacion) formData.append('longitud_verificacion', data.longitud_verificacion);

    return await httpService.post('/contratos/firmar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  getCurrentPosition: (): Promise<{ lat: string, lng: string } | null> => {
    // ... (tu código de geo existente) ...
    return new Promise((resolve) => {
       if (!navigator.geolocation) { resolve(null); return; }
       navigator.geolocation.getCurrentPosition(
         (pos) => resolve({ lat: pos.coords.latitude.toString(), lng: pos.coords.longitude.toString() }),
         () => resolve(null)
       );
    });
  }
};

export default ContratoFirmadoService;