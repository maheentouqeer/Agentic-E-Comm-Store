# AI Agent Automation for E-Commerce Operations
### Research summary, agent design, and demo overview
Prepared by Maheen Touqeer

---

## 1. How e-commerce operations actually work

Before designing any automation, I mapped the operational lifecycle a typical
online hardware retailer runs through, since the goal isn't to bolt AI onto
a website — it's to automate real steps in a real workflow:

**Discovery → Browse/Search → Cart → Checkout/Payment → Fulfillment →
Shipping/Logistics → Post-Purchase Support → Returns/RMA → Repeat Purchase.**

For a business selling IT hardware (laptops, monitors, accessories) with an
export/B2B side, three things make this more complex than a generic online
store:

- **Spec-driven decisions.** Customers don't just pick a color — they need
  the right CPU/RAM/GPU for a stated use case (office work vs. gaming vs.
  video editing), which most storefronts leave entirely to search filters.
- **Bulk/export quoting.** Wholesale and export orders need tiered pricing,
  shipping-cost variation by destination, and a formal, professional quote
  document — a different process from a normal retail checkout.
- **Physical stock constraints.** Unlike digital goods, running out of a SKU
  has a real lead time. Reordering late directly costs sales; reordering
  blindly ties up cash in dead stock.

## 2. Where agent automation adds real value

| Operational step | Manual pain point | Agent opportunity |
|---|---|---|
| Product discovery | Customers don't know which spec they need | Conversational spec-match assistant |
| Bulk/export inquiry | Manual pricing lookup, manual quote drafting | Automated tiered-pricing quote generator |
| Inventory management | Stockouts noticed too late, or reordering done ad hoc | Autonomous stock-threshold monitor that drafts POs |
| Order support | Repetitive "where's my order" questions | Order lookup with automatic escalation for edge cases |

The common thread: the highest-value automation isn't a general-purpose
chatbot bolted onto the site. It's a small number of agents, each doing one
well-scoped job, with a clear line between what the agent decides
autonomously and what still needs a human.

## 3. What I built

A working prototype built around three agents:

- **Agentic RAG Chatbot** — the core conversational brain. Retrieves relevant
  product/policy context (RAG), reasons about whether a tool is needed —
  a price quote, an order lookup, a stock check — then calls that tool for
  real before answering (the "agentic" part). One entry point handles
  product questions, bulk quotes, and order status, rather than three
  separate bots.
- **Voice Agent** — the same chatbot, with a voice layer on top (speech in,
  speech out). No duplicated logic — proof that the architecture is
  modality-agnostic, not that I built three separate brains.
- **Marketing Agent** — a content generator, not a conversation: point it at
  a product and it produces ad copy, descriptions, or social captions from
  the real spec sheet.

An autonomous Inventory/Reorder check runs underneath all of this — either
on a schedule (production) or as a tool the chatbot itself can call mid-
conversation ("is that in stock?" can trigger a live stock check) — which
is where the demo actually shows automation acting on its own, not just
answering questions.

**Architecture:**
```
customer message → retrieve relevant context (RAG)
                  → decide if a tool is needed (agentic reasoning)
                  → execute tool for real, if one was chosen
                  → generate final answer from context + tool result

tools available: search_products · calculate_quote ·
                 get_order_status · check_inventory_status
```

**Two design decisions I'd highlight:**

1. **The LLM never touches the numbers.** Every tool is plain deterministic
   Python — filtering the catalog, calculating tiered pricing, checking
   stock. The model only ever sees the *result* to phrase in natural
   language. A wrong quote or an invented spec is a real business problem,
   so the model is never in a position to produce one.
2. **Every LLM call has a deterministic fallback**, tool-aware where it
   matters (a quote's fallback summarizes the real calculated numbers, not
   a generic message) — so a missing API key or a failed call degrades
   gracefully instead of breaking the flow.

**Stack:** Python, FastAPI, Gemini (`google-genai`, both generation and
embeddings for retrieval), deployed the same way as my other projects —
Railway for the backend, Vercel for the frontend.

## 4. Why this matters for this business specifically

The Quote Generator agent isn't a generic demo feature — it's built around
this company's actual model: hardware + export. Tiered bulk discounts,
destination-based shipping, and a formatted export quote are the exact
mechanics of a wholesale inquiry. The Inventory Agent addresses a concrete
cost: every day a low-stock item isn't reordered is either a lost sale or a
rushed, worse-priced emergency order.

The value isn't "an AI feature" — it's fewer manual hours on quoting and
restocking, faster response time to customers, and a foundation that scales
to more workflows (returns triage, competitor price monitoring, review
sentiment analysis) without a redesign.

## 5. What I'd do next in production

- Replace the mock catalog/inventory with real database queries.
- Move the inventory check from a manual trigger to a real scheduler.
- Add human-in-the-loop approval for quotes above a value threshold, and for
  any purchase order over a set dollar amount.
- Integrate with a real supplier channel (email API or portal webhook)
  instead of logging a drafted message.
- Add observability: every autonomous action should be logged and
  reviewable, exactly like the ops dashboard in this demo, so trust in the
  agent grows as its track record does.
