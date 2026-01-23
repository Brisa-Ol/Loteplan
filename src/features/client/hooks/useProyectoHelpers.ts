// src/features/client/hooks/useProyectoHelpers.ts

import { useMemo } from 'react';
import { Savings, TrendingUp } from '@mui/icons-material';
import ImagenService from '@/core/api/services/imagen.service';
import type { ProyectoDto } from '@/core/types/dto/proyecto.dto';

/**
 * Hook centralizado para lógica de negocio de proyectos.
 * Elimina duplicación de código entre ProjectCard, ProjectHero y ProjectSidebar.
 * * @param proyecto - El proyecto a procesar
 * @returns Objeto con helpers y datos calculados
 */
export const useProyectoHelpers = (proyecto: ProyectoDto) => {
  return useMemo(() => {
    // ==========================================
    // 🏷️ TIPO DE INVERSIÓN
    // ==========================================
    const esMensual = proyecto.tipo_inversion === 'mensual';
    const esDirecto = proyecto.tipo_inversion === 'directo';

    // ==========================================
    // 🎨 BADGE VISUAL
    // ==========================================
    const badge = {
      icon: esMensual ? Savings : TrendingUp,
      label: esMensual ? 'PLAN DE AHORRO' : 'INVERSIÓN DIRECTA',
      color: esMensual ? 'success' : 'primary'
    };

    // ==========================================
    // 💰 FORMATO DE MONEDA
    // ==========================================
    const formatMoney = (amount: number): string => 
      new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: proyecto.moneda === 'USD' ? 'USD' : 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);

    const precioFormateado = formatMoney(Number(proyecto.monto_inversion));

    // ==========================================
    // 📅 PLAZO Y FECHAS
    // ==========================================
    const plazoTexto = esMensual && proyecto.plazo_inversion 
      ? `${proyecto.plazo_inversion} Cuotas` 
      : 'Pago Único';

    const getDaysRemaining = (): number => {
      if (!proyecto.fecha_cierre) return 0;
      const end = new Date(proyecto.fecha_cierre);
      const now = new Date();
      const diff = end.getTime() - now.getTime();
      return Math.ceil(diff / (1000 * 3600 * 24));
    };

    const diasRestantes = getDaysRemaining();
    const esUrgente = diasRestantes > 0 && diasRestantes < 30;

    // ==========================================
    // 🖼️ IMÁGENES (CORREGIDO ✅)
    // ==========================================
    
    // 1. Filtramos las imágenes que NO estén marcadas como inactivas (soft delete)
    // Usamos (img as any) por seguridad si la propiedad 'activo' no está en tu DTO estricto aún
    const imagenesActivas = proyecto.imagenes?.filter(img => (img as any).activo !== false) || [];

    // 2. Resolvemos las URLs o asignamos el placeholder si no quedan imágenes
    const imagenes = imagenesActivas.length > 0
      ? imagenesActivas.map(img => ImagenService.resolveImageUrl(img.url))
      : ['/assets/placeholder-project.jpg'];

    const imagenPrincipal = imagenes[0];

    // ==========================================
    // 📊 PROGRESO (SOLO MENSUALES)
    // ==========================================
    const progreso = esMensual ? {
      meta: proyecto.obj_suscripciones || 1,
      actual: proyecto.suscripciones_actuales || 0,
      porcentaje: Math.min(
        ((proyecto.suscripciones_actuales || 0) / (proyecto.obj_suscripciones || 1)) * 100, 
        100
      ),
      disponibles: Math.max(
        (proyecto.obj_suscripciones || 0) - (proyecto.suscripciones_actuales || 0),
        0
      )
    } : null;

    // ==========================================
    // 🏘️ LOTES
    // ==========================================
    const cantidadLotes = proyecto.lotes?.length || 0;
    const hayLotes = cantidadLotes > 0;
    const tieneUbicacion = !!(proyecto.latitud && proyecto.longitud);

    // ==========================================
    // 📍 ESTADO DEL PROYECTO
    // ==========================================
    const estadoConfig = {
      'En Espera': { color: 'warning', label: 'Próximamente' },
      'En proceso': { color: 'success', label: 'Activo' },
      'Finalizado': { color: 'default', label: 'Finalizado' }
    }[proyecto.estado_proyecto] || { color: 'default', label: proyecto.estado_proyecto };

    const estaActivo = proyecto.estado_proyecto === 'En proceso';
    const estaFinalizado = proyecto.estado_proyecto === 'Finalizado';

    // ==========================================
    // 🎁 CARACTERÍSTICAS ESPECIALES
    // ==========================================
    const esPack = !!proyecto.pack_de_lotes;

    return {
      // Tipo
      esMensual,
      esDirecto,
      
      // Visual
      badge,
      
      // Dinero
      formatMoney,
      precioFormateado,
      
      // Tiempo
      plazoTexto,
      diasRestantes,
      esUrgente,
      
      // Imágenes
      imagenes,
      imagenPrincipal,
      
      // Progreso
      progreso,
      
      // Lotes
      cantidadLotes,
      hayLotes,
      tieneUbicacion,
      
      // Estado
      estadoConfig,
      estaActivo,
      estaFinalizado,
      
      // Especiales
      esPack
    };
  }, [proyecto]);
};