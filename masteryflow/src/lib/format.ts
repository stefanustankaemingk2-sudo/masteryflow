import { format } from 'date-fns';

/**
 * Format number as Indonesian Rupiah (IDR) with no decimals
 * Uses Intl.NumberFormat with 'id-ID' locale
 */
export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date as 'dd MMM yyyy' (e.g., "15 Jan 2024")
 * Uses date-fns for consistent formatting
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd MMM yyyy');
}
