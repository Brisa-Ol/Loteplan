// src/pages/User/ResumenesCuenta/hooks/useResumenesCuenta.ts
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import ResumenCuentaService from '@/core/api/services/resumenCuenta.service';
import type { ResumenCuentaDto } from '@/core/types/dto/resumenCuenta.dto';

export const useResumenesCuenta = () => {
    // 1. Estado para Modal (Ahora guarda todo el DTO)
    const [selectedResumen, setSelectedResumen] = useState<ResumenCuentaDto | null>(null);

    // 2. Data Fetching
    const { data: resumenes = [], isLoading, error } = useQuery<ResumenCuentaDto[]>({
        queryKey: ['misResumenes'],
        queryFn: async () => (await ResumenCuentaService.getMyAccountSummaries()).data,
        staleTime: 1000 * 60 * 5 
    });

    // 3. KPI Stats
    const stats = useMemo(() => {
        const totalPlanes = resumenes.length;
        const promedioAvance = totalPlanes > 0
            ? resumenes.reduce((acc, curr) => acc + curr.porcentaje_pagado, 0) / totalPlanes
            : 0;
        const cuotasVencidasTotal = resumenes.reduce((acc, curr) => acc + curr.cuotas_vencidas, 0);

        return { totalPlanes, promedioAvance, cuotasVencidasTotal };
    }, [resumenes]);

    // 4. Handlers (Ahora recibe el objeto completo)
    const openModal = (resumen: ResumenCuentaDto) => {
        setSelectedResumen(resumen);
    };

    const closeModal = () => {
        setSelectedResumen(null);
    };

    return {
        resumenes,
        isLoading,
        error,
        stats,
        // Modal logic
        selectedResumen,
        openModal,
        closeModal,
        isModalOpen: !!selectedResumen
    };
};