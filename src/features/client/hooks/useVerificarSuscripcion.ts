// src/features/client/hooks/useVerificarSuscripcion.ts
import { useQuery } from '@tanstack/react-query';
import SuscripcionService from '@/core/api/services/suscripcion.service';
import { useAuth } from '@/core/context/AuthContext';

export interface EstadoSuscripcion {
  suscripcion: any | null;
  estaSuscripto: boolean;
  tieneTokens: boolean;
  puedePujar: boolean;
  tokensDisponibles: number;
  isLoading: boolean;
  motivoBloqueo: string | null;
}

export const useVerificarSuscripcion = (idProyecto?: number | string): EstadoSuscripcion => {
  const { isAuthenticated, user } = useAuth();
  
  // Aseguramos que el ID sea numérico para evitar fallos en la comparación
  const projectId = idProyecto ? Number(idProyecto) : undefined;

  const { data: suscripcionActiva, isLoading } = useQuery({
    queryKey: ['check-suscripcion', projectId, user?.id],
    queryFn: async () => {
      if (!projectId || !isAuthenticated) return null;
      
      // 1. Llamamos al endpoint que YA EXISTE y trae todas las suscripciones del usuario
      const response = await SuscripcionService.getMisSuscripciones();
      const misSuscripciones = response.data;

      // 2. Filtramos para encontrar la suscripción activa de este proyecto específico
      const suscripcionDelProyecto = misSuscripciones.find(
        (sub: any) => Number(sub.id_proyecto) === projectId && sub.activo === true
      );

      return suscripcionDelProyecto || null;
    },
    enabled: !!projectId && isAuthenticated,
    staleTime: 1000 * 60 * 2, // 2 minutos de caché (ajusta si necesitas que actualice más rápido al pujar)
    retry: false
  });

  const estaSuscripto = !!suscripcionActiva;
  
  // ✅ AHORA SÍ: Leemos el valor real de la base de datos gestionado por tu backend
  const tokensDisponibles = suscripcionActiva?.tokens_disponibles || 0; 
  
  const tieneTokens = tokensDisponibles > 0;
  const puedePujar = estaSuscripto && tieneTokens;

  // Lógica de bloqueo asegurando que no muestre error mientras está cargando
  let motivoBloqueo: string | null = null;
  
  if (!isLoading) {
    if (!estaSuscripto) {
      motivoBloqueo = 'No estás suscripto a este proyecto. Debes suscribirte para participar.';
    } else if (!tieneTokens) {
      motivoBloqueo = 'Ya utilizaste tu token. Debes esperar a que se libere si tu puja es superada.';
    }
  }

  return {
    suscripcion: suscripcionActiva,
    estaSuscripto,
    tieneTokens,
    tokensDisponibles,
    puedePujar,
    motivoBloqueo,
    isLoading
  };
};