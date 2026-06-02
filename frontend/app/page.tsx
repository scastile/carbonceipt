"use client";

import { useState, useEffect, useCallback } from "react";

const API = "/api/proxy";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  co2_kg: number;
  created_at: string;
}

interface DashboardData {
  total_co2_kg: number;
  total_transactions: number;
  top_category: string | null;
  total_spent: number;
  avg_co2_per_txn: number;
}

interface CategoryData {
  category: string;
  count: number;
  total_co2: number;
  total_spent: number;
}

interface TrendData {
  day: string;
  co2_kg: number;
  transactions: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CAT: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  food_groceries:       { label: "Groceries",       color: "#6366f1", bg: "#eef2ff", icon: "🛒" },
  restaurants:          { label: "Dining Out",       color: "#8b5cf6", bg: "#f5f3ff", icon: "🍽️" },
  transportation_fuel:  { label: "Gas / Fuel",       color: "#ef4444", bg: "#fef2f2", icon: "⛽" },
  transportation_rideshare: { label: "Rideshare",   color: "#f97316", bg: "#fff7ed", icon: "🚗" },
  transportation_airfare:   { label: "Air Travel",  color: "#06b6d4", bg: "#ecfeff", icon: "✈️" },
  utilities_electricity:{ label: "Electricity",     color: "#eab308", bg: "#fefce8", icon: "⚡" },
  utilities_gas:        { label: "Gas / Heating",    color: "#f59e0b", bg: "#fffbeb", icon: "🔥" },
  clothing_apparel:     { label: "Clothing",         color: "#ec4899", bg: "#fdf2f8", icon: "👕" },
  electronics:          { label: "Electronics",      color: "#14b8a6", bg: "#f0fdfa", icon: "💻" },
  entertainment:        { label: "Entertainment",    color: "#a855f7", bg: "#faf5ff", icon: "🎬" },
  healthcare:           { label: "Healthcare",       color: "#22c55e", bg: "#f0fdf4", icon: "🏥" },
  education:            { label: "Education",        color: "#3b82f6", bg: "#eff6ff", icon: "📚" },
  personal_care:        { label: "Personal Care",    color: "#f43f5e", bg: "#fff1f2", icon: "💇" },
  home_furnishings:     { label: "Home & Garden",    color: "#84cc16", bg: "#f7fee7", icon: "🏠" },
  subscriptions_digital:{ label: "Subscriptions",    color: "#64748b", bg: "#f8fafc", icon: "💳" },
  gifts_donations:      { label: "Gifts & Donations", color: "#d946ef", bg: "#fdf4ff", icon: "🎁" },
  other:                { label: "Other",            color: "#94a3b8", bg: "#f8fafc", icon: "📦" },
};

function catMeta(cat: string) {
  return CAT[cat] || CAT.other;
}

