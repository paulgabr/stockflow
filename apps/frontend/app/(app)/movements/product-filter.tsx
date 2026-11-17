"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

import type { Product } from "@/lib/types";

import styles from "./movements.module.css";

export function ProductFilter({
  products,
  value,
  type,
}: {
  products: Product[];
  value?: string;
  type?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  // A filter on an archived product still works, it just is not in the list.
  const isKnown = !value || products.some((product) => product.id === value);

  function handleChange(productId: string) {
    const params = new URLSearchParams();

    if (type) {
      params.set("type", type);
    }

    if (productId) {
      params.set("product", productId);
    }

    const query = params.toString();

    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname);
    });
  }

  return (
    <select
      value={value ?? ""}
      onChange={(event) => handleChange(event.target.value)}
      className={styles.productFilter}
      aria-label="Filtrar por produto"
      aria-busy={pending}
      data-pending={pending || undefined}
    >
      <option value="">Todos os produtos</option>
      {!isKnown && <option value={value}>Produto arquivado</option>}
      {products.map((product) => (
        <option key={product.id} value={product.id}>
          {product.name} · {product.sku}
        </option>
      ))}
    </select>
  );
}
