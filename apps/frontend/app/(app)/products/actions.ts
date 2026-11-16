"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";

import { ApiError, apiFetch } from "@/lib/api";
import { manualAdjustmentReasons } from "@/lib/stock-movements";

// Product.price is Decimal(10, 2) in the database.
const MAX_PRICE = 99_999_999.99;

// Accepts both "1.234,56" (pt-BR) and "1234.56".
function parsePrice(value: string) {
  const normalized = value.includes(",")
    ? value.replace(/\./g, "").replace(",", ".")
    : value;

  return /^\d+(\.\d{1,2})?$/.test(normalized) ? Number(normalized) : NaN;
}

const priceField = z
  .string()
  .trim()
  .min(1, { error: "Informe o preço." })
  .transform(parsePrice)
  .pipe(
    z
      .number({ error: "Use um valor como 19,90." })
      .min(0, { error: "O preço não pode ser negativo." })
      .max(MAX_PRICE, { error: "Preço acima do limite permitido." }),
  );

const BaseProductSchema = z.object({
  name: z.string().trim().min(1, { error: "Informe o nome do produto." }),
  sku: z.string().trim().min(1, { error: "Informe o SKU." }),
  description: z.string().trim(),
  price: priceField,
});

const quantityField = z
  .string()
  .trim()
  .regex(/^\d+$/, { error: "Use um número inteiro, como 0 ou 25." })
  .transform(Number)
  .pipe(
    z
      .number()
      .max(2_147_483_647, { error: "Quantidade acima do limite permitido." }),
  );

const CreateProductSchema = BaseProductSchema.extend({ quantity: quantityField });

const AdjustStockSchema = z
  .object({
    quantity: quantityField,
    reason: z.enum(manualAdjustmentReasons, {
      error: "Escolha o motivo do ajuste.",
    }),
    note: z
      .string()
      .trim()
      .max(200, { error: "Use no máximo 200 caracteres." }),
  })
  .refine((data) => data.reason !== "OTHER" || data.note.length > 0, {
    path: ["note"],
    error: "Descreva o motivo do ajuste.",
  });

export type ProductFormValues = {
  name: string;
  sku: string;
  description: string;
  price: string;
  // Only on create; stock changes afterwards go through adjustStock.
  quantity?: string;
};

export type ProductFormState =
  | {
      ok?: boolean;
      values?: ProductFormValues;
      errors?: Partial<Record<keyof ProductFormValues, string[]>>;
      message?: string;
    }
  | undefined;

export type ArchiveProductState = { ok?: boolean; message?: string } | undefined;

function readValues(formData: FormData): ProductFormValues {
  const get = (key: string) => String(formData.get(key) ?? "");

  return {
    name: get("name"),
    sku: get("sku"),
    description: get("description"),
    price: get("price"),
    ...(formData.has("quantity") && { quantity: get("quantity") }),
  };
}

function failure(values: ProductFormValues, error: unknown): ProductFormState {
  if (error instanceof ApiError && error.status === 409) {
    return {
      values,
      errors: { sku: ["Já existe um produto com este SKU."] },
    };
  }

  if (error instanceof ApiError && error.status === 404) {
    return {
      values,
      message: "Este produto não existe mais. Atualize a página.",
    };
  }

  if (error instanceof ApiError || error instanceof TypeError) {
    return {
      values,
      message: "Não foi possível salvar o produto. Tente novamente.",
    };
  }

  // Lets Next.js redirects (e.g. an expired session) propagate.
  throw error;
}

function revalidateProducts() {
  revalidatePath("/products");
  revalidatePath("/dashboard");
  revalidatePath("/movements");
}

export async function createProduct(
  _previousState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const values = readValues(formData);
  const parsed = CreateProductSchema.safeParse(values);

  if (!parsed.success) {
    return { values, errors: z.flattenError(parsed.error).fieldErrors };
  }

  const { description, ...data } = parsed.data;

  try {
    await apiFetch("/products", {
      method: "POST",
      body: JSON.stringify({ ...data, ...(description && { description }) }),
    });
  } catch (error) {
    return failure(values, error);
  }

  revalidateProducts();

  return { ok: true };
}

// Stock is not edited here: it changes through adjustStock, so every change is
// recorded in the movement history.
export async function updateProduct(
  id: string,
  _previousState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const values = readValues(formData);
  const parsed = BaseProductSchema.safeParse(values);

  if (!parsed.success) {
    return { values, errors: z.flattenError(parsed.error).fieldErrors };
  }

  const { description, ...data } = parsed.data;

  try {
    await apiFetch(`/products/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ ...data, description: description || null }),
    });
  } catch (error) {
    return failure(values, error);
  }

  revalidateProducts();

  return { ok: true };
}

export async function archiveProduct(id: string): Promise<ArchiveProductState> {
  try {
    await apiFetch(`/products/${encodeURIComponent(id)}`, { method: "DELETE" });
  } catch (error) {
    if (error instanceof ApiError || error instanceof TypeError) {
      return { message: "Não foi possível arquivar o produto. Tente novamente." };
    }

    throw error;
  }

  revalidateProducts();

  return { ok: true };
}

export type AdjustStockValues = {
  quantity: string;
  reason: string;
  note: string;
};

export type AdjustStockState =
  | {
      ok?: boolean;
      values?: AdjustStockValues;
      errors?: Partial<Record<keyof AdjustStockValues, string[]>>;
      message?: string;
    }
  | undefined;

// Sets the stock to the correct balance; the API records the difference as an
// ADJUSTMENT movement with its reason.
export async function adjustStock(
  productId: string,
  _previousState: AdjustStockState,
  formData: FormData,
): Promise<AdjustStockState> {
  const values: AdjustStockValues = {
    quantity: String(formData.get("quantity") ?? ""),
    reason: String(formData.get("reason") ?? ""),
    note: String(formData.get("note") ?? ""),
  };

  const parsed = AdjustStockSchema.safeParse(values);

  if (!parsed.success) {
    return { values, errors: z.flattenError(parsed.error).fieldErrors };
  }

  const { note, ...data } = parsed.data;

  try {
    await apiFetch("/stock-movements/adjustments", {
      method: "POST",
      body: JSON.stringify({ productId, ...data, ...(note && { note }) }),
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 400) {
      return {
        values,
        errors: { quantity: ["Informe um saldo diferente do atual."] },
      };
    }

    if (error instanceof ApiError && error.status === 409) {
      return {
        values,
        message:
          "O estoque deste produto mudou enquanto você ajustava. Feche e abra de novo para ver o saldo atual.",
      };
    }

    if (error instanceof ApiError && error.status === 404) {
      return {
        values,
        message: "Este produto não existe mais. Atualize a página.",
      };
    }

    if (error instanceof ApiError || error instanceof TypeError) {
      return {
        values,
        message: "Não foi possível ajustar o estoque. Tente novamente.",
      };
    }

    throw error;
  }

  revalidateProducts();

  return { ok: true };
}
