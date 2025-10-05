/*
  Warnings:

  - You are about to drop the column `badgeImageUrl` on the `customiz` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `addtounlockoffer` ADD COLUMN `badgeImageUrl` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `customiz` DROP COLUMN `badgeImageUrl`;
