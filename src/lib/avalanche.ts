import type {
  Debt,
  DebtPayoffResult,
  PayoffConfig,
  PayoffSimulation,
  TimelineEvent,
} from "./types";
import { getAvalancheOrder } from "./debts";

const DAYS_PER_PERIOD = 14;
const MAX_PERIODS = 520; // ~20 years safety cap

interface SimDebt {
  id: string;
  name: string;
  interestRate: number;
  balance: number;
  minimumPayment: number;
  startingBalance: number;
  totalInterestPaid: number;
  totalPaid: number;
  paidOff: boolean;
  payoffDate: Date | null;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function accrueInterest(balance: number, apr: number, days: number): number {
  if (balance <= 0 || apr <= 0) return 0;
  const dailyRate = apr / 100 / 365;
  return balance * dailyRate * days;
}

function initSimDebts(debts: Debt[]): SimDebt[] {
  return debts.map((d) => ({
    id: d.id,
    name: d.name,
    interestRate: d.interestRate,
    balance: d.balance,
    minimumPayment: d.minimumPayment,
    startingBalance: d.balance,
    totalInterestPaid: 0,
    totalPaid: 0,
    paidOff: false,
    payoffDate: null,
  }));
}

function applyPayment(
  debt: SimDebt,
  amount: number,
  date: Date,
  timeline: TimelineEvent[]
): number {
  if (debt.paidOff || amount <= 0) return 0;

  const payment = Math.min(amount, debt.balance);
  debt.balance -= payment;
  debt.totalPaid += payment;

  if (debt.balance <= 0.005) {
    debt.balance = 0;
    debt.paidOff = true;
    debt.payoffDate = date;
    timeline.push({
      date: new Date(date),
      type: "payoff",
      debtId: debt.id,
      debtName: debt.name,
      description: `${debt.name} paid off!`,
    });
  }

  return payment;
}

function simulatePeriod(
  simDebts: SimDebt[],
  priorityOrder: string[],
  budget: number,
  date: Date,
  timeline: TimelineEvent[]
): void {
  for (const debt of simDebts) {
    if (!debt.paidOff) {
      const interest = accrueInterest(debt.balance, debt.interestRate, DAYS_PER_PERIOD);
      debt.balance += interest;
      debt.totalInterestPaid += interest;
    }
  }

  let remaining = budget;

  for (const debt of simDebts) {
    if (debt.paidOff || remaining <= 0) continue;
    const minPay = Math.min(debt.minimumPayment, debt.balance);
    remaining -= applyPayment(debt, minPay, date, timeline);
  }

  for (const debtId of priorityOrder) {
    if (remaining <= 0.005) break;
    const debt = simDebts.find((d) => d.id === debtId);
    if (!debt || debt.paidOff) continue;
    remaining -= applyPayment(debt, remaining, date, timeline);
  }
}

function runSimulation(
  debts: Debt[],
  config: PayoffConfig,
  useAvalanche: boolean
): { simDebts: SimDebt[]; timeline: TimelineEvent[]; debtFreeDate: Date } {
  const priorityOrder = getAvalancheOrder(debts).map((d) => d.id);
  const simDebts = initSimDebts(debts);
  const timeline: TimelineEvent[] = [];
  let currentDate = new Date(config.startDate);
  let periods = 0;

  while (simDebts.some((d) => !d.paidOff) && periods < MAX_PERIODS) {
    const budget = useAvalanche
      ? config.biweeklyPayment
      : simDebts
          .filter((d) => !d.paidOff)
          .reduce((sum, d) => sum + d.minimumPayment, 0);

    if (useAvalanche) {
      simulatePeriod(simDebts, priorityOrder, budget, currentDate, timeline);
    } else {
      for (const debt of simDebts) {
        if (debt.paidOff) continue;
        const interest = accrueInterest(debt.balance, debt.interestRate, DAYS_PER_PERIOD);
        debt.balance += interest;
        debt.totalInterestPaid += interest;
        const minPay = Math.min(debt.minimumPayment, debt.balance);
        applyPayment(debt, minPay, currentDate, timeline);
      }
    }

    currentDate = addDays(currentDate, DAYS_PER_PERIOD);
    periods++;
  }

  return { simDebts, timeline, debtFreeDate: addDays(currentDate, -DAYS_PER_PERIOD) };
}

export function calculateAvalanchePayoff(
  debts: Debt[],
  config: PayoffConfig
): PayoffSimulation {
  const priorityOrder = getAvalancheOrder(debts);
  const avalanche = runSimulation(debts, config, true);
  const minimumOnly = runSimulation(debts, config, false);

  const totalInterestPaid = avalanche.simDebts.reduce(
    (sum, d) => sum + d.totalInterestPaid,
    0
  );
  const totalInterestMinimumOnly = minimumOnly.simDebts.reduce(
    (sum, d) => sum + d.totalInterestPaid,
    0
  );

  const debtResults: DebtPayoffResult[] = priorityOrder.map((debt, index) => {
    const result = avalanche.simDebts.find((d) => d.id === debt.id)!;
    return {
      debtId: debt.id,
      name: debt.name,
      interestRate: debt.interestRate,
      startingBalance: debt.balance,
      payoffDate: result.payoffDate!,
      totalInterestPaid: result.totalInterestPaid,
      totalPaid: result.totalPaid,
      priority: index + 1,
    };
  });

  const sortedTimeline = avalanche.timeline.sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  const msToFreedom =
    avalanche.debtFreeDate.getTime() - config.startDate.getTime();
  const monthsToFreedom = msToFreedom / (1000 * 60 * 60 * 24 * 30.44);

  return {
    debts: debtResults,
    timeline: sortedTimeline,
    totalInterestPaid,
    totalInterestMinimumOnly,
    interestSaved: totalInterestMinimumOnly - totalInterestPaid,
    debtFreeDate: avalanche.debtFreeDate,
    totalPayments: Math.ceil(
      (avalanche.debtFreeDate.getTime() - config.startDate.getTime()) /
        (DAYS_PER_PERIOD * 24 * 60 * 60 * 1000)
    ),
    monthsToFreedom,
  };
}
