import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { studentSchema, type StudentInput } from '@/lib/validators'
import type { Student } from '@/types/database'
import { X } from 'lucide-react'

interface StudentFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: Omit<Student, 'id'>) => void
  student?: Student | null
  isLoading?: boolean
}

type FormData = Omit<StudentInput, 'id'> & { parent_phone?: string }

export function StudentForm({
  open,
  onClose,
  onSubmit,
  student,
  isLoading = false,
}: StudentFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(studentSchema.omit({ id: true })),
    defaultValues: student
      ? {
          name: student.name,
          subject: student.subject as 'English' | 'Piano' | 'Computer',
          curriculum_level: student.curriculum_level,
          package_type: student.package_type,
          package_balance: student.package_balance,
          rate_per_session: student.rate_per_session,
          credit_balance: student.credit_balance,
          parent_name: student.parent_name,
          parent_phone: student.parent_phone || '',
          status: student.status,
        }
      : {
          name: '',
          subject: 'English',
          curriculum_level: '',
          package_type: '',
          package_balance: 0,
          rate_per_session: 0,
          credit_balance: 0,
          parent_name: '',
          parent_phone: '',
          status: 'active',
        },
  })

  const handleFormSubmit = (data: FormData) => {
    onSubmit(data as Omit<Student, 'id'>)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 my-8">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {student ? 'Edit Student' : 'Add New Student'}
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student Name *
              </label>
              <input
                {...register('name')}
                type="text"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : ''
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject *
              </label>
              <select
                {...register('subject')}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.subject ? 'border-red-500' : ''
                }`}
              >
                <option value="English">English</option>
                <option value="Piano">Piano</option>
                <option value="Computer">Computer</option>
              </select>
              {errors.subject && (
                <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
              )}
            </div>

            {/* Curriculum Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Curriculum Level *
              </label>
              <input
                {...register('curriculum_level')}
                type="text"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.curriculum_level ? 'border-red-500' : ''
                }`}
              />
              {errors.curriculum_level && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.curriculum_level.message}
                </p>
              )}
            </div>

            {/* Package Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Package Type *
              </label>
              <input
                {...register('package_type')}
                type="text"
                placeholder="e.g., 8 sessions"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.package_type ? 'border-red-500' : ''
                }`}
              />
              {errors.package_type && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.package_type.message}
                </p>
              )}
            </div>

            {/* Rate per Session */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rate per Session (Rp) *
              </label>
              <input
                {...register('rate_per_session', { valueAsNumber: true })}
                type="number"
                min="0"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.rate_per_session ? 'border-red-500' : ''
                }`}
              />
              {errors.rate_per_session && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.rate_per_session.message}
                </p>
              )}
            </div>

            {/* Package Balance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Package Balance (sessions) *
              </label>
              <input
                {...register('package_balance', { valueAsNumber: true })}
                type="number"
                min="0"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.package_balance ? 'border-red-500' : ''
                }`}
              />
              {errors.package_balance && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.package_balance.message}
                </p>
              )}
            </div>

            {/* Credit Balance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Credit Balance (Rp) *
              </label>
              <input
                {...register('credit_balance', { valueAsNumber: true })}
                type="number"
                min="0"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.credit_balance ? 'border-red-500' : ''
                }`}
              />
              {errors.credit_balance && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.credit_balance.message}
                </p>
              )}
            </div>

            {/* Parent Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent Name *
              </label>
              <input
                {...register('parent_name')}
                type="text"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.parent_name ? 'border-red-500' : ''
                }`}
              />
              {errors.parent_name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.parent_name.message}
                </p>
              )}
            </div>

            {/* Parent Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent Phone
              </label>
              <input
                {...register('parent_phone')}
                type="tel"
                placeholder="08xxxxxxxxxx"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.parent_phone ? 'border-red-500' : ''
                }`}
              />
              {errors.parent_phone && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.parent_phone.message}
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                {...register('status')}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.status ? 'border-red-500' : ''
                }`}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : student ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
