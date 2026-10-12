-- AlterTable
ALTER TABLE `Order` ADD COLUMN `notes` TEXT NULL;

-- AlterTable
ALTER TABLE `OrderItem` ADD COLUMN `weight_kg` DECIMAL(65, 30) NULL;
