"""Carbonceipt — FastAPI backend."""

import os
import sqlite3
import hashlib
from datetime import datetime, timezone, timedelta
from contextlib import asynccontextmanager
from typing import Optional

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ─── Climatiq ───────────────────────────────────────────────────────────────

CLIMATIQ_API_KEY = os.environ.get("CLIMATIQ_API_KEY", "")
CLIMATIQ_URL = "https://beta.api.climatiq.io/estimate"

# Cached emission factors (kg CO2e per USD spent) — fallback when no API key
# Source: EPA, DEFRA, and industry averages
FALLBACK_EMISSION_FACTORS: dict[str, float] = {
    "food_groceries": 0.35,         # kg CO2e per USD
    "restaurants": 0.45,
    "transportation_fuel": 2.31,    # per dollar (gasoline)
    "transportation_rideshare": 0.31,
    "transportation_airfare": 0.26,
    "utilities_electricity": 0.42,  # per dollar of electric bill
    "utilities_gas": 1.89,
    "clothing_apparel": 0.22,
    "electronics": 0.18,
    "entertainment": 0.12,
    "healthcare": 0.14,
    "education": 0.08,
    "personal_care": 0.15,
    "home_furnishings": 0.20,
    "subscriptions_digital": 0.05,
    "gifts_donations": 0.10,
    "other": 0.25,                  # default
}

# Category keyword mapping
CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "food_groceries": ["grocery", "supermarket", "whole foods", "trader joe", "kroger", "safeway", "aldi", "walmart", "costco", "target", "food lion", "publix", "heb", "wegmans"],
    "restaurants": ["restaurant", "mcdonald", "starbucks", "chipotle", "taco bell", "burger king", "wendy", "subway", "domino", "pizza", "diner", "cafe", "sushi", "thai", "chinese", "inditalian", "mexican", "bbq", "grill", "kitchen", "eatery", "doordash", "uber eats", "grubhub", "seamless"],
    "transportation_fuel": ["shell", "chevron", "exxon", "bp", "mobil", "gas", "fuel", "petro", "marathon", "speedway", "76", "sunoco"],
    "transportation_rideshare": ["uber", "lyft", "cab", "taxi", "rideshare"],
    "transportation_airfare": ["airline", "delta", "united", "american airline", "southwest", "jetblue", "spirit", "frontier", "alaska air", "flight", "airfare"],
    "utilities_electricity": ["electric", "power", "energy", "duke energy", "pacific gas", "pg&e", "conedison", "con edison", "national grid", "comed"],
    "utilities_gas": ["gas bill", "natural gas", "gas company"],
    "clothing_apparel": ["clothing", "apparel", "nike", "adidas", "h&m", "zara", "gap", "uniqlo", "forever 21", "old navy", "macys", "nordstrom", "uniqlo", "patagonia"],
    "electronics": ["apple", "best buy", "amazon", "newegg", "microsoft", "samsung", "dell", "hp", "sony", "tech", "computer", "phone", "laptop"],
    "entertainment": ["netflix", "spotify", "hulu", "disney+", "hbomax", "paramount", "peacock", "movie", "concert", "theater", "game", "steam", "playstation", "xbox", "nintendo"],
    "healthcare": ["pharmacy", "cvs", "walgreens", "rite aid", "doctor", "hospital", "medical", "dental", "health", "urgent care"],
    "education": ["book", "textbook", "course", "udemy", "coursera", "udacity", "college", "university", "tuition", "learning"],
    "personal_care": ["salon", "barber", "haircut", "spa", "beauty", "cosmetic", "sephora", "ulta"],
    "home_furnishings": ["ikea", "home depot", "lowe's", "wayfair", "bed bath", "furniture", "home goods", "pottery barn", "crate barrel", "west elm"],
    "subscriptions_digital": ["subscription", "saas", "software", "adobe", "google", "aws", "cloud", "domain", "hosting"],
    "gifts_donations": ["gift", "donation", "charity", " nonprof"],
}


def categorize(description: str) -> str:
    """Keyword-based categorization."""
    desc_lower = description.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            if kw in desc_lower:
                return category
    return "other"


async def fetch_climatiq_emission(description: str, amount_usd: float) -> tuple[float, str]:
    """Fetch CO2 emission from Climatiq API. Returns (kg_co2, category)."""
    category = categorize(description)

    if not CLIMATIQ_API_KEY:
        factor = FALLBACK_EMISSION_FACTORS.get(category, FALLBACK_EMISSION_FACTORS["other"])
        return round(amount_usd * factor, 3), category

    # Map our categories to Climatiq activity IDs
    ACTIVITY_IDS = {
        "food_groceries": "consumer_goods-type_food_beverages",
        "restaurants": "consumer_goods-type_food_beverages_tobacco",
        "transportation_fuel": "fuel-type_fuel_gasoline",
        "transportation_rideshare": "transport_vehicle-type_car",
        "transportation_airfare": "transport_flight-type_domestic",
        "utilities_electricity": "electricity_supply_grid-average",
        "clothing_apparel": "consumer_goods-type_clothing",
        "electronics": "consumer_goods-type_electronics",
        "entertainment": "media-type_entertainment",
        "healthcare": "healthcare-type_general",
        "education": "education-type_general",
        "personal_care": "consumer_goods-type_personal_care",
        "home_furnishings": "consumer_goods-type_furniture",
        "subscriptions_digital": "software_and_cloud_services-type_saas",
        "gifts_donations": "consumer_goods-type_general",
        "other": "consumer_goods-type_general",
    }

    activity_id = ACTIVITY_IDS.get(category, "consumer_goods-type_general")

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                CLIMATIQ_URL,
                headers={"Authorization": f"Bearer {CLIMATIQ_API_KEY}"},
                json={
                    "emission_factor": activity_id,
                    "parameters": {"money": amount_usd, "money_unit": "usd"},
                },
            )
            if resp.status_code == 200:
                data = resp.json()
                return round(data.get("co2e", 0), 3), category
    except Exception:
        pass

    # Fallback
    factor = FALLBACK_EMISSION_FACTORS.get(category, FALLBACK_EMISSION_FACTORS["other"])
    return round(amount_usd * factor, 3), category


