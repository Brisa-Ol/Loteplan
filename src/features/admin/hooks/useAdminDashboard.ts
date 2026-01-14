import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@mui/material';
import type { KycDTO } from '../../../core/types/dto/kyc.dto';
import kycService from '../../../core/api/services/kyc.service';
import type { CompletionRateDTO, MonthlyProgressItem, ProyectoDto } from '../../../core/types/dto/proyecto.dto';
import proyectoService from '../../../core/api/services/proyecto.service';
import inversionService from '../../../core/api/services/inversion.service';
import type { InversionPorUsuarioDTO, LiquidityRateDTO } from '../../../core/types/dto/inversion.dto';
import type { CancelacionDTO, MorosidadDTO } from '../../../core/types/dto/suscripcion.dto';
import suscripcionService from '../../../core/api/services/suscripcion.service';
import favoritoService from '../../../core/api/services/favorito.service';
import type { PopularidadLoteDTO } from '../../../core/types/dto/favorito.dto';
import pujaService from '../../../core/api/services/puja.service';
import type { PujaDto } from '../../../core/types/dto/puja.dto';



interface DashboardStats {
  pendingKYC: number;
  totalInvertido: string;
  totalPagado: string;
  tasaLiquidez: string;
  tasaMorosidad: string;
  tasaCancelacion: string;
  proyectosEnProceso: number;
  proyectosEnEspera: number;
  totalFinalizados: number;
  subastasActivas: number;
  cobrosPendientes: number;
}

export const useAdminDashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [activeTab, setActiveTab] = useState(0);
  const [selectedPopularidadProject, setSelectedPopularidadProject] = useState<number | ''>('');

  // --- QUERIES ---
  const { data: pendingKYC = [], isLoading: loadingKYC } = useQuery<KycDTO[]>({
    queryKey: ['pendingKYC'],
    queryFn: async () => (await kycService.getPendingVerifications() as any).data || [],
  });

  const { data: completionRate, isLoading: loadingCompletion } = useQuery<CompletionRateDTO>({
    queryKey: ['completionRate'],
    queryFn: proyectoService.getCompletionRate
  });

  const { data: monthlyProgress = [], isLoading: loadingProgress } = useQuery<MonthlyProgressItem[]>({
    queryKey: ['monthlyProgress'],
    queryFn: proyectoService.getMonthlyProgress
  });

  const { data: liquidityRate, isLoading: loadingLiquidity } = useQuery<LiquidityRateDTO>({
    queryKey: ['liquidityRate'],
    queryFn: async () => (await inversionService.getLiquidityMetrics()).data.data,
  });

  const { data: inversionesPorUsuario = [], isLoading: loadingInversiones } = useQuery<InversionPorUsuarioDTO[]>({
    queryKey: ['inversionesPorUsuario'],
    queryFn: async () => {
      const res = await inversionService.getAggregatedMetrics();
      const responseData = res.data;
      if (Array.isArray(responseData)) return responseData;
      return (responseData as any).data || [];
    },
  });

  const { data: morosidad, isLoading: loadingMorosidad } = useQuery<MorosidadDTO>({
    queryKey: ['morosidad'],
    queryFn: async () => (await suscripcionService.getMorosityMetrics() as any).data || await suscripcionService.getMorosityMetrics(),
  });

  const { data: cancelacion, isLoading: loadingCancelacion } = useQuery<CancelacionDTO>({
    queryKey: ['cancelacion'],
    queryFn: async () => (await suscripcionService.getCancellationMetrics() as any).data || await suscripcionService.getCancellationMetrics(),
  });

  const { data: proyectosActivos = [] } = useQuery<ProyectoDto[]>({
    queryKey: ['proyectosActivos'],
    queryFn: async () => (await proyectoService.getAllActive()).data,
  });

  // Efecto para seleccionar proyecto por defecto
  useEffect(() => {
    if (proyectosActivos.length > 0 && selectedPopularidadProject === '') {
        setSelectedPopularidadProject(proyectosActivos[0].id);
    }
  }, [proyectosActivos, selectedPopularidadProject]);

  const { data: popularidadLotes = [], isLoading: loadingPopularidad } = useQuery<PopularidadLoteDTO[]>({
    queryKey: ['popularidadLotes', selectedPopularidadProject],
    queryFn: () => favoritoService.getPopularidadLotes(selectedPopularidadProject as number),
    enabled: !!selectedPopularidadProject
  });

  const { data: allPujas = [], isLoading: loadingPujas } = useQuery<PujaDto[]>({
    queryKey: ['adminAllPujas'],
    queryFn: async () => (await pujaService.getAllAdmin()).data,
  });

  const isLoading = loadingKYC || loadingCompletion || loadingProgress || loadingLiquidity || loadingInversiones || loadingMorosidad || loadingCancelacion || loadingPujas;

  // --- DATOS PROCESADOS (Memo) ---
  
  const stats: DashboardStats = useMemo(() => {
    const safePujas = Array.isArray(allPujas) ? allPujas : [];
    return {
      pendingKYC: pendingKYC.length,
      totalInvertido: liquidityRate?.total_invertido_registrado ?? '0',
      totalPagado: liquidityRate?.total_pagado ?? '0',
      tasaLiquidez: liquidityRate?.tasa_liquidez ?? '0',
      tasaMorosidad: morosidad?.tasa_morosidad ?? '0',
      tasaCancelacion: cancelacion?.tasa_cancelacion ?? '0',
      proyectosEnProceso: monthlyProgress.filter(p => p.estado === 'En proceso').length,
      proyectosEnEspera: monthlyProgress.filter(p => p.estado === 'En Espera').length,
      totalFinalizados: completionRate?.total_finalizados ?? 0,
      subastasActivas: safePujas.filter(p => p.estado_puja === 'activa').length,
      cobrosPendientes: safePujas.filter(p => p.estado_puja === 'ganadora_pendiente').length,
    };
  }, [pendingKYC, liquidityRate, morosidad, cancelacion, monthlyProgress, completionRate, allPujas]);

  const chartDataSuscripciones = useMemo(() => monthlyProgress.map(p => ({
    nombre: p.nombre.length > 15 ? `${p.nombre.substring(0, 15)}...` : p.nombre,
    avance: parseFloat(p.porcentaje_avance),
  })), [monthlyProgress]);

  const estadosData = useMemo(() => [
    { name: 'En Proceso', value: stats.proyectosEnProceso },
    { name: 'En Espera', value: stats.proyectosEnEspera },
    { name: 'Finalizados', value: stats.totalFinalizados },
  ].filter(item => item.value > 0), [stats]);

  const RECHART_COLORS = [theme.palette.primary.main, theme.palette.success.main, theme.palette.warning.main, theme.palette.error.main, theme.palette.info.main];

  return {
    navigate,
    theme,
    activeTab, setActiveTab,
    selectedPopularidadProject, setSelectedPopularidadProject,
    isLoading,
    
    // Datos crudos
    proyectosActivos,
    popularidadLotes,
    inversionesPorUsuario,
    loadingPopularidad,
    completionRate,
    morosidad,
    cancelacion,

    // Datos procesados
    stats,
    chartDataSuscripciones,
    estadosData,
    RECHART_COLORS
  };
};