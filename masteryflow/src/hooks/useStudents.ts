import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Student } from '@/types/database'
import { studentSchema } from '@/lib/validators'

export function useStudents() {
  return useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      return data as Student[]
    },
    staleTime: 30_000,
    retry: 2,
  })
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: ['student', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Student
    },
    staleTime: 30_000,
    retry: 2,
    enabled: !!id,
  })
}

export function useCreateStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Omit<Student, 'id'>) => {
      const validated = studentSchema.parse(data)
      const { data: result, error } = await supabase
        .from('students')
        .insert(validated)
        .select()
        .single()

      if (error) throw error
      return result as Student
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
  })
}

export function useUpdateStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Student> }) => {
      const validated = studentSchema.partial().parse(data)
      const { data: result, error } = await supabase
        .from('students')
        .update(validated)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return result as Student
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
  })
}

export function useArchiveStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: result, error } = await supabase
        .from('students')
        .update({ status: 'archived' })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return result as Student
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
  })
}
