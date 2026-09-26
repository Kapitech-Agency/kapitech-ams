/**
 * Currency Formatting & Conversion Utilities for Kapitech Agency AMS
 * Supports IDR (Indonesian Rupiah) and USD (United States Dollar)
 * Default fixed rate: 1 USD = 16,000 IDR
 */

export type CurrencyCode = 'IDR' | 'USD';

const CURRENCY_STORAGE_KEY = 'kapitech_ams_currency';
export const CURRENCY_EVENT = 'kapitech_currency_changed';
export const USD_EXCHANGE_RATE = 16000; // 1 USD = 16,000 IDR

export function getActiveCurrency(): CurrencyCode {
  try {
    const saved = localStorage.getItem(CURRENCY_STORAGE_KEY) as CurrencyCode;
    return saved === 'USD' ? 'USD' : 'IDR';
  } catch {
    return 'IDR';
  }
}

export function setActiveCurrency(currency: CurrencyCode): void {
  try {
    localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
    window.dispatchEvent(new CustomEvent(CURRENCY_EVENT, { detail: { currency } }));
  } catch (e) {
    console.warn('Failed to save currency:', e);
  }
}

export const setGlobalCurrency = setActiveCurrency;

/**
 * Formats an amount in IDR into either IDR or USD string representation
 * @param amountInIdr Numeric value in IDR
 * @param targetCurrency Optional override for currency (defaults to active currency)
 * @param compact Whether to show shorthand formatting (e.g., 250M, $15.6K)
 */
export function formatAmount(
  amountInIdr: number,
  targetCurrency?: CurrencyCode,
  compact: boolean = false
): string {
  const curr = targetCurrency || getActiveCurrency();
  const num = Number(amountInIdr) || 0;

  if (curr === 'USD') {
    const usdValue = num / USD_EXCHANGE_RATE;
    if (compact) {
      if (usdValue >= 1_000_000) {
        return `$${(usdValue / 1_000_000).toFixed(1)}M`;
      }
      if (usdValue >= 1_000) {
        return `$${(usdValue / 1_000).toFixed(1)}k`;
      }
      return `$${usdValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    }
    return `$${Math.round(usdValue).toLocaleString('en-US')}`;
  }

  // IDR
  if (compact) {
    if (num >= 1_000_000_000) {
      return `Rp ${(num / 1_000_000_000).toFixed(1)} M`;
    }
    if (num >= 1_000_000) {
      return `Rp ${(num / 1_000_000).toFixed(0)} Jt`;
    }
    if (num >= 1_000) {
      return `Rp ${(num / 1_000).toFixed(0)} Rb`;
    }
    return `Rp ${num.toLocaleString('id-ID')}`;
  }

  return `Rp ${num.toLocaleString('id-ID')}`;
}

export function convertUsdToIdr(amountInUsd: number): number {
  return (Number(amountInUsd) || 0) * USD_EXCHANGE_RATE;
}

export function convertIdrToUsd(amountInIdr: number): number {
  return Math.round((Number(amountInIdr) || 0) / USD_EXCHANGE_RATE);
}

export function formatIDR(amount: number): string {
  return formatAmount(amount, 'IDR');
}

export const formatCurrency = formatAmount;

