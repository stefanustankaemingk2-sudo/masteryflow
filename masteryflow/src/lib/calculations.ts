import type { Account } from '../types/database';

/**
 * Parse group member names from a comma-separated string.
 * Strips suffixes like "(Piano)" or "(English)" from each name.
 * Returns array of trimmed names without suffixes.
 */
export function parseGroupMembers(nameString: string): string[] {
  if (!nameString || nameString.trim() === '') {
    return [];
  }

  return nameString
    .split(',')
    .map((name) => name.trim())
    .filter((name) => name.length > 0)
    .map((name) => name.replace(/\s*\([^)]*\)\s*$/g, '').trim())
    .filter((name) => name.length > 0);
}

/**
 * Calculate credit invoice details.
 * Enforces R2: credits_applied <= credit_balance AND <= full price
 * 
 * @param rate - Rate per session
 * @param sessions - Number of sessions
 * @param availableCredit - Student's available credit balance
 * @param creditsToApply - Desired credits to apply (can be undefined for auto-calc)
 * @returns Object with fullPrice, creditsApplied, netAmount
 */
export function calcCreditInvoice(
  rate: number,
  sessions: number,
  availableCredit: number,
  creditsToApply?: number
): { fullPrice: number; creditsApplied: number; netAmount: number } {
  const fullPrice = rate * sessions;

  // Determine credits to apply
  let creditsApplied: number;
  if (creditsToApply === undefined || creditsToApply === null) {
    // Auto-apply: use minimum of available credit and full price
    creditsApplied = Math.min(availableCredit, fullPrice);
  } else {
    // Manual: enforce R2 constraints
    creditsApplied = Math.min(creditsToApply, availableCredit, fullPrice);
  }

  // Ensure non-negative
  creditsApplied = Math.max(0, creditsApplied);

  const netAmount = fullPrice - creditsApplied;

  return { fullPrice, creditsApplied, netAmount };
}

/**
 * Calculate income allocation based on 40/50/10 split (R3, R4, R5).
 * GUARANTEES: sum === gross (adjust consume_40 for rounding errors)
 * 
 * Split breakdown:
 * - Consume: 40%
 * - Save: 50% → 60% Invest (30% of gross), 40% Cash Reserve (20% of gross)
 *   - Invest (30%): Bibit 80%, BluInvest 20%
 *     - Bibit: Gold 20%, Bonds 40%, Stocks 40% (of Bibit portion)
 *     - BluInvest: 50% Rupiah, 50% SGD
 *   - Cash Reserve (20%): Jago 33%, GoPay 33%, Blu 33%
 * - Emergency: 10%
 */
export function calcAllocation(gross: number): {
  consume40: number;
  save50: {
    invest30: {
      bibit: number;
      bibitBreakdown: { gold: number; bonds: number; stocks: number };
      bluinvest: number;
      bluinvestBreakdown: { rupiah: number; sgd: number };
    };
    cashReserve20: {
      total: number;
      bankSplit: { jago: number; gopay: number; blu: number };
    };
  };
  emergency10: number;
  totalAllocated: number;
} {
  // Calculate base percentages (round down to avoid overflow)
  const consume40 = Math.floor(gross * 0.4);
  const invest30Total = Math.floor(gross * 0.3);
  const cashReserve20Total = Math.floor(gross * 0.2);
  const emergency10 = Math.floor(gross * 0.1);

  // Invest breakdown (30% of gross)
  const bibitTotal = Math.floor(invest30Total * 0.8); // 80% to Bibit
  const bluinvestTotal = invest30Total - bibitTotal; // Remaining to BluInvest (handles rounding)

  // Bibit internal breakdown (default: Gold 20%, Bonds 40%, Stocks 40%)
  const bibGold = Math.floor(bibitTotal * 0.2);
  const bibBonds = Math.floor(bibitTotal * 0.4);
  const bibStocks = bibitTotal - bibGold - bibBonds; // Remainder handles rounding

  // BluInvest breakdown (50% Rupiah / 50% SGD)
  const bluRupiah = Math.floor(bluinvestTotal * 0.5);
  const bluSgd = bluinvestTotal - bluRupiah; // Remainder handles rounding

  // Cash reserve breakdown (Jago 33%, GoPay 33%, Blu 33%)
  const bankJago = Math.floor(cashReserve20Total / 3);
  const bankGopay = Math.floor(cashReserve20Total / 3);
  const bankBlu = cashReserve20Total - bankJago - bankGopay; // Remainder handles rounding

  // Calculate total allocated so far
  const subtotal = consume40 + invest30Total + cashReserve20Total + emergency10;

  // Adjust consume_40 to guarantee sum === gross (R3)
  const adjustedConsume40 = consume40 + (gross - subtotal);

  return {
    consume40: adjustedConsume40,
    save50: {
      invest30: {
        bibit: bibitTotal,
        bibitBreakdown: {
          gold: bibGold,
          bonds: bibBonds,
          stocks: bibStocks,
        },
        bluinvest: bluinvestTotal,
        bluinvestBreakdown: {
          rupiah: bluRupiah,
          sgd: bluSgd,
        },
      },
      cashReserve20: {
        total: cashReserve20Total,
        bankSplit: {
          jago: bankJago,
          gopay: bankGopay,
          blu: bankBlu,
        },
      },
    },
    emergency10,
    totalAllocated: adjustedConsume40 + invest30Total + cashReserve20Total + emergency10,
  };
}

