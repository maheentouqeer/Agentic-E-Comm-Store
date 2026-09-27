"""
Marketing Content Agent.

Not conversational — a content generator pointed at a specific product.
Same "facts from Python, language from Gemini" split as everywhere else:
the specs injected into the prompt come straight from mock_data, so the
model can embellish tone but can't invent a spec that doesn't exist.
"""

from mock_data import PRODUCTS
from llm import generate_json

CONTENT_PROMPTS = {
    "ad_copy": "punchy one-line ad headlines (under 15 words each)",
    "product_description": "persuasive product page descriptions (50-80 words each)",
    "social_caption": "engaging Instagram/social captions with 2-3 relevant hashtags each",
    "email_subject": "compelling email subject lines (under 10 words each)",
}

FALLBACK_TEMPLATES = {
    "ad_copy": [
        "Experience seamless performance with the {name} — starting at ${price}.",
        "Engineered for {use_case}: Meet the all-new {name}.",
        "Upgrade your workflow with {name} for just ${price}."
    ],
    "product_description": [
        "The {name} combines powerful performance with incredible efficiency. Featuring {spec_line}, it's built to power through demanding {use_case} tasks with ease.",
        "Elevate your daily computing experience with {name}. Designed specifically for {use_case}, it delivers top-tier responsiveness at an accessible ${price} price point.",
        "Precision engineering meets exceptional value in the {name}. Equipped for {use_case}, this system ensures smooth multitasking and reliable speed every single day."
    ],
    "social_caption": [
        "Upgrade your setup with the {name}! 🚀 Built for {use_case} at just ${price}. #Tech #TechUpgrade #{category}",
        "Meet your next productivity powerhouse: {name} ✨ Perfect for {use_case}. Link in bio! #{category} #Hardware",
        "Say hello to speed and reliability with the {name} ⚡️ Grab yours today for ${price}. #Innovation #TechDeals"
    ],
    "email_subject": [
        "Meet the {name}: Built for {use_case} starting at ${price}",
        "Exclusive offer: Upgrade to {name} today",
        "Transform your workflow with the new {name}"
    ]
}


def generate_content(product_id: str, content_type: str = "product_description",
                      tone: str = "professional", count: int = 3):
    product = next((p for p in PRODUCTS if p["id"] == product_id), None)
    if not product:
        return {"error": f"No product with SKU '{product_id}'"}

    content_type_key = content_type if content_type in CONTENT_PROMPTS else "product_description"
    instruction = CONTENT_PROMPTS[content_type_key]

    spec_line = (
        f"{product['name']}: {product['cpu']}, {product['ram_gb']}GB RAM, "
        f"{product['gpu']}, ${product['price_usd']}, ideal for {product['use_case']}."
        if product["category"] == "laptop"
        else f"{product['name']}, ${product['price_usd']}, ideal for {product['use_case']}."
    )

    use_case_first = product['use_case'].split('/')[0]
    category_title = product['category'].title()

    templates = FALLBACK_TEMPLATES.get(content_type_key, FALLBACK_TEMPLATES["product_description"])
    fallback_variations = [
        t.format(
            name=product['name'],
            price=product['price_usd'],
            use_case=use_case_first,
            spec_line=spec_line,
            category=category_title
        )
        for t in templates[:count]
    ]

    fallback = {"variations": fallback_variations}

    prompt = (
        f"Product facts (do not alter): {spec_line}\n\n"
        f"Task: Generate exactly {count} distinct {instruction}.\n"
        f"Tone: {tone}.\n"
        f"Requirements: Each variation must be meaningfully different in phrasing and focus.\n\n"
        "Respond with ONLY a JSON object formatted as:\n"
        '{"variations": ["Variation 1 text...", "Variation 2 text...", "Variation 3 text..."]}'
    )

    res = generate_json(prompt, fallback)
    variations = res.get("variations") if isinstance(res, dict) and isinstance(res.get("variations"), list) else None

    if not variations or len(variations) < count:
        variations = fallback_variations

    return {"product": product["name"], "content_type": content_type, "variations": variations[:count]}
