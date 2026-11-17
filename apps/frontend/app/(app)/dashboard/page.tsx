import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  CircleCheck,
  Package,
  PackageX,
  Plus,
  SlidersHorizontal,
  TrendingDown,
  Wallet,
} from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { apiFetch } from "@/lib/api";
import { getCurrentUser } from "@/lib/current-user";
import {
  getStockStatus,
  stockStatusLabels,
  type StockStatus,
} from "@/lib/stock-status";
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

import { MovementDialog } from "../movements/movement-dialog";
import styles from "./dashboard.module.css";

export const metadata: Metadata = {
  title: "Visão geral · StockFlow",
};

const REPLENISH_LIMIT = 6;

const numberFormat = new Intl.NumberFormat("pt-BR");
const currencyFormat = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
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
  const sortedProducts = [...products].sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR"),
  );

  const unitsInStock = products.reduce(
    (sum, product) => sum + product.quantity,
    0,
  );
  // Summed in cents so decimal prices do not accumulate float errors.
  const stockValueCents = products.reduce(
    (sum, product) =>
      sum + Math.round(Number(product.price) * 100) * product.quantity,
    0,
  );

  const statusOf = new Map<string, StockStatus>(
    products.map((product) => [product.id, getStockStatus(product)]),
  );
  const lowStock = products.filter(
    (product) => statusOf.get(product.id) === "low",
  );
  const outOfStock = products.filter(
    (product) => statusOf.get(product.id) === "out",
  );

  // Out of stock first, then the ones furthest below their minimum.
  const toReplenish = [...outOfStock, ...lowStock].sort(
    (a, b) =>
      a.quantity / Math.max(a.minQuantity, 1) -
        b.quantity / Math.max(b.minQuantity, 1) ||
      a.name.localeCompare(b.name, "pt-BR"),
  );

  const stats = [
    {
      label: "Produtos ativos",
      value: numberFormat.format(products.length),
      detail: `${numberFormat.format(unitsInStock)} ${unitsInStock === 1 ? "unidade" : "unidades"} em estoque`,
      icon: Package,
      href: "/products",
    },
    {
      label: "Valor do estoque",
      value: currencyFormat.format(stockValueCents / 100),
      detail: "Saldo × preço de cada produto",
      icon: Wallet,
    },
    {
      label: "Estoque baixo",
      value: numberFormat.format(lowStock.length),
      detail: "No mínimo ou abaixo dele",
      icon: TrendingDown,
      tone: lowStock.length > 0 ? "warning" : undefined,
      href: "/products?status=low",
    },
    {
      label: "Sem estoque",
      value: numberFormat.format(outOfStock.length),
      detail: "Saldo zerado",
      icon: PackageX,
      tone: outOfStock.length > 0 ? "danger" : undefined,
      href: "/products?status=out",
    },
  ];

  return (
    <>
      <PageHeader
        title={`Olá, ${firstName}`}
        description={`Este é o resumo do estoque de ${user.company.name}.`}
      />

      <section className={styles.stats} aria-label="Indicadores">
        {stats.map(({ label, value, detail, icon: Icon, tone, href }) => {
          const content = (
            <>
              <span className={styles.statIcon}>
                <Icon size={18} aria-hidden />
              </span>
              <span className={styles.statValue}>{value}</span>
              <span className={styles.statLabel}>{label}</span>
              <span className={styles.statDetail}>{detail}</span>
            </>
          );

          return href ? (
            <Link
              key={label}
              href={href}
              className={styles.stat}
              data-tone={tone}
            >
              {content}
            </Link>
          ) : (
            <div key={label} className={styles.stat} data-tone={tone}>
              {content}
            </div>
          );
        })}
      </section>

      <div className={styles.panels}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Precisa de reposição</h2>
            {toReplenish.length > REPLENISH_LIMIT && (
              <Link href="/products?status=low" className={styles.panelLink}>
                Ver todos ({toReplenish.length})
              </Link>
            )}
          </div>

          {products.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Nenhum produto cadastrado"
              description="Cadastre produtos para acompanhar quais precisam de reposição."
              action={
                <Link href="/products" className={styles.secondaryButton}>
                  Ir para produtos
                </Link>
              }
            />
          ) : toReplenish.length === 0 ? (
            <EmptyState
              icon={CircleCheck}
              title="Estoque em dia"
              description="Todos os produtos estão acima do estoque mínimo."
            />
          ) : (
            <ul className={styles.replenishList}>
              {toReplenish.slice(0, REPLENISH_LIMIT).map((product) => {
                const status = statusOf.get(product.id) ?? "in";

                return (
                  <li key={product.id} className={styles.replenishItem}>
                    <span className={styles.movementProduct}>
                      <span className={styles.movementName}>
                        {product.name}
                      </span>
                      <span className={styles.movementMeta}>
                        <span className={styles.movementSku}>
                          {product.sku}
                        </span>
                        {" · "}
                        saldo {numberFormat.format(product.quantity)} de mín.{" "}
                        {numberFormat.format(product.minQuantity)}
                      </span>
                    </span>
                    <span className={styles.statusBadge} data-status={status}>
                      {stockStatusLabels[status]}
                    </span>
                    <MovementDialog
                      products={sortedProducts}
                      defaultProductId={product.id}
                      trigger={
                        <button
                          type="button"
                          className={styles.replenishButton}
                          aria-label={`Registrar entrada de ${product.name}`}
                          title="Registrar entrada"
                        >
                          <Plus size={16} aria-hidden />
                          <span className={styles.replenishLabel}>Entrada</span>
                        </button>
                      }
                    />
                  </li>
                );
              })}
            </ul>
          )}
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
      </div>
    </>
  );
}
