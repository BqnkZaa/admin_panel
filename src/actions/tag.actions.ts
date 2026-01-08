"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function addTag(customerId: string, tag: string) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    if (!tag.trim()) return { success: false, error: "Empty tag" };

    try {
        await prisma.customer.update({
            where: { id: customerId },
            data: {
                tags: {
                    push: tag.trim()
                }
            }
        });
        revalidatePath(`/chat/${customerId}`);
        return { success: true };
    } catch (error) {
        console.error("Error adding tag:", error);
        return { success: false, error: "Failed to add tag" };
    }
}

export async function removeTag(customerId: string, tagToRemove: string) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        // Fetch current tags first as Prisma doesn't have a simple "remove item from array" atomic op for postgres arrays in simple update API, 
        // though raw query could do it. Simpler in ORM: fetch -> filter -> set.
        const customer = await prisma.customer.findUnique({
            where: { id: customerId },
            select: { tags: true }
        });

        if (!customer) return { success: false, error: "Customer not found" };

        const newTags = customer.tags.filter(t => t !== tagToRemove);

        await prisma.customer.update({
            where: { id: customerId },
            data: {
                tags: newTags
            }
        });

        revalidatePath(`/chat/${customerId}`);
        return { success: true };
    } catch (error) {
        console.error("Error removing tag:", error);
        return { success: false, error: "Failed to remove tag" };
    }
}
