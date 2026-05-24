# MoneyWise

A smart budgeting app for Malaysian students. Log daily spending, scan receipts with OCR, and get AI-powered financial coaching from Claude.

## Tech Stack

- **Frontend** — React 18 (CDN), JSX transpiled in-browser via Babel Standalone, plain CSS
- **Backend** — Node.js + Express
- **Database** — Supabase (PostgreSQL with RLS)
- **AI** — Anthropic Claude (spending behaviour analysis + rescue tips)


## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd moneywise-hackathon
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in `.env`:

| Variable | Where to get it |
|---|---|
| `SUPABASE_URL` | Supabase project → Settings → API |
| `SUPABASE_ANON_KEY` | Supabase project → Settings → API |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |



### 3. Run

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000)

## Features

- **Budget setup** — income, saving goal, date range, category weights
- **Daily log** — expense/earn entries with category, note, and date
- **Receipt scanner** — photo → OCR → auto-fill amount and category
- **Budget dashboard** — donut chart, per-category spend tracking with overspend absorption
- **Calendar view** — spending heatmap with risky day detection
- **Rescue plan** — Claude reads your logs, identifies spending behaviour patterns, and gives 3 personalised tips

## Project Structure

```
├── server.js          # Express server + API routes
├── index.html         # Entry point
├── app.jsx            # Root app state, Supabase sync
├── auth-screen.jsx    # Login / signup
├── screens.jsx        # All page screens
├── components.jsx     # Shared UI components
├── icons.jsx          # SVG icons + category metadata
├── styles.css         # All styles
└── .env.example       # Environment variable template
```
