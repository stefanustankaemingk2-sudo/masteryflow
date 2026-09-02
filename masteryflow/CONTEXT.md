# MasteryFlow Context Document

## Overview
Private tutor (English/Piano/Computer, Indonesia) management app + personal finance command center. Source of truth: Supabase. Frontend: React SPA. Secondary input: Google Sheets via Apps Script.

## Database (exists in Supabase — DO NOT recreate)
students(id,name,subject,curriculum_level,package_type,package_balance,rate_per_session,credit_balance,parent_name,parent_phone,status)
lesson_logs(id,student_id,lesson_date,topic_covered,mastery_score,status,created_at)
invoices(id,student_id,amount,status,due_date,sessions_covered,credits_applied,sessions_activated,invoice_notes,wa_message_sent,wa_sent_at,wa_message_text,created_at)
accounts(id,account_name,institution,account_type,current_balance,is_liquid)
portfolio_targets(id,asset_class,target_percentage,parent_bucket)
sinking_funds(id,goal_name,target_amount,current_amount,status)
income_allocations(id,invoice_id,gross_income,consume_40,invest_30,cash_reserve_20,emergency_10,created_at)
monthly_bills(id,bill_name,amount,due_day,is_paid,allocated_from)

## Business Rules (ENFORCE ALWAYS)
R1 package_balance >= 0
R2 credits_applied <= credit_balance AND <= full price
R3 40/50/10 split must sum to gross (adjust consume for rounding)
R4 Save(50%) splits: 60% Invest, 40% Blu Saving cash reserve
R5 Invest splits: Bibit 80% / BluInvest 20%; Bibit internal from portfolio_targets (default Gold20/Bonds40/Stocks40); BluInvest 50 Rupiah/50 SGD; cash reserve bank alloc Jago33/GoPay33/Blu33
R6 Pro-rata bill cut uses ONLY is_liquid=true accounts
R7 Emergency (is_liquid=false) never touched by cuts
R8 Cannot mark Present if balance=0
R9 Group attendance (comma names): deduction = checked checkboxes
R10 Invoice transitions: Unpaid→Paid|Cancelled only

## Payment Accounts (a.n. Stefanus)
blu 004665797835 | BCA 3790104080 | JAGO 109981714634 | Bibit 5028198641 | GoPay 081321186453

## Bills
House KPR (7th) | XL Joy Pro Wifi+CableTV (15th) | Listrik (20th) | Iuran RT 100000 (20th) | Battery Rental e-moto (25th)

## WhatsApp
Never auto-send. Always confirmation dialog first. wa.me link with phone 0→62 conversion. Indonesian template with package, credits, amount, due date, bank accounts.

## Standards
Modular files <200 lines | Zod validation | TanStack Query | ConfirmDialog for destructive ops | Soft delete for students/invoices | Unit tests for all lib/ math | Commit after each phase.

## Changelog
- **Session: Data Layer + Business Logic** (Current)
  - Created `src/types/database.ts`: TypeScript interfaces for all 8 tables
  - Created `src/lib/format.ts`: formatIDR (Intl id-ID, no decimals), formatDate (dd MMM yyyy)
  - Created `src/lib/validators.ts`: Zod schemas for student, lessonLog, invoice, account, bill, portfolioTarget, sinkingFund, incomeAllocation
  - Created `src/lib/calculations.ts`: Pure functions for parseGroupMembers, calcCreditInvoice, calcAllocation, calcProRataCut, calcAttendanceBalanceChange
  - Created unit tests for all lib functions (67 tests passing)
  - Enforces R1-R10 business rules in calculation functions
  - Build passes with zero errors

- **Session: Credit-Adjusted Invoicing + WhatsApp** (Latest)
  - Created `src/hooks/useInvoices.ts`: useInvoices (with filters: status, date range, hasCredits), useCreateInvoice, useUpdateInvoice, useRevokeInvoice (restores credits per R10)
  - Created `src/pages/InvoicesPage.tsx`: DataTable with search, multi-filter status, date range, "has credits" toggle; color-coded status badges; columns show full price, credits applied (green), net amount
  - Created `src/components/invoices/BankAccountsCard.tsx`: Copy-to-clipboard for 5 payment accounts (blu, BCA, JAGO, Bibit, GoPay)
  - Created `src/components/invoices/InvoiceGeneratorModal.tsx`: Sessions select (4/8/12/24/custom), read-only full price, editable credits (default=credit_balance, max per R2), sessions to activate, notes; live receipt preview (full / -credit / NET); on generate: insert invoice atomically
  - Created `src/components/invoices/WhatsAppSendDialog.tsx`: Confirmation dialog showing student/phone/amount/credits; validates phone exists (aborts with toast if missing); builds Indonesian message per CONTEXT.md template; opens wa.me (0→62 conversion); logs wa_message_sent
  - Created `src/components/invoices/IncomeAllocationWizard.tsx`: Two-step wizard showing calcAllocation shopping list (40% consume, 30% invest split Bibit/BluInvest, 20% cash reserve split Jago/GoPay/Blu, 10% emergency); on confirm inserts income_allocations + updates account balances; sets invoice Paid; sets student package_balance=sessions_activated
  - Human-error protection: R2 validation on credit input, destructive ConfirmDialog for revoke, phone validation before WhatsApp
  - Build passes. Commit: "feat: credit-adjusted invoicing + whatsapp"
