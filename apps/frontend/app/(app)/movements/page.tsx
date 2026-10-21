import type { Metadata } from "next";
import { ArrowLeftRight } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Movimentações · StockFlow",
};

export default function MovementsPage() {
  return (
    <>
      <PageHeader
        title="Movimentações"
        description="Histórico de entradas e saídas do seu estoque."
      />
      <EmptyState
        icon={ArrowLeftRight}
        title="Em construção"
        description="O histórico de movimentações chega em uma das próximas etapas."
      />
    </>
  );
}
