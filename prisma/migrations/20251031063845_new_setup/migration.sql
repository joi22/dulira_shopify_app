/*
  Warnings:

  - The primary key for the `session` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE `session` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `isOnline` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `accountOwner` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `collaborator` BOOLEAN NULL DEFAULT false,
    MODIFY `emailVerified` BOOLEAN NULL DEFAULT false,
    ADD PRIMARY KEY (`id`);
