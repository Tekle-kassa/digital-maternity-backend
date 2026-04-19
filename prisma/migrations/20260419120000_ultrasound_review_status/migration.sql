-- CreateEnum
CREATE TYPE "UltrasoundReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Ultrasound" ADD COLUMN "reviewStatus" "UltrasoundReviewStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Ultrasound" ADD COLUMN "reviewedById" TEXT;
ALTER TABLE "Ultrasound" ADD COLUMN "reviewedAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Ultrasound" ADD CONSTRAINT "Ultrasound_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
