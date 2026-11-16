import { IsIn, IsInt, IsUUID, Min } from 'class-validator';

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
}
