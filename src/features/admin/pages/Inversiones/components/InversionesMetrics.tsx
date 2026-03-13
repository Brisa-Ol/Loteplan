// src/features/admin/pages/Inversiones/components/InversionesMetrics.tsx

import { env } from '@/core/config/env';
import type { InversionDto } from '@/core/types/inversion.dto';
import MetricsGrid from '@/shared/components/admin/Metricsgrid';
import { StatCard } from '@/shared/components/domain/cards/StatCard';
import { AccountBalance, AttachMoney, ReceiptLong, TrendingUp } from '@mui/icons-material';
import React, { useMemo } from 'react';

interface Props {
  data: InversionDto[];
  isLoading: boolean;
  hasDateFilter: boolean;
}

const InversionesMetrics: React.FC<Props> = ({ data, isLoading, hasDateFilter }) => {
  const metrics = useMemo(() => {
    const total = data.reduce((acc, curr) => acc + Number(curr.monto), 0);
    const pagado = data.filter(i => i.estado === 'pagado').reduce((acc, curr) => acc + Number(curr.monto), 0);
    return {
      total,
      pagado,
      transacciones: data.length,
      conversion: total > 0 ? (pagado / total) * 100 : 0,
    };
  }, [data]);

  return (
    <MetricsGrid columns={{ xs: 1, sm: 2, lg: 4 }} sx={{ mb: 3 }}>
      <StatCard title="Capital Total" value={`$${metrics.total.toLocaleString(env.defaultLocale, { maximumFractionDigits: 0 })}`}
        subtitle={hasDateFilter ? 'En periodo seleccionado' : 'Registrado en sistema'}
        color="primary" icon={<AttachMoney />} loading={isLoading} />
      <StatCard title="Consolidado" value={`$${metrics.pagado.toLocaleString(env.defaultLocale, { maximumFractionDigits: 0 })}`}
        subtitle="Cobros efectivos" color="success" icon={<AccountBalance />} loading={isLoading} />
      <StatCard title="Efectividad" value={`${metrics.conversion.toFixed(1)}%`}
        subtitle="Tasa de pago" color="warning" icon={<TrendingUp />} loading={isLoading} />
      <StatCard title="Tickets" value={metrics.transacciones.toString()}
        subtitle="Operaciones encontradas" color="info" icon={<ReceiptLong />} loading={isLoading} />
    </MetricsGrid>
  );
};

export default InversionesMetrics;