/*
  Warnings:

  - You are about to drop the column `dob` on the `Patient` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Patient" DROP COLUMN "dob",
ADD COLUMN     "age" INTEGER;
