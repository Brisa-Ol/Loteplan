// src/pages/User/ResumenesCuenta/hooks/useResumenesCuenta.ts
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import ResumenCuentaService from '@/core/api/services/resumenCuenta.service';
import type { ResumenCuentaDto } from '@/core/types/dto/resumenCuenta.dto';
import { env } from '@/core/config/env'; // 👈 1. Importamos la configuración global

export const useResumenesCuenta = () => {
    const [selectedResumen, setSelectedResumen] = useState<ResumenCuentaDto | null>(null);

    const { data: resumenes = [], isLoading, error } = useQuery<ResumenCuentaDto[]>({
        queryKey: ['misResumenes'],
        queryFn: async () => {
            const response = await ResumenCuentaService.getMyAccountSummaries();
            return Array.isArray(response.data) ? response.data : [];
        },
        // 👈 2. Aplicamos la variable global de staleTime (ej: 5 minutos o lo que defina el env)
        staleTime: env.queryStaleTime || 300000 
    });

    const stats = useMemo(() => {
        const totalPlanes = resumenes.length;
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