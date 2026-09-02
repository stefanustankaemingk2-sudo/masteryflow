// Database interfaces for all 8 tables based on CONTEXT.md

export interface Student {
  id: string;
  name: string;
  subject: string;
  curriculum_level: string;
  package_type: string;
  package_balance: number;
  rate_per_session: number;
  credit_balance: number;
  parent_name: string;
  parent_phone: string;
  status: 'active' | 'inactive' | 'archived';
}

export interface LessonLog {
  id: string;
  student_id: string;
  lesson_date: string;
  topic_covered: string;
  mastery_score: number;
  status: 'present' | 'absent' | 'cancelled' | 'makeup';
  created_at: string;
}

export interface Invoice {
  id: string;
  student_id: string;
  amount: number;
  status: 'unpaid' | 'paid' | 'cancelled';
  due_date: string;
  sessions_covered: number;
  credits_applied: number;
  sessions_activated: number;
  invoice_notes: string;
  wa_message_sent: boolean;
  wa_sent_at: string | null;
  wa_message_text: string;
  created_at: string;
}

export interface Account {
  id: string;
  account_name: string;
  institution: string;
  account_type: string;
  current_balance: number;
  is_liquid: boolean;
}

export interface PortfolioTarget {
  id: string;
  asset_class: string;
  target_percentage: number;
  parent_bucket: string;
}

export interface SinkingFund {
  id: string;
  goal_name: string;
  target_amount: number;
  current_amount: number;
  status: 'active' | 'completed' | 'paused';
}

export interface IncomeAllocation {
  id: string;
  invoice_id: string;
  gross_income: number;
  consume_40: number;
  invest_30: number;
  cash_reserve_20: number;
  emergency_10: number;
  created_at: string;
}

export interface MonthlyBill {
  id: string;
  bill_name: string;
  amount: number;
  due_day: number;
  is_paid: boolean;
  allocated_from: string;
}
