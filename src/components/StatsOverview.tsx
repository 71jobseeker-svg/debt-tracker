import type { PayoffSimulation } from "@/lib/types";
import {
  formatCurrency,
  formatDate,
  formatMonths,
} from "@/lib/format";

interface StatsOverviewProps {
  simulation: PayoffSimulation;
  originalTotalBalance: number;
  currentTotalBalance: number;
}

export function StatsOverview({
  simulation,
  originalTotalBalance,
  currentTotalBalance,
}: StatsOverviewProps) {
  const progressPercent =
    originalTotalBalance > 0
      ? Math.min(
          100,
          ((originalTotalBalance - currentTotalBalance) / originalTotalBalance) *
            100
        )
      : 100;
  const amountPaidDown = originalTotalBalance - currentTotalBalance;

  const stats = [
    {
      label: "Debt Remaining",
      value: formatCurrency(currentTotalBalance),
      sub: `${formatCurrency(amountPaidDown)} paid down (${progressPercent.toFixed(0)}%)`,
      highlight: false,
    },
    {
      label: "Debt-Free Date",
      value: formatDate(simulation.debtFreeDate),
      sub: formatMonths(simulation.monthsToFreedom),
      highlight: false,
    },
    {
      label: "Interest Saved",
      value: formatCurrency(simulation.interestSaved),
      sub: "vs. minimum payments only",
      highlight: true,
    },
    {
      label: "Total Interest",
      value: formatCurrency(simulation.totalInterestPaid),
      sub: `${simulation.totalPayments} biweekly payments`,
      highlight: false,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-medium text-slate-600">Overall payoff progress</span>
          <span className="font-semibold text-indigo-600">
            {progressPercent.toFixed(0)}%
          </span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {formatCurrency(currentTotalBalance)} of{" "}
          {formatCurrency(originalTotalBalance)} remaining
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl border p-5 shadow-sm ${
              stat.highlight
                ? "border-emerald-200 bg-emerald-50"
                : "border-slate-200 bg-white"
            }`}
          >
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p
              className={`mt-1 text-2xl font-bold ${
                stat.highlight ? "text-emerald-700" : "text-slate-900"
              }`}
            >
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-slate-500">{stat.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
