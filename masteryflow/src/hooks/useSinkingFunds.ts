import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { SinkingFund } from '@/types/database'

export function useSinkingFunds() {
  return useQuery({
    queryKey: ['sinking_funds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sinking_funds')
        .select('*')
        .order('goal_name', { ascending: true })

      if (error) throw error
      return data as SinkingFund[]
    },
    staleTime: 30_000,
    retry: 2,
  })
}