# ─── Database ────────────────────────────────────────────────────────────────

DB_PATH = os.path.join(os.path.dirname(__file__), "carbonceipt.db")


def get_db() -> sqlite3.Connection:
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    return db


def init_db():
    db = get_db()
    db.executescript("""
        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            description TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT NOT NULL DEFAULT 'other',
            co2_kg REAL NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
    """)
    db.commit()
    db.close()


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


# ─── App ─────────────────────────────────────────────────────────────────────

app = FastAPI(title="Carbonceipt API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Models ──────────────────────────────────────────────────────────────────

class TransactionCreate(BaseModel):
    description: str = Field(..., min_length=1, max_length=200)
    amount: float = Field(..., gt=0, le=100000)


class TransactionOut(BaseModel):
    id: str
    description: str
    amount: float
    category: str
    co2_kg: float
    created_at: str


class DashboardData(BaseModel):
    total_co2_kg: float
    total_transactions: int
    top_category: Optional[str]
    total_spent: float
    avg_co2_per_txn: float


# ─── Routes ──────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/transactions", response_model=TransactionOut)
async def create_transaction(body: TransactionCreate):
    co2_kg, category = await fetch_climatiq_emission(body.description, body.amount)
    txn_id = hashlib.md5(
        f"{body.description}{body.amount}{datetime.now(timezone.utc).isoformat()}".encode()
    ).hexdigest()[:12]
    created_at = datetime.now(timezone.utc).isoformat()

    db = get_db()
    db.execute(
        "INSERT INTO transactions (id, description, amount, category, co2_kg, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (txn_id, body.description, body.amount, category, co2_kg, created_at),
    )
    db.commit()
    db.close()

    return TransactionOut(
        id=txn_id,
        description=body.description,
        amount=body.amount,
        category=category,
        co2_kg=co2_kg,
        created_at=created_at,
    )


@app.get("/transactions", response_model=list[TransactionOut])
async def list_transactions(limit: int = 50):
    db = get_db()
    rows = db.execute(
        "SELECT * FROM transactions ORDER BY created_at DESC LIMIT ?", (limit,)
    ).fetchall()
    db.close()
    return [TransactionOut(**dict(r)) for r in rows]


@app.get("/dashboard", response_model=DashboardData)
async def get_dashboard():
    db = get_db()
    row = db.execute("""
        SELECT
            COALESCE(SUM(co2_kg), 0) as total_co2,
            COUNT(*) as total_txn,
            COALESCE(SUM(amount), 0) as total_spent
        FROM transactions
    """).fetchone()

    top_cat_row = db.execute("""
        SELECT category, SUM(co2_kg) as cat_co2
        FROM transactions
        GROUP BY category
        ORDER BY cat_co2 DESC
        LIMIT 1
    """).fetchone()
    db.close()

    total_txn = row["total_txn"]
    return DashboardData(
        total_co2_kg=round(row["total_co2"], 3),
        total_transactions=total_txn,
        top_category=top_cat_row["category"] if top_cat_row else None,
        total_spent=round(row["total_spent"], 2),
        avg_co2_per_txn=round(row["total_co2"] / total_txn, 3) if total_txn else 0,
    )


@app.get("/categories")
async def get_categories():
    db = get_db()
    rows = db.execute("""
        SELECT
            category,
            COUNT(*) as count,
            SUM(co2_kg) as total_co2,
            SUM(amount) as total_spent
        FROM transactions
        GROUP BY category
        ORDER BY total_co2 DESC
    """).fetchall()
    db.close()
    return [dict(r) for r in rows]


@app.get("/trends")
async def get_trends(days: int = 7):
    db = get_db()
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    rows = db.execute("""
        SELECT
            date(created_at) as day,
            SUM(co2_kg) as co2_kg,
            COUNT(*) as transactions
        FROM transactions
        WHERE created_at >= ?
        GROUP BY date(created_at)
        ORDER BY day
    """, (since,)).fetchall()
    db.close()
    return [dict(r) for r in rows]


@app.delete("/transactions/{txn_id}")
async def delete_transaction(txn_id: str):
    db = get_db()
    cur = db.execute("DELETE FROM transactions WHERE id = ?", (txn_id,))
    db.commit()
    db.close()
    if cur.rowcount == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"deleted": True}
