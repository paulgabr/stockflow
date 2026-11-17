import type { Metadata } from "next";
import { Package, Plus } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { apiFetch } from "@/lib/api";
import { isStockStatus } from "@/lib/stock-status";
import type { Product } from "@/lib/types";

import { ProductFormDialog } from "./product-dialogs";
import { ProductsTable } from "./products-table";
import styles from "./products.module.css";

export const metadata: Metadata = {
  title: "Produtos · StockFlow",
};

function NewProductButton() {
  return (
    <ProductFormDialog
      trigger={
        <button type="button" className={styles.primaryButton}>
          <Plus size={18} aria-hidden />
          Novo produto
        </button>
      }
    />
  );
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [products, { status }] = await Promise.all([
    apiFetch<Product[]>("/products"),
    searchParams,
  ]);

  return (
    <>
      <PageHeader
        title="Produtos"
        description="Cadastre e acompanhe o saldo de cada item do seu estoque."
        actions={products.length > 0 && <NewProductButton />}
      />

      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Nenhum produto cadastrado"
          description="Os produtos que você cadastrar aparecem aqui, com preço e saldo em estoque."
          action={
            <div className={styles.emptyAction}>
              <NewProductButton />
            </div>
          }
        />
      ) : (
        <ProductsTable
          products={products}
          initialStatus={isStockStatus(status) ? status : undefined}
        />
      )}
    </>
  );
}
