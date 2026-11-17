import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  Boxes,
  Package,
  PackageX,
  SlidersHorizontal,
} from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { apiFetch } from "@/lib/api";
import { getCurrentUser } from "@/lib/current-user";
import {
  adjustmentReasonLabels,
  getMovementDelta,
  movementTypeLabels,
} from "@/lib/stock-movements";
import type {
  Paginated,
  Product,
  StockMovement,
  StockMovementType,
} from "@/lib/types";

import styles from "./dashboard.module.css";

export const metadata: Metadata = {
  title: "Visão geral · StockFlow",
};

const numberFormat = new Intl.NumberFormat("pt-BR");
const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const movementIcons: Record<StockMovementType, typeof ArrowDownToLine> = {
  IN: ArrowDownToLine,
  OUT: ArrowUpFromLine,
  ADJUSTMENT: SlidersHorizontal,
};

export default async function DashboardPage() {
  const [user, products, movements] = await Promise.all([
    getCurrentUser(),
    apiFetch<Product[]>("/products"),
    apiFetch<Paginated<StockMovement>>("/stock-movements?limit=6"),
  ]);

  const firstName = user.name.split(" ")[0];
  const unitsInStock = products.reduce((sum, product) => sum + product.quantity, 0);
  const outOfStock = products.filter((product) => product.quantity === 0).length;

  const stats = [
    { label: "Produtos ativos", value: products.length, icon: Package },
    { label: "Unidades em estoque", value: unitsInStock, icon: Boxes },
    {
      label: "Sem estoque",
      value: outOfStock,
      icon: PackageX,
      alert: outOfStock > 0,
    },
    {
      label: "Movimentações",
      value: movements.meta.total,
      icon: ArrowLeftRight,
    },
  ];

  return (
    <>
      <PageHeader
        title={`Olá, ${firstName}`}
        description={`Este é o resumo do estoque de ${user.company.name}.`}
      />

      <section className={styles.stats} aria-label="Indicadores">
        {stats.map(({ label, value, icon: Icon, alert }) => (
          <div key={label} className={styles.stat} data-alert={alert || undefined}>
            <span className={styles.statIcon}>
              <Icon size={18} aria-hidden />
            </span>
            <span className={styles.statValue}>{numberFormat.format(value)}</span>
            <span className={styles.statLabel}>{label}</span>
          </div>
        ))}
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>Últimas movimentações</h2>
          {movements.data.length > 0 && (
            <Link href="/movements" className={styles.panelLink}>
              Ver todas
            </Link>
          )}
        </div>

        {movements.data.length === 0 ? (
          <EmptyState
            icon={ArrowLeftRight}
            title="Nenhuma movimentação ainda"
            description="Entradas, saídas e ajustes de estoque aparecem aqui assim que forem registrados."
          />
        ) : (
          <ul className={styles.movements}>
            {movements.data.map((movement) => {
              const delta = getMovementDelta(movement);
              const Icon = movementIcons[movement.type];
              const label =
                movement.type === "ADJUSTMENT" && movement.reason
                  ? `${movementTypeLabels.ADJUSTMENT} · ${adjustmentReasonLabels[movement.reason]}`
                  : movementTypeLabels[movement.type];

              return (
                <li key={movement.id} className={styles.movement}>
                  <span
                    className={styles.movementIcon}
                    data-type={movement.type}
                    title={label}
                  >
                    <Icon size={16} aria-hidden />
                  </span>
                  <span className={styles.movementProduct}>
                    <span className={styles.movementName}>
                      {movement.product.name}
                    </span>
                    <span className={styles.movementMeta}>
                      <span className={styles.movementSku}>
                        {movement.product.sku}
                      </span>
                      {" · "}
                      {label}
                    </span>
                  </span>
                  <span
                    className={styles.movementQuantity}
                    data-type={movement.type}
                    data-direction={delta >= 0 ? "up" : "down"}
                  >
                    {delta >= 0 ? "+" : "−"}
                    {numberFormat.format(Math.abs(delta))}
                  </span>
                  <time
                    className={styles.movementDate}
                    dateTime={movement.createdAt}
                  >
                    {dateFormat.format(new Date(movement.createdAt))}
                  </time>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
