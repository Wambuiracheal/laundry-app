-- AlterTable
ALTER TABLE `Order` ADD COLUMN `delivery_instructions` TEXT NULL,
    ADD COLUMN `house_details` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `DamageReport` (
    `id` VARCHAR(191) NOT NULL,
    `order_id` VARCHAR(191) NOT NULL,
    `order_item_id` VARCHAR(191) NULL,
    `note` TEXT NOT NULL,
    `photo_path` VARCHAR(191) NULL,
    `created_by` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DamageReport` ADD CONSTRAINT `DamageReport_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DamageReport` ADD CONSTRAINT `DamageReport_order_item_id_fkey` FOREIGN KEY (`order_item_id`) REFERENCES `OrderItem`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

