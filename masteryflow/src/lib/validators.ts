import { z } from 'zod';

// Phone regex: starts with 08, followed by 8-12 digits
const phoneRegex = /^08\d{8,12}$/;

/**
 * Student schema with validation rules:
 * - parent_phone: optional, must match ^08\d{8,12}$ if provided
 * - rate_per_session: must be >= 0
 * - package_balance: must be >= 0 (R1)
 */
export const studentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  subject: z.enum(['English', 'Piano', 'Computer']),
  curriculum_level: z.string().min(1, 'Curriculum level is required'),
  package_type: z.string().min(1, 'Package type is required'),
  package_balance: z.number().min(0, 'Package balance cannot be negative'),
  rate_per_session: z.number().min(0, 'Rate per session cannot be negative'),
  credit_balance: z.number().min(0, 'Credit balance cannot be negative'),
  parent_name: z.string().min(1, 'Parent name is required'),
  parent_phone: z.string().regex(phoneRegex, 'Phone must start with 08 and have 9-13 digits').optional().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'archived']),
});

/**
 * LessonLog schema with validation rules:
 * - mastery_score: must be between 1 and 5
 */
export const lessonLogSchema = z.object({
  id: z.string().uuid(),
  student_id: z.string().uuid(),
  lesson_date: z.string(),
  topic_covered: z.string().min(1, 'Topic covered is required'),
  mastery_score: z.number().int().min(1, 'Score must be at least 1').max(5, 'Score must be at most 5'),
  status: z.enum(['present', 'absent', 'cancelled', 'makeup']),
  created_at: z.string(),
});

/**
 * Invoice schema with validation rules:
 * - credits_applied: must be <= credit_balance AND <= full price (R2)
 * - status transitions: Unpaid→Paid|Cancelled only (R10)
 */
export const invoiceSchema = z.object({
  id: z.string().uuid(),
  student_id: z.string().uuid(),
  amount: z.number().min(0, 'Amount cannot be negative'),
  status: z.enum(['unpaid', 'paid', 'cancelled']),
  due_date: z.string(),
  sessions_covered: z.number().int().min(0),
  credits_applied: z.number().min(0, 'Credits applied cannot be negative'),
  sessions_activated: z.number().int().min(0),
  invoice_notes: z.string(),
  wa_message_sent: z.boolean(),
  wa_sent_at: z.string().nullable(),
  wa_message_text: z.string(),
  created_at: z.string(),
});

/**
 * Account schema for payment accounts
 */
export const accountSchema = z.object({
  id: z.string().uuid(),
  account_name: z.string().min(1, 'Account name is required'),
  institution: z.string().min(1, 'Institution is required'),
  account_type: z.string().min(1, 'Account type is required'),
  current_balance: z.number().min(0, 'Balance cannot be negative'),
  is_liquid: z.boolean(),
});

/**
 * MonthlyBill schema with validation rules:
 * - due_day: must be between 1 and 31
 */
export const billSchema = z.object({
  id: z.string().uuid(),
  bill_name: z.string().min(1, 'Bill name is required'),
  amount: z.number().min(0, 'Amount cannot be negative'),
  due_day: z.number().int().min(1, 'Due day must be at least 1').max(31, 'Due day must be at most 31'),
  is_paid: z.boolean(),
  allocated_from: z.string(),
});

/**
 * PortfolioTarget schema for investment allocation targets
 */
export const portfolioTargetSchema = z.object({
  id: z.string().uuid(),
  asset_class: z.string().min(1, 'Asset class is required'),
  target_percentage: z.number().min(0).max(100),
  parent_bucket: z.string().min(1, 'Parent bucket is required'),
});

/**
 * SinkingFund schema for savings goals
 */
export const sinkingFundSchema = z.object({
  id: z.string().uuid(),
  goal_name: z.string().min(1, 'Goal name is required'),
  target_amount: z.number().min(0),
  current_amount: z.number().min(0),
  status: z.enum(['active', 'completed', 'paused']),
});

/**
 * IncomeAllocation schema for tracking income distribution
 */
export const incomeAllocationSchema = z.object({
  id: z.string().uuid(),
  invoice_id: z.string().uuid(),
  gross_income: z.number().min(0),
  consume_40: z.number().min(0),
  invest_30: z.number().min(0),
  cash_reserve_20: z.number().min(0),
  emergency_10: z.number().min(0),
  created_at: z.string(),
});

// Type exports
export type StudentInput = z.infer<typeof studentSchema>;
export type LessonLogInput = z.infer<typeof lessonLogSchema>;
export type InvoiceInput = z.infer<typeof invoiceSchema>;
export type AccountInput = z.infer<typeof accountSchema>;
export type BillInput = z.infer<typeof billSchema>;
export type PortfolioTargetInput = z.infer<typeof portfolioTargetSchema>;
export type SinkingFundInput = z.infer<typeof sinkingFundSchema>;
export type IncomeAllocationInput = z.infer<typeof incomeAllocationSchema>;
