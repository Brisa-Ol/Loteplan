// src/hooks/admin/useAdminDashboard.ts
import { useTheme } from '@mui/material';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Servicios
import favoritoService from '@/core/api/services/favorito.service';
import inversionService from '@/core/api/services/inversion.service';
import kycService from '@/core/api/services/kyc.service';
import proyectoService from '@/core/api/services/proyecto.service';
import pujaService from '@/core/api/services/puja.service';
import suscripcionService from '@/core/api/services/suscripcion.service';

export const useAdminDashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedPopularidadProject, setSelectedPopularidadProject] = useState<number | null>(null);

  const results = useQueries({
    queries: [
      { queryKey: ['pendingKYC'], queryFn: kycService.getPendingVerifications },
      { queryKey: ['completionRate'], queryFn: proyectoService.getCompletionRate },
      { queryKey: ['monthlyProgress'], queryFn: proyectoService.getMonthlyProgress },
      { queryKey: ['liquidityRate'], queryFn: async () => (await inversionService.getLiquidityMetrics()).data.data },
      { queryKey: ['inversionesPorUsuario'], queryFn: async () => (await inversionService.getAggregatedMetrics()).data.data },
      { queryKey: ['morosidad'], queryFn: async () => (await suscripcionService.getMorosityMetrics()).data },
      { queryKey: ['cancelacion'], queryFn: async () => (await suscripcionService.getCancellationMetrics()).data },
      { queryKey: ['proyectosActivos'], queryFn: async () => (await proyectoService.getAllActive()).data },
      { queryKey: ['adminAllPujas'], queryFn: async () => (await pujaService.getAllAdmin()).data },
      // 🆕 Agregamos los proyectos completos para poder filtrarlos
      { queryKey: ['allProyectosAdmin'], queryFn: async () => (await proyectoService.getAllAdmin()).data }
    ]
  });

  const [
    { data: pendingKYC = [] },
    { data: completionRate },
    { data: monthlyProgress = [] },
    { data: liquidityRate },
    { data: inversionesPorUsuario = [] },
    { data: morosidad },
    { data: cancelacion },
    { data: proyectosActivos = [] },
    { data: allPujas = [] },
    { data: allProyectosAdmin = [] } // 🆕
  ] = results;

  const isLoading = results.some(result => result.isLoading);

  const { data: popularidadLotes = [], isLoading: loadingPopularidad } = useQuery({
    queryKey: ['popularidadLotes', selectedPopularidadProject],
    queryFn: () => favoritoService.getPopularidadLotes(selectedPopularidadProject!),
    enabled: selectedPopularidadProject !== null,
  });

  useEffect(() => {
    if (proyectosActivos.length > 0 && selectedPopularidadProject === null) {
      setSelectedPopularidadProject(proyectosActivos[0].id);
    }
  }, [proyectosActivos, selectedPopularidadProject]);

  // 🆕 Extraemos la lógica de proyectos llenos ANTES de stats
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
    // 🆕 Lo inyectamos aquí
    proyectosListosParaIniciar: proyectosLlenosPendientes 
  }), [pendingKYC, liquidityRate, monthlyProgress, completionRate, allPujas, proyectosLlenosPendientes]);

  const chartDataSuscripciones = useMemo(() => 
    monthlyProgress.map((p: any) => ({
      nombre: p.nombre, 
      avance: parseFloat(String(p.porcentaje_avance || 0))
    })), [monthlyProgress]);

  const topLotes = useMemo(() =>
    popularidadLotes.map((l: any) => ({
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
    RECHART_COLORS,
    navigate
  };
};