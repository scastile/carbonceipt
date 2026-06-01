# Carbonceipt — Pitch Deck

**Beyond Tomorrow Summit 2026**
**Team:** PaperLab (scastile)

---

## Slide 1: Title

**Carbonceipt**
*Track the carbon footprint of every dollar you spend.*

🧾 Open-source · Real-time · Actionable

---

## Slide 2: The Problem

**Most people have no idea what their spending costs the planet.**

- The average American generates ~16 tonnes of CO₂/year
- Consumer spending drives 65% of global emissions
- Existing carbon trackers are paywalled (Joro: $60/yr, Commons: subscription)
- No free, open-source tool exists for per-transaction carbon tracking

**People can't change what they can't measure.**

---

## Slide 3: The Solution

**Carbonceipt converts every purchase into its CO₂ footprint.**

1. Enter a transaction (description + amount)
2. Auto-categorized using keyword matching across 17 categories
3. CO₂ calculated via Climatiq API + EPA/DEFRA emission factors
4. Dashboard shows: total impact, category breakdown, trends over time

**"What's the carbon footprint of my $6 coffee?" → 0.27 kg CO₂e**

---

## Slide 4: Demo

**[SCREEN RECORDING]**

- Empty state → Load demo data
- Dashboard populates: 12 transactions, $932.66 spent, 403.5 kg CO₂
- Category breakdown: Air Travel (88.4 kg) > Gas (120.1 kg) > Electricity (52.1 kg)
- 7-day trend chart
- Add new transaction live: "Starbucks coffee, $6.75" → 3.04 kg CO₂e
- Delete a transaction → dashboard updates in real-time

---

## Slide 5: Technical Architecture

```
┌──────────────────────────────────┐
│  Next.js Frontend (Vercel)       │  Inter font, Tailwind, glass UI
│  /api/proxy → backend            │  Animated gradient mesh
└──────────┬───────────────────────┘
           │ REST API
┌──────────▼───────────────────────┐
│  FastAPI Backend                 │  Python, SQLite, Pydantic
│  17 category keyword classifier  │  6 endpoints
└──────────┬───────────────────────┘
           │ emission factors
┌──────────▼───────────────────────┐
│  Climatiq API + EPA/DEFRA        │  kg CO₂e per USD by category
└──────────────────────────────────┘
```

- **Frontend:** Next.js 15, Tailwind, TypeScript, standalone Docker
- **Backend:** FastAPI, SQLite, 17-category keyword matching, Docker-ready
- **Data:** Climatiq API (fallback: 17 hardcoded EPA/DEFRA factors)
- **Deploy:** Docker Compose, 2 containers, ~100MB total

---

## Slide 6: Market & Competitive Landscape

| Tool | Price | Open Source | Per-Transaction | Auto-Import |
|------|-------|-------------|-----------------|-------------|
| Joro | $60/yr | ✗ | ✓ | ✓ |
| Commons | Subscription | ✗ | ✓ | ✓ |
| Ecology | Free | ✗ | ✗ (generic) | ✗ |
| **Carbonceipt** | **Free** | **✓** | **✓** | **Planned** |

**Gap:** No free, open-source, per-transaction carbon tracker exists.

**TAM:** 1.4M+ environmentally conscious consumers in the US alone spend $28B/year on carbon-conscious products (Nielsen 2024).

---

## Slide 7: Impact & Scalability

**Carbon receipt** directly enables:
- **Awareness:** Real-time feedback loop → behavior change
- **Aggregation:** Community-level carbon accounting
- **Policy:** Municipalities could track neighborhood-level consumption emissions
- **Offset:** Direct integration with carbon offset marketplaces

**Scalability path:**
- Phase 1: Manual entry (MVP ✓)
- Phase 2: Plaid bank integration (auto-import)
- Phase 3: Receipt OCR (snap a photo)
- Phase 4: Browser extension (auto-detect online purchases)
- Phase 5: API for ESG reporting tools

---

## Slide 8: Team & Contact

**PaperLab** — scastile@github.com
- Building open-source tools at the intersection of sustainability and technology
- Portfolio: BudgetWise (iOS), SIFT Sentinel (DFIR), Library Launchpad
- carbonceipt repo: github.com/scastile/carbonceipt

**Built with:** Next.js · FastAPI · Climatiq · Tailwind · Docker

*Licensed MIT · Open Source Forever*
