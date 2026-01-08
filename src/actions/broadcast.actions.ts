"use server";

import { prisma } from "@/lib/prisma";
import { broadcastQueue, BROADCAST_QUEUE_NAME } from "@/lib/queue";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { BroadcastTarget, Prisma } from "@prisma/client";
import { lineClient } from "@/lib/line";

export async function sendBroadcast(data: {
    name: string;
    messageContent: unknown;
    targetType: BroadcastTarget;
    targetIds?: string[];
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
