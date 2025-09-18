/*
  Warnings:

  - You are about to drop the `addtounlock` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `addtounlock` DROP FOREIGN KEY `AddToUnlock_campaignId_fkey`;

-- DropTable
DROP TABLE `addtounlock`;

-- CreateTable
CREATE TABLE `AddToUnlockOffer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `campaignId` INTEGER NOT NULL,
    `shop` VARCHAR(191) NULL,
    `goalType` VARCHAR(191) NULL,
    `goalAmount` INTEGER NULL,
    `goalQuantity` INTEGER NULL,
    `rewardType` VARCHAR(191) NULL,
    `rewardMode` VARCHAR(191) NULL,
    `discountType` VARCHAR(191) NULL,
    `discountCode` DOUBLE NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BuyXProduct` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `offerId` INTEGER NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `variantId` VARCHAR(191) NULL,
    `title` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_AddToUnlockOfferToUpsellRewardProduct` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_AddToUnlockOfferToUpsellRewardProduct_AB_unique`(`A`, `B`),
    INDEX `_AddToUnlockOfferToUpsellRewardProduct_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_AddToUnlockOfferToUpsellRewardCollection` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_AddToUnlockOfferToUpsellRewardCollection_AB_unique`(`A`, `B`),
    INDEX `_AddToUnlockOfferToUpsellRewardCollection_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_AddToUnlockOfferToUpsellTriggerProduct` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_AddToUnlockOfferToUpsellTriggerProduct_AB_unique`(`A`, `B`),
    INDEX `_AddToUnlockOfferToUpsellTriggerProduct_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_AddToUnlockOfferToUpsellTriggerCollection` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_AddToUnlockOfferToUpsellTriggerCollection_AB_unique`(`A`, `B`),
    INDEX `_AddToUnlockOfferToUpsellTriggerCollection_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AddToUnlockOffer` ADD CONSTRAINT `AddToUnlockOffer_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `UpsellCampaign`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BuyXProduct` ADD CONSTRAINT `BuyXProduct_offerId_fkey` FOREIGN KEY (`offerId`) REFERENCES `AddToUnlockOffer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_AddToUnlockOfferToUpsellRewardProduct` ADD CONSTRAINT `_AddToUnlockOfferToUpsellRewardProduct_A_fkey` FOREIGN KEY (`A`) REFERENCES `AddToUnlockOffer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_AddToUnlockOfferToUpsellRewardProduct` ADD CONSTRAINT `_AddToUnlockOfferToUpsellRewardProduct_B_fkey` FOREIGN KEY (`B`) REFERENCES `UpsellRewardProduct`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_AddToUnlockOfferToUpsellRewardCollection` ADD CONSTRAINT `_AddToUnlockOfferToUpsellRewardCollection_A_fkey` FOREIGN KEY (`A`) REFERENCES `AddToUnlockOffer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_AddToUnlockOfferToUpsellRewardCollection` ADD CONSTRAINT `_AddToUnlockOfferToUpsellRewardCollection_B_fkey` FOREIGN KEY (`B`) REFERENCES `UpsellRewardCollection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_AddToUnlockOfferToUpsellTriggerProduct` ADD CONSTRAINT `_AddToUnlockOfferToUpsellTriggerProduct_A_fkey` FOREIGN KEY (`A`) REFERENCES `AddToUnlockOffer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_AddToUnlockOfferToUpsellTriggerProduct` ADD CONSTRAINT `_AddToUnlockOfferToUpsellTriggerProduct_B_fkey` FOREIGN KEY (`B`) REFERENCES `UpsellTriggerProduct`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_AddToUnlockOfferToUpsellTriggerCollection` ADD CONSTRAINT `_AddToUnlockOfferToUpsellTriggerCollection_A_fkey` FOREIGN KEY (`A`) REFERENCES `AddToUnlockOffer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_AddToUnlockOfferToUpsellTriggerCollection` ADD CONSTRAINT `_AddToUnlockOfferToUpsellTriggerCollection_B_fkey` FOREIGN KEY (`B`) REFERENCES `UpsellTriggerCollection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
