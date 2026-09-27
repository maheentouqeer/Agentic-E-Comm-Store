import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { getProduct, type Product } from "@/data/products";

export interface CartLine {
  productId: string;
  qty: number;
}

export interface CartLineView extends CartLine {
  product: Product;
  lineTotal: number;
}

interface CartContextValue {
  lines: CartLineView[];
  count: number;
  subtotal: number;
  add: (productId: string, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [rawLines, setRawLines] = useState<CartLine[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const add = useCallback((productId: string, qty = 1) => {
    setRawLines((prev) => {
      const existing = prev.find((l) => l.productId === productId);
      if (existing) {
        return prev.map((l) => (l.productId === productId ? { ...l, qty: l.qty + qty } : l));
      }
      return [...prev, { productId, qty }];
    });
    setDrawerOpen(true);
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    setRawLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.productId !== productId)
        : prev.map((l) => (l.productId === productId ? { ...l, qty } : l)),
    );
  }, []);

  const remove = useCallback((productId: string) => {
    setRawLines((prev) => prev.filter((l) => l.productId !== productId));
  }, []);

  const clear = useCallback(() => setRawLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const lines: CartLineView[] = rawLines.flatMap((line) => {
      const product = getProduct(line.productId);
      if (!product) return [];
      return [{ ...line, product, lineTotal: product.price_usd * line.qty }];
    });
    return {
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      subtotal: lines.reduce((n, l) => n + l.lineTotal, 0),
      add,
      setQty,
      remove,
      clear,
      drawerOpen,
      setDrawerOpen,
    };
  }, [rawLines, add, setQty, remove, clear, drawerOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
