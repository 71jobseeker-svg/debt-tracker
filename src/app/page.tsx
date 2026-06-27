import { AvalancheStrategy } from "@/components/AvalancheStrategy";
import { DebtCard } from "@/components/DebtCard";
import { PayoffTimeline } from "@/components/PayoffTimeline";
import { StatsOverview } from "@/components/StatsOverview";
import { calculateAvalanchePayoff } from "@/lib/avalanche";
import { INITIAL_DEBTS, PAYOFF_CONFIG } from "@/lib/debts";

export default function Home() {
  const simulation = calculateAvalanchePayoff(INITIAL_DEBTS, PAYOFF_CONFIG);
  const totalStartingBalance = INITIAL_DEBTS.reduce(
    (sum, d) => sum + d.balance,
    0
  );

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
                Strict avalanche · $600 biweekly · 4 accounts
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
        <StatsOverview
          simulation={simulation}
          totalStartingBalance={totalStartingBalance}
        />

        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Payoff Order & Dates
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {simulation.debts.map((debt, index) => (
              <DebtCard key={debt.debtId} debt={debt} index={index} />
            ))}
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-2">
          <AvalancheStrategy />
          <PayoffTimeline simulation={simulation} />
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
        Projections use daily interest accrual with biweekly payments. Compares
        avalanche plan vs. paying minimums only.
      </footer>
    </div>
  );
}
