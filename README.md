# Debt Payoff Tracker

A Next.js app that projects debt payoff using the **strict avalanche method** — highest interest rate first, with rolled payments as each debt is eliminated.

## Pre-loaded debts

| Account | Balance | APR | Minimum |
|---------|---------|-----|---------|
| Chase Prime Visa | $1,500 | 26% | $60 |
| NFCU | $3,025 | 18% | $75 |
| Upgrade Personal Loan | $3,200 | 17% | $236 |
| Citi Diamond Preferred | $7,500 | 0% | $150 |

**Payment plan:** $600 every other Friday starting July 3, 2026.

## Features

- Avalanche payoff order (26% → 18% → 17% → 0%)
- Estimated payoff date per debt
- Total interest vs. minimum-payments-only baseline
- Visual payoff timeline

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push this repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Vercel auto-detects Next.js — click **Deploy**.

Or use the CLI:

```bash
npm i -g vercel
vercel
```

No environment variables required.
