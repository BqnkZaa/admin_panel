"use server";

import { prisma } from "@/lib/prisma";
import { lineClient } from "@/lib/line";
import { revalidatePath } from "next/cache";

export async function getConversations() {
    try {
        const conversations = await prisma.conversation.findMany({
            include: {
                customer: true,
                messages: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
            },
            orderBy: { lastMessageAt: "desc" },
        });

        return conversations.map((conv) => ({
            id: conv.id,
            customerId: conv.customerId,
            customer: {
                id: conv.customer.id,
                displayName: conv.customer.displayName,
                pictureUrl: conv.customer.pictureUrl,
                isFollowing: conv.customer.isFollowing,
            },
            lastMessage: conv.messages[0] || null,
            unreadCount: conv.unreadCount,
            status: conv.status,
            lastMessageAt: conv.lastMessageAt,
        }));
    } catch (error) {
        console.error("Error fetching conversations:", error);
        return [];
    }
}

export async function getMessages(customerId: string) {
    try {
        const messages = await prisma.message.findMany({
            where: { customerId },
            orderBy: { createdAt: "asc" },
        });

        // Mark conversation as read
        await prisma.conversation.updateMany({
            where: { customerId },
            data: { unreadCount: 0 },
        });

        return messages;
    } catch (error) {
        console.error("Error fetching messages:", error);
        return [];
    }
}

export async function getCustomer(customerId: string) {
    try {
        const customer = await prisma.customer.findUnique({
            where: { id: customerId },
            include: {
                conversations: true,
            },
        });
        return customer;
    } catch (error) {
        console.error("Error fetching customer:", error);
        return null;
    }
}

export async function sendMessage(customerId: string, text: string) {
    try {
        // Get customer
        const customer = await prisma.customer.findUnique({
            where: { id: customerId },
        });

        if (!customer) {
            return { success: false, error: "Customer not found" };
        }

        // Send message via LINE API
        await lineClient.pushMessage({
            to: customer.lineUserId,
            messages: [{ type: "text", text }],
        });

        // Get or create conversation
        let conversation = await prisma.conversation.findUnique({
            where: { customerId },
        });

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    customerId,
                    status: "OPEN",
                    unreadCount: 0,
                },
            });
        }

        // Create message record
        await prisma.message.create({
            data: {
                customerId,
                conversationId: conversation.id,
                type: "TEXT",
                direction: "OUTBOUND",
                content: { type: "text", text },
                status: "SENT",
                sentAt: new Date(),
            },
        });

        // Update conversation
        await prisma.conversation.update({
            where: { id: conversation.id },
            data: {
                lastMessageAt: new Date(),
                status: "OPEN",
            },
        });

        revalidatePath("/chat");
        revalidatePath(`/chat/${customerId}`);

        return { success: true };
    } catch (error) {
        console.error("Error sending message:", error);
        return { success: false, error: "Failed to send message" };
    }
}
