"use client";

import { useMemo } from "react";
import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  tableFeatures,
  useTable,
  type FilterFn,
  type SortFn,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  Archive,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Pencil,
  Search,
  SearchX,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import type { Product } from "@/lib/types";

import { AdjustStockDialog } from "./adjust-stock-dialog";
import { ArchiveProductDialog, ProductFormDialog } from "./product-dialogs";
import styles from "./products.module.css";

const LOW_STOCK_THRESHOLD = 10;
const PAGE_SIZE = 10;

type StockStatus = "in" | "low" | "out";
type StatusFilter = StockStatus | "all";

const statusLabels: Record<StockStatus, string> = {
  in: "Em estoque",
  low: "Estoque baixo",
  out: "Sem estoque",
};

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "in", label: statusLabels.in },
  { value: "low", label: statusLabels.low },
  { value: "out", label: statusLabels.out },
];

const currencyFormat = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const numberFormat = new Intl.NumberFormat("pt-BR");

function getStockStatus(quantity: number): StockStatus {
  if (quantity === 0) {
    return "out";
  }

  return quantity <= LOW_STOCK_THRESHOLD ? "low" : "in";
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric },
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
});

const searchFilter: FilterFn<typeof features, Product> = (
  row,
  columnId,
  filterValue: string,
) => normalize(String(row.getValue(columnId))).includes(normalize(filterValue));

const collator = new Intl.Collator("pt-BR", { sensitivity: "base" });

const localeSort: SortFn<typeof features, Product> = (rowA, rowB, columnId) =>
  collator.compare(
    String(rowA.getValue(columnId)),
    String(rowB.getValue(columnId)),
  );

const stockStatusFilter: FilterFn<typeof features, Product> = (
  row,
  columnId,
  filterValue: StockStatus,
) => getStockStatus(row.getValue<number>(columnId)) === filterValue;

const helper = createColumnHelper<typeof features, Product>();

const columns = helper.columns([
  helper.accessor("name", {
    header: "Produto",
    sortFn: localeSort,
    cell: (info) => (
      <div className={styles.product}>
        <span className={styles.productName}>{info.getValue()}</span>
        {info.row.original.description && (
          <span className={styles.productDescription}>
            {info.row.original.description}
          </span>
        )}
      </div>
    ),
  }),
  helper.accessor("sku", {
    header: "SKU",
    sortFn: "alphanumeric",
    cell: (info) => <code className={styles.sku}>{info.getValue()}</code>,
  }),
  helper.accessor((product) => Number(product.price), {
    id: "price",
    header: "Preço",
    enableGlobalFilter: false,
    cell: (info) => currencyFormat.format(info.getValue()),
  }),
  helper.accessor("quantity", {
    header: "Estoque",
    enableGlobalFilter: false,
    filterFn: stockStatusFilter,
    cell: (info) => {
      const quantity = info.getValue();
      const status = getStockStatus(quantity);

      return (
        <span className={styles.stock}>
          <span className={styles.quantity}>{numberFormat.format(quantity)}</span>
          <span className={styles.badge} data-status={status}>
            {statusLabels[status]}
          </span>
        </span>
      );
    },
  }),
  helper.display({
    id: "actions",
    header: () => <span className="visually-hidden">Ações</span>,
    cell: (info) => {
      const product = info.row.original;

      return (
        <div className={styles.rowActions}>
          <AdjustStockDialog
            product={product}
            trigger={
              <button
                type="button"
                className={styles.iconButton}
                aria-label={`Ajustar estoque de ${product.name}`}
                title="Ajustar estoque"
              >
                <SlidersHorizontal size={16} />
              </button>
            }
          />
          <ProductFormDialog
            product={product}
            trigger={
              <button
                type="button"
                className={styles.iconButton}
                aria-label={`Editar ${product.name}`}
                title="Editar"
              >
                <Pencil size={16} />
              </button>
            }
          />
          <ArchiveProductDialog
            product={product}
            trigger={
              <button
                type="button"
                className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                aria-label={`Arquivar ${product.name}`}
                title="Arquivar"
              >
                <Archive size={16} />
              </button>
            }
          />
        </div>
      );
    },
  }),
]);

const numericColumns = new Set(["price", "quantity"]);

