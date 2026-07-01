"use client";

import { useLayoutEffect, useMemo, useState } from "react";
import { AvalancheStrategy } from "@/components/AvalancheStrategy";
import { DebtCard } from "@/components/DebtCard";
import { PaymentHistory } from "@/components/PaymentHistory";
import { PayoffTimeline } from "@/components/PayoffTimeline";
import { StatsOverview } from "@/components/StatsOverview";
import { calculateAvalanchePayoff } from "@/lib/avalanche";
import {
  DEFAULT_BIWEEKLY_PAYMENT,
  INITIAL_DEBTS,
  PAYOFF_CONFIG,
} from "@/lib/debts";
import type { Debt, PaymentLogEntry } from "@/lib/types";
import { applyLoggedPayment } from "@/lib/logPayment";
import { migrateTruncatedChasePayment } from "@/lib/migrateTruncatedChasePayment";
import { formatCurrency } from "@/lib/format";

const ORIGINAL_BALANCES = Object.fromEntries(
  INITIAL_DEBTS.map((d) => [d.id, d.balance])
);

export function DebtPayoffDashboard() {
  const [debts, setDebts] = useState<Debt[]>(() =>
    INITIAL_DEBTS.map((d) => ({ ...d }))
  );
  const [paymentHistory, setPaymentHistory] = useState<PaymentLogEntry[]>([]);
  const [biweeklyPayment, setBiweeklyPayment] = useState(
    DEFAULT_BIWEEKLY_PAYMENT
  );

  useLayoutEffect(() => {
    const migrated = migrateTruncatedChasePayment(debts, paymentHistory);
    if (!migrated.changed) return;
    setDebts(migrated.debts);
    setPaymentHistory(migrated.history);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time fix for truncated Chase entry on mount
  }, []);

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

  const handleBalanceSave = (debtId: string, balance: number) => {
    if (isNaN(balance) || balance < 0) return;
    setDebts((prev) =>
      prev.map((d) => (d.id === debtId ? { ...d, balance } : d))
    );
  };

  const handleLogPayment = (debtId: string, amount: number) => {
    const result = applyLoggedPayment(debts, debtId, amount);
    if (!result) return;

    setDebts(result.debts);
    setPaymentHistory((prev) => [...prev, result.entries[0]]);
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 to-slate-100">
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
            onBiweeklyPaymentSave={setBiweeklyPayment}
          />
          <PayoffTimeline
            simulation={simulation}
            biweeklyPayment={biweeklyPayment}
            currentTotalBalance={currentTotalBalance}
          />
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
        Projections use daily interest accrual with biweekly payments. Compares
        avalanche plan vs. paying minimums only.
      </footer>
    </div>
  );
}
