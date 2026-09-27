"""End-to-end test suite for the agentic e-commerce backend."""
import urllib.request
import json
import time
import sys

BASE = "http://127.0.0.1:8000"
PASS = 0
FAIL = 0

def post(path, data):
    req = urllib.request.Request(
        f"{BASE}{path}",
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    return json.loads(urllib.request.urlopen(req, timeout=30).read())

def get(path):
    return json.loads(urllib.request.urlopen(f"{BASE}{path}", timeout=30).read())

def check(name, condition, details=""):
    global PASS, FAIL
    if condition:
        PASS += 1
        print(f"  [PASS] {name}")
    else:
        FAIL += 1
        print(f"  [FAIL] {name} — {details}")

# ----------------------------------------------------------------
print("=== 1. Health check ===")
h = get("/")
check("LLM is live", h.get("llm_live") == True, str(h))
check("Retrieval mode is embedding", h.get("retrieval_mode") == "embedding", str(h))

# ----------------------------------------------------------------
print("\n=== 2. Product recommendation (search_products) ===")
r = post("/chat", {"message": "I need a laptop for video editing under $900"})
print(f"  tools_used={r['tools_used']}")
print(f"  response={r['response'][:150]}...")
check("Uses search_products tool", "search_products" in r["tools_used"], f"tools_used={r['tools_used']}")
check("Tool result has products", r.get("tool_result") is not None and len(r["tool_result"]) > 0, str(r.get("tool_result"))[:100])
time.sleep(15)

# ----------------------------------------------------------------
print("\n=== 3. Bulk quote (calculate_quote) ===")
r = post("/chat", {"message": "Give me a price quote for 30 units of LT-002 shipped internationally"})
print(f"  tools_used={r['tools_used']}")
print(f"  tool_result={r.get('tool_result')}")
check("Uses calculate_quote tool", "calculate_quote" in r["tools_used"], f"tools_used={r['tools_used']}")
tr = r.get("tool_result") or {}
check("Quote has correct SKU", tr.get("sku") == "LT-002", f"sku={tr.get('sku')}")
check("Quantity is 30", tr.get("quantity") == 30, f"qty={tr.get('quantity')}")
check("Discount applied (>=3%)", tr.get("discount_pct", 0) >= 3, f"discount={tr.get('discount_pct')}")
time.sleep(15)

# ----------------------------------------------------------------
print("\n=== 4. Order status — found (get_order_status) ===")
r = post("/chat", {"message": "Track my order ORD-1002"})
print(f"  tools_used={r['tools_used']}")
print(f"  tool_result={r.get('tool_result')}")
check("Uses get_order_status tool", "get_order_status" in r["tools_used"], f"tools_used={r['tools_used']}")
tr = r.get("tool_result") or {}
check("Order found", tr.get("found") == True, str(tr))
check("Correct order ID", tr.get("order_id") == "ORD-1002", str(tr))
time.sleep(15)

# ----------------------------------------------------------------
print("\n=== 5. Order status — not found ===")
r = post("/chat", {"message": "Track my order ORD-9999"})
print(f"  tools_used={r['tools_used']}")
print(f"  tool_result={r.get('tool_result')}")
check("Uses get_order_status tool", "get_order_status" in r["tools_used"], f"tools_used={r['tools_used']}")
tr = r.get("tool_result") or {}
check("Order not found", tr.get("found") == False, str(tr))
check("Escalated flag", tr.get("escalated") == True, str(tr))
time.sleep(15)

# ----------------------------------------------------------------
print("\n=== 6. Inventory query (check_inventory_status) ===")
r = post("/chat", {"message": "How many units of LT-003 are currently in stock?"})
print(f"  tools_used={r['tools_used']}")
print(f"  tool_result={r.get('tool_result')}")
check("Uses check_inventory_status tool", "check_inventory_status" in r["tools_used"], f"tools_used={r['tools_used']}")
tr = r.get("tool_result") or {}
check("Correct SKU returned", tr.get("sku") == "LT-003", str(tr))
check("Stock is numeric", isinstance(tr.get("stock"), (int, float)), str(tr))
time.sleep(15)

# ----------------------------------------------------------------
print("\n=== 7. Marketing content generation ===")
r = post("/marketing/generate", {"product_id": "LT-003", "content_type": "social", "tone": "persuasive", "count": 2})
print(f"  product={r.get('product')}")
print(f"  variations={r.get('variations')}")
check("Product name present", r.get("product") == "ProBook X7 Creator", f"product={r.get('product')}")
check("Two variations returned", len(r.get("variations", [])) == 2, f"count={len(r.get('variations', []))}")

# ----------------------------------------------------------------
print("\n=== 8. Inventory simulation ===")
r = post("/simulate/inventory-check", {})
print(f"  count={r.get('count')}, actions={len(r.get('actions_taken', []))}")
check("Actions taken list exists", isinstance(r.get("actions_taken"), list))
check("Low-stock items flagged", r.get("count", 0) >= 1, f"count={r.get('count')}")

# ----------------------------------------------------------------
print("\n=== 9. Logs endpoint ===")
r = get("/logs")
check("Logs returned as list", isinstance(r, list))
check("Has log entries", len(r) > 0, f"len={len(r)}")

# ----------------------------------------------------------------
print("\n=== 10. Direct order endpoint ===")
r = get("/orders/ORD-1001")
check("Order found", r.get("found") == True, str(r))
check("Correct order ID", r.get("order_id") == "ORD-1001", str(r))

# ----------------------------------------------------------------
print(f"\n{'='*50}")
print(f"RESULTS: {PASS} passed, {FAIL} failed out of {PASS+FAIL} total")
print(f"{'='*50}")
sys.exit(0 if FAIL == 0 else 1)
