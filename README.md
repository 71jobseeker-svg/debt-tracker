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
- Persistent storage via **Upstash Redis** on Vercel (survives redeploys, works across browsers)

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without Vercel KV configured locally, the app falls back to **localStorage** in your browser.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. In your Vercel project, go to **Storage** → create an **Upstash Redis** database (or install from the [Vercel Marketplace](https://vercel.com/marketplace?category=storage&search=redis)).
4. Connect the Redis store to your project. Vercel will add `KV_REST_API_URL` and `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`).
5. Redeploy the project.

Payment data is stored in Redis under the key `debt-tracker:app-state`. It is only reset when you click **Reset all data to defaults** in the app footer.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `KV_REST_API_URL` or `UPSTASH_REDIS_REST_URL` | Production | Auto-set by Vercel Redis integration |
| `KV_REST_API_TOKEN` or `UPSTASH_REDIS_REST_TOKEN` | Production | Auto-set by Vercel Redis integration |
