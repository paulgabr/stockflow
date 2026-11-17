import type { Product } from "./types";

export type StockStatus = "in" | "low" | "out";

export const stockStatusLabels: Record<StockStatus, string> = {
  in: "Em estoque",
  low: "Estoque baixo",
  out: "Sem estoque",
};

export function getStockStatus(
  product: Pick<Product, "quantity" | "minQuantity">,
): StockStatus {
  if (product.quantity === 0) {
    return "out";
  }

  return product.quantity <= product.minQuantity ? "low" : "in";
}

export function isStockStatus(value: unknown): value is StockStatus {
  return value === "in" || value === "low" || value === "out";
}
