// src/pages/User/ResumenesCuenta/hooks/useResumenesCuenta.ts
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import ResumenCuentaService from '@/core/api/services/resumenCuenta.service';
import type { ResumenCuentaDto } from '@/core/types/dto/resumenCuenta.dto';

export const useResumenesCuenta = () => {
    const [selectedResumen, setSelectedResumen] = useState<ResumenCuentaDto | null>(null);

    const { data: resumenes = [], isLoading, error } = useQuery<ResumenCuentaDto[]>({
        queryKey: ['misResumenes'],
        queryFn: async () => {
            const response = await ResumenCuentaService.getMyAccountSummaries();
            // Validamos que sea un array para evitar errores en el reduce
            return Array.isArray(response.data) ? response.data : [];
        },
        staleTime: 1000 * 60 * 5
    });

    const stats = useMemo(() => {
        const totalPlanes = resumenes.length;
        // ✅ Tipado explícito de acc y curr para evitar errores de 'any'
        const promedioAvance = totalPlanes > 0
            ? resumenes.reduce((acc: number, curr: ResumenCuentaDto) => acc + curr.porcentaje_pagado, 0) / totalPlanes
            : 0;
        const cuotasVencidasTotal = resumenes.reduce((acc: number, curr: ResumenCuentaDto) => acc + curr.cuotas_vencidas, 0);

        return { totalPlanes, promedioAvance, cuotasVencidasTotal };
    }, [resumenes]);

    return {
        resumenes,
        isLoading,
        error,
        stats,
        selectedResumen,
        openModal: (resumen: ResumenCuentaDto) => setSelectedResumen(resumen),
        closeModal: () => setSelectedResumen(null),
        isModalOpen: !!selectedResumen
    };
};