import { describe, it, expect } from 'vitest';
import { studentSchema, lessonLogSchema, invoiceSchema, accountSchema, billSchema } from './validators.js';

describe('studentSchema', () => {
  const validStudent = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'John Doe',
    subject: 'English' as const,
    curriculum_level: 'Intermediate',
    package_type: '10 sessions',
    package_balance: 5,
    rate_per_session: 100000,
    credit_balance: 2,
    parent_name: 'Jane Doe',
    parent_phone: '081234567890',
    status: 'active' as const,
  };

  it('validates correct student data', () => {
    expect(() => studentSchema.parse(validStudent)).not.toThrow();
  });

  it('accepts empty parent_phone', () => {
    expect(() =>
      studentSchema.parse({ ...validStudent, parent_phone: '' })
    ).not.toThrow();
  });

  it('rejects invalid phone format', () => {
    expect(() =>
      studentSchema.parse({ ...validStudent, parent_phone: '081234567' }) // too short (only 8 digits after 08)
    ).toThrow();
    expect(() =>
      studentSchema.parse({ ...validStudent, parent_phone: '081234567890123' }) // too long (14 digits total)
    ).toThrow();
    expect(() =>
      studentSchema.parse({ ...validStudent, parent_phone: '08123456789a' }) // contains letter
    ).toThrow();
  });

  it('rejects negative rate_per_session', () => {
    expect(() =>
      studentSchema.parse({ ...validStudent, rate_per_session: -100 })
    ).toThrow();
  });

  it('rejects negative package_balance', () => {
    expect(() =>
      studentSchema.parse({ ...validStudent, package_balance: -1 })
    ).toThrow();
  });

  it('requires name', () => {
    expect(() =>
      studentSchema.parse({ ...validStudent, name: '' })
    ).toThrow();
  });
});

describe('lessonLogSchema', () => {
  const validLog = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    student_id: '550e8400-e29b-41d4-a716-446655440000',
    lesson_date: '2024-01-15',
    topic_covered: 'Past tense verbs',
    mastery_score: 4,
    status: 'present' as const,
    created_at: '2024-01-15T10:00:00Z',
  };

  it('validates correct lesson log', () => {
    expect(() => lessonLogSchema.parse(validLog)).not.toThrow();
  });

  it('accepts score 1 (minimum)', () => {
    expect(() =>
      lessonLogSchema.parse({ ...validLog, mastery_score: 1 })
    ).not.toThrow();
  });

  it('accepts score 5 (maximum)', () => {
    expect(() =>
      lessonLogSchema.parse({ ...validLog, mastery_score: 5 })
    ).not.toThrow();
  });

  it('rejects score 0', () => {
    expect(() =>
      lessonLogSchema.parse({ ...validLog, mastery_score: 0 })
    ).toThrow();
  });

  it('rejects score 6', () => {
    expect(() =>
      lessonLogSchema.parse({ ...validLog, mastery_score: 6 })
    ).toThrow();
  });
});

describe('invoiceSchema', () => {
  const validInvoice = {
    id: '550e8400-e29b-41d4-a716-446655440002',
    student_id: '550e8400-e29b-41d4-a716-446655440000',
    amount: 500000,
    status: 'unpaid' as const,
    due_date: '2024-02-01',
    sessions_covered: 5,
    credits_applied: 0,
    sessions_activated: 5,
    invoice_notes: '',
    wa_message_sent: false,
    wa_sent_at: null,
    wa_message_text: '',
    created_at: '2024-01-15T10:00:00Z',
  };

  it('validates correct invoice', () => {
    expect(() => invoiceSchema.parse(validInvoice)).not.toThrow();
  });

  it('rejects negative amount', () => {
    expect(() =>
      invoiceSchema.parse({ ...validInvoice, amount: -100 })
    ).toThrow();
  });

  it('rejects negative credits_applied', () => {
    expect(() =>
      invoiceSchema.parse({ ...validInvoice, credits_applied: -1 })
    ).toThrow();
  });
});

describe('accountSchema', () => {
  const validAccount = {
    id: '550e8400-e29b-41d4-a716-446655440003',
    account_name: 'blu',
    institution: 'BCA',
    account_type: 'Savings',
    current_balance: 5000000,
    is_liquid: true,
  };

  it('validates correct account', () => {
    expect(() => accountSchema.parse(validAccount)).not.toThrow();
  });

  it('rejects negative balance', () => {
    expect(() =>
      accountSchema.parse({ ...validAccount, current_balance: -100 })
    ).toThrow();
  });
});

describe('billSchema', () => {
  const validBill = {
    id: '550e8400-e29b-41d4-a716-446655440004',
    bill_name: 'House KPR',
    amount: 5000000,
    due_day: 7,
    is_paid: false,
    allocated_from: 'blu',
  };

  it('validates correct bill', () => {
    expect(() => billSchema.parse(validBill)).not.toThrow();
  });

  it('accepts due_day 1 (minimum)', () => {
    expect(() =>
      billSchema.parse({ ...validBill, due_day: 1 })
    ).not.toThrow();
  });

  it('accepts due_day 31 (maximum)', () => {
    expect(() =>
      billSchema.parse({ ...validBill, due_day: 31 })
    ).not.toThrow();
  });

  it('rejects due_day 0', () => {
    expect(() =>
      billSchema.parse({ ...validBill, due_day: 0 })
    ).toThrow();
  });

  it('rejects due_day 32', () => {
    expect(() =>
      billSchema.parse({ ...validBill, due_day: 32 })
    ).toThrow();
  });
});
