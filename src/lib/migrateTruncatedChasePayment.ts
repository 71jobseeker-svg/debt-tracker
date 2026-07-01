import type { Debt, PaymentLogEntry } from "./types";

const CHASE_PRIME_ID = "chase-prime";
const NFCU_ID = "nfcu";
const TRUNCATED_AMOUNT = 1500;
const CORRECTED_AMOUNT = 1605;
const NFCU_ORIGINAL_BALANCE = 3025;
const INCORRECT_ROLLOVER_AMOUNT = CORRECTED_AMOUNT - TRUNCATED_AMOUNT;

/**
 * Fixes prior payment data: corrects truncated Chase log entries, removes
 * incorrect NFCU rollover entries, and restores NFCU to its original balance.
 */
export function migrateTruncatedChasePayment(
  debts: Debt[],
  history: PaymentLogEntry[]
): { debts: Debt[]; history: PaymentLogEntry[]; changed: boolean } {
  let changed = false;

  let updatedHistory = history.map((e) => {
    if (
      e.debtId === CHASE_PRIME_ID &&
      !e.isRollover &&
      e.amount === TRUNCATED_AMOUNT
    ) {
      changed = true;
      return { ...e, amount: CORRECTED_AMOUNT };
    }
    return e;
  });

  const withoutRollover = updatedHistory.filter(
    (e) =>
      !(
        e.isRollover &&
        e.debtId === NFCU_ID &&
        e.amount === INCORRECT_ROLLOVER_AMOUNT
      )
  );
  if (withoutRollover.length !== updatedHistory.length) {
    changed = true;
    updatedHistory = withoutRollover;
  }

  const updatedDebts = debts.map((d) => {
    if (d.id === NFCU_ID && d.balance === NFCU_ORIGINAL_BALANCE - INCORRECT_ROLLOVER_AMOUNT) {
      changed = true;
      return { ...d, balance: NFCU_ORIGINAL_BALANCE };
    }

    const chasePaidOff = updatedHistory.some(
      (e) =>
        e.debtId === CHASE_PRIME_ID &&
        !e.isRollover &&
        e.amount === CORRECTED_AMOUNT
    );
    if (d.id === CHASE_PRIME_ID && chasePaidOff && d.balance !== 0) {
      changed = true;
      return { ...d, balance: 0 };
    }

    return d;
  });

  return { debts: updatedDebts, history: updatedHistory, changed };
}
