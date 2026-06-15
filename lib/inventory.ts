import { DEFAULT_REORDER_LEVEL, type Medicine } from "@/data/snapshot";

export type InventoryItem = Medicine & {
  available: number;
  remaining: number;
  effectiveReorder: number;
  low: boolean;
  pct: number; // remaining / available, 0..100
};

export type InventoryResponse = {
  ok: boolean;
  source: "sheet" | "snapshot";
  tab: string;
  items: InventoryItem[];
  generatedAt: string;
  error?: string;
};

export function decorate(items: Medicine[]): InventoryItem[] {
  return items.map((m) => {
    const available = (m.beginning || 0) + (m.received || 0);
    const remaining = available - (m.dispensed || 0);
    const effectiveReorder = m.reorder && m.reorder > 0 ? m.reorder : DEFAULT_REORDER_LEVEL;
    const pct = available > 0 ? Math.max(0, Math.min(100, Math.round((remaining / available) * 100))) : 0;
    return {
      ...m,
      available,
      remaining,
      effectiveReorder,
      low: remaining <= effectiveReorder,
      pct,
    };
  });
}

export function categories(items: InventoryItem[]): string[] {
  return Array.from(new Set(items.map((i) => i.category || "Uncategorized"))).sort();
}
