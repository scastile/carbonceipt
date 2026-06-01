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

const CATEGORY_LABELS: Record<string, string> = {
  food_groceries: "Groceries",
  restaurants: "Dining Out",
  transportation_fuel: "Gas / Fuel",
  transportation_rideshare: "Rideshare",
  transportation_airfare: "Air Travel",
  utilities_electricity: "Electricity",
  utilities_gas: "Gas / Heating",
  clothing_apparel: "Clothing",
  electronics: "Electronics",
  entertainment: "Entertainment",
  healthcare: "Healthcare",
  education: "Education",
  personal_care: "Personal Care",
  home_furnishings: "Home & Garden",
  subscriptions_digital: "Subscriptions",
  gifts_donations: "Gifts & Donations",
  other: "Other",
};

const CATEGORY_COLORS: Record<string, string> = {
  food_groceries: "#818cf8",
  restaurants: "#a78bfa",
  transportation_fuel: "#f87171",
  transportation_rideshare: "#fb923c",
  transportation_airfare: "#22d3ee",
  utilities_electricity: "#facc15",
  utilities_gas: "#fbbf24",
  clothing_apparel: "#f472b6",
  electronics: "#2dd4bf",
  entertainment: "#c084fc",
  healthcare: "#4ade80",
  education: "#60a5fa",
  personal_care: "#fb7185",
  home_furnishings: "#a3e635",
  subscriptions_digital: "#94a3b8",
  gifts_donations: "#e879f9",
  other: "#64748b",
};

