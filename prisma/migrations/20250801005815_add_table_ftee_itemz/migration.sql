-- AlterTable
ALTER TABLE `bogofreeitem` ADD COLUMN `media` VARCHAR(191) NULL,
    ADD COLUMN `price` VARCHAR(191) NULL,
    ADD COLUMN `variantId` VARCHAR(191) NULL,
    MODIFY `title` VARCHAR(191) NULL;