function formatCO2(kg: number): string {
  if (kg < 0.001) return "< 0.001 kg";
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)} t`;
  return `${kg.toFixed(2)} kg`;
}

function formatUSD(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════════════════════════════

function StatCard({
  icon, label, value, sub, accent,
}: {
  icon: string; label: string; value: string; sub?: string; accent: string;
}) {
  return (
    <div
      className="stat-card flex-1 min-w-[170px]"
      style={{ "--stat-accent": accent } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{icon}</span>
        <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">{label}</span>
      </div>
      <p className="text-[26px] font-extrabold tracking-tight tabular-nums" style={{ color: accent }}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-1 font-medium">{sub}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY CHART
// ═══════════════════════════════════════════════════════════════════════════════

function CategoryChart({ data }: { data: CategoryData[] }) {
  const maxCO2 = Math.max(...data.map(d => d.total_co2), 0.001);
  if (data.length === 0) return <p className="text-gray-400 text-sm italic">Add transactions to see your breakdown.</p>;

  return (
    <div className="space-y-4">
      {data.map(d => {
        const meta = catMeta(d.category);
        const pct = (d.total_co2 / maxCO2) * 100;
        return (
          <div key={d.category}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
                  style={{ background: meta.bg }}
                >
                  {meta.icon}
                </span>
                <span className="text-sm text-gray-700 font-medium">{meta.label}</span>
                <span className="text-xs text-gray-400 font-medium">({d.count})</span>
              </div>
              <span className="text-sm font-bold tabular-nums" style={{ color: meta.color }}>
                {formatCO2(d.total_co2)}
              </span>
            </div>
            <div className="category-bar-bg">
              <div
                className="category-bar-fill"
                style={{ width: `${pct}%`, background: meta.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TREND CHART
// ═══════════════════════════════════════════════════════════════════════════════

function TrendChart({ data }: { data: TrendData[] }) {
  if (data.length === 0) return <p className="text-gray-400 text-sm italic">No trend data yet.</p>;

  const maxCO2 = Math.max(...data.map(d => d.co2_kg), 0.001);
  const W = 280;
  const H = 80;
  const pad = 4;
  const spacing = (W - pad * 2) / Math.max(data.length - 1, 1);

  const pts = data.map((d, i) => ({
    x: pad + i * spacing,
    y: H - pad - (d.co2_kg / maxCO2) * (H - pad * 2),
  }));

  const linePts = pts.map(p => `${p.x},${p.y}`).join(" ");
  const areaPts = `${pts[0].x},${H} ${linePts} ${pts[pts.length - 1].x},${H}`;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 80 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polygon fill="url(#trendFill)" points={areaPts} />
        <polyline
          fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          points={linePts}
        />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#6366f1" stroke="#fff" strokeWidth="1.5" />
        ))}
      </svg>
      <div className="flex justify-between mt-2 px-1">
        {data.map(d => (
          <span key={d.day} className="text-[10px] text-gray-400 font-medium">{d.day.slice(5)}</span>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSACTION FORM
// ═══════════════════════════════════════════════════════════════════════════════

function TransactionForm({ onAdd }: { onAdd: (t: Transaction) => void }) {
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Transaction | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim() || !amount) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: desc, amount: parseFloat(amount) }),
      });
      if (!res.ok) throw new Error("Failed");
      const data: Transaction = await res.json();
      onAdd(data);
      setResult(data);
      setDesc("");
      setAmount("");
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
        <input
          type="text" placeholder="What did you buy?" value={desc}
          onChange={e => setDesc(e.target.value)}
          className="input-clean flex-1" required
        />
        <div className="relative w-full sm:w-32">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
          <input
            type="number" step="0.01" min="0.01" placeholder="0.00" value={amount}
            onChange={e => setAmount(e.target.value)}
            className="input-clean w-full pl-8" required
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary whitespace-nowrap">
          {loading ? <span className="inline-block animate-spin">⟳</span> : "Track It"}
        </button>
      </form>

      {result && (
        <div className="mt-3 rounded-xl p-4 flex items-center gap-4 animate-fade-in"
          style={{ background: catMeta(result.category).bg, border: `1px solid ${catMeta(result.category).color}20` }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ background: `${catMeta(result.category).color}15` }}>
            {catMeta(result.category).icon}
          </div>
          <div className="min-w-0">
            <p className="text-sm text-gray-500 truncate font-medium">
              {result.description} <span className="text-gray-400">· {formatUSD(result.amount)}</span>
            </p>
            <p className="text-xl font-extrabold mt-0.5" style={{ color: catMeta(result.category).color }}>
              {formatCO2(result.co2_kg)} CO₂e
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [tx, da, ca, tr] = await Promise.all([
        fetch(`${API}/transactions`), fetch(`${API}/dashboard`),
        fetch(`${API}/categories`), fetch(`${API}/trends?days=7`),
      ]);
      setTransactions(await tx.json());
      setDashboard(await da.json());
      setCategories(await ca.json());
      setTrends(await tr.json());
    } catch (err) { console.error("Failed to load:", err); }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAdd = () => loadData();
  const handleDelete = async (id: string) => {
    try { await fetch(`${API}/transactions/${id}`, { method: "DELETE" }); loadData(); }
    catch (err) { console.error(err); }
  };

  const loadSeedData = async () => {
    const seeds = [
      { description: "Whole Foods Market — weekly groceries", amount: 87.43 },
      { description: "Shell Gas Station", amount: 52.00 },
      { description: "Netflix Subscription", amount: 15.99 },
      { description: "Chipotle — lunch", amount: 12.50 },
      { description: "Uber ride to airport", amount: 34.00 },
      { description: "Amazon — electronics", amount: 89.99 },
      { description: "Starbucks coffee", amount: 6.75 },
      { description: "Electric bill payment", amount: 124.00 },
      { description: "Nike — running shoes", amount: 120.00 },
      { description: "Trader Joe's", amount: 48.60 },
      { description: "Delta Airlines — flight to NYC", amount: 340.00 },
      { description: "Pharmacy — CVS", amount: 23.40 },
    ];
    for (const s of seeds) {
      await fetch(`${API}/transactions`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      });
    }
    loadData();
  };

  return (
    <div className="page-bg min-h-screen">
      {/* Hero gradient */}
      <div className="hero-gradient" />

      <div className="relative z-10 max-w-[1080px] mx-auto px-5 sm:px-8 py-10 sm:py-14">

        {/* ── Header ── */}
        <header className="mb-10">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              🧾
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              Carbon<span style={{ color: "#6366f1" }}>ceipt</span>
            </h1>
          </div>
          <p className="text-sm text-gray-400 font-medium">
            See the carbon footprint of every dollar you spend.
          </p>
        </header>

        {/* ── Input ── */}
        <section className="mb-8">
          <div className="card p-4">
            <TransactionForm onAdd={handleAdd} />
          </div>
        </section>

        {loading ? (
          <div className="flex items-center justify-center py-28">
            <div className="w-7 h-7 border-2 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : dashboard && dashboard.total_transactions > 0 ? (
          <>
            {/* ── Stats ── */}
            <section className="flex flex-wrap gap-3 mb-8">
              <StatCard icon="💨" label="Total CO₂" value={formatCO2(dashboard.total_co2_kg)}
                sub={`${dashboard.total_transactions} transactions`} accent="#6366f1" />
              <StatCard icon="💰" label="Total Spent" value={formatUSD(dashboard.total_spent)}
                sub="tracked spending" accent="#10b981" />
              <StatCard icon={catMeta(dashboard.top_category || "other").icon} label="Top Emitter"
                value={dashboard.top_category ? catMeta(dashboard.top_category).label : "—"}
                sub="highest impact" accent="#f97316" />
              <StatCard icon="📊" label="Per Transaction" value={formatCO2(dashboard.avg_co2_per_txn)}
                sub="average CO₂" accent="#8b5cf6" />
            </section>

            {/* ── Charts ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-8">
              <div className="card p-6 lg:col-span-3">
                <h2 className="text-[11px] uppercase tracking-widest text-gray-400 font-bold mb-5">
                  Emissions by Category
                </h2>
                <CategoryChart data={categories} />
              </div>
              <div className="card p-6 lg:col-span-2">
                <h2 className="text-[11px] uppercase tracking-widest text-gray-400 font-bold mb-5">
                  7-Day Trend
                </h2>
                <TrendChart data={trends} />
                {trends.length > 0 && (
                  <p className="text-xs text-gray-400 mt-3 font-medium">
                    {trends.reduce((a, t) => a + t.transactions, 0)} transactions this week
                  </p>
                )}
              </div>
            </div>

            {/* ── Transactions ── */}
            <div className="card p-6 mb-8">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[11px] uppercase tracking-widest text-gray-400 font-bold">
                  Recent Transactions
                </h2>
                <button onClick={loadSeedData} className="btn-subtle text-[11px] px-3 py-1.5">
                  Load demo data
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                {transactions.map(t => {
                  const m = catMeta(t.category);
                  return (
                    <div key={t.id} className="flex items-center justify-between py-3 px-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                          style={{ background: m.bg }}>
                          {m.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-gray-800 font-medium truncate">{t.description}</p>
                          <p className="text-[11px] text-gray-400 font-medium">
                            {m.label} · {timeAgo(t.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 ml-4">
                        <span className="text-sm font-semibold text-gray-500 tabular-nums">{formatUSD(t.amount)}</span>
                        <span className="text-sm font-bold tabular-nums min-w-[68px] text-right"
                          style={{ color: m.color }}>{formatCO2(t.co2_kg)}</span>
                        <button onClick={() => handleDelete(t.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all text-xs w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-50"
                          title="Delete">✕</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Share Card ── */}
            <div className="rounded-2xl p-8 text-center mb-8"
              style={{
                background: "linear-gradient(135deg, rgba(99,102,241,0.04) 0%, rgba(139,92,246,0.03) 100%)",
                border: "1px solid rgba(99,102,241,0.1)",
              }}>
              <p className="text-[11px] uppercase tracking-widest text-gray-400 font-bold mb-3">
                Your Carbon Receipt
              </p>
              <p className="text-4xl sm:text-5xl font-extrabold tracking-tight tabular-nums mb-2"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>
                {formatCO2(dashboard.total_co2_kg)} CO₂e
              </p>
              <p className="text-sm text-gray-400 font-medium">
                across {dashboard.total_transactions} transactions · {formatUSD(dashboard.total_spent)} total
              </p>
            </div>
          </>
        ) : (
          /* ── Empty State ── */
          <div className="card p-12 text-center">
            <div className="text-4xl mb-4">🌍</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Track your first purchase</h2>
            <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto font-medium">
              Add a transaction above to see its carbon footprint, or load demo data to explore.
            </p>
            <button onClick={loadSeedData} className="btn-primary text-sm">
              Load Demo Data
            </button>
          </div>
        )}

        {/* ── Footer ── */}
        <footer className="mt-4 pb-8 text-center">
          <p className="text-[11px] text-gray-300 font-medium">
            Built for Beyond Tomorrow Summit 2026 · Open Source ·{" "}
            <span className="text-indigo-400">PaperLab</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
