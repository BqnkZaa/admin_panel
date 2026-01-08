import "dotenv/config"; // Load env vars
import http from "http";
import { Worker, Job } from "bullmq";
import { redis } from "../lib/redis";
import { lineClient } from "../lib/line";
import { prisma } from "../lib/prisma";
import { Prisma, MessageType } from "@prisma/client";
import { BROADCAST_QUEUE_NAME } from "../lib/queue";

console.log("🚀 Starting Broadcast Worker...");

const worker = new Worker(
    BROADCAST_QUEUE_NAME,
    async (job: Job) => {
        console.log(`[Job ${job.id}] Starting broadcast...`);
        const { messageContent, broadcastId } = job.data;

        try {
            // 1. Update status to PROCESSING
            await prisma.broadcast.update({
                where: { id: broadcastId },
                data: { status: "PROCESSING", startedAt: new Date() },
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const targetType = (job.data.targetType) || "ALL"; // Fallback for old jobs
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const targetIds = (job.data.targetIds) || [];

            console.log(`[Job ${job.id}] Target Type: ${targetType}, IDs: ${targetIds.length}`);

            // --- SPECIAL CASE: ALL_FRIENDS (Use Broadcast API) ---
            if (targetType === "ALL_FRIENDS") {
                try {
                    await lineClient.broadcast({ messages: [messageContent] });
                    console.log(`[Job ${job.id}] Broadcast API sent successfully.`);

                    // Helper: No individual tracking for Broadcast API.
                    // Just mark as completed.
                    await prisma.broadcast.update({
                        where: { id: broadcastId },
                        data: {
                            status: "COMPLETED",
                            completedAt: new Date(),
                            sentCount: 0, // Unknown
                            failedCount: 0,
                        },
                    });
                    return { sentCount: 0, failedCount: 0 };
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } catch (err: any) {
                    console.error(`[Job ${job.id}] Broadcast API failed:`, err);
                    await prisma.broadcast.update({
                        where: { id: broadcastId },
                        data: {
                            status: "FAILED",
                            completedAt: new Date(),
                        },
                    });
                    throw err;
                }
            }
            // -----------------------------------------------------

            let query: Prisma.CustomerWhereInput = {};
            let take: number | undefined = undefined;
            let orderBy: Prisma.CustomerOrderByWithRelationInput | undefined = undefined;

            if (targetType === "ALL") {
                query = { isFollowing: true };
            } else if (targetType === "RICH_MENU" && targetIds.length > 0) {
                query = {
                    isFollowing: true,
                    richMenuAliasId: { in: targetIds }
                };
            } else if (targetType === "TAG" && targetIds.length > 0) {
                query = {
                    isFollowing: true,
                    tags: { hasSome: targetIds }
                };
            } else if (targetType === "SPECIFIC_USERS" && targetIds.length > 0) {
                query = {
                    // Check existing customers if they match lineUserIds
                    lineUserId: { in: targetIds }
                };
                // NOTE: If we want to send to users NOT in DB, we should separate logic.
                // But typically Admin Panel operates on its DB. 
                // The "Specific Users" often implies raw IDs. 
                // If we restrict to `findMany`, we only msg those we "know".
                // Allow "Manual" to be strictly DB-bound for now to enable tracking?
                // Or loop `targetIds` directly instead of querying DB?
                // Let's stick to DB query to maintain consistency with `customer` loop below.
            } else if (targetType === "SINGLE" && targetIds.length > 0) {
                query = { lineUserId: targetIds[0] }; // One user
            } else if (targetType === "LIMIT" && targetIds.length > 0) {
                const limit = Number(targetIds[0]);
                if (!isNaN(limit) && limit > 0) {
                    take = limit;
                    query = { isFollowing: true };
                    orderBy = { updatedAt: "desc" }; // Valid assumption: "Recent active" often implied by limit
                }
            } else if (targetType === "SEGMENT" && targetIds.length > 0) {
                const segment = targetIds[0];
                const now = new Date();
                const dateThreshold = new Date();

                if (segment === "ACTIVE_7_DAYS") {
                    dateThreshold.setDate(now.getDate() - 7);
                    query = { isFollowing: true, updatedAt: { gte: dateThreshold } };
                } else if (segment === "ACTIVE_30_DAYS") {
                    dateThreshold.setDate(now.getDate() - 30);
                    query = { isFollowing: true, updatedAt: { gte: dateThreshold } };
                } else if (segment === "NEW_USER_30_DAYS") {
                    dateThreshold.setDate(now.getDate() - 30);
                    query = { isFollowing: true, createdAt: { gte: dateThreshold } };
                }
            }

            const customers = await prisma.customer.findMany({
                where: query,
                select: { id: true, lineUserId: true, displayName: true },
                take: take,
                orderBy: orderBy,
            });

            console.log(`[Job ${job.id}] Found ${customers.length} target customers.`);

            let sentCount = 0;
            let failedCount = 0;

            // 3. Loop and send (Rate limited)
            for (const customer of customers) {
                try {
                    await lineClient.pushMessage({
                        to: customer.lineUserId,
                        messages: [messageContent],
                    });
                    sentCount++;

                    // --- NEW: Persist to DB ---
                    try {
                        const customerId = customer.id;

                        // 1. Get or Create Conversation
                        let conversation = await prisma.conversation.findUnique({
                            where: { customerId: customerId },
                        });

                        if (!conversation) {
                            conversation = await prisma.conversation.create({
                                data: {
                                    customerId: customerId,
                                    status: "OPEN",
                                    unreadCount: 0,
                                },
                            });
                        }

                        // 2. Determine Message Type
                        const content = messageContent as Prisma.InputJsonValue;
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const contentObj = messageContent as any;

                        let msgType = "TEXT";
                        if (contentObj.type === "image") msgType = "IMAGE";
                        else if (contentObj.type === "sticker") msgType = "STICKER";
                        else if (contentObj.type === "video") msgType = "VIDEO";
                        else if (contentObj.type === "audio") msgType = "AUDIO";
                        else if (contentObj.type === "location") msgType = "LOCATION";
                        else if (contentObj.type === "flex") msgType = "FLEX";

                        // 3. Create Message Record
                        await prisma.message.create({
                            data: {
                                customerId: customerId,
                                conversationId: conversation.id,
                                type: msgType as MessageType,
                                direction: "OUTBOUND",
                                content: content, // Save the raw JSON
                                status: "SENT",
                                sentAt: new Date(),
                                broadcastId: broadcastId, // Link to broadcast
                            }
                        });


                        // 4. Update Conversation Timestamp
                        await prisma.conversation.update({
                            where: { id: conversation.id },
                            data: {
                                lastMessageAt: new Date(),
                                unreadCount: { increment: 1 }
                            }
                        });

                    } catch (dbError) {
                        console.error(`   Failed to save message to DB for ${customer.displayName}:`, dbError);
                    }
                    // --------------------------
                } catch (error) {
                    console.error(`   Failed to send to ${customer.displayName}:`, error);
                    failedCount++;
                }

                // Rate limit: 50ms delay (~20 req/sec) to stay safe under LINE limits
                await new Promise((resolve) => setTimeout(resolve, 50));

                // Update job progress
                if (customers.length > 0) {
                    await job.updateProgress(Math.round(((sentCount + failedCount) / customers.length) * 100));
                }
            }

            // 4. Update Log to COMPLETED
            await prisma.broadcast.update({
                where: { id: broadcastId },
                data: {
                    status: "COMPLETED",
                    completedAt: new Date(),
                    sentCount,
                    failedCount,
                },
            });

            console.log(`[Job ${job.id}] Broadcast completed. Success: ${sentCount}, Fail: ${failedCount}`);
            return { sentCount, failedCount };
        } catch (error) {
            console.error(`[Job ${job.id}] Broadcast failed completely:`, error);

            await prisma.broadcast.update({
                where: { id: broadcastId },
                data: {
                    status: "FAILED",
                    completedAt: new Date(),
                    // errorMessage: String(error), // No errorMessage field in schema
                },
            });

            throw error;
        }
    },
    {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        connection: redis as any,
        concurrency: 1, // Process one broadcast at a time
    }
);

worker.on("completed", (job) => {
    console.log(`[Job ${job.id}] has completed!`);
});

worker.on("failed", (job, err) => {
    console.log(`[Job ${job?.id}] has failed with ${err.message}`);
});

// --- Render Health Check Server ---
const PORT = process.env.PORT || 8080;
const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Worker is running");
});
server.listen(PORT, () => {
    console.log(`Health check server listening on port ${PORT}`);
});

