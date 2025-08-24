/*
  Warnings:

  - You are about to drop the column `iconUrl` on the `upsellcampaign` table. All the data in the column will be lost.
  - You are about to drop the column `offerDescription` on the `upsellcampaign` table. All the data in the column will be lost.
  - You are about to drop the column `offerTitle` on the `upsellcampaign` table. All the data in the column will be lost.
  - You are about to drop the column `preChecked` on the `upsellcampaign` table. All the data in the column will be lost.
  - You are about to drop the column `showConfetti` on the `upsellcampaign` table. All the data in the column will be lost.
  - You are about to drop the column `showLockedGoals` on the `upsellcampaign` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `upsellcampaign` DROP COLUMN `iconUrl`,
    DROP COLUMN `offerDescription`,
    DROP COLUMN `offerTitle`,
    DROP COLUMN `preChecked`,
    DROP COLUMN `showConfetti`,
    DROP COLUMN `showLockedGoals`;

-- CreateTable
CREATE TABLE `OrderBump` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `offerTitle` VARCHAR(191) NULL,
    `offerDescription` VARCHAR(191) NULL,
    `preChecked` BOOLEAN NOT NULL DEFAULT false,
    `iconUrl` VARCHAR(191) NULL,
    `onetickProducts` VARCHAR(191) NULL,
    `showConfetti` BOOLEAN NOT NULL DEFAULT false,
    `showLockedGoals` BOOLEAN NOT NULL DEFAULT false,
    `upsellCampaignId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `OrderBump` ADD CONSTRAINT `OrderBump_upsellCampaignId_fkey` FOREIGN KEY (`upsellCampaignId`) REFERENCES `UpsellCampaign`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
