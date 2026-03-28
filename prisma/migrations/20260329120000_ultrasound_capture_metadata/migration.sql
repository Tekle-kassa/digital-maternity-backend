-- AlterTable
ALTER TABLE "Ultrasound" ADD COLUMN     "capturedAt" TIMESTAMP(3),
ADD COLUMN     "gain" INTEGER,
ADD COLUMN     "depth" INTEGER,
ADD COLUMN     "dynamicRange" INTEGER;
