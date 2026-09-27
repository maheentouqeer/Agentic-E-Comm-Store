"""
Agentic RAG Chatbot — the core conversational agent.

Deliberately NOT using an SDK's automatic function-calling here. Instead
this is a manual, explicit 3-step loop:

    1. retrieve()      -> ground the model in real product/policy data
    2. decide()         -> ask the model, as strict JSON, whether a tool
                           is needed and with what arguments
    3. act() + answer() -> run the tool for real if one was chosen, then
                           generate the final reply from (retrieved context
                           + tool result)

Why manual instead of the framework's built-in tool-calling: it's fully
inspectable at every step (you can log/return exactly what was retrieved
and exactly what the model decided), it degrades cleanly to a
context-only answer if the JSON step fails, and it doesn't depend on the
SDK's schema-inference matching Python type hints exactly. For an
interview where you need to explain *how* the agent decided something,
"here's the literal JSON it returned" is a much easier thing to point at
than an opaque framework internals.
"""

import json

from llm import generate, generate_json
from retrieval import retrieve
from tools import TOOL_SCHEMAS, TOOL_FUNCTIONS


def _decide(message: str, history_snippet: str) -> dict:
    schema_text = json.dumps(TOOL_SCHEMAS, indent=2)
    prompt = (
        "You are the tool-selection reasoning engine for an e-commerce AI agent.\n"
        "Your ONLY job is to decide which tool (if any) to call based on the customer message.\n\n"
        f"Available Tools:\n{schema_text}\n\n"
        "MANDATORY RULES — follow these in order, stop at the first match:\n\n"
        "RULE 1: If the message mentions an ORDER ID (like ORD-XXXX, order #, order number, "
        "tracking, shipment status, delivery, ETA, 'where is my order') → ALWAYS use get_order_status.\n"
        '  Example: "Track my order ORD-1002" → {{"tool": "get_order_status", "args": {{"order_id": "ORD-1002"}}}}\n\n'
        "RULE 2: If the message asks about STOCK LEVEL, INVENTORY, or 'is X in stock' for a specific "
        "product SKU (like LT-XXX) → ALWAYS use check_inventory_status.\n"
        '  Example: "How many units of LT-003 are in stock?" → {{"tool": "check_inventory_status", "args": {{"product_id": "LT-003"}}}}\n\n'
        "RULE 3: If the message asks for a PRICE QUOTE, BULK PRICING, wholesale cost, or total for "
        "a specific SKU and quantity → ALWAYS use calculate_quote.\n"
        '  Example: "Quote for 30 units of LT-002 international" → {{"tool": "calculate_quote", "args": {{"product_id": "LT-002", "quantity": 30, "destination": "international"}}}}\n\n'
        "RULE 4: If the message asks for PRODUCT RECOMMENDATIONS, comparisons, 'what laptop/monitor for X', "
        "budget constraints, or use-case matching → ALWAYS use search_products.\n"
        '  Example: "laptop for video editing under $900" → {{"tool": "search_products", "args": {{"budget_max": 900, "use_case": "video editing"}}}}\n\n'
        "RULE 5: ONLY return null if the message is a greeting, thanks, general policy question, "
        "or something that clearly doesn't need any data lookup.\n\n"
        f"Recent conversation:\n{history_snippet}\n\n"
        f"Customer message: \"{message}\"\n\n"
        "Respond with ONLY a JSON object, no markdown:\n"
        '{"tool": "<tool_name or null>", "args": {<arguments>}}'
    )
    fallback = {"tool": None, "args": {}}
    return generate_json(prompt, fallback)


def _fallback_for_tool(tool_name: str, tool_result: dict, context_snippet: str) -> str:
    """Builds an informative fallback when the final-answer LLM call is
    unavailable — summarizes the real tool_result instead of an unrelated
    context line, so a rate-limit blip mid-demo still shows correct data."""
    if tool_name == "calculate_quote" and "error" not in tool_result:
        r = tool_result
        return (
            f"Quote: {r['quantity']}x {r['product']} at ${r['unit_price']}/unit "
            f"({r['discount_pct']}% bulk discount), shipping ${r['shipping']}, "
            f"total ${r['total']} ({r['destination']})."
        )
    if tool_name == "get_order_status":
        if tool_result.get("found"):
            r = tool_result
            return f"Order {r['order_id']} ({r['item']}) is '{r['status']}', ETA {r['eta_days']} day(s)."
        return f"I couldn't find order '{tool_result.get('order_id')}' — flagging for a support agent."
    if tool_name == "check_inventory_status" and "error" not in tool_result:
        r = tool_result
        note = " (reorder already in progress)" if r["reorder_pending"] else ""
        return f"{r['name']} ({r['sku']}): {r['stock']} units in stock{note}."
    if tool_name == "search_products":
        if tool_result:
            best = tool_result[0]
            return f"I'd recommend the {best['name']} — ${best['price_usd']}, {best['use_case']}."
        return "No in-stock match for that — want to adjust budget or specs?"
    return context_snippet.split("\n")[0].lstrip("- ") if context_snippet else (
        "I'm not sure — could you rephrase that or give me an order ID or product name?"
    )


def handle(message: str, history: list | None = None) -> dict:
    history = history or []
    history_snippet = "\n".join(f"{h['role']}: {h['content']}" for h in history[-4:]) or "(none yet)"

    # 1. Retrieve grounding context — always runs, regardless of tool use.
    retrieved = retrieve(message, k=4)
    context_snippet = "\n".join(f"- {d['text']}" for d in retrieved)

    # 2. Decide whether a tool is needed.
    decision = _decide(message, history_snippet)
    tool_name = decision.get("tool")
    if isinstance(tool_name, str) and tool_name.strip().lower() in ("null", "none", ""):
        tool_name = None

    tool_result = None

    # 3. Act, if a valid tool was chosen.
    if tool_name in TOOL_FUNCTIONS:
        args = decision.get("args")
        if not isinstance(args, dict):
            args = {}
        try:
            tool_result = TOOL_FUNCTIONS[tool_name](**args)
        except TypeError as e:
            tool_result = {"error": f"Tool called with invalid arguments: {e}"}
    elif tool_name:
        tool_name = None  # model hallucinated a tool name that doesn't exist — ignore it, don't crash

    # 4. Generate the final answer from context + (optional) tool result.
    tool_snippet = f"\nTool result ({tool_name}): {tool_result}" if tool_result else ""
    fallback = (
        _fallback_for_tool(tool_name, tool_result, context_snippet)
        if tool_name else
        (context_snippet.split("\n")[0].lstrip("- ") if context_snippet else
         "I'm not sure — could you rephrase that or give me an order ID or product name?")
    )
    prompt = (
        "You are a helpful, concise e-commerce sales/support assistant for a "
        "hardware and IT-export business. Answer the customer using ONLY the "
        "information below — do not invent prices, specs, or stock numbers.\n\n"
        f"Relevant catalog/policy info:\n{context_snippet}"
        f"{tool_snippet}\n\n"
        f"Customer message: \"{message}\"\n\n"
        "Reply in under 70 words, friendly and direct."
    )
    response_text = generate(prompt, fallback)

    return {
        "response": response_text,
        "tools_used": [tool_name] if tool_name else [],
        "tool_result": tool_result,
        "retrieved": [d["text"] for d in retrieved],
    }
