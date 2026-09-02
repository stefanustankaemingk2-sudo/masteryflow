import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useStudents } from '@/hooks/useStudents';
import { useCreateInvoice } from '@/hooks/useInvoices';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';

const invoiceSchema = z.object({
  student_id: z.number().min(1, 'Student is required'),
  sessions_covered: z.number().min(1, 'At least 1 session'),
  credits_applied: z.number().min(0),
  sessions_activated: z.number().min(0),
  invoice_notes: z.string().optional(),
  due_date: z.string(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InvoiceGeneratorModal({ isOpen, onClose }: InvoiceGeneratorModalProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [fullPrice, setFullPrice] = useState(0);
  
  const { data: students } = useStudents();
  const createMutation = useCreateInvoice();
  
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      sessions_covered: 4,
      credits_applied: 0,
      sessions_activated: 0,
      invoice_notes: '',
      due_date: new Date().toISOString().split('T')[0],
    },
  });

  const sessionsCovered = watch('sessions_covered');
  const creditsApplied = watch('credits_applied');
  const studentId = watch('student_id');

  useEffect(() => {
    if (isOpen) {
      reset({
        sessions_covered: 4,
        credits_applied: 0,
        sessions_activated: 0,
        invoice_notes: '',
        due_date: new Date().toISOString().split('T')[0],
      });
      setSelectedStudentId(null);
      setFullPrice(0);
    }
  }, [isOpen, reset]);

  useEffect(() => {
    if (studentId && students) {
      const student = students.find(s => s.id === String(studentId));
      if (student) {
        setSelectedStudentId(Number(student.id));
        const price = student.rate_per_session * sessionsCovered;
        setFullPrice(price);
        // Default credits to min of credit_balance and full price (R2)
        const maxCredits = Math.min(student.credit_balance || 0, price);
        setValue('credits_applied', maxCredits);
      }
    }
  }, [studentId, sessionsCovered, students, setValue]);

  useEffect(() => {
    if (selectedStudentId && students) {
      const student = students.find(s => s.id === String(selectedStudentId));
      if (student) {
        const newFullPrice = student.rate_per_session * sessionsCovered;
        setFullPrice(newFullPrice);
        // Ensure credits don't exceed balance or price (R2)
        const maxCredits = Math.min(student.credit_balance || 0, newFullPrice);
        if ((creditsApplied || 0) > maxCredits) {
          setValue('credits_applied', maxCredits);
        }
      }
    }
  }, [sessionsCovered, selectedStudentId, students, creditsApplied, setValue]);

  const netAmount = fullPrice - (creditsApplied || 0);

  const onSubmit = async (data: InvoiceFormData) => {
    const student = students?.find(s => s.id === String(data.student_id));
    if (!student) {
      toast.error('Student not found');
      return;
    }

    // Validate R2: credits <= credit_balance AND credits <= full price
    if (data.credits_applied > (student.credit_balance || 0)) {
      toast.error('Credits applied cannot exceed student credit balance');
      return;
    }
    if (data.credits_applied > fullPrice) {
      toast.error('Credits applied cannot exceed full price');
      return;
    }

    try {
      await createMutation.mutateAsync({
        student_id: student.id,
        amount: fullPrice,
        status: 'unpaid',
        due_date: data.due_date,
        sessions_covered: data.sessions_covered,
        credits_applied: data.credits_applied,
        sessions_activated: data.sessions_activated,
        invoice_notes: data.invoice_notes || '',
        wa_message_sent: false,
        wa_message_text: '',
        wa_sent_at: null,
      });

      toast.success('Invoice generated successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to generate invoice');
      console.error(error);
    }
  };

  if (!isOpen) return null;

  const student = students?.find(s => s.id === String(selectedStudentId));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">Generate Invoice</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Student *</label>
            <select
              {...register('student_id', { valueAsNumber: true })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Select student</option>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Sessions Covered *</label>
              <select
                {...register('sessions_covered', { valueAsNumber: true })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {[4, 8, 12, 24].map(num => (
                  <option key={num} value={num}>{num} sessions</option>
                ))}
                <option value={1}>1 session (custom)</option>
                <option value={2}>2 sessions (custom)</option>
                <option value={3}>3 sessions (custom)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Due Date *</label>
              <input
                type="date"
                {...register('due_date')}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          {student && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Rate per session:</span>
                <CurrencyDisplay amount={student.rate_per_session} />
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Available credits:</span>
                <span className="font-medium">{student.credit_balance || 0}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold border-t pt-2">
                <span>Full Price ({sessionsCovered} sessions):</span>
                <CurrencyDisplay amount={fullPrice} />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Credits to Apply</label>
            <input
              type="number"
              {...register('credits_applied', { valueAsNumber: true })}
              className="w-full px-3 py-2 border rounded-lg"
              min={0}
              max={student ? Math.min(student.credit_balance || 0, fullPrice) : undefined}
            />
            <p className="text-xs text-gray-500 mt-1">
              Max: {student ? Math.min(student.credit_balance || 0, fullPrice) : 0} (R2: ≤ credit balance & ≤ full price)
            </p>
            {errors.credits_applied && (
              <p className="text-red-500 text-sm mt-1">{errors.credits_applied.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Sessions to Activate</label>
            <input
              type="number"
              {...register('sessions_activated', { valueAsNumber: true })}
              className="w-full px-3 py-2 border rounded-lg"
              min={0}
            />
            <p className="text-xs text-gray-500 mt-1">
              Package balance will be set to this value after payment
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              {...register('invoice_notes')}
              className="w-full px-3 py-2 border rounded-lg"
              rows={3}
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Receipt Preview</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Full Price:</span>
                <CurrencyDisplay amount={fullPrice} />
              </div>
              <div className="flex justify-between text-green-600">
                <span>Credits Applied:</span>
                <span>-<CurrencyDisplay amount={creditsApplied || 0} /></span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Net Amount Due:</span>
                <CurrencyDisplay amount={netAmount} />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Generating...' : 'Generate Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
