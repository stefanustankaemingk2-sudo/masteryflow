import { useState } from 'react'
import { Menu, X, BookOpen, LogOut } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const navItems = [
  { name: 'Dashboard', path: '/', icon: '📊' },
  { name: 'Students', path: '/students', icon: '👨‍🎓' },
  { name: 'Attendance', path: '/attendance', icon: '📝' },
  { name: 'Invoices', path: '/invoices', icon: '💰' },
  { name: 'Finance', path: '/finance', icon: '📈' },
  { name: 'Settings', path: '/settings', icon: '⚙️' },
]

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const { logout } = useAuth()

  const isActive = (path: string) => location.pathname === path

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-4 shadow-sm">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5 text-gray-700" />
        </button>
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-blue-600" />
          <h1 className="font-bold text-lg text-gray-900">MasteryFlow</h1>
        </div>
        <div className="w-9" />
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 lg:translate-x-0 shadow-xl lg:shadow-sm',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center px-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <BookOpen className="h-6 w-6 text-white mr-2" />
          <h1 className="font-bold text-lg text-white">MasteryFlow</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto p-2 hover:bg-blue-800 rounded-lg lg:hidden transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                isActive(item.path)
                  ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 shadow-sm'
                  : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
              )}
            >
              <span className="text-lg">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Footer Info */}
        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50 space-y-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors border border-gray-300"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
          <p className="text-xs text-gray-500 text-center">© 2026 MasteryFlow</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen pb-8">
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