const CATEGORY_EMOJIS: Record<string, string> = {
  food_groceries: "🛒",
  restaurants: "🍽️",
  transportation_fuel: "⛽",
  transportation_rideshare: "🚗",
  transportation_airfare: "✈️",
  utilities_electricity: "⚡",
  utilities_gas: "🔥",
  clothing_apparel: "👕",
  electronics: "💻",
  entertainment: "🎬",
  healthcare: "🏥",
  education: "📚",
  personal_care: "💇",
  home_furnishings: "🏠",
  subscriptions_digital: "💳",
  gifts_donations: "🎁",
  other: "📦",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function categoryLabel(cat: string) {
  return CATEGORY_LABELS[cat] || cat;
}

function categoryColor(cat: string) {
  return CATEGORY_COLORS[cat] || "#64748b";
}

function categoryEmoji(cat: string) {
  return CATEGORY_EMOJIS[cat] || "📦";
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
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="stat-card p-5 flex-1 min-w-[160px]">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <span className="text-[11px] uppercase tracking-widest text-gray-500 font-medium">
          {label}
        </span>
      </div>
      <p className="text-2xl font-extrabold tracking-tight" style={{ color: accent }}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Category Bar Chart ──────────────────────────────────────────────────────

function CategoryChart({ data }: { data: CategoryData[] }) {
  const maxCO2 = Math.max(...data.map((d) => d.total_co2), 0.001);

  if (data.length === 0) {
    return (
      <p className="text-gray-600 text-sm italic">
        Add transactions to see your breakdown.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((d) => {
        const pct = (d.total_co2 / maxCO2) * 100;
        const color = categoryColor(d.category);
        return (
          <div key={d.category}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-sm">{categoryEmoji(d.category)}</span>
                <span className="text-sm text-gray-300">{categoryLabel(d.category)}</span>
                <span className="text-xs text-gray-600">({d.count})</span>
              </div>
              <span className="text-sm font-semibold" style={{ color }}>
                {formatCO2(d.total_co2)}
              </span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${color}88, ${color})`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Trend Chart ─────────────────────────────────────────────────────────────

function TrendChart({ data }: { data: TrendData[] }) {
  if (data.length === 0) {
    return <p className="text-gray-600 text-sm italic">No trend data yet.</p>;
  }

  const maxCO2 = Math.max(...data.map((d) => d.co2_kg), 0.001);
  const spacing = 100 / Math.max(data.length - 1, 1);

  const linePoints = data
    .map((d, i) => {
      const x = i * spacing;
      const y = 100 - (d.co2_kg / maxCO2) * 85 - 5;
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `0,100 ${linePoints} 100,100`;

  return (
    <div>
      <svg viewBox="0 0 100 100" className="w-full h-24" preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon fill="url(#areaGrad)" points={areaPoints} />
        <polyline
          fill="none"
          stroke="#818cf8"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={linePoints}
        />
        {data.map((d, i) => {
          const x = i * spacing;
          const y = 100 - (d.co2_kg / maxCO2) * 85 - 5;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="2"
              fill="#6366f1"
              stroke="#06060a"
              strokeWidth="1"
            />
          );
        })}
      </svg>
      <div className="flex justify-between mt-2">
        {data.map((d) => (
          <span key={d.day} className="text-[10px] text-gray-600 font-medium">
            {d.day.slice(5)}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Transaction Form ────────────────────────────────────────────────────────

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
      const data = await res.json();
      onAdd(data);
      setResult(data);
      setDesc("");
      setAmount("");
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="card p-6">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="What did you buy?"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          className="flex-1 px-5 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all text-sm"
          required
        />
        <div className="relative w-full sm:w-36">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full pl-8 pr-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all text-sm"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-7 py-3.5 rounded-xl font-semibold text-white text-sm transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          style={{
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          }}
        >
          {loading ? (
            <span className="inline-block animate-spin">⟳</span>
          ) : (
            "Track It"
          )}
        </button>
      </form>

      {result && (
        <div
          className="mt-4 rounded-xl p-4 flex items-center gap-4 animate-fade-in"
          style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08))",
            border: "1px solid rgba(99,102,241,0.15)",
          }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
            style={{ background: `${categoryColor(result!.category)}20` }}
          >
            {categoryEmoji(result!.category)}
          </div>
          <div className="min-w-0">
            <p className="text-sm text-gray-400 truncate">
              {result!.description}{" "}
              <span className="text-gray-600">— {formatUSD(result!.amount)}</span>
            </p>
            <p className="text-xl font-extrabold mt-0.5" style={{ color: categoryColor(result!.category) }}>
              {formatCO2(result!.co2_kg)} CO₂e
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [txRes, dashRes, catRes, trRes] = await Promise.all([
        fetch(`${API}/transactions`),
        fetch(`${API}/dashboard`),
        fetch(`${API}/categories`),
        fetch(`${API}/trends?days=7`),
      ]);
      setTransactions(await txRes.json());
      setDashboard(await dashRes.json());
      setCategories(await catRes.json());
      setTrends(await trRes.json());
    } catch (err) {
      console.error("Failed to load:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAdd = (t: Transaction) => {
    loadData();
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API}/transactions/${id}`, { method: "DELETE" });
      loadData();
    } catch (err) {
      console.error("Failed to delete:", err);
    }
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      });
    }
    loadData();
  };

  return (
    <div className="min-h-screen text-white" style={{ fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
      {/* Animated gradient mesh */}
      <div className="page-gradient-bg">
        <div className="gradient-mesh" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl"
              style={{
                background: "linear-gradient(135deg, #6366f1, #22c55e)",
                boxShadow: "0 4px 20px rgba(99, 102, 241, 0.3)",
              }}
            >
              🧾
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Carbon<span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">ceipt</span>
            </h1>
          </div>
          <p className="text-gray-500 text-sm max-w-md">
            See the carbon footprint of every dollar you spend. Understand your impact. Make better choices.
          </p>
        </header>

        {/* Transaction Form */}
        <section className="mb-8">
          <TransactionForm onAdd={handleAdd} />
        </section>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : dashboard && dashboard.total_transactions > 0 ? (
          <>
            {/* Stats Row */}
            <section className="flex flex-wrap gap-3 mb-8">
              <StatCard
                icon="💨"
                label="Total CO₂"
                value={formatCO2(dashboard.total_co2_kg)}
                sub={`across ${dashboard.total_transactions} transactions`}
                accent="#818cf8"
              />
              <StatCard
                icon="💰"
                label="Total Spent"
                value={formatUSD(dashboard.total_spent)}
                sub="tracked spending"
                accent="#4ade80"
              />
              <StatCard
                icon={categoryEmoji(dashboard.top_category || "other")}
                label="Top Emitter"
                value={dashboard.top_category ? categoryLabel(dashboard.top_category) : "—"}
                sub="highest impact category"
                accent="#fb923c"
              />
              <StatCard
                icon="📊"
                label="Per Transaction"
                value={formatCO2(dashboard.avg_co2_per_txn)}
                sub="average CO₂"
                accent="#f472b6"
              />
            </section>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-8">
              {/* Category Breakdown */}
              <div className="card p-6 lg:col-span-3">
                <h2 className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-5">
                  Emissions by Category
                </h2>
                <CategoryChart data={categories} />
              </div>

              {/* Weekly Trend */}
              <div className="card p-6 lg:col-span-2">
                <h2 className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-5">
                  7-Day Trend
                </h2>
                <TrendChart data={trends} />
                {trends.length > 0 && (
                  <p className="text-xs text-gray-600 mt-3">
                    {trends.reduce((a, t) => a + t.transactions, 0)} transactions this week
                  </p>
                )}
              </div>
            </div>

            {/* Transaction List */}
            <div className="card p-6 mb-8">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
                  Recent Transactions
                </h2>
                <button
                  onClick={loadSeedData}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-3 py-1 rounded-lg hover:bg-white/5"
                >
                  Load demo data
                </button>
              </div>
              <div className="space-y-1">
                {transactions.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-white/[0.03] transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                        style={{ background: `${categoryColor(t.category)}15` }}
                      >
                        {categoryEmoji(t.category)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-gray-300 truncate">{t.description}</p>
                        <p className="text-[11px] text-gray-600">
                          {categoryLabel(t.category)} · {timeAgo(t.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 ml-4">
                      <span className="text-sm font-medium text-gray-500">
                        {formatUSD(t.amount)}
                      </span>
                      <span
                        className="text-sm font-bold min-w-[70px] text-right"
                        style={{ color: categoryColor(t.category) }}
                      >
                        {formatCO2(t.co2_kg)}
                      </span>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all text-xs w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-500/10"
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Share Card */}
            <div
              className="rounded-2xl p-8 text-center mb-8"
              style={{
                background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(34,197,94,0.06))",
                border: "1px solid rgba(99,102,241,0.12)",
              }}
            >
              <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-3">
                Your Carbon Receipt
              </p>
              <p
                className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-violet-400 to-green-400 bg-clip-text text-transparent mb-2"
              >
                {formatCO2(dashboard.total_co2_kg)} CO₂e
              </p>
              <p className="text-sm text-gray-500">
                across {dashboard.total_transactions} transactions · {formatUSD(dashboard.total_spent)} total
              </p>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="card p-12 text-center">
            <div className="text-5xl mb-4">🌍</div>
            <h2 className="text-xl font-bold mb-2">Track your first purchase</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
              Add a transaction above to see its carbon footprint, or load demo data to explore the app.
            </p>
            <button
              onClick={loadSeedData}
              className="px-6 py-3 rounded-xl font-semibold text-white text-sm transition-all hover:shadow-lg hover:shadow-indigo-500/20"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              Load Demo Data
            </button>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-8 text-center text-[11px] text-gray-700 pb-8 space-y-1">
          <p>Built for Beyond Tomorrow Summit 2026 · Open Source</p>
          <p>Carbon emission factors from Climatiq & EPA · <span className="text-indigo-500/70">PaperLab</span></p>
        </footer>
      </div>
    </div>
  );
}
