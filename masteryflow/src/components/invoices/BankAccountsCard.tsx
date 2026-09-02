import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const BANK_ACCOUNTS = [
  { name: 'blu', number: '004665797835', institution: 'Blu' },
  { name: 'BCA', number: '3790104080', institution: 'BCA' },
  { name: 'JAGO', number: '109981714634', institution: 'Jago' },
  { name: 'Bibit', number: '5028198641', institution: 'Bibit' },
  { name: 'GoPay', number: '081321186453', institution: 'GoPay' },
];

export function BankAccountsCard() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (accountNumber: string, index: number) => {
    try {
      await navigator.clipboard.writeText(accountNumber);
      setCopiedIndex(index);
      toast.success('Account number copied!');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-3">Payment Accounts (a.n. Stefanus)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {BANK_ACCOUNTS.map((account, index) => (
          <div
            key={account.name}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
          >
            <div>
              <p className="font-medium text-sm">{account.institution}</p>
              <p className="text-xs text-gray-600">{account.number}</p>
            </div>
            <button
              onClick={() => handleCopy(account.number, index)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="Copy account number"
            >
              {copiedIndex === index ? (
                <Check size={16} className="text-green-600" />
              ) : (
                <Copy size={16} />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
