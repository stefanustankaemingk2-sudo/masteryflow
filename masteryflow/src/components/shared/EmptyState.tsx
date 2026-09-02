import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  action?: React.ReactNode
  icon?: LucideIcon
}

export function EmptyState({ title, description, actionLabel, onAction, action, icon: Icon }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      {Icon && (
        <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Icon className="h-6 w-6 text-gray-400" />
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      )}
      {action ? (
        <div className="mt-6">{action}</div>
      ) : actionLabel && onAction ? (
        <button
          onClick={onAction}
          className="mt-6 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}
