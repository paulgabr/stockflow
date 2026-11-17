import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

import { StockMovementType } from '../../../generated/prisma/client';

export class CreateStockMovementDto {
  @IsUUID()
  productId: string;

  // Adjustments go through POST /stock-movements/adjustments.
  @IsIn([StockMovementType.IN, StockMovementType.OUT])
  type: typeof StockMovementType.IN | typeof StockMovementType.OUT;

  @IsInt()
  @Min(1)
  quantity: number;

  // E.g. an invoice or order number.
  @IsString()
  @MaxLength(200)
  @IsOptional()
  note?: string;
}
