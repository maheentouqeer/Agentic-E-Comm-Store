"""
Autonomous Inventory / Reorder Agent.

This is the agent that actually demonstrates "automation" rather than
"chatbot": nobody asks it a question. It scans stock on its own (here,
triggered manually via an endpoint to simulate a scheduled job — in
production this would be a cron/Cloud Scheduler trigger) and, when a SKU
drops below its reorder threshold, drafts a purchase order to the supplier
and logs exactly what it did and why.

`reorder_pending` prevents it from spamming a duplicate PO every time the
check runs before the real-world restock arrives — a small idempotency
detail, but the kind of thing that separates a real automation agent from
a demo toy.
"""

from mock_data import PRODUCTS, SUPPLIERS
from llm import generate

REORDER_THRESHOLD = 5
REORDER_QTY = 20

ACTIVITY_LOG = []  # in-memory activity log, read by the ops dashboard


def check_inventory():
    """Scans all products; drafts a PO for anything under threshold that doesn't
    already have one pending. Returns the list of actions taken this run."""
    actions_taken = []

    for p in PRODUCTS:
        if p["stock"] < REORDER_THRESHOLD and not p["reorder_pending"]:
            supplier = SUPPLIERS.get(p["category"], "unknown-supplier@example.com")

            fallback = (
                f"PURCHASE ORDER (auto-generated)\n"
                f"To: {supplier}\n"
                f"Reorder {REORDER_QTY}x {p['name']} (SKU {p['id']}).\n"
                f"Reason: current stock {p['stock']} is below reorder threshold {REORDER_THRESHOLD}."
            )
            prompt = (
                f"Draft a brief, professional purchase order email to supplier {supplier}, "
                f"reordering {REORDER_QTY} units of '{p['name']}' (SKU {p['id']}). "
                f"Current stock is {p['stock']}, below our reorder threshold of {REORDER_THRESHOLD}. "
                f"Keep it under 80 words, include SKU and quantity clearly."
            )
            message = generate(prompt, fallback)

            entry = {
                "sku": p["id"],
                "product": p["name"],
                "stock_before": p["stock"],
                "threshold": REORDER_THRESHOLD,
                "reorder_qty": REORDER_QTY,
                "supplier": supplier,
                "action": "auto_reorder_drafted",
                "message": message,
            }
            ACTIVITY_LOG.append(entry)
            actions_taken.append(entry)
            p["reorder_pending"] = True  # won't re-trigger until restocked

    return actions_taken


def simulate_restock(sku: str, qty: int = REORDER_QTY):
    """Simulates the supplier's shipment arriving, for demo purposes —
    clears reorder_pending so the loop can trigger again later."""
    product = next((p for p in PRODUCTS if p["id"] == sku), None)
    if not product:
        return None
    product["stock"] += qty
    product["reorder_pending"] = False
    ACTIVITY_LOG.append({
        "sku": sku,
        "product": product["name"],
        "action": "restock_received",
        "qty_received": qty,
        "stock_after": product["stock"],
    })
    return product


def get_log():
    return list(reversed(ACTIVITY_LOG))  # newest first for the dashboard