export function ProductsTable({ products }: { products: Product[] }) {
  const table = useTable({
    features,
    columns,
    data: products,
    globalFilterFn: searchFilter,
    sortDescFirst: false,
    initialState: {
      sorting: [{ id: "name", desc: false }],
      pagination: { pageIndex: 0, pageSize: PAGE_SIZE },
    },
  });

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      all: products.length,
      in: 0,
      low: 0,
      out: 0,
    };

    for (const product of products) {
      counts[getStockStatus(product.quantity)] += 1;
    }

    return counts;
  }, [products]);

  const search = String(table.state.globalFilter ?? "");
  const statusFilter =
    (table.state.columnFilters.find((filter) => filter.id === "quantity")
      ?.value as StockStatus | undefined) ?? "all";

  const { pageIndex, pageSize } = table.state.pagination;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const firstRow = filteredCount === 0 ? 0 : pageIndex * pageSize + 1;
  const lastRow = Math.min((pageIndex + 1) * pageSize, filteredCount);
  const rows = table.getRowModel().rows;

  function setStatusFilter(value: StatusFilter) {
    table
      .getColumn("quantity")
      ?.setFilterValue(value === "all" ? undefined : value);
  }

  function clearFilters() {
    table.resetGlobalFilter();
    setStatusFilter("all");
  }

  return (
    <div className={styles.card}>
      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Search size={18} className={styles.searchIcon} aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            placeholder="Buscar por nome ou SKU"
            aria-label="Buscar produtos por nome ou SKU"
            className={styles.searchInput}
          />
          {search && (
            <button
              type="button"
              className={styles.searchClear}
              onClick={() => table.resetGlobalFilter()}
              aria-label="Limpar busca"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div
          className={styles.segmented}
          role="group"
          aria-label="Filtrar por situação do estoque"
        >
          {statusFilters.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={styles.segment}
              data-status={value}
              aria-pressed={statusFilter === value}
              onClick={() => setStatusFilter(value)}
            >
              {label}
              <span className={styles.segmentCount}>{statusCounts[value]}</span>
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className={styles.noResults}>
          <EmptyState
            icon={SearchX}
            title="Nenhum produto encontrado"
            description="Tente buscar por outro termo ou mudar o filtro de estoque."
            action={
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={clearFilters}
              >
                Limpar filtros
              </button>
            }
          />
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const sorted = header.column.getIsSorted();
                    const numeric = numericColumns.has(header.column.id);

                    if (!header.column.getCanSort()) {
                      return (
                        <th key={header.id} data-column={header.column.id}>
                          <table.FlexRender header={header} />
                        </th>
                      );
                    }

                    return (
                      <th
                        key={header.id}
                        data-numeric={numeric || undefined}
                        aria-sort={
                          sorted === "asc"
                            ? "ascending"
                            : sorted === "desc"
                              ? "descending"
                              : "none"
                        }
                      >
                        <button
                          type="button"
                          className={styles.sortButton}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <table.FlexRender header={header} />
                          {sorted === "asc" ? (
                            <ArrowUp size={14} aria-hidden />
                          ) : sorted === "desc" ? (
                            <ArrowDown size={14} aria-hidden />
                          ) : (
                            <ChevronsUpDown
                              size={14}
                              className={styles.sortIdle}
                              aria-hidden
                            />
                          )}
                        </button>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {row.getAllCells().map((cell) => (
                    <td
                      key={cell.id}
                      data-column={cell.column.id}
                      data-numeric={numericColumns.has(cell.column.id) || undefined}
                    >
                      <table.FlexRender cell={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className={styles.footer}>
        <p className={styles.summary} aria-live="polite">
          {filteredCount === 0
            ? "Nenhum produto"
            : `Mostrando ${firstRow}–${lastRow} de ${filteredCount} ${
                filteredCount === 1 ? "produto" : "produtos"
              }`}
        </p>

        {table.getPageCount() > 1 && (
          <div className={styles.pager}>
            <button
              type="button"
              className={styles.pagerButton}
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Página anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <span className={styles.pageInfo}>
              {pageIndex + 1} / {table.getPageCount()}
            </span>
            <button
              type="button"
              className={styles.pagerButton}
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Próxima página"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
