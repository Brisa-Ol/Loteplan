// src/hooks/admin/useAdminDashboard.ts
import { useTheme } from '@mui/material';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Servicios
import { getAdhesionMetrics } from '@/core/api/services/adhesion.service';
import favoritoService from '@/core/api/services/favorito.service';
import inversionService from '@/core/api/services/inversion.service';
import kycService from '@/core/api/services/kyc.service';
import pagoService from '@/core/api/services/pago.service';
import proyectoService from '@/core/api/services/proyecto.service';
import pujaService from '@/core/api/services/puja.service';
import suscripcionService from '@/core/api/services/suscripcion.service';

import { env } from '@/core/config/env';

const DEFAULT_STALE_TIME = env.queryStaleTime || 30000;

export const useAdminDashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const [activeTab, setActiveTab] = useState(0);
  const [selectedPopularidadProject, setSelectedPopularidadProject] = useState<number | null>(null);

  const [filtroPeriodo, setFiltroPeriodo] = useState<string>('este_mes');

  // 🆕 ESTADOS PARA FECHA EXACTA (Reemplazan a los de mes)
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const queryClient = useQueryClient();
  const [togglingLoteId, setTogglingLoteId] = useState<number | null>(null);

  const { mutate: toggleExcluir } = useMutation({
    mutationFn: (idLote: number) => favoritoService.toggleExcluirEstadisticas(idLote),
    onMutate: (idLote) => setTogglingLoteId(idLote),
    onSettled: () => {
      setTogglingLoteId(null);
      queryClient.invalidateQueries({ queryKey: ['popularidadLotes', selectedPopularidadProject] });
    },
  });
  // 🗓️ Cálculo de Fechas basado en el filtro seleccionado
  const { fechaInicio, fechaFin, mesActual, anioActual } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    let fInicio: string | undefined = undefined;
    let fFin: string | undefined = undefined;

    switch (filtroPeriodo) {
      case 'este_mes':
        fInicio = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0];
        fFin = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];
        break;
      case 'ultimo_trimestre':
        fInicio = new Date(currentYear, currentMonth - 3, 1).toISOString().split('T')[0];
        fFin = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];
        break;
      case 'este_anio':
        fInicio = new Date(currentYear, 0, 1).toISOString().split('T')[0];
        fFin = new Date(currentYear, 11, 31).toISOString().split('T')[0];
        break;
      case 'personalizado': // 🆕 Usa las fechas exactas del calendario
        fInicio = customStartDate || undefined;
        fFin = customEndDate || undefined;
        break;
      case 'historico':
      default:
        fInicio = undefined;
        fFin = undefined;
        break;
    }

    return { fechaInicio: fInicio, fechaFin: fFin, mesActual: currentMonth, anioActual: currentYear };
  }, [filtroPeriodo, customStartDate, customEndDate]);

  const results = useQueries({
    queries: [
      { queryKey: ['pendingKYC'], queryFn: kycService.getPendingVerifications, staleTime: DEFAULT_STALE_TIME },
      { queryKey: ['completionRate', fechaInicio, fechaFin], queryFn: () => proyectoService.getCompletionRate(fechaInicio, fechaFin), staleTime: DEFAULT_STALE_TIME },
      { queryKey: ['morosidad', fechaInicio, fechaFin], queryFn: async () => (await suscripcionService.getMorosityMetrics(fechaInicio, fechaFin)).data, staleTime: DEFAULT_STALE_TIME },
      { queryKey: ['cancelacion', fechaInicio, fechaFin], queryFn: async () => (await suscripcionService.getCancellationMetrics(fechaInicio, fechaFin)).data, staleTime: DEFAULT_STALE_TIME },
      { queryKey: ['monthlyProgress'], queryFn: proyectoService.getMonthlyProgress, staleTime: DEFAULT_STALE_TIME },
      { queryKey: ['liquidityRate'], queryFn: async () => (await inversionService.getLiquidityMetrics()).data.data, staleTime: DEFAULT_STALE_TIME },
      { queryKey: ['inversionesPorUsuario'], queryFn: async () => (await inversionService.getAggregatedMetrics()).data.data, staleTime: DEFAULT_STALE_TIME },
      { queryKey: ['proyectosActivos'], queryFn: async () => (await proyectoService.getAllActive()).data, staleTime: DEFAULT_STALE_TIME },
      { queryKey: ['adminAllPujas'], queryFn: async () => (await pujaService.getAllAdmin()).data, staleTime: DEFAULT_STALE_TIME },
      { queryKey: ['allProyectosAdmin'], queryFn: async () => (await proyectoService.getAllAdmin()).data, staleTime: DEFAULT_STALE_TIME },
      { queryKey: ['adhesionMetrics'], queryFn: async () => (await getAdhesionMetrics()).data.data, staleTime: DEFAULT_STALE_TIME },
      {
        queryKey: ['recaudoMensual', fechaInicio, fechaFin],
        queryFn: async () => {
          if (fechaInicio && fechaFin) {
            return (await pagoService.getMetricsByDateRange(fechaInicio, fechaFin)).data.data;
          }
          return (await pagoService.getMonthlyMetrics(mesActual, anioActual)).data.data;
        },
        staleTime: DEFAULT_STALE_TIME
      },
      {
        queryKey: ['pagosATiempo', mesActual, anioActual],
        queryFn: async () => (await pagoService.getOnTimeMetrics(mesActual, anioActual)).data.data,
        staleTime: DEFAULT_STALE_TIME
      }
    ]
  });

  const [
    { data: pendingKYC = [] },
    { data: completionRate },
    { data: morosidad },
    { data: cancelacion },
    { data: monthlyProgress = [] },
    { data: liquidityRate },
    { data: inversionesPorUsuario = [] },
    { data: proyectosActivos = [] },
    { data: allPujas = [] },
    { data: allProyectosAdmin = [] },
    { data: adhesionMetrics },
    { data: recaudoMensual },
    { data: pagosATiempo }
  ] = results;

  const isLoading = results.some(result => result.isLoading);
  const hasError = results.some(result => result.isError);
  const error = hasError ? new Error("Error al cargar las métricas del panel.") : null;
  const { data: popularidadLotes = [], isLoading: loadingPopularidad } = useQuery({
    queryKey: ['popularidadLotes', selectedPopularidadProject],
    queryFn: () => favoritoService.getPopularidadLotes(selectedPopularidadProject!),
    enabled: selectedPopularidadProject !== null,
    staleTime: DEFAULT_STALE_TIME,
  });

  useEffect(() => {
    if (proyectosActivos.length > 0 && selectedPopularidadProject === null) {
      setSelectedPopularidadProject(proyectosActivos[0].id);
    }
  }, [proyectosActivos, selectedPopularidadProject]);

  const proyectosLlenosPendientes = useMemo(() => {
    if (!allProyectosAdmin) return 0;
    return allProyectosAdmin.filter(p =>
      p.estado_proyecto === 'En Espera' &&
      p.suscripciones_actuales >= (p.obj_suscripciones || 1)
    ).length;
  }, [allProyectosAdmin]);

  const stats = useMemo(() => ({
    pendingKYC: pendingKYC.length,
    totalInvertido: liquidityRate?.total_invertido_registrado ?? '0',
    totalPagado: liquidityRate?.total_pagado ?? '0',
    tasaLiquidez: liquidityRate?.tasa_liquidez ?? '0',
    proyectosEnProceso: monthlyProgress.filter((p: any) => p.estado === 'En proceso').length,
    proyectosEnEspera: monthlyProgress.filter((p: any) => p.estado === 'En Espera').length,
    totalFinalizados: completionRate?.total_finalizados ?? 0,
    subastasActivas: allPujas.filter((p: any) => p.estado_puja === 'activa').length,
    cobrosPendientes: allPujas.filter((p: any) => p.estado_puja === 'ganadora_pendiente').length,
    proyectosListosParaIniciar: proyectosLlenosPendientes,
    adhesionesPendienteCobro: adhesionMetrics?.montos?.monto_pendiente ?? '0',
    adhesionesVencidas: adhesionMetrics?.montos?.monto_vencido ?? '0',
    adhesionesTasaCobranza: adhesionMetrics?.tasa_cobranza ?? '0',
  }), [pendingKYC, liquidityRate, monthlyProgress, completionRate, allPujas, proyectosLlenosPendientes, adhesionMetrics]);

  const chartDataSuscripciones = useMemo(() =>
    monthlyProgress.map((p: any) => ({
      nombre: p.nombre,
      avance: parseFloat(String(p.porcentaje_avance || 0))
    })), [monthlyProgress]);

  const topLotes = useMemo(() =>
    popularidadLotes.map((l: any) => ({
      id_lote: l.id_lote,
      nombre_lote: l.nombre_lote,
      total_favoritos: l.cantidad_favoritos,
      porcentaje: l.porcentaje_popularidad,
    })),
    [popularidadLotes]);

  const estadosData = useMemo(() =>
    [
      { name: 'En Proceso', value: stats.proyectosEnProceso },
      { name: 'En Espera', value: stats.proyectosEnEspera },
      { name: 'Finalizados', value: stats.totalFinalizados },
    ].filter(item => item.value > 0),
    [stats]);

  const RECHART_COLORS = useMemo(() => [
    theme.palette.primary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
  ], [theme]);

  return {
    filtroPeriodo,
    setFiltroPeriodo,
    customStartDate,      // 🆕 Exportado
    setCustomStartDate,   // 🆕 Exportado
    customEndDate,        // 🆕 Exportado
    setCustomEndDate,     // 🆕 Exportado
    recaudoMensual,
    pagosATiempo,
    togglingLoteId,
    toggleExcluir,
    activeTab,
    setActiveTab,
    selectedPopularidadProject,
    setSelectedPopularidadProject,
    isLoading,
    loadingPopularidad,
    proyectosActivos,
    inversionesPorUsuario,
    stats,
    morosidad,
    cancelacion,
    completionRate,
    chartDataSuscripciones,
    topLotes,
    estadosData,
    error,
    RECHART_COLORS,
    navigate,
    adhesionMetrics
  };
};