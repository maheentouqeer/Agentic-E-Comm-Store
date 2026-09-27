"""
Marketing Content Agent.

Not conversational — a content generator pointed at a specific product.
Same "facts from Python, language from Gemini" split as everywhere else:
the specs injected into the prompt come straight from mock_data, so the
model can embellish tone but can't invent a spec that doesn't exist.
"""

from mock_data import PRODUCTS
from llm import generate

CONTENT_PROMPTS = {
    "ad_copy": "Write a punchy one-line ad headline (under 15 words) for this product.",
    "product_description": "Write a persuasive product page description (60-90 words).",
    "social_caption": "Write an Instagram/social caption with 2-3 relevant hashtags.",
    "email_subject": "Write a compelling email subject line (under 10 words).",
}


def generate_content(product_id: str, content_type: str = "product_description",
                      tone: str = "professional", count: int = 3):
    product = next((p for p in PRODUCTS if p["id"] == product_id), None)
    if not product:
        return {"error": f"No product with SKU '{product_id}'"}

    instruction = CONTENT_PROMPTS.get(content_type, CONTENT_PROMPTS["product_description"])
    spec_line = (
        f"{product['name']}: {product['cpu']}, {product['ram_gb']}GB RAM, "
        f"{product['gpu']}, ${product['price_usd']}, ideal for {product['use_case']}."
        if product["category"] == "laptop"
        else f"{product['name']}, ${product['price_usd']}, ideal for {product['use_case']}."
    )

    variations = []
    for i in range(count):
        fallback = f"{product['name']} — {product['use_case'].split('/')[0]} made easy, at ${product['price_usd']}."
        prompt = (
            f"Product facts (do not alter): {spec_line}\n\n"
            f"{instruction} Tone: {tone}. "
            f"This is variation {i + 1} of {count} — make it meaningfully different "
            f"from a typical version, not a near-duplicate."
        )
        variations.append(generate(prompt, fallback))

    return {"product": product["name"], "content_type": content_type, "variations": variations}
