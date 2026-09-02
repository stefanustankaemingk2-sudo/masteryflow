import { useState } from 'react'
import { ChevronUp, ChevronDown, Search } from 'lucide-react'

interface Column<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  render?: (item: T) => React.ReactNode
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchKey?: keyof T
  searchPlaceholder?: string
  emptyMessage?: string
  searchTerm?: string
  onSearchChange?: (value: string) => void
  filters?: Array<{ value: string; label: string }>
  selectedFilters?: string[]
  onFilterChange?: (values: string[]) => void
  filterLabel?: string
}

export function DataTable<T extends { id: number | string }>({
  data,
  columns,
  searchKey,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No data found',
  searchTerm: externalSearchTerm,
  onSearchChange,
  filters,
  selectedFilters = [],
  onFilterChange,
  filterLabel,
}: DataTableProps<T>) {
  const [internalSearchTerm, setInternalSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)

  const searchTerm = externalSearchTerm !== undefined ? externalSearchTerm : internalSearchTerm
  const handleSearchChange = onSearchChange || setInternalSearchTerm

  const filteredData = data.filter((item) => {
    if (searchKey && searchTerm) {
      const value = item[searchKey]
      if (!String(value).toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }
    }
    if (filters && filters.length > 0 && selectedFilters.length > 0) {
      const itemStatus = (item as any).status
      if (!selectedFilters.includes(itemStatus)) {
        return false
      }
    }
    return true
  })

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig) return 0
    const aValue = a[sortConfig.key as keyof T]
    const bValue = b[sortConfig.key as keyof T]
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return prev.direction === 'asc' ? { key, direction: 'desc' } : null
      }
      return { key, direction: 'asc' }
    })
  }

  return (
    <div className="border rounded-lg bg-white">
      {(searchKey || (filters && filters.length > 0)) && (
        <div className="p-4 border-b space-y-3">
          {searchKey && (
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          {filters && filters.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {filterLabel && <span className="text-sm font-medium text-gray-700">{filterLabel}:</span>}
              {filters.map((filter) => {
                const isSelected = selectedFilters.includes(filter.value)
                return (
                  <button
                    key={filter.value}
                    onClick={() => {
                      if (!onFilterChange) return
                      if (isSelected) {
                        onFilterChange(selectedFilters.filter(f => f !== filter.value))
                      } else {
                        onFilterChange([...selectedFilters, filter.value])
                      }
                    }}
                    className={`px-3 py-1 text-xs rounded-full border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {filter.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  onClick={() => col.sortable && handleSort(String(col.key))}
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    col.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {col.sortable && (
                      <span className="text-gray-400">
                        {sortConfig?.key === String(col.key) ? (
                          sortConfig.direction === 'asc' ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )
                        ) : null}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-4 py-3 text-sm text-gray-900">
                      {col.render ? col.render(item) : String(item[col.key as keyof T])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
