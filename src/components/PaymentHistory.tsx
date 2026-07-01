import type { PaymentLogEntry } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";

interface PaymentHistoryProps {
  entries: PaymentLogEntry[];
}

export function PaymentHistory({ entries }: PaymentHistoryProps) {
  const sorted = [...entries].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Payment History</h2>
      <p className="mt-1 text-sm text-slate-500">
        Actual payments logged outside the biweekly schedule
      </p>

      {sorted.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">
          No payments logged yet. Use &ldquo;Log Payment&rdquo; on any debt card
          above.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-slate-100">
          {sorted.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center justify-between gap-4 py-3 first:pt-0"
            >
              <div>
                <p className="font-medium text-slate-900">{entry.debtName}</p>
                <time className="text-sm text-slate-500">
                  {formatDate(entry.date)}
                </time>
                {entry.note && (
                  <p className="mt-0.5 text-xs text-slate-500">{entry.note}</p>
                )}
              </div>
              <p className="text-lg font-semibold text-emerald-700">
                −{formatCurrency(entry.amount)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
