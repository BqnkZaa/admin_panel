"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getCustomers(page: number = 1, limit: number = 20) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        const skip = (page - 1) * limit;
        const [customers, total] = await Promise.all([
            prisma.customer.findMany({
                orderBy: { lastActiveAt: "desc" },
                take: limit,
                skip: skip,
                // include: { tags: true } // Tags is a scalar list (string[]), so it's included by default in the model object, no explicit include needed unless it was a relation
            }),
            prisma.customer.count(),
        ]);

        return {
            success: true,
            customers,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
        };
    } catch (error) {
        console.error("Error fetching customers:", error);
        return { success: false, error: "Failed to fetch customers" };
    }
}

export async function toggleBlockStatus(customerId: string) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        const customer = await prisma.customer.findUnique({
            where: { id: customerId },
            select: { isBlocked: true }
        });

        if (!customer) return { success: false, error: "Customer not found" };

        const updated = await prisma.customer.update({
            where: { id: customerId },
            data: { isBlocked: !customer.isBlocked }
        });

        revalidatePath("/customers");
        return { success: true, isBlocked: updated.isBlocked };
    } catch (error) {
        console.error("Error toggling block status:", error);
        return { success: false, error: "Failed to update status" };
    }
}
