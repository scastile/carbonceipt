# 🧾 Carbonceipt

**Track the carbon footprint of every dollar you spend.**

Carbonceipt is an open-source web app that converts your spending into real-time CO₂ emissions. Enter any purchase, and it tells you the environmental impact — categorized, visualized, and tracked over time.

Built for the [Beyond Tomorrow Summit 2026](https://beyond-tomorrow-summit-30094.devpost.com/) Hackathon.

## How It Works

1. **Add a transaction** — describe what you bought and how much you spent
2. **Auto-categorization** — keywords match your purchase to 17 categories (groceries, gas, dining, etc.)
3. **CO₂ calculation** — emission factors from [Climatiq](https://climatiq.io/) and EPA data convert dollars to kg CO₂e
4. **Visualize** — dashboard with per-category breakdowns, 7-day trends, and impact summaries

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15, Tailwind CSS, TypeScript, Inter font |
| Backend | FastAPI, Python 3.12, SQLite, Pydantic |
| Carbon Data | Climatiq API + EPA/DEFRA fallback factors |
| Design | Dark theme, animated gradient mesh, glass-morphism |

## Quick Start

### Backend
```bash
cd backend
uv venv && source .venv/bin/activate
uv pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

The frontend proxies API requests to the backend via `/api/proxy/*` routes — no CORS config needed.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/transactions` | Create a transaction (`{description, amount}`) |
| `GET` | `/transactions` | List recent transactions |
| `DELETE` | `/transactions/:id` | Delete a transaction |
| `GET` | `/dashboard` | Aggregated stats (total CO₂, spending, top category) |
| `GET` | `/categories` | CO₂ breakdown by category |
| `GET` | `/trends?days=7` | Daily CO₂ trend data |

## Emission Factors

Fallback emission factors (kg CO₂e per USD) are sourced from EPA and DEFRA:

| Category | Factor |
|----------|--------|
| Gas / Fuel | 2.31 |
| Electricity | 0.42 |
| Dining Out | 0.45 |
| Groceries | 0.35 |
| Rideshare | 0.31 |
| Air Travel | 0.26 |
| ... | See `main.py` `FALLBACK_EMISSION_FACTORS` |

## Future Scope

- [ ] Plaid bank integration (auto-import transactions)
- [ ] AI-powered merchant categorization
- [ ] Social features (leaderboards, challenges)
- [ ] Carbon offset marketplace
- [ ] Receipt OCR (snap → extract → track)
- [ ] Browser extension for auto-tracking online purchases

## License

MIT · Built by [PaperLab](https://paperlab.xyz)
