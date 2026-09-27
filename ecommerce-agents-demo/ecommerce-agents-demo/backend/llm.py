"""
Thin LLM wrapper around Gemini, using the current `google-genai` SDK
(NOT the deprecated `google-generativeai` package — worth mentioning if
asked, since a lot of tutorials online still show the old one).

Design choice worth explaining in the interview: every agent function passes
a `fallback` string alongside its prompt. If GEMINI_API_KEY isn't set, or the
API call fails/times out, we return the deterministic fallback instead of
crashing. This means:
  1. The whole demo runs end-to-end even with no API key configured.
  2. It mirrors a real production pattern (tiered fallback) — the same idea
     used in larger multi-agent systems so a single LLM outage doesn't take
     down the whole pipeline.
"""

import os

API_KEY = os.getenv("GEMINI_API_KEY")
if API_KEY:
    os.environ["GOOGLE_API_KEY"] = API_KEY

MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")

try:
    from google import genai
    _IMPORT_OK = True
except ImportError:
    _IMPORT_OK = False

_client = None

if _IMPORT_OK and API_KEY:
    try:
        _client = genai.Client(api_key=API_KEY)
    except Exception as e:  # pragma: no cover
        print(f"[llm] Failed to initialize Gemini client: {e}")
        _client = None


def generate(prompt: str, fallback: str) -> str:
    """Generate text with Gemini, or return `fallback` if unavailable/failed."""
    if _client is None:
        return fallback
    for attempt in range(3):
        try:
            response = _client.models.generate_content(model=MODEL_NAME, contents=prompt)
            text = (response.text or "").strip()
            return text if text else fallback
        except Exception as e:
            if attempt < 2:
                import time
                time.sleep(2 * (attempt + 1))
                continue
            print(f"[llm] Gemini call failed, using fallback: {e}")
            return fallback


def generate_json(prompt: str, fallback: dict) -> dict:
    """Ask Gemini for a strict JSON object; returns `fallback` dict if unavailable,
    the call fails, or the response isn't valid JSON. Used for the RAG chatbot's
    tool-selection step, where a broken response must never crash the request."""
    import json
    import re

    if _client is None:
        return fallback
    for attempt in range(3):
        try:
            response = _client.models.generate_content(
                model=MODEL_NAME,
                contents=prompt,
                config={"response_mime_type": "application/json"},
            )
            text = (response.text or "").strip()
            match = re.search(r"\{.*\}", text, re.DOTALL)
            if not match:
                return fallback
            return json.loads(match.group(0))
        except Exception as e:
            if attempt < 2:
                import time
                time.sleep(2 * (attempt + 1))
                continue
            print(f"[llm] Gemini JSON call failed, using fallback: {e}")
            return fallback


EMBED_MODEL = os.getenv("GEMINI_EMBED_MODEL", "gemini-embedding-001")


def embed(text: str):
    """Returns an embedding vector for `text`, or None if embeddings aren't
    available (no key, or the call fails). Callers must handle None by
    falling back to non-embedding retrieval — see retrieval.py."""
    if _client is None:
        return None
    try:
        response = _client.models.embed_content(model=EMBED_MODEL, contents=text)
        return response.embeddings[0].values
    except Exception as e:
        print(f"[llm] Embedding call failed, falling back to keyword retrieval: {e}")
        return None


def is_live() -> bool:
    """Lets endpoints report whether they're running with a real model or fallback mode."""
    return _client is not None
