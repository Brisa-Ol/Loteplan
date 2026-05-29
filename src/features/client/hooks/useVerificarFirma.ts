// src/features/client/hooks/useVerificarFirma.ts

import ContratoService from "@/core/api/services/contrato.service";
import { useAuth } from "@/core/context/AuthContext";
import { useQuery } from "@tanstack/react-query";

export const useVerificarFirma = (idProyecto: number | undefined) => {
	const { user, isAuthenticated } = useAuth();

	const { data: trackingData, isLoading } = useQuery({
		queryKey: ["tracking-contrato", idProyecto],
		queryFn: () => ContratoService.trackPaymentAndContract(Number(idProyecto)),
		enabled: !!idProyecto && !!user?.id && isAuthenticated,
		staleTime: 30_000,
	});

	return {
		trackingData,
		tieneFirmaPendiente: trackingData?.puede_firmar,
		puedeFirmar: trackingData?.puede_firmar ?? true,
		isLoading,
	};
};
