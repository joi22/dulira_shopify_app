/*
  Warnings:

  - You are about to drop the column `goalText` on the `upsellcampaign` table. All the data in the column will be lost.
  - You are about to drop the column `preGoalText` on the `upsellcampaign` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `upsellcampaign` DROP COLUMN `goalText`,
    DROP COLUMN `preGoalText`;
