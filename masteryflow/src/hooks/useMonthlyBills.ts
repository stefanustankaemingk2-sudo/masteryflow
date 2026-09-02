import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { MonthlyBill } from '@/types/database'

export function useMonthlyBills() {
  return useQuery({
    queryKey: ['monthly_bills'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monthly_bills')
        .select('*')
        .order('due_day', { ascending: true })

      if (error) throw error
      return data as MonthlyBill[]
    },
    staleTime: 30_000,
    retry: 2,
  })
}
