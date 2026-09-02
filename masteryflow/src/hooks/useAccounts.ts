import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Account } from '@/types/database'

export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('account_name', { ascending: true })

      if (error) throw error
      return data as Account[]
    },
    staleTime: 30_000,
    retry: 2,
  })
}
