export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  companyId: string;
  company: { id: string; name: string };
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  price: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
};

export type StockMovementType = "IN" | "OUT" | "ADJUSTMENT";

export type StockAdjustmentReason =
  | "INITIAL_STOCK"
  | "INVENTORY_COUNT"
  | "ENTRY_ERROR"
  | "DAMAGE_OR_LOSS"
  | "OTHER";

export type StockMovement = {
  id: string;
  type: StockMovementType;
  // Always positive; use getMovementDelta() for the signed change.
  quantity: number;
  createdAt: string;
  // Only set for ADJUSTMENT movements.
  reason: StockAdjustmentReason | null;
  note: string | null;
  previousQuantity: number | null;
  newQuantity: number | null;
  productId: string;
  product: Product;
};

export type Paginated<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
