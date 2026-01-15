import type { InversionDto } from '@/core/types/dto/inversion.dto';
import type { PagoDto } from '@/core/types/dto/pago.dto';
import type { ResumenCuentaDto } from '@/core/types/dto/resumenCuenta.dto';
import type { SuscripcionDto } from '@/core/types/dto/suscripcion.dto';
import { useMemo } from 'react';


interface DashboardStatsInput {
  resumenes?: ResumenCuentaDto[];
  suscripciones?: SuscripcionDto[];
  inversiones?: InversionDto[];
  pagos?: PagoDto[];
}

export const useDashboardStats = ({
  resumenes = [],
  suscripciones = [],
  inversiones = [],
  pagos = []
}: DashboardStatsInput) => {

  return useMemo(() => {
    // --- 1. SUSCRIPCIONES ---
    const saldoTotalAFavor = suscripciones.reduce(
      (acc, curr) => acc + Number(curr.saldo_a_favor || 0), 0
    );

    const totalInvertidoSuscripciones = suscripciones.reduce(
      (acc, s) => acc + Number(s.monto_total_pagado || 0), 0
    );

    // --- 2. INVERSIONES DIRECTAS ---
    const inversionesPagadas = inversiones.filter(i => i.estado === 'pagado');
    const totalInvertidoDirecto = inversionesPagadas.reduce(
      (acc, i) => acc + Number(i.monto), 0
    );

    // --- 3. TOTALES GENERALES ---
    const granTotalInvertido = totalInvertidoSuscripciones + totalInvertidoDirecto;
    const totalProyectos = (resumenes.length) + (inversiones.length);
    
    // --- 4. PAGOS Y DEUDA ---
    const pagosPendientes = pagos.filter(p => p.estado_pago === 'pendiente');
    const pagosVencidos = pagos.filter(p => p.estado_pago === 'vencido');
    
    // Próximo vencimiento
    const proximoVencimiento = pagosPendientes
      .sort((a, b) => new Date(a.fecha_vencimiento).getTime() - new Date(b.fecha_vencimiento).getTime())[0] || null;

    // --- 5. PROGRESO (SOLO SUSCRIPCIONES POR AHORA) ---
    const totalCuotasPagadas = resumenes.reduce((acc, r) => acc + (r.cuotas_pagadas || 0), 0);

    return {
      // Financiero
      saldoTotalAFavor,
      granTotalInvertido,
      
      // Contadores
      totalProyectos,
      totalCuotasPagadas,
      
      // Estado de Cuenta
      pagosVencidos, // Array completo por si necesitas iterarlo en alertas
      cantidadPagosVencidos: pagosVencidos.length,
      proximoVencimiento,
      
      // Mensajería (Auxiliar si quisieras meterlo aquí, pero mejor dejarlo fuera)
    };
  }, [resumenes, suscripciones, inversiones, pagos]);
};