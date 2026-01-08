-- AlterEnum
ALTER TYPE "BroadcastTarget" ADD VALUE 'SPECIFIC_USERS';

-- AlterTable
ALTER TABLE "Broadcast" ADD COLUMN     "targetConfig" JSONB;

-- AlterTable
ALTER TABLE "WelcomeMessage" ADD COLUMN     "altText" TEXT;
