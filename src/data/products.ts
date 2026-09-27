export type ProductCategory = "laptop" | "monitor" | "accessory";

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  cpu?: string;
  ram_gb?: number;
  storage_gb?: number;
  gpu?: string;
  price_usd: number;
  stock: number;
  use_case: string;
}

export const products: Product[] = [
  {
    id: "LT-001",
    name: "ProBook X3",
    category: "laptop",
    cpu: "Intel i3 12th Gen",
    ram_gb: 8,
    storage_gb: 256,
    gpu: "Integrated",
    price_usd: 380,
    stock: 22,
    use_case: "everyday/office/student",
  },
  {
    id: "LT-002",
    name: "ProBook X5",
    category: "laptop",
    cpu: "Intel i5 12th Gen",
    ram_gb: 8,
    storage_gb: 512,
    gpu: "Integrated",
    price_usd: 550,
    stock: 14,
    use_case: "everyday/office",
  },
  {
    id: "LT-003",
    name: "ProBook X7 Creator",
    category: "laptop",
    cpu: "Intel i7 13th Gen",
    ram_gb: 16,
    storage_gb: 512,
    gpu: "RTX 3050",
    price_usd: 850,
    stock: 4,
    use_case: "gaming/creative/video editing",
  },
  {
    id: "LT-004",
    name: "ProBook X9 Studio",
    category: "laptop",
    cpu: "Intel i9 13th Gen",
    ram_gb: 32,
    storage_gb: 1024,
    gpu: "RTX 4060",
    price_usd: 1450,
    stock: 3,
    use_case: "gaming/creative/video editing/3D rendering",
  },
  {
    id: "LT-005",
    name: "LightBook Air",
    category: "laptop",
    cpu: "Intel i5 12th Gen",
    ram_gb: 16,
    storage_gb: 512,
    gpu: "Integrated",
    price_usd: 620,
    stock: 18,
    use_case: "everyday/office/travel",
  },
  {
    id: "MN-001",
    name: 'ViewMax 24" Monitor',
    category: "monitor",
    price_usd: 140,
    stock: 30,
    use_case: "office/everyday",
  },
  {
    id: "AC-001",
    name: "TypeFast Wireless Keyboard+Mouse",
    category: "accessory",
    price_usd: 35,
    stock: 60,
    use_case: "office/everyday",
  },
];

export const categoryLabels: Record<ProductCategory, string> = {
  laptop: "Laptops",
  monitor: "Monitors",
  accessory: "Accessories",
};

export const useCaseTags = [
  "everyday",
  "office",
  "student",
  "travel",
  "gaming",
  "creative",
  "video editing",
  "3D rendering",
];

export function getProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function formatPrice(usd: number): string {
  return `$${usd.toLocaleString("en-US")}`;
}
