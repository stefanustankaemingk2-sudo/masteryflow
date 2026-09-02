import { useState } from 'react';
import { useInvoices, useRevokeInvoice } from '@/hooks/useInvoices';
import { DataTable } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { InvoiceGeneratorModal } from '@/components/invoices/InvoiceGeneratorModal';
import { BankAccountsCard } from '@/components/invoices/BankAccountsCard';
import { WhatsAppSendDialog } from '@/components/invoices/WhatsAppSendDialog';
import { IncomeAllocationWizard } from '@/components/invoices/IncomeAllocationWizard';
import { FileText, Plus } from 'lucide-react';
import type { Invoice } from '@/types/database';

type InvoiceWithStudent = Invoice & { students?: { name: string } };

export function InvoicesPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [hasCredits, setHasCredits] = useState<boolean | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithStudent | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false);
  const [showAllocationWizard, setShowAllocationWizard] = useState(false);
  const [revokeInvoice, setRevokeInvoice] = useState<InvoiceWithStudent | null>(null);

  const { data: invoices, isLoading, error } = useInvoices({
    status: statusFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    hasCredits,
  });

  const revokeMutation = useRevokeInvoice();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'unpaid': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const columns = [
    { key: 'student_name', label: 'Student', render: (invoice: InvoiceWithStudent) => 
      invoice.students?.name || 'Unknown' 
    },
    { 
      key: 'amount', 
      label: 'Full Price', 
      render: (invoice: InvoiceWithStudent) => <CurrencyDisplay amount={invoice.amount} /> 
    },
    { 
      key: 'credits_applied', 
      label: 'Credits Applied', 
      render: (invoice: InvoiceWithStudent) => (
        <span className="text-green-600 font-medium">
          -<CurrencyDisplay amount={invoice.credits_applied || 0} />
        </span>
      )
    },
    { 
      key: 'net_amount', 
      label: 'Net Amount', 
      render: (invoice: InvoiceWithStudent) => (
        <CurrencyDisplay amount={(invoice.amount || 0) - (invoice.credits_applied || 0)} />
      )
    },
    { 
      key: 'status', 
      label: 'Status', 
      render: (invoice: InvoiceWithStudent) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
          {invoice.status}
        </span>
      )
    },
    { 
      key: 'due_date', 
      label: 'Due Date', 
      render: (invoice: InvoiceWithStudent) => new Date(invoice.due_date).toLocaleDateString('id-ID')
    },
  ];

  const handleRevokeConfirm = () => {
    if (!revokeInvoice) return;
    
    revokeMutation.mutate(
      { 
        id: revokeInvoice.id, 
        creditsToRestore: revokeInvoice.credits_applied || 0,
        studentId: revokeInvoice.student_id
      },
      {
        onSuccess: () => {
          setRevokeInvoice(null);
        },
      }
    );
  };

  if (error) {
    return <EmptyState title="Error loading invoices" description={error.message} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <button
          onClick={() => setShowGenerator(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Generate Invoice
        </button>
      </div>

      <BankAccountsCard />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          type="text"
          placeholder="Search by student..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">All Status</option>
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="px-3 py-2 border rounded-lg"
          placeholder="From date"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="px-3 py-2 border rounded-lg"
          placeholder="To date"
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={hasCredits === true}
            onChange={(e) => setHasCredits(e.target.checked ? true : undefined)}
          />
          Has Credits
        </label>
      </div>

      {isLoading ? (
        <SkeletonLoader />
      ) : invoices && invoices.length > 0 ? (
        <DataTable
          columns={columns}
          data={invoices.filter(inv => 
            !searchTerm || 
            inv.students?.name?.toLowerCase().includes(searchTerm.toLowerCase())
          )}
        />
      ) : (
        <EmptyState
          icon={FileText}
          title="No invoices found"
          description="Generate your first invoice to get started"
          actionLabel="Generate Invoice"
          onAction={() => setShowGenerator(true)}
        />
      )}

      <InvoiceGeneratorModal
        isOpen={showGenerator}
        onClose={() => setShowGenerator(false)}
      />

      {selectedInvoice && (
        <WhatsAppSendDialog
          isOpen={showWhatsAppDialog}
          onClose={() => {
            setShowWhatsAppDialog(false);
            setSelectedInvoice(null);
          }}
          invoice={selectedInvoice}
          onSent={() => {
            setShowWhatsAppDialog(false);
            setShowAllocationWizard(true);
          }}
        />
      )}

      {selectedInvoice && (
        <IncomeAllocationWizard
          isOpen={showAllocationWizard}
          onClose={() => {
            setShowAllocationWizard(false);
            setSelectedInvoice(null);
          }}
          invoice={selectedInvoice}
        />
      )}

      <ConfirmDialog
        open={!!revokeInvoice}
        title="Revoke Invoice"
        message={`Are you sure you want to revoke this invoice? ${revokeInvoice?.credits_applied || 0} credits will be restored to the student.`}
        confirmLabel="Revoke"
        destructive
        onConfirm={handleRevokeConfirm}
        onCancel={() => setRevokeInvoice(null)}
        isLoading={revokeMutation.isPending}
      />
    </div>
  );
}
