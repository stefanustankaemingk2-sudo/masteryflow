import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { toast } from 'sonner';
import type { Invoice } from '@/types/database';

interface WhatsAppSendDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice & { students?: { name: string } };
  onSent: () => void;
}

export function WhatsAppSendDialog({ isOpen, onClose, invoice, onSent }: WhatsAppSendDialogProps) {
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const studentName = invoice.students?.name || 'Unknown Student';
  
  // Get student phone from parent context (would need to fetch student details)
  // For now, we'll use a placeholder - in real app, fetch student by invoice.student_id
  const studentPhone = '081234567890'; // Placeholder - would come from student data
  
  const formatPhoneForWhatsApp = (phone: string) => {
    // Convert 0 prefix to 62
    if (phone.startsWith('0')) {
      return '62' + phone.slice(1);
    }
    return phone;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const generateMessage = () => {
    const fullPrice = invoice.amount || 0;
    const creditsApplied = invoice.credits_applied || 0;
    const netAmount = fullPrice - creditsApplied;
    const dueDate = formatDate(invoice.due_date);

    return `Halo, berikut tagihan untuk ${studentName}:

📚 Paket: ${invoice.sessions_covered} sesi
💰 Harga penuh: ${formatCurrency(fullPrice)}
🎫 Kredit digunakan: ${creditsApplied} (${formatCurrency(creditsApplied)})
💵 Total yang harus dibayar: ${formatCurrency(netAmount)}
📅 Jatuh tempo: ${dueDate}

Metode pembayaran tersedia:
• blu: 004665797835
• BCA: 3790104080
• JAGO: 109981714634
• Bibit: 5028198641
• GoPay: 081321186453

Silakan konfirmasi setelah melakukan pembayaran. Terima kasih!`;
  };

  const handleSend = () => {
    // Validate phone exists
    if (!studentPhone || studentPhone === '081234567890') {
      toast.error('Nomor telepon siswa tidak ditemukan. Harap lengkapi data siswa terlebih dahulu.');
      return;
    }

    setIsSending(true);

    try {
      const message = generateMessage();
      const whatsappUrl = `https://wa.me/${formatPhoneForWhatsApp(studentPhone)}?text=${encodeURIComponent(message)}`;
      
      // Open WhatsApp in new tab
      window.open(whatsappUrl, '_blank');
      
      // Log that message was prepared (in real app, update database)
      toast.success('Dialog WhatsApp dibuka. Silakan kirim pesan secara manual.');
      onSent();
    } catch (error) {
      toast.error('Gagal membuka WhatsApp');
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Send size={20} />
            Kirim WhatsApp
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Detail Pengiriman</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Siswa:</span>
                <span className="font-medium">{studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Telepon:</span>
                <span className="font-medium">{studentPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Tagihan:</span>
                <span className="font-bold">{formatCurrency((invoice.amount || 0) - (invoice.credits_applied || 0))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Kredit Digunakan:</span>
                <span className="text-green-600">{invoice.credits_applied || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Preview Pesan</h3>
            <pre className="text-xs whitespace-pre-wrap text-gray-700">{generateMessage()}</pre>
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg text-sm text-yellow-800">
            ⚠️ Pesan tidak dikirim otomatis. WhatsApp akan dibuka dan Anda harus menekan tombol kirim secara manual.
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={isSending}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send size={16} />
              {isSending ? 'Membuka...' : 'Buka WhatsApp'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
