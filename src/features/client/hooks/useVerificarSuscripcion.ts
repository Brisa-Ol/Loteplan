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
  motivoBloqueo: string | null; // ✅ NUEVO: Mensaje de bloqueo
}

export const useVerificarSuscripcion = (idProyecto?: number): EstadoSuscripcion => {
  const { isAuthenticated, user } = useAuth();

  const { data: suscripcion, isLoading } = useQuery({
    queryKey: ['check-suscripcion', idProyecto, user?.id],
    queryFn: async () => {
      if (!idProyecto || !isAuthenticated) return null;
      return await SuscripcionService.checkEstadoSuscripcion(idProyecto);
    },
    enabled: !!idProyecto && isAuthenticated,
    staleTime: 1000 * 60 * 2, // ✅ Reducido a 2 min (tokens cambian al pujar)
    retry: false
  });

  // ✅ LÓGICA CORRECTA
  const estaSuscripto = !!suscripcion;
  const tokensDisponibles = suscripcion?.tokens_disponibles || 0;
  const tieneTokens = tokensDisponibles > 0;
  const puedePujar = estaSuscripto && tieneTokens;

  // ✅ NUEVO: Determinar motivo de bloqueo
  let motivoBloqueo: string | null = null;
  if (!estaSuscripto) {
    motivoBloqueo = 'No estás suscripto al proyecto';
  } else if (!tieneTokens) {
    motivoBloqueo = 'Ya utilizaste tu token en otra subasta de este proyecto';
  }

  return {
    suscripcion,
    estaSuscripto,
    tieneTokens,
    tokensDisponibles,
    puedePujar,
    motivoBloqueo,
    isLoading
  };
};