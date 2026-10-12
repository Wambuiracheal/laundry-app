-- CreateTable
CREATE TABLE `RiderEarning` (
    `id` VARCHAR(191) NOT NULL,
    `rider_id` VARCHAR(191) NOT NULL,
    `order_id` VARCHAR(191) NOT NULL,
    `leg` VARCHAR(191) NOT NULL,
    `distance_km` DECIMAL(8, 2) NULL,
    `distance_source` VARCHAR(191) NULL,
    `rate_per_km` DECIMAL(10, 2) NOT NULL,
    `amount` DECIMAL(10, 2) NULL,
    `status` VARCHAR(191) NOT NULL,
    `paid_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `RiderEarning_order_id_leg_key`(`order_id`, `leg`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Setting` (
    `key` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RiderEarning` ADD CONSTRAINT `RiderEarning_rider_id_fkey` FOREIGN KEY (`rider_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RiderEarning` ADD CONSTRAINT `RiderEarning_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

