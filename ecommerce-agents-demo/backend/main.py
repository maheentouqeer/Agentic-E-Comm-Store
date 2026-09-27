"""
E-Commerce Agent Demo — FastAPI entry point (v2: Agentic RAG architecture).

Three agents, matching what's being demoed:
  - Agentic RAG Chatbot  (/chat)               — the core conversational brain
  - Marketing Agent      (/marketing/generate) — content generation
  - Inventory Agent      (background/admin)    — autonomous stock monitoring,
                                                   also reachable as a tool
                                                   the chatbot can call

Voice is NOT a separate backend agent — it's a thin client-side layer
(mic -> /chat -> speaker) on top of the same chatbot. No new logic needed
here unless you want server-side STT/TTS (see README for that option).

Run locally:
    uvicorn main:app --reload --port 8000
"""
from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent / ".env")

  # must run before importing llm, so GEMINI_API_KEY is set in time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from mock_data import PRODUCTS, ORDERS
from agents import rag_chatbot, marketing_agent, inventory_agent
from llm import is_live
from retrieval import mode as retrieval_mode

app = FastAPI(title="E-Commerce Agent Demo", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    history: Optional[list[ChatMessage]] = None


class MarketingRequest(BaseModel):
    product_id: str
    content_type: str = "product_description"
    tone: str = "professional"
    count: int = 3


@app.get("/")
def health():
    return {"status": "ok", "llm_live": is_live(), "retrieval_mode": retrieval_mode()}


@app.get("/products")
def list_products():
    return PRODUCTS


@app.post("/chat")
def chat(req: ChatRequest):
    """Single entry point for the Agentic RAG Chatbot. The Voice Agent calls
    this exact endpoint too — same brain, different input/output modality."""
    history = [h.model_dump() for h in req.history] if req.history else []
    return rag_chatbot.handle(req.message, history)


@app.post("/marketing/generate")
def marketing(req: MarketingRequest):
    return marketing_agent.generate_content(
        req.product_id, req.content_type, req.tone, req.count
    )


class CreateOrderRequest(BaseModel):
    order_id: str
    customer: str
    item: str
    status: str = "processing"
    eta_days: int = 5


@app.get("/orders/{order_id}")
def order_status(order_id: str):
    from tools import get_order_status
    return get_order_status(order_id)


@app.post("/orders")
def create_order(req: CreateOrderRequest):
    order = {
        "order_id": req.order_id.upper(),
        "customer": req.customer,
        "item": req.item,
        "status": req.status,
        "eta_days": req.eta_days,
    }
    # Avoid duplicate order IDs
    if not any(o["order_id"] == order["order_id"] for o in ORDERS):
        ORDERS.append(order)
    return {"status": "created", "order": order}


@app.post("/simulate/inventory-check")
def run_inventory_check():
    """Manually triggers the autonomous inventory agent — for the live demo.
    In production this is a scheduled job, not a button. The same underlying
    check is also reachable mid-conversation via the chatbot's
    check_inventory_status tool."""
    actions = inventory_agent.check_inventory()
    return {"actions_taken": actions, "count": len(actions)}


@app.post("/simulate/restock/{sku}")
def restock(sku: str, qty: int = 20):
    result = inventory_agent.simulate_restock(sku, qty)
    if result is None:
        return {"error": f"No product with SKU {sku}"}
    return result


@app.get("/logs")
def get_logs():
    """Powers an ops-dashboard view — every autonomous action the inventory
    agent has taken, newest first."""
    return inventory_agent.get_log()
