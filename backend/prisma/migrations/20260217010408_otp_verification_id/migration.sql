/*
  Warnings:

  - You are about to drop the column `code` on the `Otp` table. All the data in the column will be lost.
  - You are about to drop the column `reference` on the `Otp` table. All the data in the column will be lost.
  - Added the required column `verificationId` to the `Otp` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Otp" DROP COLUMN "code",
DROP COLUMN "reference",
ADD COLUMN     "verificationId" TEXT NOT NULL;
