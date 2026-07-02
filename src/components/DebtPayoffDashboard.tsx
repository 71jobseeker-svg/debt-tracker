"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AvalancheStrategy } from "@/components/AvalancheStrategy";
import { DebtCard } from "@/components/DebtCard";
import { PaymentHistory } from "@/components/PaymentHistory";
import { PayoffTimeline } from "@/components/PayoffTimeline";
import { StatsOverview } from "@/components/StatsOverview";
import { calculateAvalanchePayoff } from "@/lib/avalanche";
import { INITIAL_DEBTS, PAYOFF_CONFIG } from "@/lib/debts";
import { applyLoggedPayment } from "@/lib/logPayment";
import {
  getDefaultAppState,
  loadAppState,
  resetAppState,
  saveAppState,
  StorageError,
} from "@/lib/storage";
import type { PersistedAppState } from "@/lib/stateSchema";
import type { Debt, PaymentLogEntry } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

const ORIGINAL_BALANCES = Object.fromEntries(
  INITIAL_DEBTS.map((d) => [d.id, d.balance])
);

export function DebtPayoffDashboard() {
  const defaults = getDefaultAppState();
  const [debts, setDebts] = useState<Debt[]>(defaults.debts);
  const [paymentHistory, setPaymentHistory] = useState<PaymentLogEntry[]>(
    defaults.paymentHistory
  );
  const [biweeklyPayment, setBiweeklyPayment] = useState(defaults.biweeklyPayment);
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const shouldPersistRef = useRef(false);
  const stateRef = useRef<PersistedAppState>({
    debts: defaults.debts,
    paymentHistory: defaults.paymentHistory,
    biweeklyPayment: defaults.biweeklyPayment,
  });
  const saveInFlightRef = useRef<Promise<void> | null>(null);

  const persist = useCallback(async () => {
    if (!shouldPersistRef.current) return;

    const promise = (async () => {
      try {
        await saveAppState(stateRef.current);
        setSaveError(null);
      } catch (error) {
        console.error("[debt-tracker] persist() caught error", {
          error,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          cause: error instanceof Error ? error.cause : undefined,
        });
        const message =
          error instanceof StorageError
            ? error.message
            : error instanceof Error
              ? error.message
              : "An unexpected error occurred while saving";
        setSaveError(message);
        window.alert(
          `Save failed: ${message}\n\nYour change is visible on screen but was NOT saved to the server. Please retry.`
        );
        throw error;
      }
    })();

    saveInFlightRef.current = promise;
    try {
      await promise;
    } finally {
      if (saveInFlightRef.current === promise) {
        saveInFlightRef.current = null;
      }
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoadError(null);
    setIsReady(false);

    try {
      const { state: saved, isNew } = await loadAppState();
      setDebts(saved.debts);
      setPaymentHistory(saved.paymentHistory);
      setBiweeklyPayment(saved.biweeklyPayment);
      stateRef.current = saved;
      shouldPersistRef.current = !isNew;
    } catch (error) {
      const message =
        error instanceof StorageError
          ? error.message
          : "Failed to load debt data from server";
      setLoadError(message);
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    stateRef.current = { debts, paymentHistory, biweeklyPayment };
  }, [debts, paymentHistory, biweeklyPayment]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!isReady || !shouldPersistRef.current || loadError) return;

    const timer = setTimeout(() => {
      void persist().catch(() => undefined);
    }, 100);

    return () => clearTimeout(timer);
  }, [debts, paymentHistory, biweeklyPayment, isReady, loadError, persist]);

  useEffect(() => {
    const flushOnHide = () => {
      if (
        document.visibilityState !== "hidden" ||
        !shouldPersistRef.current ||
        loadError
      ) {
        return;
      }
      void persist().catch(() => undefined);
    };

    document.addEventListener("visibilitychange", flushOnHide);
    window.addEventListener("pagehide", flushOnHide);

    return () => {
      document.removeEventListener("visibilitychange", flushOnHide);
      window.removeEventListener("pagehide", flushOnHide);
    };
  }, [loadError, persist]);

  const markDirty = () => {
    shouldPersistRef.current = true;
  };

  const originalTotalBalance = useMemo(
    () => INITIAL_DEBTS.reduce((sum, d) => sum + d.balance, 0),
    []
  );

  const currentTotalBalance = useMemo(
    () => debts.reduce((sum, d) => sum + d.balance, 0),
    [debts]
  );

  const simulation = useMemo(
    () =>
      calculateAvalanchePayoff(debts, {
        ...PAYOFF_CONFIG,
        biweeklyPayment,
      }),
    [debts, biweeklyPayment]
  );

  const handleBalanceSave = async (debtId: string, balance: number) => {
    if (isNaN(balance) || balance < 0) return;
    markDirty();

    const nextDebts = debts.map((d) =>
      d.id === debtId ? { ...d, balance } : d
    );
    const nextState: PersistedAppState = {
      debts: nextDebts,
      paymentHistory,
      biweeklyPayment,
    };

    stateRef.current = nextState;
    setDebts(nextDebts);
    await persist();
  };

  const handleLogPayment = async (debtId: string, amount: number) => {
    const result = applyLoggedPayment(debts, debtId, amount);
    if (!result) return;

    markDirty();

    const nextHistory = [...paymentHistory, result.entries[0]];
    const nextState: PersistedAppState = {
      debts: result.debts,
      paymentHistory: nextHistory,
      biweeklyPayment,
    };

    stateRef.current = nextState;
    setDebts(result.debts);
    setPaymentHistory(nextHistory);
    await persist();
  };

  const handleBiweeklyPaymentSave = async (amount: number) => {
    markDirty();

    const nextState: PersistedAppState = {
      debts,
      paymentHistory,
      biweeklyPayment: amount,
    };

    stateRef.current = nextState;
    setBiweeklyPayment(amount);
    await persist();
  };

  const handleResetAll = async () => {
    if (
      !window.confirm(
        "Reset all debts, payment history, and biweekly payment to original defaults? This cannot be undone."
      )
    ) {
      return;
    }

    await resetAppState();
    const fresh = getDefaultAppState();
    stateRef.current = fresh;
    setDebts(fresh.debts);
    setPaymentHistory(fresh.paymentHistory);
    setBiweeklyPayment(fresh.biweeklyPayment);
    shouldPersistRef.current = true;
    await persist();
  };

  if (!isReady) {
    return (
      <div className="flex min-h-full items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
        <p className="text-sm text-slate-500">Loading your debt data…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-gradient-to-b from-slate-50 to-slate-100 px-6 text-center">
        <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-red-800">
            Could not load debt data
          </h2>
          <p className="mt-2 text-sm text-red-700">{loadError}</p>
          <p className="mt-2 text-xs text-red-600">
            Data is loaded from Redis only. localStorage and default balances are
            not used when the server is unavailable.
          </p>
          <button
            type="button"
            onClick={() => void loadData()}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 to-slate-100">
      {saveError && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
          Save failed: {saveError}. Your last change may not be persisted —
          please try saving again.
        </div>
      )}

      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white shadow-md">
              $
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Debt Payoff Tracker
              </h1>
              <p className="text-sm text-slate-500">
                Strict avalanche · {formatCurrency(biweeklyPayment)} biweekly ·{" "}
                {formatCurrency(currentTotalBalance)} remaining
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
        <StatsOverview
          simulation={simulation}
          originalTotalBalance={originalTotalBalance}
          currentTotalBalance={currentTotalBalance}
        />

        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Payoff Order & Dates
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {simulation.debts.map((debt, index) => {
              const liveDebt = debts.find((d) => d.id === debt.debtId)!;
              return (
                <DebtCard
                  key={debt.debtId}
                  debt={debt}
                  index={index}
                  currentBalance={liveDebt.balance}
                  originalBalance={ORIGINAL_BALANCES[debt.debtId]}
                  onBalanceSave={handleBalanceSave}
                  onLogPayment={handleLogPayment}
                />
              );
            })}
          </div>
        </section>

        <PaymentHistory entries={paymentHistory} />

        <div className="grid gap-8 lg:grid-cols-2">
          <AvalancheStrategy
            debts={debts}
            biweeklyPayment={biweeklyPayment}
            onBiweeklyPaymentSave={(amount) => void handleBiweeklyPaymentSave(amount)}
          />
          <PayoffTimeline
            simulation={simulation}
            biweeklyPayment={biweeklyPayment}
            currentTotalBalance={currentTotalBalance}
          />
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
        <p>
          Projections use daily interest accrual with biweekly payments. Compares
          avalanche plan vs. paying minimums only.
        </p>
        <button
          type="button"
          onClick={() => void handleResetAll()}
          className="mt-3 text-xs text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline"
        >
          Reset all data to defaults
        </button>
      </footer>
    </div>
  );
}
