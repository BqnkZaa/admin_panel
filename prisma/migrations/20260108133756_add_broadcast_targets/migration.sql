-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BroadcastTarget" ADD VALUE 'ALL_FRIENDS';
ALTER TYPE "BroadcastTarget" ADD VALUE 'LIMIT';
ALTER TYPE "BroadcastTarget" ADD VALUE 'SEGMENT';
ALTER TYPE "BroadcastTarget" ADD VALUE 'SINGLE';
