"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

export async function getTemplates() {
    try {
        return await prisma.flexTemplate.findMany({
            orderBy: { createdAt: "desc" },
        });
    } catch (error) {
        console.error("Error fetching templates:", error);
        return [];
    }
}

export async function saveTemplate(data: {
    id?: string;
    name: string;
    content: unknown;
}) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        // Validation (basic)
        if (!data.name || !data.content) {
            return { success: false, error: "Missing required fields" };
        }

        if (data.id) {
            // Update
            await prisma.flexTemplate.update({
                where: { id: data.id },
                data: {
                    name: data.name,
                    content: data.content as Prisma.InputJsonValue,
                },
            });
        } else {
            // Create
            await prisma.flexTemplate.create({
                data: {
                    name: data.name,
                    content: data.content as Prisma.InputJsonValue,
                },
            });
        }

        revalidatePath("/flex-builder");
        return { success: true };
    } catch (error) {
        console.error("Error saving template:", error);
        return { success: false, error: "Failed to save template" };
    }
}

export async function deleteTemplate(id: string) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        await prisma.flexTemplate.delete({
            where: { id },
        });

        revalidatePath("/flex-builder");
        return { success: true };
    } catch (error) {
        console.error("Error deleting template:", error);
        return { success: false, error: "Failed to delete template" };
    }
}
