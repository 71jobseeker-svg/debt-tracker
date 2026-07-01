import {
  DEFAULT_BIWEEKLY_PAYMENT,
  INITIAL_DEBTS,
} from "./debts";
import { migrateTruncatedChasePayment } from "./migrateTruncatedChasePayment";
import type { Debt, PaymentLogEntry } from "./types";

const STORAGE_KEY = "debt-tracker-state";
const STORAGE_VERSION = 1;

export interface PersistedAppState {
  debts: Debt[];
  paymentHistory: PaymentLogEntry[];
  biweeklyPayment: number;
}

interface SerializedState {
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

export function loadAppState(): PersistedAppState {
  if (typeof window === "undefined") {
    return getDefaultAppState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultAppState();

    const parsed = JSON.parse(raw) as SerializedState;
    if (parsed.version !== STORAGE_VERSION || !Array.isArray(parsed.debts)) {
      return getDefaultAppState();
    }

    const loaded: PersistedAppState = {
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

    const migrated = migrateTruncatedChasePayment(
      loaded.debts,
      loaded.paymentHistory
    );

    if (migrated.changed) {
      const corrected: PersistedAppState = {
        debts: migrated.debts,
        paymentHistory: migrated.history,
        biweeklyPayment: loaded.biweeklyPayment,
      };
      saveAppState(corrected);
      return corrected;
    }

    return loaded;
  } catch {
    return getDefaultAppState();
  }
}

export function saveAppState(state: PersistedAppState): void {
  if (typeof window === "undefined") return;

  const serialized: SerializedState = {
    version: STORAGE_VERSION,
    debts: state.debts,
    biweeklyPayment: state.biweeklyPayment,
    paymentHistory: state.paymentHistory.map((entry) => ({
      ...entry,
      date: entry.date.toISOString(),
    })),
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
}
