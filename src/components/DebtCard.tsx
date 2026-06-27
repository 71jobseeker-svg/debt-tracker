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
}

export function DebtCard({ debt, index }: DebtCardProps) {
  const colorClass = PRIORITY_COLORS[index] ?? "border-l-slate-500 bg-slate-50";

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
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {formatPercent(debt.interestRate)} APR · Started at{" "}
            {formatCurrency(debt.startingBalance)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Payoff Date
          </p>
          <p className="text-lg font-bold text-slate-900">
            {formatDate(debt.payoffDate)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-white/80 px-3 py-2">
          <p className="text-xs text-slate-500">Interest Paid</p>
          <p className="font-semibold text-slate-800">
            {formatCurrency(debt.totalInterestPaid)}
          </p>
        </div>
        <div className="rounded-lg bg-white/80 px-3 py-2">
          <p className="text-xs text-slate-500">Total Paid</p>
          <p className="font-semibold text-slate-800">
            {formatCurrency(debt.totalPaid)}
          </p>
        </div>
      </div>
    </div>
  );
}
