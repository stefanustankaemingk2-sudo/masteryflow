import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { PortfolioTarget } from '@/types/database'

export function usePortfolioTargets() {
  return useQuery({
    queryKey: ['portfolio_targets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('portfolio_targets')
        .select('*')
        .order('asset_class', { ascending: true })

      if (error) throw error
      return data as PortfolioTarget[]
    },
    staleTime: 30_000,
    retry: 2,
  })
}
