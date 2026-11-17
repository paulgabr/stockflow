import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

import { StockMovementType } from '../../../generated/prisma/client';

export class FindStockMovementsQueryDto {
  @IsEnum(StockMovementType)
  @IsOptional()
  type?: StockMovementType;

  @IsUUID()
  @IsOptional()
  productId?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;
}
