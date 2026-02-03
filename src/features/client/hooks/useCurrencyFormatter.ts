// src/shared/hooks/useCurrencyFormatter.ts

import { useCallback, useMemo } from 'react';
import { env } from '@/core/config/env';

interface CurrencyFormatterOptions {
  currency?: string;
  locale?: string;
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
}

/**
 * Hook para formatear montos de forma consistente y optimizada
 * Cachea el formatter para evitar recreaciones
 */
export const useCurrencyFormatter = (options?: CurrencyFormatterOptions) => {
  const {
    currency = env.defaultCurrency,
    locale = env.defaultLocale,
    maximumFractionDigits = 0,
    minimumFractionDigits = 0
  } = options || {};

  // ✅ Memoizar el formatter (objeto costoso de crear)
  const formatter = useMemo(() => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits,
      minimumFractionDigits
    });
  }, [currency, locale, maximumFractionDigits, minimumFractionDigits]);

  // ✅ Memoizar la función de formateo
  const format = useCallback((amount: number | string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return formatter.format(numAmount);
  }, [formatter]);

  return format;
};

// ✅ Hook especializado para formato compacto (K, M, B)
export const useCompactCurrencyFormatter = (options?: CurrencyFormatterOptions) => {
  const {
    currency = env.defaultCurrency,
    locale = env.defaultLocale,
  } = options || {};

  const formatter = useMemo(() => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1
    });
  }, [currency, locale]);

  const format = useCallback((amount: number | string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return formatter.format(numAmount);
  }, [formatter]);

  return format;
};