import type {
  StockAdjustmentReason,
  StockMovement,
  StockMovementType,
} from "./types";

export const movementTypeLabels: Record<StockMovementType, string> = {
  IN: "Entrada",
  OUT: "Saída",
  ADJUSTMENT: "Ajuste",
};

export const adjustmentReasonLabels: Record<StockAdjustmentReason, string> = {
  INITIAL_STOCK: "Saldo inicial",
  INVENTORY_COUNT: "Contagem de inventário",
  ENTRY_ERROR: "Correção de erro",
  DAMAGE_OR_LOSS: "Perda ou avaria",
  OTHER: "Outro motivo",
};

// INITIAL_STOCK is recorded by the API when a product is created.
export const manualAdjustmentReasons = [
  "INVENTORY_COUNT",
  "ENTRY_ERROR",
  "DAMAGE_OR_LOSS",
  "OTHER",
] as const satisfies readonly StockAdjustmentReason[];

export type ManualAdjustmentReason = (typeof manualAdjustmentReasons)[number];

// Signed stock change: positive for IN, negative for OUT, and the direction of
// the correction for ADJUSTMENT.
export function getMovementDelta(movement: StockMovement) {
  if (movement.type === "IN") {
    return movement.quantity;
  }

  if (movement.type === "OUT") {
    return -movement.quantity;
  }

  const increased = (movement.newQuantity ?? 0) >= (movement.previousQuantity ?? 0);

  return increased ? movement.quantity : -movement.quantity;
}
