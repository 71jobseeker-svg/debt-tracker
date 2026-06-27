export interface Debt {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  minimumPayment: number;
  notes?: string;
}

export interface PayoffConfig {
  biweeklyPayment: number;
  startDate: Date;
}

export interface DebtPayoffResult {
  debtId: string;
  name: string;
  interestRate: number;
  startingBalance: number;
  payoffDate: Date;
  totalInterestPaid: number;
  totalPaid: number;
  priority: number;
}

export interface TimelineEvent {
  date: Date;
  type: "payment" | "payoff";
  debtId: string;
  debtName: string;
  amount?: number;
  remainingBalance?: number;
  description: string;
}

export interface PayoffSimulation {
  debts: DebtPayoffResult[];
  timeline: TimelineEvent[];
  totalInterestPaid: number;
  totalInterestMinimumOnly: number;
  interestSaved: number;
  debtFreeDate: Date;
  totalPayments: number;
  monthsToFreedom: number;
}
