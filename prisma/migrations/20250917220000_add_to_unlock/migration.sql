/*
  Warnings:

  - You are about to drop the column `Status` on the `upsellcampaign` table. All the data in the column will be lost.
  - You are about to drop the column `rewardMode` on the `upsellcampaign` table. All the data in the column will be lost.
  - You are about to drop the column `rewardType` on the `upsellcampaign` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[campaignId]` on the table `customiz` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `upsellcampaign` DROP COLUMN `Status`,
    DROP COLUMN `rewardMode`,
    DROP COLUMN `rewardType`,
    ADD COLUMN `status` ENUM('ACTIVE', 'INACTIVE', 'DRAFT') NOT NULL DEFAULT 'DRAFT';

-- CreateIndex
CREATE UNIQUE INDEX `customiz_campaignId_key` ON `customiz`(`campaignId`);
