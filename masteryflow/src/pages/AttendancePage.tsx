import { useState, useMemo } from 'react'
import { useStudents } from '@/hooks/useStudents'
import { useLessonLogs } from '@/hooks/useLessonLogs'
import { DataTable } from '@/components/shared/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { SkeletonLoader } from '@/components/shared/SkeletonLoader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { MarkAttendanceDialog } from '@/components/attendance/MarkAttendanceDialog'
import type { LessonLog } from '@/types/database'
import { Calendar, SortAsc, SortDesc } from 'lucide-react'
import { toast } from 'sonner'

type AttendanceStatus = 'present' | 'absent' | 'cancelled' | 'makeup'

interface AttendanceRow {
  id: string
  student_name: string
  subject: string
  lesson_date: string
  topic_covered: string
  status: AttendanceStatus
  mastery_score: number | null
  student_id: string
}

export function AttendancePage() {
  const { data: students, isLoading: studentsLoading } = useStudents()
  const { 
    data: lessonLogs, 
    isLoading: logsLoading,
    deleteLessonLog 
  } = useLessonLogs()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus[]>([])
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedLog, setSelectedLog] = useState<LessonLog | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [logToDelete, setLogToDelete] = useState<LessonLog | null>(null)

  const rows: AttendanceRow[] = useMemo(() => {
    if (!lessonLogs || !students) return []

    const studentMap = new Map(students.map(s => [s.id, s]))

    return lessonLogs.map(log => {
      const student = studentMap.get(log.student_id)
      return {
        id: log.id,
        student_name: student?.name || 'Unknown',
        subject: student?.subject || 'Unknown',
        lesson_date: log.lesson_date,
        topic_covered: log.topic_covered || '',
        status: log.status as AttendanceStatus,
        mastery_score: log.mastery_score,
        student_id: log.student_id,
      }
    })
  }, [lessonLogs, students])

  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch = 
          row.student_name.toLowerCase().includes(searchLower) ||
          row.subject.toLowerCase().includes(searchLower) ||
          row.topic_covered.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }

      // Status filter
      if (statusFilter.length > 0 && !statusFilter.includes(row.status)) {
        return false
      }

      // Date range filter
      if (dateFrom && row.lesson_date < dateFrom) {
        return false
      }
      if (dateTo && row.lesson_date > dateTo) {
        return false
      }

      return true
    })
  }, [rows, searchTerm, statusFilter, dateFrom, dateTo])

  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      const dateA = new Date(a.lesson_date).getTime()
      const dateB = new Date(b.lesson_date).getTime()
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA
    })
  }, [filteredRows, sortDirection])

  const handleDeleteConfirm = async () => {
    if (!logToDelete) return

    try {
      await deleteLessonLog(logToDelete.id)
      toast.success('Attendance record deleted')
    } catch (error) {
      toast.error('Failed to delete attendance record')
    } finally {
      setIsDeleteDialogOpen(false)
      setLogToDelete(null)
    }
  }

  const columns = [
    { key: 'lesson_date', label: 'Date', sortable: true },
    { key: 'student_name', label: 'Student', sortable: true },
    { key: 'subject', label: 'Subject', sortable: true },
    { key: 'topic_covered', label: 'Topic', sortable: false },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'mastery_score', label: 'Mastery', sortable: true },
  ]

  const statusOptions = [
    { value: 'present', label: 'Present' },
    { value: 'absent', label: 'Absent' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'makeup', label: 'Makeup' },
  ]

  if (studentsLoading || logsLoading) {
    return <SkeletonLoader />
  }

  const getDeleteWarningMessage = (log: LessonLog) => {
    if (log.status === 'present') {
      return `This will restore 1 credit(s) to the student's package balance.`
    }
    return 'This action cannot be undone.'
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold">Attendance</h1>
        
        <div className="flex flex-wrap gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
            placeholder="From"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
            placeholder="To"
          />
          <button
            onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 border rounded-lg text-sm flex items-center gap-2 hover:bg-gray-50"
          >
            {sortDirection === 'asc' ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
            {sortDirection === 'asc' ? 'Oldest' : 'Newest'}
          </button>
        </div>
      </div>

      <DataTable<AttendanceRow>
        data={sortedRows}
        columns={columns}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by student, subject, or topic..."
        filters={statusOptions}
        selectedFilters={statusFilter}
        onFilterChange={(vals) => setStatusFilter(vals as AttendanceStatus[])}
        filterLabel="Status"
      />

      {sortedRows.length === 0 && (
        <EmptyState
          icon={Calendar}
          title="No attendance records"
          description="Start by marking attendance for a student."
        />
      )}

      {selectedLog && (
        <MarkAttendanceDialog
          open={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false)
            setSelectedLog(null)
          }}
          existingLog={selectedLog}
          mode="edit"
        />
      )}

      <ConfirmDialog
        open={isDeleteDialogOpen}
        title="Delete Attendance Record"
        message={logToDelete ? getDeleteWarningMessage(logToDelete) : ''}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDeleteDialogOpen(false)
          setLogToDelete(null)
        }}
      />
    </div>
  )
}
