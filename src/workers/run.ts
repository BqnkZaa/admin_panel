import "dotenv/config"; // Load env vars
import http from "http";
import { Worker, Job } from "bullmq";
import { redis } from "../lib/redis";
import { lineClient } from "../lib/line";
import { prisma } from "../lib/prisma";
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

            // 2. Fetch customers
            // TODO: Handle segment filtering if implemented later
            const customers = await prisma.customer.findMany({
                where: { isFollowing: true },
                select: { id: true, lineUserId: true, displayName: true },
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
                        const customerId = (customer as any).id;

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
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const content = messageContent as any;
                        let msgType = "TEXT";
                        if (content.type === "image") msgType = "IMAGE";
                        else if (content.type === "sticker") msgType = "STICKER";
                        else if (content.type === "video") msgType = "VIDEO";
                        else if (content.type === "audio") msgType = "AUDIO";
                        else if (content.type === "location") msgType = "LOCATION";
                        else if (content.type === "flex") msgType = "FLEX";

                        // 3. Create Message Record
                        await prisma.message.create({
                            data: {
                                customerId: customerId,
                                conversationId: conversation.id,
                                type: msgType as any,
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
                await job.updateProgress(Math.round(((sentCount + failedCount) / customers.length) * 100));
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

