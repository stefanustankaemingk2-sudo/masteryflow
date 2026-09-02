import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Archive, Edit2, AlertCircle } from 'lucide-react'
import { useStudents, useArchiveStudent } from '@/hooks/useStudents'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { StudentForm } from '@/components/students/StudentForm'
import { EmptyState } from '@/components/shared/EmptyState'
import { SkeletonLoader } from '@/components/shared/SkeletonLoader'
import { formatIDR } from '@/lib/format'
import type { Student } from '@/types/database'

const SUBJECTS = ['English', 'Piano', 'Computer'] as const
const STATUSES = ['active', 'inactive', 'archived'] as const

export function StudentsPage() {
  const navigate = useNavigate()
  const { data: students, isLoading, error } = useStudents()
  const archiveMutation = useArchiveStudent()

  const [searchTerm, setSearchTerm] = useState('')
  const [subjectFilter, setSubjectFilter] = useState<string | ''>('')
  const [statusFilter, setStatusFilter] = useState<string | ''>('')
  const [showCreditsOnly, setShowCreditsOnly] = useState(false)
  const [sortKey, setSortKey] = useState<'name' | 'package_balance' | 'credit_balance'>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [studentToArchive, setStudentToArchive] = useState<{ id: string; name: string; hasUnpaid: boolean } | null>(null)

  const ITEMS_PER_PAGE = 20

  // Filter and sort students
  const filteredStudents = students?.filter((student) => {
    if (searchTerm && !student.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    if (subjectFilter && student.subject !== subjectFilter) {
      return false
    }
    if (statusFilter && student.status !== statusFilter) {
      return false
    }
    if (showCreditsOnly && student.credit_balance <= 0) {
      return false
    }
    return true
  })

  const sortedStudents = [...(filteredStudents || [])].sort((a, b) => {
    let comparison = 0
    if (sortKey === 'name') {
      comparison = a.name.localeCompare(b.name)
    } else {
      comparison = a[sortKey] - b[sortKey]
    }
    return sortDirection === 'asc' ? comparison : -comparison
  })

  // Pagination
  const totalPages = Math.ceil((sortedStudents?.length || 0) / ITEMS_PER_PAGE)
  const paginatedStudents = sortedStudents?.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const getBalanceBadgeColor = (balance: number) => {
    if (balance <= 1) return 'bg-red-100 text-red-800'
    if (balance <= 3) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const handleArchiveClick = (student: Student) => {
    // Check for unpaid invoices (in real app, would query invoices)
    // For now, we'll assume no unpaid invoices for demo
    setStudentToArchive({ id: student.id, name: student.name, hasUnpaid: false })
    setArchiveDialogOpen(true)
  }

  const handleArchiveConfirm = () => {
    if (studentToArchive) {
      archiveMutation.mutate(studentToArchive.id, {
        onSuccess: () => {
          setArchiveDialogOpen(false)
          setStudentToArchive(null)
        },
      })
    }
  }

  const handleCreateClick = () => {
    setEditingStudent(null)
    setFormOpen(true)
  }

  const handleEditClick = (student: Student) => {
    setEditingStudent(student)
    setFormOpen(true)
  }

  const handleFormSubmit = () => {
    // In real app, would call create/update mutation
    setFormOpen(false)
    setEditingStudent(null)
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <span>Failed to load students. Please try again.</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600 mt-1">Manage your tutoring students</p>
        </div>
        <button
          onClick={handleCreateClick}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          Add Student
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Subjects</option>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Credits Toggle */}
          <div className="flex items-center">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={showCreditsOnly}
                onChange={(e) => setShowCreditsOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Has Credits
            </label>
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <SkeletonLoader lines={10} />
      ) : paginatedStudents && paginatedStudents.length > 0 ? (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Subject
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('package_balance')}
                  >
                    Balance {sortKey === 'package_balance' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Rate/Session
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('credit_balance')}
                  >
                    Credits {sortKey === 'credit_balance' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      <div>
                        <div>{student.name}</div>
                        <div className="text-xs text-gray-500">{student.parent_name}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{student.subject}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getBalanceBadgeColor(student.package_balance)}`}
                      >
                        {student.package_balance} sessions
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatIDR(student.rate_per_session)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {student.credit_balance > 0 ? formatIDR(student.credit_balance) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          student.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : student.status === 'inactive'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => navigate(`/students/${student.id}`)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="View details"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEditClick(student)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {student.status !== 'archived' && (
                          <button
                            onClick={() => handleArchiveClick(student)}
                            className="p-1 hover:bg-red-50 text-red-600 rounded"
                            title="Archive"
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                {Math.min(currentPage * ITEMS_PER_PAGE, sortedStudents?.length || 0)} of{' '}
                {sortedStudents?.length || 0} students
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          title="No students found"
          description="Try adjusting your filters or add a new student."
          actionLabel="Add Student"
          onAction={handleCreateClick}
        />
      )}

      {/* Create/Edit Form Modal */}
      <StudentForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditingStudent(null)
        }}
        onSubmit={handleFormSubmit}
        student={editingStudent}
      />

      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        open={archiveDialogOpen}
        title="Archive Student?"
        message={
          studentToArchive?.hasUnpaid
            ? `Cannot archive "${studentToArchive.name}". This student has unpaid invoices. Please cancel or mark them as paid first.`
            : `Are you sure you want to archive "${studentToArchive?.name}"? This will change their status to archived.`
        }
        confirmLabel="Archive"
        destructive
        onConfirm={handleArchiveConfirm}
        onCancel={() => {
          setArchiveDialogOpen(false)
          setStudentToArchive(null)
        }}
        isLoading={archiveMutation.isPending}
      />
    </div>
  )
}
