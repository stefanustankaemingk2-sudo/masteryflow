import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns'

export function useDashboardData() {
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  // This would normally fetch from Supabase, but we're using mock data for the shell
  // In real app, this would combine useStudents, useInvoices, useAccounts, useMonthlyBills
  return {
    monthStart,
    monthEnd,
    getNextBillDue: (bills: Array<{ bill_name: string; due_day: number; is_paid: boolean; amount?: number }>) => {
      const unpaidBills = bills.filter((b) => !b.is_paid)
      if (unpaidBills.length === 0) return null

      const today = now.getDate()
      let nextBill = unpaidBills[0]
      let minDays = Infinity

      for (const bill of unpaidBills) {
        let daysUntilDue = bill.due_day - today
        if (daysUntilDue < 0) {
          daysUntilDue += new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
        }
        if (daysUntilDue < minDays) {
          minDays = daysUntilDue
          nextBill = bill
        }
      }
      return { ...nextBill, daysUntilDue: minDays }
    },
    getBillsDueSoon: (
      bills: Array<{ bill_name: string; due_day: number; is_paid: boolean; amount?: number }>,
      daysThreshold = 7
    ) => {
      const today = now.getDate()
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

      return bills.filter((bill) => {
        if (bill.is_paid) return false
        let daysUntilDue = bill.due_day - today
        if (daysUntilDue < 0) daysUntilDue += daysInMonth
        return daysUntilDue <= daysThreshold
      })
    },
    isInThisMonth: (dateString: string) => {
      const date = parseISO(dateString)
      return isWithinInterval(date, { start: monthStart, end: monthEnd })
    },
    getDaysUntilBill: (dueDay: number) => {
      const today = now.getDate()
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      let daysUntil = dueDay - today
      if (daysUntil < 0) daysUntil += daysInMonth
      return daysUntil
    },
  }
}
