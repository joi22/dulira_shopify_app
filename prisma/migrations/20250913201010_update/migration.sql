/*
  Warnings:

  - You are about to drop the column `badgeImageUrl` on the `upsellcampaign` table. All the data in the column will be lost.
  - You are about to drop the column `barColors` on the `upsellcampaign` table. All the data in the column will be lost.
  - You are about to drop the column `barRadius` on the `upsellcampaign` table. All the data in the column will be lost.
  - You are about to drop the column `barStyle` on the `upsellcampaign` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `upsellcampaign` table. All the data in the column will be lost.
  - You are about to drop the column `discountCode` on the `upsellcampaign` table. All the data in the column will be lost.
  - You are about to drop the column `discountType` on the `upsellcampaign` table. All the data in the column will be lost.
  - You are about to drop the column `goalAmount` on the `upsellcampaign` table. All the data in the column will be lost.
  - You are about to drop the column `goalType` on the `upsellcampaign` table. All the data in the column will be lost.
  - You are about to drop the column `goalquantity` on the `upsellcampaign` table. All the data in the column will be lost.
  - Added the required column `campaignId` to the `OrderBump` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `bogofreeitem` ADD COLUMN `shop` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `bogorule` ADD COLUMN `shop` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `buymorerule` ADD COLUMN `shop` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `orderbump` ADD COLUMN `campaignId` INTEGER NOT NULL,
    ADD COLUMN `shop` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `upsellcampaign` DROP COLUMN `badgeImageUrl`,
    DROP COLUMN `barColors`,
    DROP COLUMN `barRadius`,
    DROP COLUMN `barStyle`,
    DROP COLUMN `currency`,
    DROP COLUMN `discountCode`,
    DROP COLUMN `discountType`,
    DROP COLUMN `goalAmount`,
    DROP COLUMN `goalType`,
    DROP COLUMN `goalquantity`;

-- AlterTable
ALTER TABLE `upsellfreegiftproduct` ADD COLUMN `shop` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `upsellrewardcollection` ADD COLUMN `shop` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `upsellrewardproduct` ADD COLUMN `shop` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `upselltriggercollection` ADD COLUMN `shop` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `upselltriggerproduct` ADD COLUMN `shop` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `customiz` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `campaignId` INTEGER NOT NULL,
    `badgeImageUrl` VARCHAR(191) NULL,
    `barStyle` VARCHAR(191) NOT NULL,
    `barRadius` VARCHAR(191) NOT NULL,
    `barColors` JSON NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AddToUnlock` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `campaignId` INTEGER NOT NULL,
    `shop` VARCHAR(191) NULL,
    `discountCode` VARCHAR(191) NULL,
    `discountType` VARCHAR(191) NULL,
    `goalType` VARCHAR(191) NULL,
    `goalAmount` INTEGER NULL,
    `goalQuantity` INTEGER NULL,
    `currency` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `customiz` ADD CONSTRAINT `customiz_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `UpsellCampaign`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AddToUnlock` ADD CONSTRAINT `AddToUnlock_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `UpsellCampaign`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
