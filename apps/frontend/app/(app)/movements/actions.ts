"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";

import { ApiError, apiFetch } from "@/lib/api";

const MovementSchema = z.object({
  type: z.enum(["IN", "OUT"], { error: "Escolha entrada ou saída." }),
  productId: z.uuid({ error: "Escolha um produto." }),
  quantity: z
    .string()
    .trim()
    .regex(/^\d+$/, { error: "Use um número inteiro, como 1 ou 25." })
    .transform(Number)
    .pipe(
      z
        .number()
        .min(1, { error: "A quantidade precisa ser pelo menos 1." })
        .max(2_147_483_647, { error: "Quantidade acima do limite permitido." }),
    ),
  note: z.string().trim().max(200, { error: "Use no máximo 200 caracteres." }),
});

export type MovementFormValues = {
  type: string;
  productId: string;
  quantity: string;
  note: string;
};

export type MovementFormState =
  | {
      ok?: boolean;
      values?: MovementFormValues;
      errors?: Partial<Record<keyof MovementFormValues, string[]>>;
      message?: string;
    }
  | undefined;

export async function createMovement(
  _previousState: MovementFormState,
  formData: FormData,
): Promise<MovementFormState> {
  const get = (key: string) => String(formData.get(key) ?? "");
  const values: MovementFormValues = {
    type: get("type"),
    productId: get("productId"),
    quantity: get("quantity"),
    note: get("note"),
  };

  const parsed = MovementSchema.safeParse(values);

  if (!parsed.success) {
    return { values, errors: z.flattenError(parsed.error).fieldErrors };
  }

  const { note, ...data } = parsed.data;

  try {
    await apiFetch("/stock-movements", {
      method: "POST",
      body: JSON.stringify({ ...data, ...(note && { note }) }),
    });
  } catch (error) {
    // The API only answers 400 here when an OUT is larger than the stock.
    if (error instanceof ApiError && error.status === 400) {
      return {
        values,
        errors: {
          quantity: [
            "Não há estoque suficiente. O saldo pode ter mudado; feche e abra de novo para ver o atual.",
          ],
        },
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
        message: "Não foi possível registrar a movimentação. Tente novamente.",
      };
    }

    // Lets Next.js redirects (e.g. an expired session) propagate.
    throw error;
  }

  revalidatePath("/movements");
  revalidatePath("/products");
  revalidatePath("/dashboard");

  return { ok: true };
}
