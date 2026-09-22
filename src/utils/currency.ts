/**
 * Currency utilities for cent-safe financial operations
 */

export function formatCurrency(cents: number = 0): string {
  const safeNumber = isNaN(cents) ? 0 : cents / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeNumber);
}

export const formatCurrencyCents = formatCurrency;

export function formatCurrencyInput(cents: number = 0): string {
  const safeNumber = isNaN(cents) ? 0 : cents / 100;
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeNumber);
}

export function formatCurrencyCompact(cents: number = 0): string {
  const safeNumber = isNaN(cents) ? 0 : cents / 100;
  if (Math.abs(safeNumber) >= 1_000_000) {
    return `R$ ${(safeNumber / 1_000_000).toFixed(1).replace('.', ',')}M`;
  }
  if (Math.abs(safeNumber) >= 10_000) {
    return `R$ ${(safeNumber / 1_000).toFixed(1).replace('.', ',')}k`;
  }
  return formatCurrency(cents);
}

/**
 * Converts a string formatted as currency (e.g., "1.250,50" or "R$ 1.250,50") or a number to integer cents.
 */
export function parseCurrencyInput(input: string | number): number {
  if (typeof input === 'number') {
    return Math.round(input * 100);
  }
  if (!input) return 0;

  // Clean all characters except digits, commas, and dots
  const clean = input
    .replace(/[^\d,.-]/g, '')
    .trim();

  if (!clean) return 0;

  // If Brazilian format with comma decimal e.g. "1.250,50"
  if (clean.includes(',')) {
    const withoutThousands = clean.replace(/\./g, '');
    const standardDecimal = withoutThousands.replace(',', '.');
    const parsed = parseFloat(standardDecimal);
    return isNaN(parsed) ? 0 : Math.round(parsed * 100);
  }

  // Standard float format e.g. "1250.50"
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100);
}

export const parseCurrencyToCents = parseCurrencyInput;

export function centsToNumber(cents: number = 0): number {
  return cents / 100;
}

export function numberToCents(num: number = 0): number {
  return Math.round(num * 100);
}

export function formatPercentage(val: number = 0, decimals: number = 1): string {
  const safe = isNaN(val) ? 0 : val;
  return `${safe.toFixed(decimals).replace('.', ',')}%`;
}
