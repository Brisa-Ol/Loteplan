// src/shared/hooks/useCurrencyFormatter.ts

import { env } from '@/core/config/env';
import { useCallback, useMemo } from 'react';

interface CurrencyFormatterOptions {
  currency?: string;
  locale?: string;
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
}

/**
 * Hook para formatear montos de moneda.
 * ✅ Aplica env.defaultLocale y env.defaultCurrency.
 * ✅ Remueve decimales si es entero (ej: $ 5.000), los mantiene si es decimal (ej: $ 5.000,50).
 */
export const useCurrencyFormatter = (options?: CurrencyFormatterOptions) => {
  const {
    currency = env.defaultCurrency || 'ARS',
    locale = env.defaultLocale || 'es-AR',
    maximumFractionDigits = 2,
    minimumFractionDigits = 2
  } = options || {};

  // Formateador para números ENTEROS (Limpia el .00 innecesario)
  const intFormatter = useMemo(() => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    });
  }, [currency, locale]);

  // Formateador para números CON DECIMALES
  const decFormatter = useMemo(() => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits,
      minimumFractionDigits
    });
  }, [currency, locale, maximumFractionDigits, minimumFractionDigits]);

  return useCallback((amount: number | string | null | undefined): string => {
    if (amount === null || amount === undefined) return intFormatter.format(0);
    
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numAmount)) return intFormatter.format(0);

    // Si es entero exacto, usamos el formato sin decimales para mayor limpieza visual
    return Number.isInteger(numAmount)
      ? intFormatter.format(numAmount)
      : decFormatter.format(numAmount);
  }, [intFormatter, decFormatter]);
};

/**
 * Hook para formato compacto (K para miles, M para millones)
 * Ideal para Dashboards o Cards con poco espacio.
 */
export const useCompactCurrencyFormatter = (options?: CurrencyFormatterOptions) => {
  const {
    currency = env.defaultCurrency || 'ARS',
    locale = env.defaultLocale || 'es-AR',
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

  return useCallback((amount: number | string | null | undefined): string => {
    if (amount === null || amount === undefined) return formatter.format(0);
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(numAmount) ? formatter.format(0) : formatter.format(numAmount);
  }, [formatter]);
};

/**
 * Hook para formatear números puros (tokens, cantidades, stock)
 */
export const useNumberFormatter = (options?: Intl.NumberFormatOptions) => {
  const locale = env.defaultLocale || 'es-AR';

  const formatter = useMemo(() => {
    return new Intl.NumberFormat(locale, {
      maximumFractionDigits: 0,
      ...options
    });
  }, [locale, options]);

  return useCallback((amount: number | string | null | undefined) => {
    if (amount === null || amount === undefined) return formatter.format(0);
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(num) ? formatter.format(0) : formatter.format(num);
  }, [formatter]);
};