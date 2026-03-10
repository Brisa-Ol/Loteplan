import { useAuth } from '@/core/context/AuthContext';
import { useCallback, useState } from 'react';
import type { SecurityRequirementType } from '../guards/SecurityRequirementModal';



export const useSecurityGuard = () => {
  const { user } = useAuth();
  const [requirement, setRequirement] = useState<SecurityRequirementType>(null);

  /**
   * Verifica los requisitos y ejecuta el callback si todo está OK.
   * Si falta algo, abre el modal correspondiente.
   * @param action La función que se debe ejecutar si pasa la seguridad
   */
  const withSecurityCheck = useCallback((action: () => void) => {
    if (!user) return;

    // 1. Prioridad: 2FA Activado
    if (!user.is_2fa_enabled) {
      setRequirement('2FA_MISSING');
      return;
    }

    // 2. Prioridad: KYC Aprobado
    if (user.estado_kyc !== 'APROBADA') {
      setRequirement('KYC_MISSING');
      return;
    }

    // 3. Si todo ok, ejecutar acción
    action();
  }, [user]);

  // ✅ Fix: useCallback para consistencia y estabilidad de referencia
  const closeSecurityModal = useCallback(() => setRequirement(null), []);

  return {
    withSecurityCheck,
    securityModalProps: {
      open: !!requirement,
      type: requirement,
      onClose: closeSecurityModal
    }
  };
};