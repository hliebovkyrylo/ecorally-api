-- DropForeignKey
ALTER TABLE "CleanupEquipment" DROP CONSTRAINT "CleanupEquipment_eventId_fkey";

-- DropForeignKey
ALTER TABLE "CleanupEventDate" DROP CONSTRAINT "CleanupEventDate_eventId_fkey";

-- DropForeignKey
ALTER TABLE "CleanupEventLocation" DROP CONSTRAINT "CleanupEventLocation_eventId_fkey";

-- DropForeignKey
ALTER TABLE "CleanupResult" DROP CONSTRAINT "CleanupResult_eventId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_eventId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_eventId_fkey";

-- DropForeignKey
ALTER TABLE "TakePart" DROP CONSTRAINT "TakePart_eventId_fkey";

-- AlterTable
ALTER TABLE "Equipment" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Notification" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "CleanupEventDate" ADD CONSTRAINT "CleanupEventDate_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CleanupEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleanupEventLocation" ADD CONSTRAINT "CleanupEventLocation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CleanupEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TakePart" ADD CONSTRAINT "TakePart_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CleanupEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleanupResult" ADD CONSTRAINT "CleanupResult_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CleanupEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleanupEquipment" ADD CONSTRAINT "CleanupEquipment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CleanupEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CleanupEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CleanupEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
