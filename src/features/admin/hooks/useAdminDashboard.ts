// src/hooks/admin/useAdminDashboard.ts
import { useTheme } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Servicios
import favoritoService from '@/core/api/services/favorito.service';
import inversionService from '@/core/api/services/inversion.service';
import kycService from '@/core/api/services/kyc.service';
import proyectoService from '@/core/api/services/proyecto.service';
import pujaService from '@/core/api/services/puja.service';
import suscripcionService from '@/core/api/services/suscripcion.service';

// ===========================================================================
// HOOK
// ===========================================================================

export const useAdminDashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  // FIX: tipo coherente. Se inicializa en null hasta que proyectosActivos se carga.
  const [selectedPopularidadProject, setSelectedPopularidadProject] = useState<number | null>(null);

  // ---------------------------------------------------------------------------
  // QUERIES
  // ---------------------------------------------------------------------------

  const { data: pendingKYC = [], isLoading: l1 } = useQuery({
    queryKey: ['pendingKYC'],
    queryFn: kycService.getPendingVerifications,
  });

  // proyectoService.getCompletionRate() ya retorna CompletionRateDTO (extrae data.data internamente)
  const { data: completionRate, isLoading: l2 } = useQuery({
    queryKey: ['completionRate'],
    queryFn: proyectoService.getCompletionRate,
  });

  // proyectoService.getMonthlyProgress() ya retorna MonthlyProgressItem[]
  const { data: monthlyProgress = [], isLoading: l3 } = useQuery({
    queryKey: ['monthlyProgress'],
    queryFn: proyectoService.getMonthlyProgress,
  });

  // FIX: getLiquidityMetrics() → AxiosResponse<BackendResponse<LiquidityRateDTO>>
  // .data (AxiosResponse) → .data (BackendResponse) → LiquidityRateDTO
  const { data: liquidityRate, isLoading: l4 } = useQuery({
    queryKey: ['liquidityRate'],
    queryFn: async () => {
      const { data } = await inversionService.getLiquidityMetrics();
      return data.data;
    },
  });

  // FIX: getAggregatedMetrics() → AxiosResponse<BackendResponse<InversionPorUsuarioDTO[]>>
  // res.data es BackendResponse (un objeto), Array.isArray siempre retornaba false.
  // La lógica anterior "casualmente" funcionaba por el fallback, pero estaba invertida.
  const { data: inversionesPorUsuario = [], isLoading: l5 } = useQuery({
    queryKey: ['inversionesPorUsuario'],
    queryFn: async () => {
      const { data } = await inversionService.getAggregatedMetrics();
      return data.data;
    },
  });

  // FIX: getMorosityMetrics() → AxiosResponse<MorosidadDTO>
  // Antes hacía: (await service() as any).data || await service()
  // Si .data era falsy, ejecutaba una SEGUNDA llamada HTTP y retornaba AxiosResponse crudo.
  const { data: morosidad, isLoading: l6 } = useQuery({
    queryKey: ['morosidad'],
    queryFn: async () => {
      const { data } = await suscripcionService.getMorosityMetrics();
      return data;
    },
  });

  // FIX: mismo bug que morosidad, mismo patrón de doble llamada HTTP.
  const { data: cancelacion, isLoading: l7 } = useQuery({
    queryKey: ['cancelacion'],
    queryFn: async () => {
      const { data } = await suscripcionService.getCancellationMetrics();
      return data;
    },
  });

  // proyectoService.getAllActive() → AxiosResponse<ProyectoDto[]>
  const { data: proyectosActivos = [], isLoading: l8 } = useQuery({
    queryKey: ['proyectosActivos'],
    queryFn: async () => {
      const { data } = await proyectoService.getAllActive();
      return data;
    },
  });

  const { data: allPujas = [], isLoading: l9 } = useQuery({
    queryKey: ['adminAllPujas'],
    queryFn: async () => {
      const { data } = await pujaService.getAllAdmin();
      return data;
    },
  });

  // FIX: enabled usa null-check en lugar de !! que falaría con id === 0
  const { data: popularidadLotes = [], isLoading: loadingPopularidad } = useQuery({
    queryKey: ['popularidadLotes', selectedPopularidadProject],
    queryFn: () => favoritoService.getPopularidadLotes(selectedPopularidadProject!),
    enabled: selectedPopularidadProject !== null,
  });

  // ---------------------------------------------------------------------------
  // EFECTOS
  // ---------------------------------------------------------------------------

  // Seleccionar el primer proyecto activo como valor inicial del selector
  useEffect(() => {
    if (proyectosActivos.length > 0 && selectedPopularidadProject === null) {
      setSelectedPopularidadProject(proyectosActivos[0].id);
    }
  }, [proyectosActivos, selectedPopularidadProject]);

  // ---------------------------------------------------------------------------
  // PROCESAMIENTO DE DATOS
  // ---------------------------------------------------------------------------

  const stats = useMemo(() => ({
    pendingKYC: pendingKYC.length,
    totalInvertido: liquidityRate?.total_invertido_registrado ?? '0',
    totalPagado: liquidityRate?.total_pagado ?? '0',
    tasaLiquidez: liquidityRate?.tasa_liquidez ?? '0',
    proyectosEnProceso: monthlyProgress.filter(p => p.estado === 'En proceso').length,
    proyectosEnEspera: monthlyProgress.filter(p => p.estado === 'En Espera').length,
    totalFinalizados: completionRate?.total_finalizados ?? 0,
    subastasActivas: allPujas.filter(p => p.estado_puja === 'activa').length,
    cobrosPendientes: allPujas.filter(p => p.estado_puja === 'ganadora_pendiente').length,
  }), [pendingKYC, liquidityRate, monthlyProgress, completionRate, allPujas]);

  const chartDataSuscripciones = useMemo(() =>
    monthlyProgress.map(p => ({
      nombre: p.nombre.length > 15 ? `${p.nombre.substring(0, 15)}…` : p.nombre,
      avance: parseFloat(p.porcentaje_avance),
    })),
  [monthlyProgress]);

  // Mapeo para el gráfico de popularidad: el campo dataKey del BarChart es "total_pujas"
  const topLotes = useMemo(() =>
    popularidadLotes.map(l => ({
      nombre_lote: l.nombre_lote,
      total_pujas: l.cantidad_favoritos,
      porcentaje: l.porcentaje_popularidad,
    })),
  [popularidadLotes]);

  const estadosData = useMemo(() =>
    [
      { name: 'En Proceso', value: stats.proyectosEnProceso },
      { name: 'En Espera',  value: stats.proyectosEnEspera },
      { name: 'Finalizados', value: stats.totalFinalizados },
    ].filter(item => item.value > 0),
  [stats]);

  // ---------------------------------------------------------------------------
  // RETORNO
  // ---------------------------------------------------------------------------

  return {
    navigate,
    theme,
    activeTab,
    setActiveTab,
    selectedPopularidadProject,
    setSelectedPopularidadProject,
    isLoading: l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8 || l9,
    loadingPopularidad,
    proyectosActivos,
    popularidadLotes,
    topLotes,
    inversionesPorUsuario,
    completionRate,
    morosidad,
    cancelacion,
    stats,
    chartDataSuscripciones,
    estadosData,
    RECHART_COLORS: [
      theme.palette.primary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.error.main,
    ],
  };
};