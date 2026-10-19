-- DropForeignKey
ALTER TABLE "stock_movements" DROP CONSTRAINT "stock_movements_productId_fkey";

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "archivedAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
