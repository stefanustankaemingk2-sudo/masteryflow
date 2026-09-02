import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Invoice } from '@/types/database';

export function useInvoices(filters?: { status?: string; dateFrom?: string; dateTo?: string; hasCredits?: boolean }) {
  return useQuery({
    queryKey: ['invoices', filters],
    queryFn: async () => {
      let query = supabase.from('invoices').select('*, students(name)').order('created_at', { ascending: false });
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.dateFrom) {
        query = query.gte('due_date', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('due_date', filters.dateTo);
      }
      if (filters?.hasCredits !== undefined) {
        query = query[filters.hasCredits ? 'gt' : 'eq']('credits_applied', 0);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as (Invoice & { students: { name: string } })[];
    },
    staleTime: 30000,
    retry: 2,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (invoice: Omit<Invoice, 'id' | 'created_at'> & { student_id: string }) => {
      const { data, error } = await supabase.from('invoices').insert(invoice).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Invoice>) => {
      const { data, error } = await supabase.from('invoices').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useRevokeInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, creditsToRestore, studentId }: { id: string; creditsToRestore: number; studentId: string }) => {
      // First update invoice to Cancelled
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .select()
        .single();
      
      if (invoiceError) throw invoiceError;
      
      // Restore credits to student using direct update
      if (creditsToRestore > 0) {
        const { data: student, error: getError } = await supabase
          .from('students')
          .select('credit_balance')
          .eq('id', studentId)
          .single();
        
        if (getError) throw getError;
        
        const { error: updateError } = await supabase
          .from('students')
          .update({ credit_balance: (student?.credit_balance || 0) + creditsToRestore })
          .eq('id', studentId);
        
        if (updateError) throw updateError;
      }
      
      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}
