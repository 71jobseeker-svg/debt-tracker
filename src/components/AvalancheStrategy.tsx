import { INITIAL_DEBTS, PAYOFF_CONFIG, getAvalancheOrder } from "@/lib/debts";
import {
  formatCurrency,
  formatDate,
  formatPercent,
} from "@/lib/format";

export function AvalancheStrategy() {
  const ordered = getAvalancheOrder(INITIAL_DEBTS);
  const totalMin = INITIAL_DEBTS.reduce((s, d) => s + d.minimumPayment, 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">
        Avalanche Strategy
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Every other Friday starting {formatDate(PAYOFF_CONFIG.startDate)}
      </p>

      <div className="mt-4 flex flex-wrap gap-4 rounded-lg bg-slate-50 p-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Biweekly Payment
          </p>
          <p className="text-xl font-bold text-slate-900">
            {formatCurrency(PAYOFF_CONFIG.biweeklyPayment)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Total Minimums
          </p>
          <p className="text-xl font-bold text-slate-900">
            {formatCurrency(totalMin)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Extra to Target
          </p>
          <p className="text-xl font-bold text-indigo-600">
            {formatCurrency(PAYOFF_CONFIG.biweeklyPayment - totalMin)}
          </p>
        </div>
      </div>

      <ol className="mt-6 space-y-3">
        {ordered.map((debt, i) => (
          <li
            key={debt.id}
            className="flex items-center gap-3 rounded-lg border border-slate-100 px-4 py-3"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-900">{debt.name}</p>
              <p className="text-sm text-slate-500">
                {formatPercent(debt.interestRate)} · {formatCurrency(debt.balance)}{" "}
                · {formatCurrency(debt.minimumPayment)}/period min
              </p>
            </div>
            {i === 0 && (
              <span className="shrink-0 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                Target
              </span>
            )}
            {debt.notes && (
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                {debt.notes}
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
