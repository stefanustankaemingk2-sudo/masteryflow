// src/lib/format.ts
import { format, parseISO, formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'

/**
 * Format date to Indonesian locale
 * Example: "25 Agustus 2026"
 */
export function formatDateID(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString
  return format(date, 'd MMMM yyyy', { locale: id })
}

/**
 * Format date with time
 * Example: "25 Agustus 2026, 14:30"
 */
export function formatDateTimeID(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString
  return format(date, 'd MMMM yyyy, HH:mm', { locale: id })
}

/**
 * Format date short
 * Example: "25 Agu 2026"
 */
export function formatDateShortID(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString
  return format(date, 'd MMM yyyy', { locale: id })
}

/**
 * Format relative time
 * Example: "3 hari yang lalu"
 */
export function formatRelativeTime(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString
  return formatDistanceToNow(date, { addSuffix: true, locale: id })
}

/**
 * Currency formatter
 */
export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}