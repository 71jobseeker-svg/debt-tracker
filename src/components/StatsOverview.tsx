import type { PayoffSimulation } from "@/lib/types";
import {
  formatCurrency,
  formatDate,
  formatMonths,
} from "@/lib/format";

interface StatsOverviewProps {
  simulation: PayoffSimulation;
  totalStartingBalance: number;
}

export function StatsOverview({
  simulation,
  totalStartingBalance,
}: StatsOverviewProps) {
  const stats = [
    {
      label: "Total Debt",
      value: formatCurrency(totalStartingBalance),
      sub: "Starting balance",
    },
    {
      label: "Debt-Free Date",
      value: formatDate(simulation.debtFreeDate),
      sub: formatMonths(simulation.monthsToFreedom),
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
    },
  ];

  return (
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
  );
}
