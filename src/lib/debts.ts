import type { Debt, PayoffConfig } from "./types";

export const INITIAL_DEBTS: Debt[] = [
  {
    id: "chase-prime",
    name: "Chase Prime Visa",
    balance: 1500,
    interestRate: 26,
    minimumPayment: 60,
  },
  {
    id: "nfcu",
    name: "NFCU",
    balance: 3025,
    interestRate: 18,
    minimumPayment: 75,
  },
  {
    id: "upgrade",
    name: "Upgrade Personal Loan",
    balance: 3200,
    interestRate: 17,
    minimumPayment: 236,
  },
  {
    id: "citi-diamond",
    name: "Citi Diamond Preferred",
    balance: 7500,
    interestRate: 0,
    minimumPayment: 150,
    notes: "0% promo until January 2028",
  },
];

export const DEFAULT_BIWEEKLY_PAYMENT = 600;

export const PAYOFF_CONFIG: PayoffConfig = {
  biweeklyPayment: DEFAULT_BIWEEKLY_PAYMENT,
  startDate: new Date(2026, 6, 3), // July 3, 2026
};

export function getAvalancheOrder(debts: Debt[]): Debt[] {
  return [...debts].sort((a, b) => b.interestRate - a.interestRate);
}