/**
 * Calculate pro-rata bill cut using only liquid accounts (R6).
 * Emergency accounts (is_liquid=false) are never touched (R7).
 * 
 * @param accounts - Array of all accounts
 * @param billAmount - Amount needed for the bill
 * @returns Object with cutPercentage and manifest of withdrawals
 */
export function calcProRataCut(
  accounts: Account[],
  billAmount: number
): {
  cutPercentage: number;
  manifest: Array<{
    account: string;
    balance: number;
    withdrawal: number;
    remaining: number;
  }>;
} {
  // Filter only liquid accounts (R6)
  const liquidAccounts = accounts.filter((acc) => acc.is_liquid);

  // Calculate total liquid balance
  const totalLiquid = liquidAccounts.reduce((sum, acc) => sum + acc.current_balance, 0);

  // If no liquid balance, return empty manifest
  if (totalLiquid <= 0) {
    return {
      cutPercentage: 0,
      manifest: liquidAccounts.map((acc) => ({
        account: acc.account_name,
        balance: acc.current_balance,
        withdrawal: 0,
        remaining: acc.current_balance,
      })),
    };
  }

  // Calculate cut percentage needed
  const cutPercentage = Math.min(1, billAmount / totalLiquid);

  // Generate manifest for liquid accounts only
  const manifest = liquidAccounts.map((acc) => {
    const withdrawal = Math.floor(acc.current_balance * cutPercentage);
    const remaining = acc.current_balance - withdrawal;
    return {
      account: acc.account_name,
      balance: acc.current_balance,
      withdrawal,
      remaining,
    };
  });

  return {
    cutPercentage,
    manifest,
  };
}

/**
 * Calculate attendance balance change based on status transition.
 * Returns +1 (credit added), -1 (credit deducted), or 0 (no change).
 * 
 * Rules:
 * - present: -1 (deducts from package_balance)
 * - absent: 0 (no deduction per R9 context)
 * - cancelled: 0 (no deduction)
 * - makeup: 0 (uses existing credit, no new deduction)
 */
export function calcAttendanceBalanceChange(
  oldStatus: 'present' | 'absent' | 'cancelled' | 'makeup' | null,
  newStatus: 'present' | 'absent' | 'cancelled' | 'makeup'
): number {
  // Helper: returns -1 if status deducts credit, 0 otherwise
  const getDeduction = (status: string): number => {
    if (status === 'present') return -1;
    return 0;
  };

  const oldDeduction = oldStatus ? getDeduction(oldStatus) : 0;
  const newDeduction = getDeduction(newStatus);

  // Return the difference (change in balance)
  return newDeduction - oldDeduction;
}
