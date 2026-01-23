import { useQuery } from '@tanstack/react-query';
import SuscripcionService from '@/core/api/services/suscripcion.service';
import { useAuth } from '@/core/context/AuthContext';

export const useVerificarSuscripcion = (idProyecto?: number) => {
  const { isAuthenticated, user } = useAuth();

  const { data: suscripcion, isLoading } = useQuery({
    queryKey: ['check-suscripcion', idProyecto, user?.id],
    queryFn: async () => {
      // Si no hay proyecto o usuario, no ejecutamos la llamada
      if (!idProyecto || !isAuthenticated) return null;
      return await SuscripcionService.checkEstadoSuscripcion(idProyecto);
    },
    // Solo se ejecuta si tenemos los datos necesarios
    enabled: !!idProyecto && isAuthenticated,
    staleTime: 1000 * 60 * 5, // Cachear resultado por 5 minutos
    retry: false
  });

  // Lógica derivada
  const estaSuscripto = !!suscripcion; // true si existe objeto, false si es null
  const tieneTokens = (suscripcion?.tokens_disponibles || 0) > 0;
  
  // Puedes ajustar esta lógica. Por ahora, si está suscripto habilitamos el botón.
  // Si en el futuro quieres bloquear por falta de tokens, cambia esto a: estaSuscripto && tieneTokens
  const puedePujar = estaSuscripto;

  return { 
    suscripcion, 
    estaSuscripto, 
    tieneTokens,
    puedePujar, 
    isLoading 
  };
};