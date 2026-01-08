"use server";

import { lineClient, lineBlobClient } from "@/lib/line";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { RichMenu } from "@line/bot-sdk";
import { prisma } from "@/lib/prisma";

// Define a type for our internal representation if needed, 
// but LINE SDK types are usually sufficient.

export async function getRichMenus() {
    const session = await auth();
    if (!session?.user) return [];

    try {
        const response = await lineClient.getRichMenuList();
        // detailed info for each might need individual fetches if list is summary only, 
        // but getRichMenuList returns array of RichMenuResponse which is good.
        return response.richmenus;
    } catch (error) {
        console.error("Error fetching rich menus:", error);
        return [];
    }
}

export async function createRichMenu(data: {
    name: string;
    chatBarText: string;
    imageUrl: string;
    areas: string; // JSON string
}) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        console.log("Creating Rich Menu with data:", { name: data.name, imageUrl: data.imageUrl });

        // 1. Parse Areas JSON
        let areas = [];
        try {
            areas = JSON.parse(data.areas);
        } catch {
            return { success: false, error: "Invalid JSON for Areas" };
        }

        // 2. Create Rich Menu Object
        const richMenu: RichMenu = {
            size: { width: 2500, height: 1686 }, // Standard size, could make configurable later
            selected: false,
            name: data.name,
            chatBarText: data.chatBarText,
            areas: areas,
        };

        const response = await lineClient.createRichMenu(richMenu);
        const richMenuId = response.richMenuId;
        console.log("Rich Menu created, ID:", richMenuId);

        // 3. Upload Image
        try {
            console.log("Fetching image from URL...");
            const imageRes = await fetch(data.imageUrl);
            if (!imageRes.ok) {
                console.error("Failed to fetch image:", imageRes.statusText);
                throw new Error(`Failed to fetch image from URL: ${imageRes.statusText}`);
            }

            const contentType = imageRes.headers.get("content-type");
            console.log("Image Content-Type:", contentType);

            if (!contentType || (!contentType.includes("image/jpeg") && !contentType.includes("image/png"))) {
                throw new Error(`Invalid Image Content-Type: ${contentType}. Must be image/jpeg or image/png.`);
            }

            const imageBuffer = await imageRes.arrayBuffer();
            const blob = new Blob([imageBuffer], { type: contentType });
            console.log("Image fetched, uploading to LINE...", { size: imageBuffer.byteLength, type: contentType });

            await lineBlobClient.setRichMenuImage(richMenuId, blob);
            console.log("Image uploaded successfully.");
        } catch (uploadError) {
            console.error("Image upload failed, rolling back Rich Menu creation:", uploadError);
            // Attempt to clean up the menu that was just created without an image
            await lineClient.deleteRichMenu(richMenuId);
            throw uploadError;
        }

        revalidatePath("/rich-menu");
        return { success: true };
    } catch (error: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const msg = (error as any).message || "Failed to create rich menu";
        console.error("Error creating rich menu:", error);
        // If possible, try to delete the empty menu if image upload failed?
        // But for now, just log.
        return { success: false, error: msg };
    }
}

export async function deleteRichMenu(richMenuId: string) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        await lineClient.deleteRichMenu(richMenuId);
        revalidatePath("/rich-menu");
        return { success: true };
    } catch (error) {
        console.error("Error deleting rich menu:", error);
        return { success: false, error: "Failed to delete rich menu" };
    }
}

export async function setDefaultRichMenu(richMenuId: string) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        await lineClient.setDefaultRichMenu(richMenuId);
        revalidatePath("/rich-menu");
        return { success: true };
    } catch (error) {
        console.error("Error setting default rich menu:", error);
        return { success: false, error: "Failed to set default rich menu" };
    }
}

export async function getDefaultRichMenuId() {
    try {
        const response = await lineClient.getDefaultRichMenuId();
        return response.richMenuId;
    } catch {
        // 404 if no default is set
        return null;
    }
}

export async function linkRichMenuToUser(userId: string, richMenuId: string) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        console.log(`Linking Rich Menu ${richMenuId} to User ${userId}`);
        await lineClient.linkRichMenuIdToUser(userId, richMenuId);

        // --- NEW: Sync to DB ---
        await prisma.customer.update({
            where: { lineUserId: userId },
            data: { richMenuAliasId: richMenuId }
        });
        // -----------------------

        console.log("Link successful");
        revalidatePath(`/chat/${userId}`); // Revalidate chat page
        return { success: true };
    } catch (error) {
        console.error("Error linking rich menu to user:", error);
        return { success: false, error: "Failed to link rich menu" };
    }
}

export async function unlinkRichMenuFromUser(userId: string) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        console.log(`Unlinking Rich Menu from User ${userId}`);
        await lineClient.unlinkRichMenuIdFromUser(userId);

        // --- NEW: Sync to DB ---
        await prisma.customer.update({
            where: { lineUserId: userId },
            data: { richMenuAliasId: null }
        });
        // -----------------------

        revalidatePath(`/chat/${userId}`);
        return { success: true };
    } catch (error) {
        console.error("Error unlinking rich menu from user:", error);
        return { success: false, error: "Failed to unlink rich menu" };
    }
}

export async function getRichMenuIdOfUser(userId: string) {
    try {
        const response = await lineClient.getRichMenuIdOfUser(userId);
        return response.richMenuId;
    } catch {
        // 404 if no menu linked
        return null;
    }
}

