import { describe, it, expect } from 'vitest'
import { parseGroupMembers, calcAttendanceBalanceChange } from '../calculations'

describe('parseGroupMembers', () => {
  it('should parse single name without suffix', () => {
    expect(parseGroupMembers('John Doe')).toEqual(['John Doe'])
  })

  it('should parse multiple names separated by comma', () => {
    expect(parseGroupMembers('John Doe, Jane Smith')).toEqual(['John Doe', 'Jane Smith'])
  })

  it('should strip (Piano) suffix', () => {
    expect(parseGroupMembers('John Doe (Piano)')).toEqual(['John Doe'])
  })

  it('should strip (English) suffix', () => {
    expect(parseGroupMembers('Jane Smith (English)')).toEqual(['Jane Smith'])
  })

  it('should strip any suffix in parentheses', () => {
    expect(parseGroupMembers('Bob (Computer)')).toEqual(['Bob'])
  })

  it('should handle multiple names with mixed suffixes', () => {
    expect(parseGroupMembers('Alice (Piano), Bob (English), Charlie')).toEqual([
      'Alice',
      'Bob',
      'Charlie',
    ])
  })

  it('should trim whitespace', () => {
    expect(parseGroupMembers('  John Doe  ,  Jane Smith  ')).toEqual(['John Doe', 'Jane Smith'])
  })

  it('should return empty array for empty string', () => {
    expect(parseGroupMembers('')).toEqual([])
  })

  it('should return empty array for whitespace only', () => {
    expect(parseGroupMembers('   ')).toEqual([])
  })

  it('should filter out empty names after parsing', () => {
    expect(parseGroupMembers('John, , Jane')).toEqual(['John', 'Jane'])
  })

  it('should handle names with multiple parentheses correctly', () => {
    // The regex only removes the last parentheses group
    expect(parseGroupMembers('John (Piano) (Advanced)')).toEqual(['John (Piano)'])
  })
})

describe('calcAttendanceBalanceChange', () => {
  it('should return -1 when changing from null to present (new attendance)', () => {
    expect(calcAttendanceBalanceChange(null, 'present')).toBe(-1)
  })

  it('should return 0 when changing from null to absent', () => {
    expect(calcAttendanceBalanceChange(null, 'absent')).toBe(0)
  })

  it('should return 0 when changing from null to cancelled', () => {
    expect(calcAttendanceBalanceChange(null, 'cancelled')).toBe(0)
  })

  it('should return 0 when changing from null to makeup', () => {
    expect(calcAttendanceBalanceChange(null, 'makeup')).toBe(0)
  })

  it('should return 0 when editing present to present (no change)', () => {
    expect(calcAttendanceBalanceChange('present', 'present')).toBe(0)
  })

  it('should return +1 when changing from present to absent (restore credit)', () => {
    expect(calcAttendanceBalanceChange('present', 'absent')).toBe(1)
  })

  it('should return +1 when changing from present to cancelled (restore credit)', () => {
    expect(calcAttendanceBalanceChange('present', 'cancelled')).toBe(1)
  })

  it('should return +1 when changing from present to makeup (restore credit)', () => {
    expect(calcAttendanceBalanceChange('present', 'makeup')).toBe(1)
  })

  it('should return -1 when changing from absent to present (deduct credit)', () => {
    expect(calcAttendanceBalanceChange('absent', 'present')).toBe(-1)
  })

  it('should return 0 when changing from absent to absent', () => {
    expect(calcAttendanceBalanceChange('absent', 'absent')).toBe(0)
  })

  it('should return 0 when changing from absent to cancelled', () => {
    expect(calcAttendanceBalanceChange('absent', 'cancelled')).toBe(0)
  })

  it('should return -1 when changing from cancelled to present', () => {
    expect(calcAttendanceBalanceChange('cancelled', 'present')).toBe(-1)
  })

  it('should return 0 when changing from cancelled to absent', () => {
    expect(calcAttendanceBalanceChange('cancelled', 'absent')).toBe(0)
  })

  it('should return -1 when changing from makeup to present', () => {
    expect(calcAttendanceBalanceChange('makeup', 'present')).toBe(-1)
  })

  it('should return 0 when changing from makeup to absent', () => {
    expect(calcAttendanceBalanceChange('makeup', 'absent')).toBe(0)
  })

  it('should handle all status transitions correctly', () => {
    const statuses: Array<'present' | 'absent' | 'cancelled' | 'makeup'> = [
      'present',
      'absent',
      'cancelled',
      'makeup',
    ]

    // Test all combinations
    statuses.forEach(oldStatus => {
      statuses.forEach(newStatus => {
        const result = calcAttendanceBalanceChange(oldStatus, newStatus)
        
        if (oldStatus === 'present' && newStatus !== 'present') {
          // Going from present to anything else restores 1 credit
          expect(result).toBe(1)
        } else if (oldStatus !== 'present' && newStatus === 'present') {
          // Going to present from anything else deducts 1 credit
          expect(result).toBe(-1)
        } else {
          // Same status or non-present to non-present = no change
          expect(result).toBe(0)
        }
      })
    })
  })
})
