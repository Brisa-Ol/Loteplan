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
 * ✅ MEJORA: Remueve dinámicamente los decimales si el número es un entero exacto (ej: 5.00 -> $ 5),
 * pero conserva los decimales si tiene cifras significativas (ej: 15.99 -> $ 15,99).
 */
export const useCurrencyFormatter = (options?: CurrencyFormatterOptions) => {
  const {
    currency = env.defaultCurrency || 'ARS',
    locale = env.defaultLocale || 'es-AR',
    maximumFractionDigits = 2,
    minimumFractionDigits = 2
  } = options || {};

  // Formateador para números ENTEROS (Sin .00)
  const intFormatter = useMemo(() => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    });
  }, [currency, locale]);

  // Formateador para números CON DECIMALES (Conserva los 2 decimales)
  const decFormatter = useMemo(() => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits,
      minimumFractionDigits
    });
  }, [currency, locale, maximumFractionDigits, minimumFractionDigits]);

  const format = useCallback((amount: number | string): string => {
    // 1. Convertir a número (parseFloat ignora los ceros a la derecha como '5.00' -> 5)
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numAmount)) return intFormatter.format(0);

    // 2. Si es un número entero exacto, usamos el formateador sin decimales.
    // Si tiene fracciones (ej: 15.99), usamos el que tiene decimales.
    return Number.isInteger(numAmount)
      ? intFormatter.format(numAmount)
      : decFormatter.format(numAmount);
  }, [intFormatter, decFormatter]);

  return format;
};

/**
 * Hook especializado para formato compacto (K, M, B)
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

  const format = useCallback((amount: number | string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return formatter.format(0);
    return formatter.format(numAmount);
  }, [formatter]);

  return format;
};

/**
 * Hook para formatear números puros (tokens, cantidades)
 */
export const useNumberFormatter = (options?: Intl.NumberFormatOptions) => {
  const locale = env.defaultLocale || 'es-AR';

  const formatter = useMemo(() => {
    return new Intl.NumberFormat(locale, {
      maximumFractionDigits: 0,
      ...options
    });
  }, [locale, options]);

  return useCallback((amount: number | string) => {
    const num = typeof amount === 'string' ? parseInt(amount, 10) : amount;
    return formatter.format(num || 0);
  }, [formatter]);
};