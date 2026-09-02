import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Archive, AlertCircle } from 'lucide-react'
import { useStudent } from '@/hooks/useStudents'
import { formatIDR } from '@/lib/format'
import { EmptyState } from '@/components/shared/EmptyState'
import { SkeletonLoader } from '@/components/shared/SkeletonLoader'

type Tab = 'lesson-history' | 'invoice-history'

export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('lesson-history')

  const { data: student, isLoading: studentLoading, error: studentError } = useStudent(id || '')

  if (studentError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <span>Failed to load student. Please try again.</span>
          </div>
        </div>
      </div>
    )
  }

  if (studentLoading) {
    return (
      <div className="p-6">
        <SkeletonLoader lines={6} />
      </div>
    )
  }

  if (!student) {
    return (
      <EmptyState
        title="Student not found"
        description="The student you're looking for doesn't exist."
        actionLabel="Back to Students"
        onAction={() => navigate('/students')}
      />
    )
  }

  const getBalanceBadgeColor = (balance: number) => {
    if (balance <= 1) return 'bg-red-100 text-red-800'
    if (balance <= 3) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  const sessionsTotal = parseInt(student.package_type.match(/\d+/)?.[0] || '0', 10) || 0
  const sessionsUsed = sessionsTotal - student.package_balance
  const progressPercent = sessionsTotal > 0 ? (sessionsUsed / sessionsTotal) * 100 : 0

  return (
    <div className="p-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/students')}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Students
      </button>

      {/* Header */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
            <p className="text-gray-600 mt-1">
              {student.subject} • {student.curriculum_level}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Parent: {student.parent_name} • {student.parent_phone || 'No phone'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/students/${id}/edit`)}
              className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </button>
            <button
              disabled={student.status === 'archived'}
              className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <Archive className="h-4 w-4" />
              Archive
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
          <div>
            <p className="text-sm text-gray-600">Package Type</p>
            <p className="font-semibold text-gray-900">{student.package_type}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Sessions Remaining</p>
            <span
              className={`inline-flex px-2 py-1 rounded-full text-sm font-medium ${getBalanceBadgeColor(student.package_balance)}`}
            >
              {student.package_balance}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-600">Rate per Session</p>
            <p className="font-semibold text-gray-900">{formatIDR(student.rate_per_session)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Credit Balance</p>
            <p className="font-semibold text-gray-900">
              {student.credit_balance > 0 ? formatIDR(student.credit_balance) : 'Rp 0'}
            </p>
          </div>
        </div>

        {/* Package Progress Bar */}
        {sessionsTotal > 0 && (
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Package Progress</span>
              <span className="font-medium text-gray-900">
                {sessionsUsed} / {sessionsTotal} sessions
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('lesson-history')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'lesson-history'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Lesson History
          </button>
          <button
            onClick={() => setActiveTab('invoice-history')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'invoice-history'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Invoice History
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'lesson-history' && (
        <div className="bg-white border rounded-lg">
          <EmptyState
            title="No lessons recorded"
            description="Start tracking lessons for this student."
          />
        </div>
      )}

      {activeTab === 'invoice-history' && (
        <div className="bg-white border rounded-lg">
          <EmptyState
            title="No invoices yet"
            description="Create an invoice for this student."
          />
        </div>
      )}
    </div>
  )
}
