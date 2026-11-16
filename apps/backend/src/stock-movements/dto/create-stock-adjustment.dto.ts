import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

import { StockAdjustmentReason } from '../../../generated/prisma/client';

// INITIAL_STOCK is recorded by the system when a product is created.
export const MANUAL_ADJUSTMENT_REASONS = [
  StockAdjustmentReason.INVENTORY_COUNT,
  StockAdjustmentReason.ENTRY_ERROR,
  StockAdjustmentReason.DAMAGE_OR_LOSS,
  StockAdjustmentReason.OTHER,
] as const;

export type ManualAdjustmentReason = (typeof MANUAL_ADJUSTMENT_REASONS)[number];

export class CreateStockAdjustmentDto {
  @IsUUID()
  productId: string;

  // The correct stock balance, not the difference.
  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  quantity: number;

  @IsIn(MANUAL_ADJUSTMENT_REASONS)
  reason: ManualAdjustmentReason;

  // Required when the reason is OTHER.
  @ValidateIf(
    (adjustment: CreateStockAdjustmentDto) =>
      adjustment.reason === StockAdjustmentReason.OTHER ||
      adjustment.note !== undefined,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  note?: string;
}
