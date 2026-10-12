-- AlterTable
ALTER TABLE `Payment` ADD COLUMN `checkout_request_id` VARCHAR(191) NULL,
    ADD COLUMN `last_queried_at` DATETIME(3) NULL,
    ADD COLUMN `merchant_request_id` VARCHAR(191) NULL,
    ADD COLUMN `mpesa_receipt` VARCHAR(191) NULL,
    ADD COLUMN `phone` VARCHAR(191) NULL,
    ADD COLUMN `result_code` VARCHAR(191) NULL,
    ADD COLUMN `result_desc` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX `Payment_checkout_request_id_key` ON `Payment`(`checkout_request_id`);

