import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { LessonLog } from '@/types/database'

export function useLessonLogs() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['lesson_logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lesson_logs')
        .select('*, student:students(name, subject)')
        .order('lesson_date', { ascending: false })

      if (error) throw error
      return data as (LessonLog & { student: { name: string; subject: string } })[]
    },
    staleTime: 30_000,
    retry: 2,
  })

  const createMutation = useMutation({
    mutationFn: async (log: Partial<LessonLog>) => {
      const { data, error } = await supabase
        .from('lesson_logs')
        .insert([log])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson_logs'] })
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<LessonLog> }) => {
      const { data, error } = await supabase
        .from('lesson_logs')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson_logs'] })
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('lesson_logs').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson_logs'] })
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
  })

  return {
    ...query,
    createLessonLog: createMutation.mutateAsync,
    updateLessonLog: updateMutation.mutateAsync,
    deleteLessonLog: deleteMutation.mutateAsync,
  }
}
