// src/components/shared/CurrencyDisplay.tsx

interface CurrencyDisplayProps {
  amount: number
  showDecimals?: boolean
  className?: string
}

export function CurrencyDisplay({ 
  amount, 
  showDecimals = false,
  className = '' 
}: CurrencyDisplayProps) {
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount)

  return <span className={className}>{formatted}</span>
}

// Alternative simpler version (if you prefer):
export function CurrencyDisplaySimple({ amount }: { amount: number }) {
  return <span>Rp{amount.toLocaleString('id-ID')}</span>
}