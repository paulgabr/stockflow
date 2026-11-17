import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  ChevronLeft,
  ChevronRight,
  Package,
  Plus,
  SearchX,
  SlidersHorizontal,
} from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { apiFetch } from "@/lib/api";
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

import { MovementDialog } from "./movement-dialog";
import styles from "./movements.module.css";
import { ProductFilter } from "./product-filter";

export const metadata: Metadata = {
  title: "Movimentações · StockFlow",
};

const PAGE_SIZE = 20;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const typeFilters: { value?: StockMovementType; label: string }[] = [
  { label: "Todas" },
  { value: "IN", label: "Entradas" },
  { value: "OUT", label: "Saídas" },
  { value: "ADJUSTMENT", label: "Ajustes" },
];

const movementIcons: Record<StockMovementType, typeof ArrowDownToLine> = {
  IN: ArrowDownToLine,
  OUT: ArrowUpFromLine,
  ADJUSTMENT: SlidersHorizontal,
};

const numberFormat = new Intl.NumberFormat("pt-BR");
const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const timeFormat = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

type Filters = {
  type?: StockMovementType;
  product?: string;
  page?: number;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseFilters(
  params: Record<string, string | string[] | undefined>,
): Required<Pick<Filters, "page">> & Filters {
  const type = first(params.type);
  const product = first(params.product);
  const page = Number.parseInt(first(params.page) ?? "", 10);

  return {
    type: typeFilters.some((filter) => filter.value && filter.value === type)
      ? (type as StockMovementType)
      : undefined,
    product: product && UUID_PATTERN.test(product) ? product : undefined,
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

function buildHref({ type, product, page }: Filters) {
  const params = new URLSearchParams();

  if (type) params.set("type", type);
  if (product) params.set("product", product);
  if (page && page > 1) params.set("page", String(page));

  const query = params.toString();

  return query ? `/movements?${query}` : "/movements";
}

function describeMovement(movement: StockMovement) {
  if (movement.type === "ADJUSTMENT" && movement.reason) {
    return adjustmentReasonLabels[movement.reason];
  }

  return null;
}

export default async function MovementsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseFilters(await searchParams);

  const query = new URLSearchParams({
    page: String(filters.page),
    limit: String(PAGE_SIZE),
  });
  if (filters.type) query.set("type", filters.type);
  if (filters.product) query.set("productId", filters.product);

  const [movements, products] = await Promise.all([
    apiFetch<Paginated<StockMovement>>(`/stock-movements?${query}`),
    apiFetch<Product[]>("/products"),
  ]);

  const sortedProducts = [...products].sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR"),
  );
  const { total, totalPages } = movements.meta;
  const page = filters.page;
  const hasFilters = !!filters.type || !!filters.product;
  const firstRow = (page - 1) * PAGE_SIZE + 1;
  const lastRow = firstRow + movements.data.length - 1;

  const newMovementButton =
    products.length > 0 ? (
      <MovementDialog
        products={sortedProducts}
        defaultProductId={filters.product}
        trigger={
          <button type="button" className={styles.primaryButton}>
            <Plus size={18} aria-hidden />
            Nova movimentação
          </button>
        }
      />
    ) : null;

  if (products.length === 0 && total === 0 && !hasFilters) {
    return (
      <>
        <PageHeader
          title="Movimentações"
          description="Histórico de entradas, saídas e ajustes do seu estoque."
        />
        <EmptyState
          icon={Package}
          title="Cadastre um produto primeiro"
          description="As movimentações registram o que entra e sai de cada produto."
          action={
            <Link href="/products" className={styles.secondaryButton}>
              Ir para produtos
            </Link>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Movimentações"
        description="Histórico de entradas, saídas e ajustes do seu estoque."
        actions={newMovementButton}
      />

      <div className={styles.card}>
        <div className={styles.toolbar}>
          <nav className={styles.segmented} aria-label="Filtrar por tipo">
            {typeFilters.map(({ value, label }) => (
              <Link
                key={label}
                href={buildHref({ type: value, product: filters.product })}
                className={styles.segment}
                aria-current={filters.type === value ? "page" : undefined}
                data-type={value}
                scroll={false}
              >
                {label}
              </Link>
            ))}
          </nav>

          <ProductFilter
            products={sortedProducts}
            value={filters.product}
            type={filters.type}
          />
        </div>

        {movements.data.length === 0 ? (
          <div className={styles.noResults}>
            {total > 0 ? (
              <EmptyState
                icon={SearchX}
                title="Esta página não existe"
                description={`O histórico tem ${totalPages} ${totalPages === 1 ? "página" : "páginas"}.`}
                action={
                  <Link
                    href={buildHref({ ...filters, page: 1 })}
                    className={styles.secondaryButton}
                  >
                    Ir para a primeira página
                  </Link>
                }
              />
            ) : hasFilters ? (
              <EmptyState
                icon={SearchX}
                title="Nenhuma movimentação encontrada"
                description="Não há movimentações com esses filtros."
                action={
                  <Link href="/movements" className={styles.secondaryButton}>
                    Limpar filtros
                  </Link>
                }
              />
            ) : (
              <EmptyState
                icon={ArrowLeftRight}
                title="Nenhuma movimentação ainda"
                description="Registre a primeira entrada ou saída pelo botão Nova movimentação."
              />
            )}
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Data</th>
                  <th scope="col">Produto</th>
                  <th scope="col">Tipo</th>
                  <th scope="col" data-numeric>
                    Quantidade
                  </th>
                </tr>
              </thead>
              <tbody>
                {movements.data.map((movement) => {
                  const delta = getMovementDelta(movement);
                  const Icon = movementIcons[movement.type];
                  const detail = describeMovement(movement);
                  const createdAt = new Date(movement.createdAt);

                  return (
                    <tr key={movement.id}>
                      <td className={styles.date}>
                        <time dateTime={movement.createdAt}>
                          <span>{dateFormat.format(createdAt)}</span>
                          <span className={styles.muted}>
                            {timeFormat.format(createdAt)}
                          </span>
                        </time>
                      </td>
                      <td>
                        <Link
                          href={buildHref({
                            type: filters.type,
                            product: movement.product.id,
                          })}
                          className={styles.product}
                          title="Ver só as movimentações deste produto"
                        >
                          <span className={styles.productName}>
                            {movement.product.name}
                            {movement.product.archivedAt && (
                              <span className={styles.archived}>Arquivado</span>
                            )}
                          </span>
                          <code className={styles.sku}>{movement.product.sku}</code>
                        </Link>
                      </td>
                      <td>
                        <div className={styles.type}>
                          <span className={styles.badge} data-type={movement.type}>
                            <Icon size={13} aria-hidden />
                            {movementTypeLabels[movement.type]}
                          </span>
                          {(detail || movement.note) && (
                            <span className={styles.detail}>
                              {[detail, movement.note].filter(Boolean).join(" · ")}
                            </span>
                          )}
                        </div>
                      </td>
                      <td data-numeric>
                        <span
                          className={styles.quantity}
                          data-direction={delta >= 0 ? "up" : "down"}
                        >
                          {delta >= 0 ? "+" : "−"}
                          {numberFormat.format(Math.abs(delta))}
                        </span>
                        {movement.type === "ADJUSTMENT" &&
                          movement.previousQuantity !== null &&
                          movement.newQuantity !== null && (
                            <span className={styles.balanceChange}>
                              {numberFormat.format(movement.previousQuantity)} →{" "}
                              {numberFormat.format(movement.newQuantity)}
                            </span>
                          )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {movements.data.length > 0 && (
          <div className={styles.footer}>
            <p className={styles.summary}>
              {`Mostrando ${firstRow}–${lastRow} de ${numberFormat.format(total)} ${
                total === 1 ? "movimentação" : "movimentações"
              }`}
            </p>

            {totalPages > 1 && (
              <nav className={styles.pager} aria-label="Paginação">
                {page > 1 ? (
                  <Link
                    href={buildHref({ ...filters, page: page - 1 })}
                    className={styles.pagerButton}
                    aria-label="Página anterior"
                  >
                    <ChevronLeft size={18} />
                  </Link>
                ) : (
                  <span className={styles.pagerButton} aria-disabled="true">
                    <ChevronLeft size={18} />
                  </span>
                )}
                <span className={styles.pageInfo}>
                  {page} / {totalPages}
                </span>
                {page < totalPages ? (
                  <Link
                    href={buildHref({ ...filters, page: page + 1 })}
                    className={styles.pagerButton}
                    aria-label="Próxima página"
                  >
                    <ChevronRight size={18} />
                  </Link>
                ) : (
                  <span className={styles.pagerButton} aria-disabled="true">
                    <ChevronRight size={18} />
                  </span>
                )}
              </nav>
            )}
          </div>
        )}
      </div>
    </>
  );
}
