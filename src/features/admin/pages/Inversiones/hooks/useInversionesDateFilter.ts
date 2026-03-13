// src/features/admin/pages/Inversiones/hooks/useInversionesDateFilter.ts

import type { InversionDto } from '@/core/types/inversion.dto';
import { useMemo, useState } from 'react';

const useInversionesDateFilter = (inversiones: InversionDto[]) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredData = useMemo(() => inversiones.filter((inv) => {
    const fechaBase = inv.fecha_inversion || inv.createdAt;
    if (!fechaBase) return true;
    const invDate = new Date(fechaBase).toISOString().split('T')[0];
    if (startDate && invDate < startDate) return false;
    if (endDate && invDate > endDate) return false;
    return true;
  }), [inversiones, startDate, endDate]);

  const clearDates = () => { setStartDate(''); setEndDate(''); };

  return { startDate, setStartDate, endDate, setEndDate, filteredData, clearDates };
};

export default useInversionesDateFilter;