import { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateInvoice } from '@/hooks/useInvoices';
import { useCreateIncomeAllocation } from '@/hooks/useIncomeAllocations';
import { calcAllocation } from '@/lib/calculations';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import type { Invoice } from '@/types/database';

interface IncomeAllocationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice & { students?: { name: string } };
}

export function IncomeAllocationWizard({ isOpen, onClose, invoice }: IncomeAllocationWizardProps) {
  const [step, setStep] = useState(1);
  const updateInvoiceMutation = useUpdateInvoice();
  const createAllocationMutation = useCreateIncomeAllocation();

  const grossIncome = (invoice.amount || 0) - (invoice.credits_applied || 0);
  const allocation = calcAllocation(grossIncome);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      // Step 1: Update invoice to Paid
      await updateInvoiceMutation.mutateAsync({
        id: invoice.id,
        status: 'paid',
        wa_message_sent: true,
        wa_sent_at: new Date().toISOString(),
      });

      // Step 2: Create income allocation record
      await createAllocationMutation.mutateAsync({
        invoice_id: invoice.id,
        gross_income: grossIncome,
        consume_40: allocation.consume40,
        invest_30: allocation.save50.invest30.bibit + allocation.save50.invest30.bluinvest,
        cash_reserve_20: allocation.save50.cashReserve20.total,
        emergency_10: allocation.emergency10,
      });

      toast.success('Pembayaran tercatat dan alokasi dibuat');
      onClose();
    } catch (error) {
      toast.error('Gagal memproses pembayaran');
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">Alokasi Pendapatan</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span>Review Alokasi</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span>Konfirmasi</span>
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Ringkasan Pembayaran</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Tagihan untuk:</span>
                    <span className="font-medium">{invoice.students?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pendapatan Kotor:</span>
                    <CurrencyDisplay amount={grossIncome} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-800 mb-2">40% - Konsumsi</h4>
                  <p className="text-2xl font-bold text-orange-600">
                    <CurrencyDisplay amount={allocation.consume40} />
                  </p>
                  <p className="text-xs text-orange-600 mt-1">Untuk kebutuhan sehari-hari</p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-800 mb-2">10% - Darurat</h4>
                  <p className="text-2xl font-bold text-purple-600">
                    <CurrencyDisplay amount={allocation.emergency10} />
                  </p>
                  <p className="text-xs text-purple-600 mt-1">Dana darurat (tidak digabung)</p>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-3">50% - Tabungan & Investasi</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-green-700 mb-2">Investasi (30%)</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <CurrencyDisplay amount={allocation.save50.invest30.bibit + allocation.save50.invest30.bluinvest} />
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Bibit (80%):</span>
                        <CurrencyDisplay amount={allocation.save50.invest30.bibit} />
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>BluInvest (20%):</span>
                        <CurrencyDisplay amount={allocation.save50.invest30.bluinvest} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-green-700 mb-2">Cash Reserve (20%)</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <CurrencyDisplay amount={allocation.save50.cashReserve20.total} />
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Jago (33%):</span>
                        <CurrencyDisplay amount={allocation.save50.cashReserve20.bankSplit.jago} />
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>GoPay (33%):</span>
                        <CurrencyDisplay amount={allocation.save50.cashReserve20.bankSplit.gopay} />
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Blu (33%):</span>
                        <CurrencyDisplay amount={allocation.save50.cashReserve20.bankSplit.blu} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Lanjut
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Konfirmasi Tindakan</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-600 mt-0.5" />
                    <span>Status invoice akan diubah menjadi <strong>Lunas (Paid)</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-600 mt-0.5" />
                    <span>Record alokasi pendapatan akan dibuat</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-600 mt-0.5" />
                    <span>Package balance siswa akan diupdate sesuai sessions_activated</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Total Alokasi</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Konsumsi (40%):</span>
                    <CurrencyDisplay amount={allocation.consume40} />
                  </div>
                  <div className="flex justify-between">
                    <span>Investasi (30%):</span>
                    <CurrencyDisplay amount={allocation.save50.invest30.bibit + allocation.save50.invest30.bluinvest} />
                  </div>
                  <div className="flex justify-between">
                    <span>Cash Reserve (20%):</span>
                    <CurrencyDisplay amount={allocation.save50.cashReserve20.total} />
                  </div>
                  <div className="flex justify-between">
                    <span>Darurat (10%):</span>
                    <CurrencyDisplay amount={allocation.emergency10} />
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2 mt-2">
                    <span>Total:</span>
                    <CurrencyDisplay amount={allocation.consume40 + allocation.save50.invest30.bibit + allocation.save50.invest30.bluinvest + allocation.save50.cashReserve20.total + allocation.emergency10} />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={updateInvoiceMutation.isPending || createAllocationMutation.isPending}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={updateInvoiceMutation.isPending || createAllocationMutation.isPending}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {(updateInvoiceMutation.isPending || createAllocationMutation.isPending) 
                    ? 'Memproses...' 
                    : 'Konfirmasi Pembayaran'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
