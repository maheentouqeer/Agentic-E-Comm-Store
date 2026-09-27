"""
Retrieval for the Agentic RAG Chatbot.

Tries real embedding-based semantic search first. If Gemini embeddings
aren't available (no API key, or the call fails), falls back to a plain
keyword-overlap scorer — no external vector DB needed at this corpus size
(a few dozen documents), and the fallback means retrieval still works and
is still testable with no API key configured, same philosophy as llm.py.

The corpus is embedded once at process start (`_build_index`), not per
request — a real RAG system that ignores request latency isn't a
production one.
"""

import math
import re

from knowledge import build_corpus
from llm import embed

_CORPUS = None          # list of {id, text}
_EMBEDDINGS = None      # list of vectors, parallel to _CORPUS, or None if unavailable
_MODE = None            # "embedding" or "keyword", set on first build


def _cosine(a, b) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def _tokenize(text: str):
    return set(re.findall(r"[a-z0-9]+", text.lower()))


def _build_index():
    """Builds the corpus once and tries to embed it. If any embedding call
    fails (e.g. no API key), the whole index falls back to keyword mode —
    a mix of both would be confusing to reason about and to demo."""
    global _CORPUS, _EMBEDDINGS, _MODE

    _CORPUS = build_corpus()
    vectors = []
    for doc in _CORPUS:
        vec = embed(doc["text"])
        if vec is None:
            _EMBEDDINGS = None
            _MODE = "keyword"
            return
        vectors.append(vec)

    _EMBEDDINGS = vectors
    _MODE = "embedding"


def retrieve(query: str, k: int = 4):
    """Returns the top-k most relevant {id, text, score} documents for `query`."""
    if _CORPUS is None:
        _build_index()

    if _MODE == "embedding":
        q_vec = embed(query)
        if q_vec is not None:
            scored = [
                {**doc, "score": round(_cosine(q_vec, vec), 4)}
                for doc, vec in zip(_CORPUS, _EMBEDDINGS)
            ]
            scored.sort(key=lambda d: d["score"], reverse=True)
            return scored[:k]
        # embedding the query failed even though the corpus was embedded
        # earlier (e.g. transient error) — fall through to keyword mode
        # for this one request rather than failing the whole response.

    q_tokens = _tokenize(query)
    scored = []
    for doc in _CORPUS:
        overlap = len(q_tokens & _tokenize(doc["text"]))
        scored.append({**doc, "score": overlap})
    scored.sort(key=lambda d: d["score"], reverse=True)
    top = [d for d in scored[:k] if d["score"] > 0]
    return top if top else scored[:k]  # never return nothing — better a weak match than no grounding


def mode() -> str:
    if _CORPUS is None:
        _build_index()
    return _MODE
