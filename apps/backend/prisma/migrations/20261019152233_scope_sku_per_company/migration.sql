-- DropIndex
DROP INDEX "products_sku_key";

-- CreateIndex
CREATE INDEX "stock_movements_companyId_type_createdAt_idx" ON "stock_movements"("companyId", "type", "createdAt");
