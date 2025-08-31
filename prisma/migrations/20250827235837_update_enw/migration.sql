-- CreateTable
CREATE TABLE `checkout_upsell` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `campaignId` INTEGER NOT NULL,
    `productId` VARCHAR(191) NULL,
    `discountType` VARCHAR(191) NULL,
    `discountCode` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `checkout_upsell` ADD CONSTRAINT `checkout_upsell_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `UpsellCampaign`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
