-- AlterEnum
ALTER TYPE "BroadcastTarget" ADD VALUE 'RICH_MENU';

-- AlterTable
ALTER TABLE "AutoReplyKeyword" ADD COLUMN     "altText" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "quickReplies" JSONB,
ADD COLUMN     "senderIconUrl" TEXT,
ADD COLUMN     "senderName" TEXT,
ADD COLUMN     "tagsToAdd" TEXT[],
ALTER COLUMN "matchType" SET DEFAULT 'EXACT';
