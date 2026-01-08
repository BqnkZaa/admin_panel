"use server";

import { prisma } from "@/lib/prisma";
import { broadcastQueue, BROADCAST_QUEUE_NAME } from "@/lib/queue";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { BroadcastTarget, Prisma } from "@prisma/client";
import { lineClient } from "@/lib/line";

export async function calculateRecipientCount(
    targetType: BroadcastTarget,
    targetIds?: string[]
) {
    try {
        if (targetType === "ALL") {
            const count = await prisma.customer.count({ where: { isBlocked: false } });
            return { success: true, count };
        }

        if (targetType === "ALL_FRIENDS") {
            // Cannot accurately count without Insight API
            return { success: true, count: 0 };
        }

        if (targetType === "TAG" && targetIds && targetIds.length > 0) {
            const count = await prisma.customer.count({
                where: {
                    isBlocked: false,
                    tags: { hasSome: targetIds }
                }
            });
            return { success: true, count };
        }

        if (targetType === "RICH_MENU" && targetIds && targetIds.length > 0) {
            const count = await prisma.customer.count({
                where: {
                    isBlocked: false,
                    richMenuAliasId: targetIds[0]
                }
            });
            return { success: true, count };
        }

        if (targetType === "SPECIFIC_USERS" && targetIds) {
            return { success: true, count: targetIds.length };
        }

        if (targetType === "SINGLE") {
            return { success: true, count: 1 };
        }

        if (targetType === "LIMIT" && targetIds && targetIds.length > 0) {
            const limit = Number(targetIds[0]);
            if (isNaN(limit)) return { success: true, count: 0 };
            const total = await prisma.customer.count({ where: { isBlocked: false } });
            return { success: true, count: Math.min(limit, total) };
        }

        if (targetType === "SEGMENT" && targetIds && targetIds.length > 0) {
            const segmentType = targetIds[0];
            const now = new Date();
            const dateThreshold = new Date();

            if (segmentType === "ACTIVE_7_DAYS") {
                dateThreshold.setDate(now.getDate() - 7);
                const count = await prisma.customer.count({
                    where: { isBlocked: false, updatedAt: { gte: dateThreshold } }
                });
                return { success: true, count };
            }

            if (segmentType === "ACTIVE_30_DAYS") {
                dateThreshold.setDate(now.getDate() - 30);
                const count = await prisma.customer.count({
                    where: { isBlocked: false, updatedAt: { gte: dateThreshold } }
                });
                return { success: true, count };
            }

            if (segmentType === "NEW_USER_30_DAYS") {
                dateThreshold.setDate(now.getDate() - 30);
                const count = await prisma.customer.count({
                    where: { isBlocked: false, createdAt: { gte: dateThreshold } }
                });
                return { success: true, count };
            }

            return { success: true, count: 0 };
        }

        return { success: true, count: 0 };
    } catch (error) {
        console.error("Error calculating recipient count:", error);
        return { success: false, count: 0, error: "Failed to calculate count" };
    }
}

export async function sendBroadcast(data: {
    name: string;
    messageContent: unknown;
    targetType: BroadcastTarget;
    targetIds?: string[];
    // targetConfig?: unknown; // Removed unused
    scheduledAt?: Date;
}) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const now = new Date();
        const scheduledTime = data.scheduledAt ? new Date(data.scheduledAt) : null;
        let delay = 0;
        let status: "QUEUED" | "SCHEDULED" = "QUEUED";

        if (scheduledTime && scheduledTime > now) {
            delay = scheduledTime.getTime() - now.getTime();
            status = "SCHEDULED";
        }

        // 1. Create Broadcast record in DB
        const broadcast = await prisma.broadcast.create({
            data: {
                name: data.name,
                content: data.messageContent as Prisma.InputJsonValue,
                targetType: data.targetType,
                targetIds: data.targetIds || [],
                // targetConfig: data.targetConfig as Prisma.InputJsonValue,
                status: status,
                scheduledAt: scheduledTime,
                createdById: session.user.id,
            },
        });

        // 2. Add job to BullMQ
        await broadcastQueue.add(BROADCAST_QUEUE_NAME, {
            broadcastId: broadcast.id,
            messageContent: data.messageContent,
            targetType: data.targetType,
            targetIds: data.targetIds || [],
            // targetConfig: data.targetConfig,
            segment: "all",
        }, {
            delay: delay,
            jobId: broadcast.id // Use broadcast ID as job ID for easier tracking/cancellation if needed
        });

        revalidatePath("/broadcast");
        return { success: true, broadcastId: broadcast.id };
    } catch (error) {
        console.error("Error sending broadcast:", error);
        return { success: false, error: "Failed to create broadcast" };
    }
}

export async function sendTestBroadcast(data: {
    messageContent: unknown;
    targetUserId: string;
}) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        await lineClient.pushMessage({
            to: data.targetUserId,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            messages: [data.messageContent as any],
        });
        return { success: true };
    } catch (error) {
        console.error("Error sending test broadcast:", error);
        return { success: false, error: "Failed to send test message" };
    }
}

export async function getBroadcasts() {
    try {
        return await prisma.broadcast.findMany({
            orderBy: { createdAt: "desc" },
            take: 20,
            include: {
                createdBy: {
                    select: { name: true, email: true },
                },
            },
        });
    } catch (error) {
        console.error("Error fetching broadcasts:", error);
        return [];
    }
}
