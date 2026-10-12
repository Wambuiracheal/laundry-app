-- AlterTable
ALTER TABLE `Order` ADD COLUMN `delivery_distance_km` DECIMAL(8, 2) NULL,
    ADD COLUMN `delivery_distance_source` VARCHAR(191) NULL,
    ADD COLUMN `delivery_fee` DECIMAL(10, 2) NULL,
    ADD COLUMN `delivery_rate_per_km` DECIMAL(10, 2) NULL;

