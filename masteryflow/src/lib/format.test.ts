import { describe, it, expect } from 'vitest';
import { formatIDR, formatDate } from './format.js';

describe('formatIDR', () => {
  it('formats zero correctly', () => {
    expect(formatIDR(0)).toMatch(/Rp\s?0/);
  });

  it('formats whole numbers without decimals', () => {
    expect(formatIDR(100000)).toMatch(/Rp\s?100\.000/);
    expect(formatIDR(50000)).toMatch(/Rp\s?50\.000/);
  });

  it('rounds down decimals', () => {
    expect(formatIDR(100000.9)).toMatch(/Rp\s?100\.001/);
    expect(formatIDR(100000.4)).toMatch(/Rp\s?100\.000/);
  });

  it('handles negative numbers', () => {
    expect(formatIDR(-50000)).toMatch(/-Rp\s?50\.000/);
  });

  it('handles large numbers', () => {
    expect(formatIDR(10000000)).toMatch(/Rp\s?10\.000\.000/);
  });
});

describe('formatDate', () => {
  it('formats Date object correctly', () => {
    const date = new Date('2024-01-15T00:00:00Z');
    expect(formatDate(date)).toBe('15 Jan 2024');
  });

  it('formats ISO string correctly', () => {
    expect(formatDate('2024-03-20')).toBe('20 Mar 2024');
  });

  it('handles single digit days with leading zero', () => {
    expect(formatDate('2024-01-05')).toBe('05 Jan 2024');
  });

  it('handles different months', () => {
    expect(formatDate('2024-12-25')).toBe('25 Dec 2024');
    expect(formatDate('2024-07-04')).toBe('04 Jul 2024');
  });
});
