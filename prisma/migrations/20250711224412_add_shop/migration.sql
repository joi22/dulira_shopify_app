/*
  Warnings:

  - Added the required column `shop` to the `UpsellCampaign` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `upsellcampaign` ADD COLUMN `shop` VARCHAR(191) NOT NULL;
