import { describe, it, expect } from 'vitest';
import {
  parseGroupMembers,
  calcCreditInvoice,
  calcAllocation,
  calcProRataCut,
  calcAttendanceBalanceChange,
} from './calculations.js';
import type { Account } from '../types/database.js';

describe('parseGroupMembers', () => {
  it('parses single name without suffix', () => {
    expect(parseGroupMembers('John Doe')).toEqual(['John Doe']);
  });

  it('parses multiple names separated by comma', () => {
    expect(parseGroupMembers('John, Jane, Bob')).toEqual(['John', 'Jane', 'Bob']);
  });

  it('strips (Piano) suffix', () => {
    expect(parseGroupMembers('John (Piano), Jane (Piano)')).toEqual(['John', 'Jane']);
  });

  it('strips (English) suffix', () => {
    expect(parseGroupMembers('Bob (English), Alice (English)')).toEqual(['Bob', 'Alice']);
  });

  it('handles mixed suffixes', () => {
    expect(parseGroupMembers('John (Piano), Jane (English), Bob')).toEqual(['John', 'Jane', 'Bob']);
  });

  it('trims whitespace', () => {
    expect(parseGroupMembers('  John  ,  Jane  ')).toEqual(['John', 'Jane']);
  });

  it('returns empty array for empty string', () => {
    expect(parseGroupMembers('')).toEqual([]);
  });

  it('returns empty array for whitespace only', () => {
    expect(parseGroupMembers('   ')).toEqual([]);
  });

  it('filters out empty entries from trailing commas', () => {
    expect(parseGroupMembers('John, , Jane,')).toEqual(['John', 'Jane']);
  });
});

describe('calcCreditInvoice', () => {
  it('calculates full price with no credits', () => {
    const result = calcCreditInvoice(100000, 5, 0);
    expect(result).toEqual({
      fullPrice: 500000,
      creditsApplied: 0,
      netAmount: 500000,
    });
  });

  it('auto-applies all available credit when less than full price', () => {
    const result = calcCreditInvoice(100000, 5, 200000);
    expect(result).toEqual({
      fullPrice: 500000,
      creditsApplied: 200000,
      netAmount: 300000,
    });
  });

  it('caps credits at full price when credit > price', () => {
    const result = calcCreditInvoice(100000, 3, 500000);
    expect(result).toEqual({
      fullPrice: 300000,
      creditsApplied: 300000,
      netAmount: 0,
    });
  });

  it('respects manual creditsToApply within limits', () => {
    const result = calcCreditInvoice(100000, 5, 300000, 150000);
    expect(result).toEqual({
      fullPrice: 500000,
      creditsApplied: 150000,
      netAmount: 350000,
    });
  });

  it('caps manual creditsToApply at available credit', () => {
    const result = calcCreditInvoice(100000, 5, 100000, 200000);
    expect(result).toEqual({
      fullPrice: 500000,
      creditsApplied: 100000,
      netAmount: 400000,
    });
  });

  it('caps manual creditsToApply at full price', () => {
    const result = calcCreditInvoice(100000, 3, 500000, 400000);
    expect(result).toEqual({
      fullPrice: 300000,
      creditsApplied: 300000,
      netAmount: 0,
    });
  });

  it('handles zero sessions', () => {
    const result = calcCreditInvoice(100000, 0, 50000);
    expect(result).toEqual({
      fullPrice: 0,
      creditsApplied: 0,
      netAmount: 0,
    });
  });

  it('ensures creditsApplied is never negative', () => {
    const result = calcCreditInvoice(100000, 5, -100);
    expect(result.creditsApplied).toBe(0);
    expect(result.netAmount).toBe(500000);
  });
});

