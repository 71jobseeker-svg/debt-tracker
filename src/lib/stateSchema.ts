import {
  DEFAULT_BIWEEKLY_PAYMENT,
  INITIAL_DEBTS,
} from "./debts";
import type { Debt, PaymentLogEntry } from "./types";

export const STORAGE_VERSION = 1;
export const KV_STATE_KEY = "debt-tracker:app-state";

export interface PersistedAppState {
  debts: Debt[];
  paymentHistory: PaymentLogEntry[];
  biweeklyPayment: number;
}

export interface SerializedState {
  version: number;
  debts: Debt[];
  biweeklyPayment: number;
  paymentHistory: Array<Omit<PaymentLogEntry, "date"> & { date: string }>;
}

export function getDefaultAppState(): PersistedAppState {
  return {
    debts: INITIAL_DEBTS.map((d) => ({ ...d })),
    paymentHistory: [],
    biweeklyPayment: DEFAULT_BIWEEKLY_PAYMENT,
  };
}

export function serializeAppState(state: PersistedAppState): SerializedState {
  return {
    version: STORAGE_VERSION,
    debts: state.debts,
    biweeklyPayment: state.biweeklyPayment,
    paymentHistory: state.paymentHistory.map((entry) => ({
      ...entry,
      date: entry.date.toISOString(),
    })),
  };
}

export function deserializeAppState(
  data: unknown
): PersistedAppState | null {
  if (!data || typeof data !== "object") return null;

  const parsed = data as SerializedState;
  if (parsed.version !== STORAGE_VERSION || !Array.isArray(parsed.debts)) {
    return null;
  }

  return {
    debts: parsed.debts,
    biweeklyPayment:
      typeof parsed.biweeklyPayment === "number"
        ? parsed.biweeklyPayment
        : DEFAULT_BIWEEKLY_PAYMENT,
    paymentHistory: (parsed.paymentHistory ?? []).map((entry) => ({
      ...entry,
      date: new Date(entry.date),
    })),
  };
}
