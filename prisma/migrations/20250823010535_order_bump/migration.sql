-- AlterTable
ALTER TABLE `upsellcampaign` ADD COLUMN `iconUrl` VARCHAR(191) NULL,
    ADD COLUMN `offerDescription` VARCHAR(191) NULL,
    ADD COLUMN `offerTitle` VARCHAR(191) NULL,
    ADD COLUMN `preChecked` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `CampaignTargetCountry` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `campaignId` INTEGER NOT NULL,
    `code` VARCHAR(191) NULL,
    `name` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CampaignExcludeCountry` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `campaignId` INTEGER NOT NULL,
    `code` VARCHAR(191) NULL,
    `name` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CampaignTargetCountry` ADD CONSTRAINT `CampaignTargetCountry_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `UpsellCampaign`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CampaignExcludeCountry` ADD CONSTRAINT `CampaignExcludeCountry_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `UpsellCampaign`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