describe('calcAllocation', () => {
  it('calculates correct split for round number', () => {
    const result = calcAllocation(1000000);
    expect(result.consume40 + result.save50.invest30.bibit + result.save50.invest30.bluinvest + result.save50.cashReserve20.total + result.emergency10).toBe(1000000);
    expect(result.totalAllocated).toBe(1000000);
  });

  it('guarantees sum equals gross for odd amounts (R3)', () => {
    const testAmounts = [100001, 500003, 777777, 1234567];
    testAmounts.forEach((gross) => {
      const result = calcAllocation(gross);
      expect(result.totalAllocated).toBe(gross);
      expect(result.consume40 + result.save50.invest30.bibit + result.save50.invest30.bluinvest + result.save50.cashReserve20.total + result.emergency10).toBe(gross);
    });
  });

  it('handles zero gross', () => {
    const result = calcAllocation(0);
    expect(result.consume40).toBe(0);
    expect(result.emergency10).toBe(0);
    expect(result.totalAllocated).toBe(0);
  });

  it('correctly splits invest portion (Bibit 80%, BluInvest 20%)', () => {
    const result = calcAllocation(1000000);
    const investTotal = result.save50.invest30.bibit + result.save50.invest30.bluinvest;
    expect(result.save50.invest30.bibit).toBe(Math.floor(investTotal * 0.8));
  });

  it('correctly splits Bibit internally (Gold 20%, Bonds 40%, Stocks 40%)', () => {
    const result = calcAllocation(1000000);
    const bibitTotal = result.save50.invest30.bibit;
    const breakdown = result.save50.invest30.bibitBreakdown;
    expect(breakdown.gold + breakdown.bonds + breakdown.stocks).toBe(bibitTotal);
  });

  it('correctly splits BluInvest (50% Rupiah, 50% SGD)', () => {
    const result = calcAllocation(1000000);
    const bluinvestTotal = result.save50.invest30.bluinvest;
    const breakdown = result.save50.invest30.bluinvestBreakdown;
    expect(breakdown.rupiah + breakdown.sgd).toBe(bluinvestTotal);
  });

  it('correctly splits cash reserve (Jago 33%, GoPay 33%, Blu 33%)', () => {
    const result = calcAllocation(1000000);
    const cashReserveTotal = result.save50.cashReserve20.total;
    const split = result.save50.cashReserve20.bankSplit;
    expect(split.jago + split.gopay + split.blu).toBe(cashReserveTotal);
  });
});

describe('calcProRataCut', () => {
  const accounts: Account[] = [
    { id: '1', account_name: 'blu', institution: 'BCA', account_type: 'Savings', current_balance: 3000000, is_liquid: true },
    { id: '2', account_name: 'JAGO', institution: 'JAGO', account_type: 'Savings', current_balance: 2000000, is_liquid: true },
    { id: '3', account_name: 'Bibit', institution: 'Bibit', account_type: 'Investment', current_balance: 5000000, is_liquid: false },
  ];

  it('calculates pro-rata cut using only liquid accounts (R6)', () => {
    const result = calcProRataCut(accounts, 1500000);
    // Total liquid = 5000000, need 1500000, so 30% cut
    expect(result.cutPercentage).toBe(0.3);
    expect(result.manifest.length).toBe(2); // Only liquid accounts
  });

  it('excludes non-liquid accounts from manifest (R7)', () => {
    const result = calcProRataCut(accounts, 1000000);
    const accountNames = result.manifest.map((m) => m.account);
    expect(accountNames).not.toContain('Bibit');
    expect(accountNames).toContain('blu');
    expect(accountNames).toContain('JAGO');
  });

  it('handles bill larger than total liquid balance', () => {
    const result = calcProRataCut(accounts, 10000000);
    expect(result.cutPercentage).toBe(1); // 100% cut
  });

  it('returns zero cut when no liquid balance', () => {
    const nonLiquidAccounts: Account[] = [
      { id: '1', account_name: 'Bibit', institution: 'Bibit', account_type: 'Investment', current_balance: 5000000, is_liquid: false },
    ];
    const result = calcProRataCut(nonLiquidAccounts, 1000000);
    expect(result.cutPercentage).toBe(0);
    expect(result.manifest.length).toBe(0);
  });

  it('calculates correct remaining balances', () => {
    const result = calcProRataCut(accounts, 1500000);
    const bluManifest = result.manifest.find((m) => m.account === 'blu');
    expect(bluManifest?.remaining).toBe(3000000 - 900000); // 30% of 3M
  });
});

describe('calcAttendanceBalanceChange', () => {
  it('returns -1 when marking present from null', () => {
    expect(calcAttendanceBalanceChange(null, 'present')).toBe(-1);
  });

  it('returns 0 when marking absent from null', () => {
    expect(calcAttendanceBalanceChange(null, 'absent')).toBe(0);
  });

  it('returns 0 when marking cancelled from null', () => {
    expect(calcAttendanceBalanceChange(null, 'cancelled')).toBe(0);
  });

  it('returns 0 when marking makeup from null', () => {
    expect(calcAttendanceBalanceChange(null, 'makeup')).toBe(0);
  });

  it('returns +1 when changing from present to absent', () => {
    expect(calcAttendanceBalanceChange('present', 'absent')).toBe(1);
  });

  it('returns -1 when changing from absent to present', () => {
    expect(calcAttendanceBalanceChange('absent', 'present')).toBe(-1);
  });

  it('returns 0 when status unchanged', () => {
    expect(calcAttendanceBalanceChange('present', 'present')).toBe(0);
    expect(calcAttendanceBalanceChange('absent', 'absent')).toBe(0);
  });

  it('returns 0 when changing between non-present statuses', () => {
    expect(calcAttendanceBalanceChange('absent', 'cancelled')).toBe(0);
    expect(calcAttendanceBalanceChange('cancelled', 'makeup')).toBe(0);
  });
});
