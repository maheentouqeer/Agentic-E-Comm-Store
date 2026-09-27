"""
Tools available to the Agentic RAG Chatbot.

Every function here is plain deterministic Python — no LLM calls inside
any of them. This is the same principle from the first version of this
project, just consolidated: the chatbot's orchestrator (agents/rag_chatbot.py)
decides *when* to call these, but once called, the numbers/lookups are
100% real, never generated. Keeping that boundary explicit is exactly what
makes an "agentic" system trustworthy enough to point at pricing or stock.
"""

from mock_data import PRODUCTS, ORDERS
from agents import inventory_agent

DISCOUNT_TIERS = [
    (100, 0.12),
    (50, 0.08),
    (20, 0.05),
    (10, 0.03),
    (1, 0.00),
]
SHIPPING_RATES = {"local": 0, "regional": 25, "international": 60}

CATEGORY_KEYWORDS = {
    "monitor": "monitor", "screen": "monitor",
    "keyboard": "accessory", "mouse": "accessory", "accessory": "accessory",
    "laptop": "laptop", "notebook": "laptop",
}


def search_products(budget_max=None, use_case=None, min_ram=None, category=None):
    """Filters the real catalog. Returns up to 3 matches, cheapest first."""
    if budget_max is not None:
        try:
            budget_max = float(budget_max)
        except (ValueError, TypeError):
            budget_max = None
    if min_ram is not None:
        try:
            min_ram = int(min_ram)
        except (ValueError, TypeError):
            min_ram = None

    results = [p for p in PRODUCTS if p["stock"] > 0]
    if category:
        cat_str = str(category).strip().lower()
        results = [p for p in results if p["category"].lower() == cat_str]
    if budget_max is not None:
        results = [p for p in results if p["price_usd"] <= budget_max]
    if use_case:
        uc_str = str(use_case).strip().lower()
        results = [p for p in results if uc_str in p["use_case"].lower() or any(w in p["use_case"].lower() for w in uc_str.split())]
    if min_ram is not None:
        results = [p for p in results if p["ram_gb"] >= min_ram]
    results = sorted(results, key=lambda p: p["price_usd"])
    if not results and category:  # relax category if it over-filtered
        return search_products(budget_max, use_case, min_ram, category=None)
    return results[:3]


def calculate_quote(product_id: str, quantity: int, destination: str = "international"):
    """Deterministic B2B pricing — the numbers a real business would need to be exact."""
    clean_sku = str(product_id).strip().upper()
    product = next((p for p in PRODUCTS if p["id"].upper() == clean_sku), None)
    if not product:
        return {"error": f"No product with SKU '{product_id}'"}

    try:
        qty = int(quantity)
    except (ValueError, TypeError):
        qty = 1

    dest = str(destination).strip().lower() if destination else "international"

    discount = 0.0
    for min_qty, pct in DISCOUNT_TIERS:
        if qty >= min_qty:
            discount = pct
            break

    unit_price = round(product["price_usd"] * (1 - discount), 2)
    subtotal = round(unit_price * qty, 2)
    shipping = SHIPPING_RATES.get(dest, SHIPPING_RATES["international"])
    total = round(subtotal + shipping, 2)

    return {
        "product": product["name"], "sku": product["id"], "quantity": qty,
        "unit_price": unit_price, "discount_pct": round(discount * 100, 1),
        "subtotal": subtotal, "shipping": shipping, "total": total,
        "destination": dest, "in_stock": product["stock"] >= qty,
    }


def get_order_status(order_id: str):
    """Looks up a real order; returns escalated=True rather than guessing if not found."""
    clean_id = str(order_id).strip()
    order = next((o for o in ORDERS if o["order_id"].lower() == clean_id.lower()), None)
    if not order:
        return {"found": False, "escalated": True, "order_id": clean_id}
    return {"found": True, "escalated": False, **order}


def check_inventory_status(product_id: str):
    """Reports live stock for one SKU, and whether the autonomous reorder
    agent has already flagged/actioned it — lets the chatbot say something
    like 'that's low, but a reorder is already in progress' instead of
    just a stock number."""
    clean_sku = str(product_id).strip().upper()
    product = next((p for p in PRODUCTS if p["id"].upper() == clean_sku), None)
    if not product:
        return {"error": f"No product with SKU '{product_id}'"}
    return {
        "sku": product["id"], "name": product["name"], "stock": product["stock"],
        "reorder_pending": product["reorder_pending"],
        "below_threshold": product["stock"] < inventory_agent.REORDER_THRESHOLD,
    }


# Schema shown to the LLM during the "decide which tool" step in rag_chatbot.py.
TOOL_SCHEMAS = {
    "search_products": {
        "description": "Find in-stock products matching budget, use case, RAM, or category.",
        "args": {"budget_max": "number|null", "use_case": "string|null",
                  "min_ram": "number|null", "category": "'laptop'|'monitor'|'accessory'|null"},
    },
    "calculate_quote": {
        "description": "Calculate exact B2B bulk pricing for a specific product/quantity/destination.",
        "args": {"product_id": "string (SKU, e.g. 'LT-002')", "quantity": "integer",
                  "destination": "'local'|'regional'|'international'"},
    },
    "get_order_status": {
        "description": "Look up the status of a specific order by ID.",
        "args": {"order_id": "string, e.g. 'ORD-1001'"},
    },
    "check_inventory_status": {
        "description": "Check live stock level and reorder status for a specific SKU.",
        "args": {"product_id": "string (SKU)"},
    },
}

TOOL_FUNCTIONS = {
    "search_products": search_products,
    "calculate_quote": calculate_quote,
    "get_order_status": get_order_status,
    "check_inventory_status": check_inventory_status,
}
