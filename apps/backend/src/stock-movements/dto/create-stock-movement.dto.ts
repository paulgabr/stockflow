import { IsEnum, IsInt, IsUUID, Min } from 'class-validator';

import { StockMovementType } from '../../../generated/prisma/client';

export class CreateStockMovementDto {
  @IsUUID()
  productId: string;

  @IsEnum(StockMovementType)
  type: StockMovementType;

  @IsInt()
  @Min(1)
  quantity: number;
}
