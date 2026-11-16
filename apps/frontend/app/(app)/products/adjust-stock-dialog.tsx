"use client";

import { useActionState, useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, LoaderCircle, X } from "lucide-react";

import {
  adjustmentReasonLabels,
  manualAdjustmentReasons,
  type ManualAdjustmentReason,
} from "@/lib/stock-movements";
import type { Product } from "@/lib/types";

import { adjustStock, type AdjustStockState } from "./actions";
import { FormAlert } from "./product-dialogs";
import styles from "./product-dialogs.module.css";

const reasonDescriptions: Record<ManualAdjustmentReason, string> = {
  INVENTORY_COUNT: "A contagem física deu um número diferente do sistema.",
  ENTRY_ERROR: "Um saldo, entrada ou saída foi lançado com o valor errado.",
  DAMAGE_OR_LOSS: "Itens danificados, vencidos, extraviados ou furtados.",
  OTHER: "Descreva o motivo na observação.",
};

const numberFormat = new Intl.NumberFormat("pt-BR");

function parseQuantity(value: string) {
  return /^\d+$/.test(value.trim()) ? Number(value) : null;
}

function AdjustmentPreview({ difference }: { difference: number | null }) {
  if (difference === null || difference === 0) {
    return (
      <p className={styles.hint} aria-live="polite">
        Informe o saldo correto. A diferença fica registrada como ajuste no
        histórico.
      </p>
    );
  }

  const increase = difference > 0;

  return (
    <p
      className={styles.stockChange}
      data-type={increase ? "in" : "out"}
      aria-live="polite"
    >
      <strong>
        {increase ? "+" : "−"}
        {numberFormat.format(Math.abs(difference))}
      </strong>
      <span>
        {increase ? "unidades a mais" : "unidades a menos"} · registrado como
        ajuste
      </span>
    </p>
  );
}

function AdjustStockForm({
  product,
  onSaved,
}: {
  product: Product;
  onSaved: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    async (previousState: AdjustStockState, formData: FormData) => {
      const result = await adjustStock(product.id, previousState, formData);

      if (result?.ok) {
        onSaved();
      }

      return result;
    },
    undefined,
  );

  const [quantity, setQuantity] = useState(String(product.quantity));
  const [reason, setReason] = useState("");

  const next = parseQuantity(quantity);
  const difference = next === null ? null : next - product.quantity;
  const errors = state?.errors;
  const noteRequired = reason === "OTHER";

  return (
    <form action={formAction} className={styles.form} noValidate>
      <FormAlert message={state?.message} />

      <div className={styles.balance}>
        <div className={styles.balanceItem}>
          <span className={styles.label}>Saldo atual</span>
          <span className={styles.balanceValue}>
            {numberFormat.format(product.quantity)}
          </span>
        </div>

        <ArrowRight size={18} className={styles.balanceArrow} aria-hidden />

        <div className={styles.field}>
          <label htmlFor="adjust-quantity" className={styles.label}>
            Saldo correto
          </label>
          <input
            id="adjust-quantity"
            name="quantity"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className={`${styles.input} ${styles.numeric}`}
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            onFocus={(event) => event.target.select()}
            aria-invalid={!!errors?.quantity}
            aria-describedby="adjust-quantity-feedback"
          />
        </div>
      </div>

      <div id="adjust-quantity-feedback">
        {errors?.quantity ? (
          <p className={styles.fieldError}>{errors.quantity[0]}</p>
        ) : (
          <AdjustmentPreview difference={difference} />
        )}
      </div>

      <fieldset
        className={styles.fieldset}
        aria-describedby={errors?.reason ? "adjust-reason-error" : undefined}
      >
        <legend className={styles.label}>Motivo</legend>
        <div className={styles.reasonList}>
          {manualAdjustmentReasons.map((value) => (
            <label key={value} className={styles.reasonOption}>
              <input
                type="radio"
                name="reason"
                value={value}
                checked={reason === value}
                onChange={() => setReason(value)}
                className={styles.reasonRadio}
              />
              <span className={styles.reasonText}>
                <span className={styles.reasonLabel}>
                  {adjustmentReasonLabels[value]}
                </span>
                <span className={styles.reasonDescription}>
                  {reasonDescriptions[value]}
                </span>
              </span>
            </label>
          ))}
        </div>
        {errors?.reason && (
          <p id="adjust-reason-error" className={styles.fieldError}>
            {errors.reason[0]}
          </p>
        )}
      </fieldset>

      <div className={styles.field}>
        <label htmlFor="adjust-note" className={styles.label}>
          Observação {noteRequired ? "" : "(opcional)"}
        </label>
        <textarea
          id="adjust-note"
          name="note"
          defaultValue={state?.values?.note}
          maxLength={200}
          rows={2}
          className={`${styles.input} ${styles.textarea}`}
          placeholder={
            noteRequired
              ? "Explique o que aconteceu"
              : "Ex.: contagem do dia 16/11, prateleira B"
          }
          aria-invalid={!!errors?.note}
          aria-describedby={errors?.note ? "adjust-note-error" : undefined}
        />
        {errors?.note && (
          <p id="adjust-note-error" className={styles.fieldError}>
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
          disabled={pending || difference === 0}
        >
          {pending && (
            <LoaderCircle size={16} className={styles.spinner} aria-hidden />
          )}
          {pending ? "Ajustando…" : "Confirmar ajuste"}
        </button>
      </div>
    </form>
  );
}

export function AdjustStockDialog({
  product,
  trigger,
}: {
  product: Product;
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
              <Dialog.Title className={styles.title}>Ajustar estoque</Dialog.Title>
              <Dialog.Description className={styles.description}>
                Corrija o saldo de <strong>{product.name}</strong>. Para
                registrar compras ou vendas, use entradas e saídas.
              </Dialog.Description>
            </div>
            <Dialog.Close className={styles.closeButton} aria-label="Fechar">
              <X size={18} />
            </Dialog.Close>
          </div>

          <AdjustStockForm product={product} onSaved={() => setOpen(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
