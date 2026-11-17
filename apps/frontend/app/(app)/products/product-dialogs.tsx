"use client";

import {
  useActionState,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Archive,
  LoaderCircle,
  X,
} from "lucide-react";

import { FormAlert } from "@/components/form-alert";
import type { Product } from "@/lib/types";

import {
  archiveProduct,
  createProduct,
  updateProduct,
  type ArchiveProductState,
  type ProductFormState,
  type ProductFormValues,
} from "./actions";
import styles from "@/components/form-dialog.module.css";

function formatPriceInput(price: string) {
  return Number(price).toFixed(2).replace(".", ",");
}

function initialValues(product?: Product): ProductFormValues {
  if (!product) {
    return {
      name: "",
      sku: "",
      description: "",
      price: "",
      minQuantity: "10",
      quantity: "0",
    };
  }

  return {
    name: product.name,
    sku: product.sku,
    description: product.description ?? "",
    price: formatPriceInput(product.price),
    minQuantity: String(product.minQuantity),
  };
}

type FieldProps = {
  name: keyof ProductFormValues;
  label: string;
  defaultValue?: string;
  error?: string;
  hint?: string;
  children: (props: {
    id: string;
    name: string;
    defaultValue?: string;
    "aria-invalid": boolean;
    "aria-describedby"?: string;
  }) => ReactNode;
};

function Field({ name, label, defaultValue, error, hint, children }: FieldProps) {
  const id = `product-${name}`;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error && errorId, hint && hintId].filter(Boolean).join(" ");

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {children({
        id,
        name,
        defaultValue,
        "aria-invalid": !!error,
        "aria-describedby": describedBy || undefined,
      })}
      {error && (
        <p id={errorId} className={styles.fieldError}>
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
    </div>
  );
}

function ProductForm({
  product,
  onSaved,
}: {
  product?: Product;
  onSaved: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    async (previousState: ProductFormState, formData: FormData) => {
      const result = product
        ? await updateProduct(product.id, previousState, formData)
        : await createProduct(previousState, formData);

      if (result?.ok) {
        onSaved();
      }

      return result;
    },
    undefined,
  );

  const values = state?.values ?? initialValues(product);
  const errors = state?.errors;

  return (
    <form action={formAction} className={styles.form} noValidate>
      <FormAlert message={state?.message} />

      <Field
        name="name"
        label="Nome"
        defaultValue={values.name}
        error={errors?.name?.[0]}
      >
        {(props) => (
          <input
            {...props}
            className={styles.input}
            autoComplete="off"
            placeholder="Ex.: Camiseta básica preta"
            autoFocus
          />
        )}
      </Field>

      <div className={styles.row}>
        <Field
          name="sku"
          label="SKU"
          defaultValue={values.sku}
          error={errors?.sku?.[0]}
          hint="Código único do produto na sua empresa."
        >
          {(props) => (
            <input
              {...props}
              className={`${styles.input} ${styles.mono}`}
              autoComplete="off"
              spellCheck={false}
              placeholder="CAM-PRT-M"
            />
          )}
        </Field>

        <Field
          name="price"
          label="Preço (R$)"
          defaultValue={values.price}
          error={errors?.price?.[0]}
        >
          {(props) => (
            <input
              {...props}
              className={`${styles.input} ${styles.numeric}`}
              inputMode="decimal"
              autoComplete="off"
              placeholder="0,00"
            />
          )}
        </Field>
      </div>

      <div className={product ? undefined : styles.row}>
        {!product && (
          <Field
            name="quantity"
            label="Estoque inicial"
            defaultValue={values.quantity}
            error={errors?.quantity?.[0]}
            hint="Fica registrado no histórico como saldo inicial."
          >
            {(props) => (
              <input
                {...props}
                className={`${styles.input} ${styles.numeric}`}
                inputMode="numeric"
                autoComplete="off"
              />
            )}
          </Field>
        )}

        <Field
          name="minQuantity"
          label="Estoque mínimo"
          defaultValue={values.minQuantity}
          error={errors?.minQuantity?.[0]}
          hint="Com esse saldo ou menos, o produto aparece como estoque baixo."
        >
          {(props) => (
            <input
              {...props}
              className={`${styles.input} ${styles.numeric}`}
              inputMode="numeric"
              autoComplete="off"
            />
          )}
        </Field>
      </div>

      <Field
        name="description"
        label="Descrição (opcional)"
        defaultValue={values.description}
        error={errors?.description?.[0]}
      >
        {(props) => (
          <textarea
            {...props}
            className={`${styles.input} ${styles.textarea}`}
            rows={3}
            placeholder="Detalhes que ajudam a identificar o produto"
          />
        )}
      </Field>

      <div className={styles.footer}>
        <Dialog.Close className={styles.secondaryButton} disabled={pending}>
          Cancelar
        </Dialog.Close>
        <button type="submit" className={styles.primaryButton} disabled={pending}>
          {pending && (
            <LoaderCircle size={16} className={styles.spinner} aria-hidden />
          )}
          {pending
            ? "Salvando…"
            : product
              ? "Salvar alterações"
              : "Cadastrar produto"}
        </button>
      </div>
    </form>
  );
}

export function ProductFormDialog({
  product,
  trigger,
}: {
  product?: Product;
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
                {product ? "Editar produto" : "Novo produto"}
              </Dialog.Title>
              <Dialog.Description className={styles.description}>
                {product
                  ? "Atualize as informações do produto. Para mudar o saldo, use Ajustar estoque."
                  : "Cadastre um item para acompanhar o saldo dele no estoque."}
              </Dialog.Description>
            </div>
            <Dialog.Close className={styles.closeButton} aria-label="Fechar">
              <X size={18} />
            </Dialog.Close>
          </div>

          <ProductForm product={product} onSaved={() => setOpen(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function ArchiveProductDialog({
  product,
  trigger,
}: {
  product: Product;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ArchiveProductState>();
  const [pending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    if (pending) {
      return;
    }

    setOpen(next);

    if (!next) {
      setState(undefined);
    }
  }

  function confirm() {
    startTransition(async () => {
      const result = await archiveProduct(product.id);

      if (result?.ok) {
        setOpen(false);
      } else {
        setState(result);
      }
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={`${styles.content} ${styles.compact}`}>
          <span className={styles.archiveIcon}>
            <Archive size={20} aria-hidden />
          </span>
          <Dialog.Title className={styles.title}>Arquivar produto?</Dialog.Title>
          <Dialog.Description className={styles.description}>
            <strong>{product.name}</strong> sai da lista de produtos e do
            dashboard. O histórico de movimentações dele continua guardado.
          </Dialog.Description>

          <FormAlert message={state?.message} />

          <div className={styles.footer}>
            <Dialog.Close className={styles.secondaryButton} disabled={pending}>
              Cancelar
            </Dialog.Close>
            <button
              type="button"
              className={styles.dangerButton}
              onClick={confirm}
              disabled={pending}
            >
              {pending && (
                <LoaderCircle size={16} className={styles.spinner} aria-hidden />
              )}
              {pending ? "Arquivando…" : "Arquivar"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
