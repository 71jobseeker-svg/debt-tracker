import type { Debt, PaymentLogEntry } from "./types";

export interface LogPaymentResult {
  debts: Debt[];
  entries: PaymentLogEntry[];
}

/**
 * Records the full payment amount on the target debt and floors its balance at
 * $0. Excess above the tracked balance (e.g. accrued interest) is not applied
 * to any other debt.
 */
export function applyLoggedPayment(
  debts: Debt[],
  targetDebtId: string,
  amount: number,
  date: Date = new Date()
): LogPaymentResult | null {
  if (amount <= 0) return null;

  const targetDebt = debts.find((d) => d.id === targetDebtId);
  if (!targetDebt) return null;

  const updatedDebts = debts.map((d) => {
    if (d.id !== targetDebtId) return d;
    return { ...d, balance: Math.max(0, d.balance - amount) };
  });

  return {
    debts: updatedDebts,
    entries: [
      {
        id: crypto.randomUUID(),
        debtId: targetDebtId,
        debtName: targetDebt.name,
        amount,
        date,
      },
    ],
  };
}
