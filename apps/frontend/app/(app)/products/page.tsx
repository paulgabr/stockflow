import type { Metadata } from "next";
import { Package } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Produtos · StockFlow",
};

export default function ProductsPage() {
  return (
    <>
      <PageHeader
        title="Produtos"
        description="Cadastre e acompanhe o saldo de cada item do seu estoque."
      />
      <EmptyState
        icon={Package}
        title="Em construção"
        description="A listagem de produtos chega na próxima etapa."
      />
    </>
  );
}
