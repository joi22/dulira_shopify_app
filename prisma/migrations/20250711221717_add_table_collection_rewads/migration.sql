-- CreateTable
CREATE TABLE `Session` (
    `id` VARCHAR(191) NOT NULL,
    `shop` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `isOnline` BOOLEAN NOT NULL DEFAULT false,
    `scope` VARCHAR(191) NULL,
    `expires` DATETIME(3) NULL,
    `accessToken` VARCHAR(191) NOT NULL,
    `userId` BIGINT NULL,
    `firstName` VARCHAR(191) NULL,
    `lastName` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `accountOwner` BOOLEAN NOT NULL DEFAULT false,
    `locale` VARCHAR(191) NULL,
    `collaborator` BOOLEAN NULL DEFAULT false,
    `emailVerified` BOOLEAN NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UpsellCampaign` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `placement` VARCHAR(191) NOT NULL,
    `rewardMode` VARCHAR(191) NOT NULL,
    `rewardType` VARCHAR(191) NOT NULL,
    `discountCode` VARCHAR(191) NULL,
    `discountType` VARCHAR(191) NULL,
    `goalType` VARCHAR(191) NULL,
    `goalAmount` INTEGER NULL,
    `goalquantity` INTEGER NULL,
    `currency` VARCHAR(191) NULL,
    `showConfetti` BOOLEAN NOT NULL DEFAULT false,
    `showLockedGoals` BOOLEAN NOT NULL DEFAULT false,
    `badgeImageUrl` VARCHAR(191) NULL,
    `barStyle` VARCHAR(191) NOT NULL,
    `barRadius` VARCHAR(191) NOT NULL,
    `barColors` JSON NOT NULL,
    `goalText` VARCHAR(191) NOT NULL,
    `preGoalText` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UpsellTriggerProduct` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `campaignId` INTEGER NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `productTitle` VARCHAR(191) NOT NULL,
    `handle` VARCHAR(191) NOT NULL,
    `price` VARCHAR(191) NULL,
    `media` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UpsellTriggerCollection` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `campaignId` INTEGER NOT NULL,
    `collectionId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `handle` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UpsellRewardProduct` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `campaignId` INTEGER NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `price` VARCHAR(191) NULL,
    `media` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UpsellRewardCollection` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `campaignId` INTEGER NOT NULL,
    `collectionid` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `price` VARCHAR(191) NULL,
    `media` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BuyMoreRule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `campaignId` INTEGER NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `discount` DOUBLE NOT NULL,
    `discountType` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BogoRule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `campaignId` INTEGER NOT NULL,
    `buyQty` VARCHAR(191) NOT NULL,
    `getQty` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BogoFreeItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `campaignId` INTEGER NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UpsellTriggerProduct` ADD CONSTRAINT `UpsellTriggerProduct_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `UpsellCampaign`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UpsellTriggerCollection` ADD CONSTRAINT `UpsellTriggerCollection_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `UpsellCampaign`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UpsellRewardProduct` ADD CONSTRAINT `UpsellRewardProduct_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `UpsellCampaign`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UpsellRewardCollection` ADD CONSTRAINT `UpsellRewardCollection_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `UpsellCampaign`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BuyMoreRule` ADD CONSTRAINT `BuyMoreRule_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `UpsellCampaign`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BogoRule` ADD CONSTRAINT `BogoRule_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `UpsellCampaign`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BogoFreeItem` ADD CONSTRAINT `BogoFreeItem_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `UpsellCampaign`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
