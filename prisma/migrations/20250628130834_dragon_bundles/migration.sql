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
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `placement` VARCHAR(191) NOT NULL,
    `rewardMode` VARCHAR(191) NOT NULL,
    `showConfetti` BOOLEAN NOT NULL,
    `showLockedGoals` BOOLEAN NOT NULL,
    `goalType` VARCHAR(191) NOT NULL,
    `currency` VARCHAR(191) NOT NULL,
    `goalAmount` VARCHAR(191) NOT NULL,
    `rewardType` VARCHAR(191) NOT NULL,
    `discountCode` VARCHAR(191) NULL,
    `discountType` VARCHAR(191) NULL,
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
    `id` VARCHAR(191) NOT NULL,
    `campaignId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `productTitle` VARCHAR(191) NOT NULL,
    `handle` VARCHAR(191) NOT NULL,
    `price` VARCHAR(191) NULL,
    `media` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UpsellTriggerCollection` (
    `id` VARCHAR(191) NOT NULL,
    `campaignId` VARCHAR(191) NOT NULL,
    `collectionId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `handle` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UpsellRewardProduct` (
    `id` VARCHAR(191) NOT NULL,
    `campaignId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `price` VARCHAR(191) NULL,
    `media` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UpsellTriggerProduct` ADD CONSTRAINT `UpsellTriggerProduct_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `UpsellCampaign`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UpsellTriggerCollection` ADD CONSTRAINT `UpsellTriggerCollection_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `UpsellCampaign`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UpsellRewardProduct` ADD CONSTRAINT `UpsellRewardProduct_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `UpsellCampaign`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
