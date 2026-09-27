# Agentic E-Commerce Demo (v2 — Agentic RAG architecture)

Backend for a 3-agent e-commerce automation demo: an **Agentic RAG Chatbot**,
a **Voice Agent** (a thin layer over the same chatbot), and a **Marketing
Agent**. UI is built separately in Bolt and talks to this backend over the
API contract below.

## Architecture

```
customer message → retrieve relevant context (RAG: products + policies)
                  → decide if a tool is needed (agentic reasoning, JSON)
                  → execute tool for real, if one was chosen
                  → generate final answer from context + tool result

tools: search_products · calculate_quote · get_order_status · check_inventory_status
```

The tool-decision step is a manual, explicit loop (not the SDK's built-in
function-calling) — see the docstring at the top of `agents/rag_chatbot.py`
for why, and have that explanation ready if asked in the interview.

## Setup

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env        # add your GEMINI_API_KEY (free at aistudio.google.com/apikey)
uvicorn main:app --reload --port 8000
```

## ⚠️ Important — what's tested vs. what needs your live key

Everything in this repo was tested end-to-end **without** a live Gemini key,
using the built-in fallback paths — retrieval falls back to keyword
matching, and every tool has a deterministic, tool-aware fallback response.
All of that is verified working.

**The one thing that cannot be tested without your real `GEMINI_API_KEY`:
the tool-*decision* step itself** (`_decide()` in `rag_chatbot.py`). That
step needs a live Gemini JSON call to reason "does this message need
`calculate_quote`, and with what arguments?" — in fallback mode it always
returns "no tool needed," so quote/order/stock questions get answered from
retrieved context alone rather than triggering the actual tool.

**Before your demo:** add your API key and manually test a few messages
that should trigger each tool — e.g. "quote for 30 units of LT-002 to
Europe," "where's my order ORD-1002," "is LT-003 in stock" — and check the
`tools_used` field in the response actually shows the tool fired. This is
the single highest-risk part of the whole system to verify live, precisely
because I couldn't verify it for you in this sandboxed build.

## API contract (for Bolt / the frontend)

**`POST /chat`**
```json
// request
{ "message": "string", "session_id": "string (optional)", "history": [{"role":"user","content":"..."}] }
// response
{ "response": "string", "tools_used": ["calculate_quote"], "tool_result": {...} | null, "retrieved": ["doc snippet", ...] }
```
Show `tools_used` and `retrieved` somewhere in the UI (even a collapsed
"agent reasoning" panel) — it's the most convincing thing you can put on
screen, since it proves the retrieval and tool-calling are real rather than
claimed.

**`POST /marketing/generate`**
```json
// request
{ "product_id": "LT-002", "content_type": "ad_copy | product_description | social_caption | email_subject", "tone": "professional", "count": 3 }
// response
{ "product": "string", "content_type": "string", "variations": ["...", "..."] }
```

**`GET /products`** → full catalog, for populating dropdowns/product grids.

**`GET /orders/{order_id}`** → direct order lookup (used internally by chat, also exposed directly).

**`POST /simulate/inventory-check`** → manually triggers the autonomous
inventory scan for the live demo (`{"actions_taken": [...], "count": N}`).

**`POST /simulate/restock/{sku}?qty=20`** → simulates a shipment arriving,
so you can demo the reorder loop more than once.

**`GET /logs`** → every autonomous action the inventory agent has taken,
newest first — good for an "ops dashboard" panel in Bolt.

## Voice Agent — no new backend code required (yet)

The Voice Agent is a client-side layer, not a separate backend agent:
mic → speech-to-text → `POST /chat` (exactly as above) → speech-to-text
response spoken aloud. Two options for Bolt to implement:

- **Zero backend work:** browser's built-in Web Speech API for both STT and
  TTS — just JS calling the existing `/chat` endpoint.
- **Higher quality:** if you want server-side STT/TTS (e.g. Groq
  Whisper + PlayAI, matching your Karigar voice work), tell me and I'll add
  `/voice/transcribe` and `/voice/speak` endpoints — not built yet since it
  depends on which path you pick.

## Suggested live demo order

1. **Inventory check** — run it, show it draft a PO, run it again to prove
   it doesn't duplicate. Strongest 60 seconds, and it's not "a chatbot."
2. **Agentic RAG Chatbot** — ask a quote question, then open the "agent
   reasoning" panel to show the retrieved context + which tool fired.
3. **Voice Agent** — same brain, ask it something by voice.
4. **Marketing Agent** — generate ad copy for a product, end on something
   immediately recognizable as valuable.

## Deploying

- Backend → Railway: point at `backend/`, set `GEMINI_API_KEY`, start
  command `uvicorn main:app --host 0.0.0.0 --port $PORT`.
- Frontend (Bolt export) → Vercel, pointed at your Railway URL.

## Production roadmap (if asked "what's next")

- Real DB instead of `mock_data.py`.
- Real scheduler for the inventory check instead of a manual endpoint.
- Human-in-the-loop approval above a $ threshold for quotes and POs.
- Real supplier integration instead of a logged draft message.
- Conversation memory persisted per session instead of client-passed history.
