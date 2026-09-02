import { lazy, Suspense } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { SkeletonLoader } from '@/components/shared/SkeletonLoader'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { LoginPage } from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'

// Lazy-load pages for code splitting
const StudentsPage = lazy(() => import('@/pages/StudentsPage').then(m => ({ default: m.StudentsPage })))
const StudentDetailPage = lazy(() => import('@/pages/StudentDetailPage').then(m => ({ default: m.StudentDetailPage })))
const AttendancePage = lazy(() => import('@/pages/AttendancePage').then(m => ({ default: m.AttendancePage })))
const InvoicesPage = lazy(() => import('@/pages/InvoicesPage').then(m => ({ default: m.InvoicesPage })))
const FinancePage = lazy(() => import('@/pages/FinancePage').then(m => ({ default: m.FinancePage })))
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
    },
  },
})

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <SkeletonLoader />
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <AppShell>
      <Suspense fallback={<SkeletonLoader />}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/students/:id" element={<StudentDetailPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/finance" element={<FinancePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </AppShell>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary>
          <AuthProvider>
            <AppContent />
            <Toaster position="bottom-right" />
          </AuthProvider>
        </ErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
