// src/features/client/hooks/useProyectoHelpers.ts

import ImagenService from '@/core/api/services/imagen.service';
import type { ProyectoDto } from '@/core/types/proyecto.dto';
import { Savings, TrendingUp } from '@mui/icons-material';
import { useMemo } from 'react';

// --- UTILS ---
const normalizarFecha = (fechaStr: string) => {
  if (!fechaStr) return null;
  const fecha = new Date(fechaStr);
  // Si viene sin hora (YYYY-MM-DD), ajustamos para evitar el desfase UTC
  if (fechaStr.indexOf('T') === -1) {
    fecha.setMinutes(fecha.getMinutes() + fecha.getTimezoneOffset());
  }
  return fecha;
};

const calcularDiasDiferencia = (fechaObjetivo: Date) => {
  const ahora = new Date();
  ahora.setHours(0, 0, 0, 0); // Reset a medianoche actual

  const objetivo = new Date(fechaObjetivo);
  objetivo.setHours(0, 0, 0, 0); // Reset a medianoche objetivo

  const diffMs = objetivo.getTime() - ahora.getTime();
  const dias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return dias; // Puede ser negativo si ya pasó
};

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

    // Cálculo Inteligente de Tiempo
    const fechaInicio = normalizarFecha(proyecto.fecha_inicio);
    const fechaCierre = normalizarFecha(proyecto.fecha_cierre);

    let diasRestantes = 0;
    let esUrgente = false;
    let tiempoLabel = '';

    if (proyecto.estado_proyecto === 'En Espera' && fechaInicio) {
      // Caso 1: Aún no empieza
      diasRestantes = calcularDiasDiferencia(fechaInicio);
      tiempoLabel = diasRestantes <= 0 ? 'Abre hoy' : `Abre en ${diasRestantes} días`;
    } else if (proyecto.estado_proyecto === 'En proceso' && fechaCierre) {
      // Caso 2: Está activo, contamos para el cierre
      diasRestantes = calcularDiasDiferencia(fechaCierre);
      esUrgente = diasRestantes >= 0 && diasRestantes <= 10; // Urgente si faltan 10 días o menos

      if (diasRestantes < 0) tiempoLabel = 'Finalizado';
      else if (diasRestantes === 0) tiempoLabel = '¡Cierra hoy!';
      else if (diasRestantes === 1) tiempoLabel = '¡Cierra mañana!';
      else tiempoLabel = `Cierra en ${diasRestantes} días`;
    }

    const fechaInicioTexto = fechaInicio?.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) || '-';
    const fechaCierreTexto = fechaCierre?.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) || '-';

    // ==========================================
    // 🖼️ IMÁGENES
    // ==========================================
    const imagenesActivas = proyecto.imagenes?.filter(img => (img as any).activo !== false) || [];
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
    // 📍 ESTADO DEL PROYECTO
    // ==========================================
    const estadoConfig = {
      'En Espera': { color: 'warning', label: 'Próximamente' },
      'En proceso': { color: 'success', label: 'Activo' },
      'Finalizado': { color: 'default', label: 'Finalizado' }
    }[proyecto.estado_proyecto] || { color: 'default', label: proyecto.estado_proyecto };

    const estaFinalizado = proyecto.estado_proyecto === 'Finalizado';

    return {
      esMensual,
      esDirecto,
      badge,
      formatMoney,
      precioFormateado,

      // Tiempo Mejorado
      plazoTexto,
      diasRestantes, // Número crudo para lógica
      tiempoLabel,   // Texto listo para UI ("Cierra en 5 días")
      esUrgente,
      fechas: { inicio: fechaInicioTexto, cierre: fechaCierreTexto },

      imagenes,
      imagenPrincipal,
      progreso,
      estadoConfig,
      estaFinalizado,
      esPack: !!proyecto.pack_de_lotes
    };
  }, [proyecto]);
};