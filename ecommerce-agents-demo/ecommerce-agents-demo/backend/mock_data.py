"""
Mock e-commerce dataset for the agent demo.
In production this would be replaced by real DB queries (Postgres/Firestore),
but for the demo it lets every agent run deterministically without a backend DB.
"""

PRODUCTS = [
    {
        "id": "LT-001", "name": "ProBook X3", "category": "laptop",
        "cpu": "Intel i3 12th Gen", "ram_gb": 8, "storage_gb": 256, "gpu": "Integrated",
        "price_usd": 380, "stock": 22, "use_case": "everyday/office/student",
        "reorder_pending": False,
    },
    {
        "id": "LT-002", "name": "ProBook X5", "category": "laptop",
        "cpu": "Intel i5 12th Gen", "ram_gb": 8, "storage_gb": 512, "gpu": "Integrated",
        "price_usd": 550, "stock": 14, "use_case": "everyday/office",
        "reorder_pending": False,
    },
    {
        "id": "LT-003", "name": "ProBook X7 Creator", "category": "laptop",
        "cpu": "Intel i7 13th Gen", "ram_gb": 16, "storage_gb": 512, "gpu": "RTX 3050",
        "price_usd": 850, "stock": 4, "use_case": "gaming/creative/video editing",
        "reorder_pending": False,
    },
    {
        "id": "LT-004", "name": "ProBook X9 Studio", "category": "laptop",
        "cpu": "Intel i9 13th Gen", "ram_gb": 32, "storage_gb": 1024, "gpu": "RTX 4060",
        "price_usd": 1450, "stock": 3, "use_case": "gaming/creative/video editing/3D rendering",
        "reorder_pending": False,
    },
    {
        "id": "LT-005", "name": "LightBook Air", "category": "laptop",
        "cpu": "Intel i5 12th Gen", "ram_gb": 16, "storage_gb": 512, "gpu": "Integrated",
        "price_usd": 620, "stock": 18, "use_case": "everyday/office/travel",
        "reorder_pending": False,
    },
    {
        "id": "MN-001", "name": "ViewMax 24\" Monitor", "category": "monitor",
        "cpu": "-", "ram_gb": 0, "storage_gb": 0, "gpu": "-",
        "price_usd": 140, "stock": 30, "use_case": "office/everyday",
        "reorder_pending": False,
    },
    {
        "id": "AC-001", "name": "TypeFast Wireless Keyboard+Mouse", "category": "accessory",
        "cpu": "-", "ram_gb": 0, "storage_gb": 0, "gpu": "-",
        "price_usd": 35, "stock": 60, "use_case": "office/everyday",
        "reorder_pending": False,
    },
]

ORDERS = [
    {"order_id": "ORD-1001", "customer": "Ali Raza", "item": "ProBook X5", "status": "shipped", "eta_days": 2},
    {"order_id": "ORD-1002", "customer": "Zara Khan", "item": "ProBook X7 Creator", "status": "processing", "eta_days": 5},
    {"order_id": "ORD-1003", "customer": "Bilal Ahmed", "item": "ViewMax 24\" Monitor", "status": "delivered", "eta_days": 0},
]

SUPPLIERS = {
    "laptop": "procurement@globaltech-supply.com",
    "monitor": "sales@displaypartners.com",
    "accessory": "orders@accessoryhub.com",
}
