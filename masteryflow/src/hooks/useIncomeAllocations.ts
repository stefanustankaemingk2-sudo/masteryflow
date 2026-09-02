import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { IncomeAllocation } from '@/types/database';

export function useIncomeAllocations() {
  return useQuery({
    queryKey: ['income_allocations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('income_allocations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as IncomeAllocation[];
    },
    staleTime: 30000,
    retry: 2,
  });
}

export function useCreateIncomeAllocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (allocation: Omit<IncomeAllocation, 'id' | 'created_at'> & { invoice_id: string }) => {
      const { data, error } = await supabase
        .from('income_allocations')
        .insert(allocation)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income_allocations'] });
    },
  });
}
