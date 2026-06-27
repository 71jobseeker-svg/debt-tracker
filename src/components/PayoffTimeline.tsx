import type { PayoffSimulation } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { INITIAL_DEBTS, PAYOFF_CONFIG } from "@/lib/debts";

interface PayoffTimelineProps {
  simulation: PayoffSimulation;
}

export function PayoffTimeline({ simulation }: PayoffTimelineProps) {
  const payoffEvents = simulation.timeline.filter((e) => e.type === "payoff");
  const totalMin = INITIAL_DEBTS.reduce((s, d) => s + d.minimumPayment, 0);
  const extraPerPeriod = PAYOFF_CONFIG.biweeklyPayment - totalMin;

  const milestones = [
    {
      date: PAYOFF_CONFIG.startDate,
      title: "Plan starts",
      description: `$${PAYOFF_CONFIG.biweeklyPayment} every other Friday · $${extraPerPeriod} extra to highest-rate debt after minimums`,
      isStart: true,
    },
    ...payoffEvents.map((event) => ({
      date: event.date,
      title: event.debtName,
      description: event.description,
      isStart: false,
    })),
    {
      date: simulation.debtFreeDate,
      title: "Debt free!",
      description: `All ${formatCurrency(INITIAL_DEBTS.reduce((s, d) => s + d.balance, 0))} paid off · ${formatCurrency(simulation.interestSaved)} interest saved vs. minimums`,
      isStart: false,
      isEnd: true,
    },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Payoff Timeline</h2>
      <p className="mt-1 text-sm text-slate-500">
        Avalanche order: highest interest rate first, rolling freed payments
        down the list
      </p>

      <div className="relative mt-8">
        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-200" />

        <ol className="space-y-6">
          {milestones.map((milestone, i) => (
            <li key={i} className="relative flex gap-4 pl-8">
              <span
                className={`absolute left-0 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                  "isEnd" in milestone && milestone.isEnd
                    ? "border-emerald-500 bg-emerald-500"
                    : milestone.isStart
                      ? "border-indigo-500 bg-indigo-500"
                      : "border-white bg-indigo-500"
                }`}
              >
                {!("isEnd" in milestone && milestone.isEnd) && !milestone.isStart && (
                  <span className="h-2 w-2 rounded-full bg-white" />
                )}
                {milestone.isStart && (
                  <span className="text-[10px] font-bold text-white">▶</span>
                )}
                {"isEnd" in milestone && milestone.isEnd && (
                  <span className="text-[10px] font-bold text-white">✓</span>
                )}
              </span>

              <div className="min-w-0 flex-1 pb-1">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <p className="font-semibold text-slate-900">{milestone.title}</p>
                  <time className="text-sm text-slate-500">
                    {formatDate(milestone.date)}
                  </time>
                </div>
                <p className="mt-0.5 text-sm text-slate-600">
                  {milestone.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
