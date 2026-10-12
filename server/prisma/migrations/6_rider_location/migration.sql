-- CreateTable
CREATE TABLE `RiderLocation` (
    `rider_id` VARCHAR(191) NOT NULL,
    `lat` DOUBLE NOT NULL,
    `lng` DOUBLE NOT NULL,
    `accuracy_m` DOUBLE NULL,
    `heading` DOUBLE NULL,
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`rider_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RiderLocation` ADD CONSTRAINT `RiderLocation_rider_id_fkey` FOREIGN KEY (`rider_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

