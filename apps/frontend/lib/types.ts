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

export type StockMovementType = "IN" | "OUT";

export type StockMovement = {
  id: string;
  type: StockMovementType;
  quantity: number;
  createdAt: string;
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
