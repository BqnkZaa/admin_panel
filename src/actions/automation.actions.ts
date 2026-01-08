"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { MatchType } from "@prisma/client";

// ========== WELCOME MESSAGE ACTIONS ==========

export async function getWelcomeMessage() {
    try {
        const wm = await prisma.welcomeMessage.findFirst({
            orderBy: { createdAt: "desc" }, // Get the latest one if multiple exist, or we can use a fixed ID approach
        });
        return wm;
    } catch (error) {
        console.error("Error fetching welcome message:", error);
        return null;
    }
}

export async function saveWelcomeMessage(content: string, isActive: boolean) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        // Check if one exists
        const existing = await prisma.welcomeMessage.findFirst();

        if (existing) {
            await prisma.welcomeMessage.update({
                where: { id: existing.id },
                data: {
                    content: { type: "text", text: content },
                    isActive,
                },
            });
        } else {
            await prisma.welcomeMessage.create({
                data: {
                    name: "Default Welcome",
                    messageType: "TEXT",
                    content: { type: "text", text: content },
                    isActive,
                },
            });
        }
        revalidatePath("/automation");
        return { success: true };
    } catch (error) {
        console.error("Error saving welcome message:", error);
        return { success: false, error: "Failed to save welcome message" };
    }
}

// ========== AUTO-REPLY KEYWORD ACTIONS ==========

export async function getKeywords() {
    try {
        return await prisma.autoReplyKeyword.findMany({
            orderBy: { createdAt: "desc" },
        });
    } catch (error) {
        console.error("Error fetching keywords:", error);
        return [];
    }
}

export async function createKeyword(data: {
    keyword: string;
    replyContent: string;
    matchType: MatchType;
    isActive: boolean;
}) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        await prisma.autoReplyKeyword.create({
            data: {
                keyword: data.keyword,
                matchType: data.matchType,
                replyType: "TEXT",
                replyContent: { type: "text", text: data.replyContent },
                isActive: data.isActive,
            },
        });
        revalidatePath("/automation");
        return { success: true };
    } catch (error) {
        console.error("Error creating keyword:", error);
        return { success: false, error: "Failed to create keyword" };
    }
}

export async function deleteKeyword(id: string) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        await prisma.autoReplyKeyword.delete({
            where: { id },
        });
        revalidatePath("/automation");
        return { success: true };
    } catch (error) {
        console.error("Error deleting keyword:", error);
        return { success: false, error: "Failed to delete keyword" };
    }
}

export async function toggleKeywordStatus(id: string, isActive: boolean) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        await prisma.autoReplyKeyword.update({
            where: { id },
            data: { isActive },
        });
        revalidatePath("/automation");
        return { success: true };
    } catch (error) {
        console.error("Error toggling keyword:", error);
        return { success: false, error: "Failed to update keyword" };
    }
}
