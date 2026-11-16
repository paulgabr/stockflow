-- CreateEnum
CREATE TYPE "StockAdjustmentReason" AS ENUM ('INITIAL_STOCK', 'INVENTORY_COUNT', 'ENTRY_ERROR', 'DAMAGE_OR_LOSS', 'OTHER');

-- AlterEnum
ALTER TYPE "StockMovementType" ADD VALUE 'ADJUSTMENT';

-- AlterTable
ALTER TABLE "stock_movements" ADD COLUMN     "newQuantity" INTEGER,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "previousQuantity" INTEGER,
ADD COLUMN     "reason" "StockAdjustmentReason";
