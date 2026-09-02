import { formatIDR } from '@/lib/format'

interface CurrencyDisplayProps {
  amount: number
  className?: string
  showSign?: boolean
}

export function CurrencyDisplay({ amount, className, showSign = false }: CurrencyDisplayProps) {
  const formatted = formatIDR(Math.abs(amount))
  const sign = amount < 0 ? '-' : showSign && amount > 0 ? '+' : ''

  return (
    <span className={className}>
      {sign}{formatted}
    </span>
  )
}
