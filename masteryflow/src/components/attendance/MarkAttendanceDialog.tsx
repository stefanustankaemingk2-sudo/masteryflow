import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useStudents } from '@/hooks/useStudents'
import { useLessonLogs } from '@/hooks/useLessonLogs'
import { parseGroupMembers } from '@/lib/calculations'
import type { LessonLog, Student } from '@/types/database'
import { toast } from 'sonner'
import { X } from 'lucide-react'

const lessonLogSchema = z.object({
  student_id: z.string().uuid('Please select a student'),
  lesson_date: z.string().min(1, 'Date is required'),
  topic_covered: z.string().min(1, 'Topic is required'),
  mastery_score: z.number().min(1).max(5).optional(),
  status: z.enum(['present', 'absent', 'cancelled', 'makeup']),
})

type LessonLogForm = z.infer<typeof lessonLogSchema>

interface MarkAttendanceDialogProps {
  open: boolean
  onClose: () => void
  existingLog?: LessonLog | null
  mode?: 'create' | 'edit'
  onPresentWithZeroBalance?: () => void
}

export function MarkAttendanceDialog({
  open,
  onClose,
  existingLog,
  mode = 'create',
  onPresentWithZeroBalance,
}: MarkAttendanceDialogProps) {
  const { data: students } = useStudents()
  const { createLessonLog, updateLessonLog } = useLessonLogs()

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [groupMembers, setGroupMembers] = useState<string[]>([])
  const [checkedMembers, setCheckedMembers] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [balanceWarning, setBalanceWarning] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<LessonLogForm>({
    resolver: zodResolver(lessonLogSchema),
    defaultValues: existingLog
      ? {
          student_id: existingLog.student_id,
          lesson_date: existingLog.lesson_date,
          topic_covered: existingLog.topic_covered || '',
          mastery_score: existingLog.mastery_score || undefined,
          status: existingLog.status as 'present' | 'absent' | 'cancelled' | 'makeup',
        }
      : {
          lesson_date: new Date().toISOString().split('T')[0],
          status: 'present',
        },
  })

  const watchedStatus = watch('status')
  const watchedTopic = watch('topic_covered')

  // Parse group members when student changes
  useEffect(() => {
    if (!students || !open) return

    const studentId = watch('student_id')
    if (studentId) {
      const student = students.find(s => s.id === studentId)
      setSelectedStudent(student || null)

      if (student) {
        const members = parseGroupMembers(student.name)
        setGroupMembers(members)
        setCheckedMembers([]) // Reset checked members on student change
      } else {
        setGroupMembers([])
        setCheckedMembers([])
      }
    }
  }, [watch('student_id'), students, open])

  // Check if topic should be disabled (no members checked for group)
  const isTopicDisabled = useMemo(() => {
    if (mode === 'edit') return false
    if (!selectedStudent) return false
    
    const members = parseGroupMembers(selectedStudent.name)
    if (members.length <= 1) return false
    
    return checkedMembers.length === 0
  }, [selectedStudent, checkedMembers, mode])

  // Calculate balance impact
  useEffect(() => {
    if (!selectedStudent || !open) {
      setBalanceWarning(null)
      return
    }

    const oldStatus = existingLog?.status || null
    const newStatus = watchedStatus

    if (newStatus === 'present') {
      const deduction = mode === 'edit' 
        ? (oldStatus === 'present' ? 0 : 1)
        : (groupMembers.length > 1 ? checkedMembers.length : 1)
      
      const newBalance = selectedStudent.package_balance - deduction
      
      if (newBalance < 0) {
        setBalanceWarning(`Cannot mark Present: Student has only ${selectedStudent.package_balance} credit(s), but this would deduct ${deduction}. Package balance cannot go below 0 (R1, R8).`)
      } else if (newBalance === 0 && mode === 'create') {
        setBalanceWarning(`Warning: This will reduce the package balance to 0. An invoice should be generated.`)
      } else {
        setBalanceWarning(null)
      }
    } else {
      setBalanceWarning(null)
    }
  }, [watchedStatus, selectedStudent, existingLog, mode, groupMembers, checkedMembers, open])

  // Auto-disable topic for group sessions with no checked members
  useEffect(() => {
    if (isTopicDisabled && watchedTopic) {
      setValue('topic_covered', '')
    }
  }, [isTopicDisabled, watchedTopic, setValue])

  const onSubmit = async (data: LessonLogForm) => {
    if (!selectedStudent) {
      toast.error('Please select a student')
      return
    }

    // Validate group session requirements
    const members = parseGroupMembers(selectedStudent.name)
    let deduction = 0

    if (members.length > 1 && mode === 'create') {
      // Group session
      if (checkedMembers.length === 0) {
        toast.error('Please check at least one member for group attendance (R9)')
        return
      }
      deduction = checkedMembers.length
    } else if (data.status === 'present') {
      // Individual session or edit mode
      deduction = mode === 'edit' && existingLog?.status === 'present' ? 0 : 1
    }

    // Check balance constraint (R1, R8)
    if (data.status === 'present') {
      const newBalance = selectedStudent.package_balance - deduction
      if (newBalance < 0) {
        toast.error(`Cannot mark Present: Insufficient package balance (R1, R8)`)
        return
      }
    }

    setIsSubmitting(true)

    try {
      if (mode === 'edit' && existingLog) {
        await updateLessonLog({
          id: existingLog.id,
          updates: {
            lesson_date: data.lesson_date,
            topic_covered: data.topic_covered,
            mastery_score: data.mastery_score,
            status: data.status,
          },
        })
        toast.success('Attendance updated successfully')
      } else {
        await createLessonLog({
          student_id: data.student_id,
          lesson_date: data.lesson_date,
          topic_covered: data.topic_covered,
          mastery_score: data.mastery_score,
          status: data.status,
        })
        
        // Check if we need to trigger invoice generation
        if (data.status === 'present') {
          const newBalance = selectedStudent.package_balance - deduction
          if (newBalance === 0 && onPresentWithZeroBalance) {
            onPresentWithZeroBalance()
          }
        }
        
        toast.success('Attendance marked successfully')
      }

      onClose()
      reset()
      setCheckedMembers([])
      setGroupMembers([])
      setSelectedStudent(null)
      setBalanceWarning(null)
    } catch (error) {
      toast.error('Failed to save attendance')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open) return null

  const isGroupSession = selectedStudent && parseGroupMembers(selectedStudent.name).length > 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div className="relative bg-white rounded-lg shadow-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {mode === 'edit' ? 'Edit Attendance' : 'Mark Attendance'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Student Selection */}
          <div>
            <label className="block text-sm font-medium mb-1">Student *</label>
            <select
              {...register('student_id')}
              disabled={mode === 'edit'}
              className={`w-full px-3 py-2 border rounded-lg ${errors.student_id ? 'border-red-500' : ''} ${mode === 'edit' ? 'bg-gray-100' : ''}`}
            >
              <option value="">Select a student</option>
              {students?.map(student => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.subject})
                </option>
              ))}
            </select>
            {errors.student_id && (
              <p className="text-red-500 text-sm mt-1">{errors.student_id.message}</p>
            )}
          </div>

          {/* Group Members Checkbox (if applicable) */}
          {isGroupSession && mode === 'create' && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <label className="block text-sm font-medium mb-2">
                Group Members Present (R9: deduction = checked count) *
              </label>
              <div className="space-y-2">
                {groupMembers.map((member, index) => (
                  <label key={index} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkedMembers.includes(member)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCheckedMembers([...checkedMembers, member])
                        } else {
                          setCheckedMembers(checkedMembers.filter(m => m !== member))
                        }
                      }}
                      className="h-4 w-4"
                    />
                    <span>{member}</span>
                  </label>
                ))}
              </div>
              {checkedMembers.length === 0 && (
                <p className="text-yellow-600 text-sm mt-2">
                  Please check at least one member to enable topic input.
                </p>
              )}
              {checkedMembers.length > 0 && (
                <p className="text-green-600 text-sm mt-2">
                  Deduction: {checkedMembers.length} credit(s)
                </p>
              )}
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-sm font-medium mb-1">Date *</label>
            <input
              type="date"
              {...register('lesson_date')}
              className={`w-full px-3 py-2 border rounded-lg ${errors.lesson_date ? 'border-red-500' : ''}`}
            />
            {errors.lesson_date && (
              <p className="text-red-500 text-sm mt-1">{errors.lesson_date.message}</p>
            )}
          </div>

          {/* Topic */}
          <div>
            <label className="block text-sm font-medium mb-1">Topic Covered *</label>
            <input
              type="text"
              {...register('topic_covered')}
              disabled={isTopicDisabled}
              placeholder={isTopicDisabled ? 'Check at least one member first' : 'Enter topic'}
              className={`w-full px-3 py-2 border rounded-lg ${errors.topic_covered ? 'border-red-500' : ''} ${isTopicDisabled ? 'bg-gray-100' : ''}`}
            />
            {errors.topic_covered && (
              <p className="text-red-500 text-sm mt-1">{errors.topic_covered.message}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-1">Status *</label>
            <select
              {...register('status')}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="cancelled">Cancelled</option>
              <option value="makeup">Makeup</option>
            </select>
          </div>

          {/* Mastery Score */}
          <div>
            <label className="block text-sm font-medium mb-1">Mastery Score (1-5)</label>
            <input
              type="number"
              min="1"
              max="5"
              {...register('mastery_score', { valueAsNumber: true })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Optional"
            />
            {errors.mastery_score && (
              <p className="text-red-500 text-sm mt-1">{errors.mastery_score.message}</p>
            )}
          </div>

          {/* Balance Warning */}
          {balanceWarning && (
            <div className={`p-3 rounded-lg text-sm ${
              balanceWarning.includes('Cannot') 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
            }`}>
              {balanceWarning}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !!balanceWarning?.includes('Cannot')}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : (mode === 'edit' ? 'Update' : 'Save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
