-- DropForeignKey
ALTER TABLE "Visit" DROP CONSTRAINT "Visit_pregnancyId_fkey";

-- AlterTable
ALTER TABLE "Visit" ALTER COLUMN "pregnancyId" DROP NOT NULL,
ALTER COLUMN "visitNumber" DROP NOT NULL,
ALTER COLUMN "visitType" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_pregnancyId_fkey" FOREIGN KEY ("pregnancyId") REFERENCES "Pregnancy"("id") ON DELETE SET NULL ON UPDATE CASCADE;
