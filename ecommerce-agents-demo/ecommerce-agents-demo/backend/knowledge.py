"""
Knowledge base for the Agentic RAG Chatbot.

Two kinds of documents get retrieved against:
  1. Product docs — auto-generated from mock_data.PRODUCTS, so they can
     never drift out of sync with the real catalog (no hand-maintained
     duplicate text to go stale).
  2. Policy docs — the kind of static business info a real e-commerce
     support/sales conversation constantly needs (warranty, shipping,
     payment terms) that isn't in the product table at all.

In production these would come from a real CMS/DB; for the demo they're
plain Python so retrieval.py has something real to search over.
"""

from mock_data import PRODUCTS

POLICY_DOCS = [
    {
        "id": "policy-warranty",
        "text": (
            "Warranty policy: All laptops carry a 1-year manufacturer warranty "
            "covering hardware defects. Monitors and accessories carry a 6-month "
            "warranty. Warranty does not cover accidental damage or liquid damage. "
            "RMA requests are processed within 3-5 business days of receiving the item."
        ),
    },
    {
        "id": "policy-shipping",
        "text": (
            "Shipping policy: Local orders ship free within 2-3 business days. "
            "Regional orders (within the same region) cost $25 flat and arrive in "
            "5-7 business days. International/export orders cost $60 flat and arrive "
            "in 10-14 business days, and require a commercial invoice for customs."
        ),
    },
    {
        "id": "policy-payment",
        "text": (
            "Payment terms: Retail orders are paid in full at checkout. B2B/export "
            "bulk orders (10+ units) can be split as 50% deposit to confirm the order "
            "and 50% before shipment. Bulk orders of 10+ units get tiered discounts; "
            "see the quote tool for exact pricing."
        ),
    },
    {
        "id": "policy-returns",
        "text": (
            "Returns policy: Unopened items can be returned within 14 days for a "
            "full refund. Opened items can be exchanged within 7 days if defective. "
            "B2B/export orders are final sale once shipped, except for manufacturer "
            "defects covered under warranty."
        ),
    },
]


def _product_to_doc(p: dict) -> dict:
    if p["category"] == "laptop":
        text = (
            f"{p['name']} (SKU {p['id']}): {p['cpu']}, {p['ram_gb']}GB RAM, "
            f"{p['storage_gb']}GB storage, {p['gpu']} graphics. Priced at "
            f"${p['price_usd']}. Best suited for {p['use_case']}. "
            f"Currently {p['stock']} units in stock."
        )
    else:
        text = (
            f"{p['name']} (SKU {p['id']}), category {p['category']}. "
            f"Priced at ${p['price_usd']}. Best suited for {p['use_case']}. "
            f"Currently {p['stock']} units in stock."
        )
    return {"id": f"product-{p['id']}", "text": text}


def build_corpus():
    """Returns the full list of {id, text} documents to embed/search over."""
    return [_product_to_doc(p) for p in PRODUCTS] + POLICY_DOCS
