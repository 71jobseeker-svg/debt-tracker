"use client";

import { useEffect, useState } from "react";
import type { DebtPayoffResult } from "@/lib/types";
import {
  formatCurrency,
  formatDate,
  formatPercent,
} from "@/lib/format";

const PRIORITY_COLORS = [
  "border-l-red-500 bg-red-50",
  "border-l-orange-500 bg-orange-50",
  "border-l-amber-500 bg-amber-50",
  "border-l-emerald-500 bg-emerald-50",
];

interface DebtCardProps {
  debt: DebtPayoffResult;
  index: number;
  currentBalance: number;
  originalBalance: number;
  onBalanceSave: (debtId: string, balance: number) => void | Promise<void>;
  onLogPayment: (debtId: string, amount: number) => void | Promise<void>;
}

export function DebtCard({
  debt,
  index,
  currentBalance,
  originalBalance,
  onBalanceSave,
  onLogPayment,
}: DebtCardProps) {
  const [balanceDraft, setBalanceDraft] = useState(String(currentBalance));
  const [paymentDraft, setPaymentDraft] = useState("");
  const colorClass = PRIORITY_COLORS[index] ?? "border-l-slate-500 bg-slate-50";
  const isPaidOff = currentBalance <= 0;
  const progressPercent =
    originalBalance > 0
      ? Math.min(100, ((originalBalance - currentBalance) / originalBalance) * 100)
      : 100;

  useEffect(() => {
    setBalanceDraft(String(currentBalance));
  }, [currentBalance]);

  const handleBalanceSave = () => {
    const next = parseFloat(balanceDraft);
    if (isNaN(next) || next < 0) return;
    void onBalanceSave(debt.debtId, next);
  };

  const handleLogPayment = () => {
    const amount = parseFloat(paymentDraft);
    if (isNaN(amount) || amount <= 0) return;
    void onLogPayment(debt.debtId, amount);
    setPaymentDraft("");
  };

  const inputClassName =
    "w-full rounded-lg border border-slate-300 bg-white py-2 pl-7 pr-3 text-sm font-medium text-slate-900 shadow-sm outline-none ring-indigo-500 focus:border-indigo-500 focus:ring-2";

  const buttonClassName =
    "shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2";

  return (
    <div
      className={`rounded-xl border border-slate-200 border-l-4 p-5 shadow-sm ${colorClass}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-700 shadow-sm">
              {debt.priority}
            </span>
            <h3 className="font-semibold text-slate-900">{debt.name}</h3>
            {isPaidOff && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                Paid off
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {formatPercent(debt.interestRate)} APR · Started at{" "}
            {formatCurrency(originalBalance)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {isPaidOff ? "Status" : "Payoff Date"}
          </p>
          <p className="text-lg font-bold text-slate-900">
            {isPaidOff ? "Complete" : formatDate(debt.payoffDate)}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-medium text-slate-700">Current balance</span>
          <span className="text-lg font-bold text-slate-900">
            {formatCurrency(currentBalance)}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/80">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {progressPercent.toFixed(0)}% paid down
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-white/80 px-3 py-2">
          <p className="text-xs text-slate-500">Proj. Interest</p>
          <p className="font-semibold text-slate-800">
            {formatCurrency(debt.totalInterestPaid)}
          </p>
        </div>
        <div className="rounded-lg bg-white/80 px-3 py-2">
          <p className="text-xs text-slate-500">Proj. Total Paid</p>
          <p className="font-semibold text-slate-800">
            {formatCurrency(debt.totalPaid)}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-4 border-t border-slate-200/80 pt-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Edit Current Balance
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Hard override to match your statement — not recorded in payment
            history
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                $
              </span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={balanceDraft}
                onChange={(e) => setBalanceDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleBalanceSave();
                }}
                className={inputClassName}
              />
            </div>
            <button
              type="button"
              onClick={handleBalanceSave}
              className={buttonClassName}
            >
              Save
            </button>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Log Payment
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Records a payment in history and subtracts from balance (min $0)
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                $
              </span>
              <input
                type="number"
                min={0.01}
                step={0.01}
                placeholder="0.00"
                value={paymentDraft}
                onChange={(e) => setPaymentDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLogPayment();
                }}
                className={inputClassName}
              />
            </div>
            <button
              type="button"
              onClick={handleLogPayment}
              className={buttonClassName}
            >
              Log
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
