"use client";

import { useActionState, useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  LoaderCircle,
  X,
} from "lucide-react";

import { FormAlert } from "@/components/form-alert";
import styles from "@/components/form-dialog.module.css";
import type { Product } from "@/lib/types";

import { createMovement, type MovementFormState } from "./actions";
import movementStyles from "./movements.module.css";

type MovementType = "IN" | "OUT";

const typeOptions = [
  {
    value: "IN",
    label: "Entrada",
    description: "Compra, recebimento ou devolução de cliente.",
    icon: ArrowDownToLine,
  },
  {
    value: "OUT",
    label: "Saída",
    description: "Venda, retirada ou envio para outro local.",
    icon: ArrowUpFromLine,
  },
] as const;

const numberFormat = new Intl.NumberFormat("pt-BR");

function parseQuantity(value: string) {
  return /^\d+$/.test(value.trim()) ? Number(value) : null;
}

function BalancePreview({
  product,
  type,
  quantity,
}: {
  product?: Product;
  type: MovementType;
  quantity: number | null;
}) {
  if (!product) {
    return (
      <p className={styles.hint} aria-live="polite">
        Escolha o produto para ver o saldo atual.
      </p>
    );
  }

  const next =
    quantity === null || quantity === 0
      ? null
      : type === "IN"
        ? product.quantity + quantity
        : product.quantity - quantity;

  if (next !== null && next < 0) {
    return (
      <p className={styles.fieldError} aria-live="polite">
        Só há {numberFormat.format(product.quantity)} em estoque. A saída não
        pode deixar o saldo negativo.
      </p>
    );
  }

  return (
    <p className={movementStyles.balancePreview} aria-live="polite">
      <span>
        Saldo atual <strong>{numberFormat.format(product.quantity)}</strong>
      </span>
      {next !== null && (
        <>
          <ArrowRight size={14} aria-hidden />
          <span>
            depois <strong>{numberFormat.format(next)}</strong>
          </span>
        </>
      )}
    </p>
  );
}

function MovementForm({
  products,
  defaultProductId,
  onSaved,
}: {
  products: Product[];
  defaultProductId?: string;
  onSaved: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    async (previousState: MovementFormState, formData: FormData) => {
      const result = await createMovement(previousState, formData);

      if (result?.ok) {
        onSaved();
      }

      return result;
    },
    undefined,
  );

  const [type, setType] = useState<MovementType>("IN");
  const [productId, setProductId] = useState(
    products.some((product) => product.id === defaultProductId)
      ? (defaultProductId ?? "")
      : "",
  );
  const [quantity, setQuantity] = useState("");

  const product = products.find((item) => item.id === productId);
  const parsedQuantity = parseQuantity(quantity);
  const exceedsStock =
    type === "OUT" &&
    !!product &&
    parsedQuantity !== null &&
    parsedQuantity > product.quantity;
  const errors = state?.errors;

  return (
    <form action={formAction} className={styles.form} noValidate>
      <FormAlert message={state?.message} />

      <fieldset className={styles.fieldset}>
        <legend className={styles.label}>Tipo</legend>
        <div className={styles.reasonList}>
          {typeOptions.map(({ value, label, description, icon: Icon }) => (
            <label
              key={value}
              className={`${styles.reasonOption} ${movementStyles.typeOption}`}
              data-type={value}
            >
              <input
                type="radio"
                name="type"
                value={value}
                checked={type === value}
                onChange={() => setType(value)}
                className="visually-hidden"
              />
              <span className={movementStyles.typeIcon}>
                <Icon size={16} aria-hidden />
              </span>
              <span className={styles.reasonText}>
                <span className={styles.reasonLabel}>{label}</span>
                <span className={styles.reasonDescription}>{description}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className={styles.field}>
        <label htmlFor="movement-product" className={styles.label}>
          Produto
        </label>
        <select
          id="movement-product"
          name="productId"
          value={productId}
          onChange={(event) => setProductId(event.target.value)}
          className={`${styles.input} ${movementStyles.select}`}
          aria-invalid={!!errors?.productId}
          aria-describedby={
            errors?.productId ? "movement-product-error" : undefined
          }
        >
          <option value="" disabled>
            Selecione um produto
          </option>
          {products.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} · {item.sku} (saldo {numberFormat.format(item.quantity)})
            </option>
          ))}
        </select>
        {errors?.productId && (
          <p id="movement-product-error" className={styles.fieldError}>
            {errors.productId[0]}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="movement-quantity" className={styles.label}>
          Quantidade
        </label>
        <input
          id="movement-quantity"
          name="quantity"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          className={`${styles.input} ${styles.numeric}`}
          inputMode="numeric"
          autoComplete="off"
          placeholder="0"
          aria-invalid={!!errors?.quantity || exceedsStock}
          aria-describedby="movement-quantity-feedback"
        />
        <div id="movement-quantity-feedback">
          {errors?.quantity && !exceedsStock ? (
            <p className={styles.fieldError}>{errors.quantity[0]}</p>
          ) : (
            <BalancePreview
              product={product}
              type={type}
              quantity={parsedQuantity}
            />
          )}
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="movement-note" className={styles.label}>
          Observação (opcional)
        </label>
        <input
          id="movement-note"
          name="note"
          defaultValue={state?.values?.note}
          maxLength={200}
          className={styles.input}
          autoComplete="off"
          placeholder={
            type === "IN" ? "Ex.: NF 1234, fornecedor X" : "Ex.: pedido 55, cliente Y"
          }
          aria-invalid={!!errors?.note}
          aria-describedby={errors?.note ? "movement-note-error" : undefined}
        />
        {errors?.note && (
          <p id="movement-note-error" className={styles.fieldError}>
            {errors.note[0]}
          </p>
        )}
      </div>

      <div className={styles.footer}>
        <Dialog.Close className={styles.secondaryButton} disabled={pending}>
          Cancelar
        </Dialog.Close>
        <button
          type="submit"
          className={styles.primaryButton}
          disabled={pending || exceedsStock}
        >
          {pending && (
            <LoaderCircle size={16} className={styles.spinner} aria-hidden />
          )}
          {pending
            ? "Registrando…"
            : type === "IN"
              ? "Registrar entrada"
              : "Registrar saída"}
        </button>
      </div>
    </form>
  );
}

export function MovementDialog({
  products,
  defaultProductId,
  trigger,
}: {
  products: Product[];
  defaultProductId?: string;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.content}>
          <div className={styles.header}>
            <div>
              <Dialog.Title className={styles.title}>
                Nova movimentação
              </Dialog.Title>
              <Dialog.Description className={styles.description}>
                Registre produtos que chegaram ou saíram do estoque.
              </Dialog.Description>
            </div>
            <Dialog.Close className={styles.closeButton} aria-label="Fechar">
              <X size={18} />
            </Dialog.Close>
          </div>

          <MovementForm
            products={products}
            defaultProductId={defaultProductId}
            onSaved={() => setOpen(false)}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
