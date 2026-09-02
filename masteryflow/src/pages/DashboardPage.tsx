import { useStudents } from '@/hooks/useStudents'
import { useInvoices } from '@/hooks/useInvoices'
import { useAccounts } from '@/hooks/useAccounts'
import { useMonthlyBills } from '@/hooks/useMonthlyBills'
import { useDashboardData } from '@/hooks/useDashboardData'
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay'
import { SkeletonLoader } from '@/components/shared/SkeletonLoader'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatIDR } from '@/lib/format'
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns'
import type { Student, Invoice, Account, MonthlyBill } from '@/types/database'

export default function DashboardPage() {
  const { data: students, isLoading: loadingStudents } = useStudents()
  const { data: invoices, isLoading: loadingInvoices } = useInvoices()
  const { data: accounts, isLoading: loadingAccounts } = useAccounts()
  const { data: bills, isLoading: loadingBills } = useMonthlyBills()
  const dashboardUtils = useDashboardData()

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  // Calculate metrics
  const activeStudents = students?.filter((s: Student) => s.status === 'active').length ?? 0

  const paidInvoicesThisMonth = invoices?.filter(
    (inv: Invoice) =>
      inv.status === 'paid' &&
      inv.created_at &&
      isWithinInterval(parseISO(inv.created_at), { start: monthStart, end: monthEnd })
  ) ?? []

  const monthlyIncome = paidInvoicesThisMonth.reduce((sum: number, inv: Invoice) => sum + inv.amount, 0)

  const pendingInvoices = invoices?.filter((inv: Invoice) => inv.status === 'unpaid').length ?? 0

  const liquidNetWorth =
    accounts?.filter((a: Account) => a.is_liquid).reduce((sum: number, a: Account) => sum + a.current_balance, 0) ?? 0

  const nextBill = bills ? dashboardUtils.getNextBillDue(bills as MonthlyBill[]) : null
  const billsDueSoon = bills ? dashboardUtils.getBillsDueSoon(bills as MonthlyBill[], 7) : []

  // Alert lists
  const zeroBalanceStudents = students?.filter((s: Student) => s.package_balance === 0 && s.status === 'active') ?? []
  const lowBalanceStudents = students?.filter((s: Student) => s.package_balance === 1 && s.status === 'active') ?? []
  const creditPositiveStudents = students?.filter((s: Student) => s.credit_balance > 0) ?? []

  if (loadingStudents || loadingInvoices || loadingAccounts || loadingBills) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-lg border">
              <SkeletonLoader lines={3} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's your teaching & finance overview.</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Active Students Card */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-blue-100 text-sm font-medium">Active Students</p>
            <span className="text-3xl">👨‍🎓</span>
          </div>
          <p className="text-4xl font-bold">{activeStudents}</p>
          <p className="text-blue-100 text-sm mt-2">Currently enrolled</p>
        </div>

        {/* Monthly Income Card */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-emerald-100 text-sm font-medium">Monthly Income</p>
            <span className="text-3xl">💰</span>
          </div>
          <p className="text-3xl font-bold">
            <CurrencyDisplay amount={monthlyIncome} />
          </p>
          <p className="text-emerald-100 text-sm mt-2">Invoices paid this month</p>
        </div>

        {/* Pending Invoices Card */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-amber-100 text-sm font-medium">Pending Invoices</p>
            <span className="text-3xl">⏳</span>
          </div>
          <p className="text-4xl font-bold">{pendingInvoices}</p>
          <p className="text-amber-100 text-sm mt-2">Awaiting payment</p>
        </div>

        {/* Liquid Net Worth Card */}
        <div className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-violet-100 text-sm font-medium">Liquid Net Worth</p>
            <span className="text-3xl">💎</span>
          </div>
          <p className="text-3xl font-bold">
            <CurrencyDisplay amount={liquidNetWorth} />
          </p>
          <p className="text-violet-100 text-sm mt-2">Available funds</p>
        </div>

        {/* Next Bill Due Card */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-red-100 text-sm font-medium">Next Bill Due</p>
            <span className="text-3xl">📅</span>
          </div>
          {nextBill ? (
            <>
              <p className="text-xl font-bold">{nextBill.bill_name}</p>
              <p className="text-red-100 text-sm mt-2">
                {formatIDR(nextBill.amount || 0)} in {nextBill.daysUntilDue} days
              </p>
            </>
          ) : (
            <p className="text-red-100">No pending bills</p>
          )}
        </div>

        {/* Credits Issued Card */}
        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-cyan-100 text-sm font-medium">Credits Issued</p>
            <span className="text-3xl">🎫</span>
          </div>
          <p className="text-4xl font-bold">{creditPositiveStudents.length}</p>
          <p className="text-cyan-100 text-sm mt-2">Students with active credits</p>
        </div>
      </div>

      {/* Alert Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {zeroBalanceStudents.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-800 mb-2">⚠️ Balance = 0 (Cannot mark Present)</h3>
            <ul className="space-y-1">
              {zeroBalanceStudents.map((s: Student) => (
                <li key={s.id} className="text-sm text-red-700">
                  {s.name} ({s.subject})
                </li>
              ))}
            </ul>
          </div>
        )}

        {lowBalanceStudents.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">⚡ Balance = 1 (Low)</h3>
            <ul className="space-y-1">
              {lowBalanceStudents.map((s: Student) => (
                <li key={s.id} className="text-sm text-yellow-700">
                  {s.name} ({s.subject})
                </li>
              ))}
            </ul>
          </div>
        )}

        {creditPositiveStudents.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">✓ Credits Available</h3>
            <ul className="space-y-1">
              {creditPositiveStudents.slice(0, 5).map((s: Student) => (
                <li key={s.id} className="text-sm text-green-700">
                  {s.name}: {s.credit_balance} credits
                </li>
              ))}
              {creditPositiveStudents.length > 5 && (
                <li className="text-sm text-green-600">+{creditPositiveStudents.length - 5} more</li>
              )}
            </ul>
          </div>
        )}

        {billsDueSoon.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="font-semibold text-orange-800 mb-2">📅 Bills Due ≤ 7 Days</h3>
            <ul className="space-y-1">
              {billsDueSoon.map((bill, idx) => (
                <li key={idx} className="text-sm text-orange-700">
                  {bill.bill_name} — {formatIDR(bill.amount ?? 0)} (Day {bill.due_day})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Empty States */}
      {zeroBalanceStudents.length === 0 &&
        lowBalanceStudents.length === 0 &&
        creditPositiveStudents.length === 0 &&
        billsDueSoon.length === 0 && (
          <EmptyState
            title="All systems normal"
            description="No alerts at this time. Everything looks good!"
          />
        )}
    </div>
  )
}
