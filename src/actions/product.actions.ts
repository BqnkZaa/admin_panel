"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

export async function getProducts() {
    try {
        const products = await prisma.product.findMany({
            orderBy: { createdAt: "desc" },
        });

        // Convert Decimal to number/string for client serialization if needed
        // But Next.js server actions acts as an API layer, usually JSON serialization handles it or fails.
        // Prisma Decimal returns a Decimal.js object. passing it to client component might cause warning.
        // Let's map it safely.
        return products.map((p) => ({
            ...p,
            price: p.price.toNumber(),
            salePrice: p.salePrice ? p.salePrice.toNumber() : null,
        }));
    } catch (error) {
        console.error("Error fetching products:", error);
        return [];
    }
}

export async function createProduct(data: {
    sku: string;
    name: string;
    description?: string;
    price: number;
    stock: number;
    imageUrl?: string;
}) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        await prisma.product.create({
            data: {
                sku: data.sku,
                name: data.name,
                description: data.description,
                price: new Prisma.Decimal(data.price),
                stock: data.stock,
                imageUrl: data.imageUrl,
                isActive: true,
            },
        });
        revalidatePath("/products");
        return { success: true };
    } catch (error) {
        console.error("Error creating product:", error);
        return { success: false, error: "Failed to create product" };
    }
}

export async function updateProduct(
    id: string,
    data: {
        sku: string;
        name: string;
        description?: string;
        price: number;
        stock: number;
        imageUrl?: string;
    }
) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        await prisma.product.update({
            where: { id },
            data: {
                sku: data.sku,
                name: data.name,
                description: data.description,
                price: new Prisma.Decimal(data.price),
                stock: data.stock,
                imageUrl: data.imageUrl,
            },
        });
        revalidatePath("/products");
        return { success: true };
    } catch (error) {
        console.error("Error updating product:", error);
        return { success: false, error: "Failed to update product" };
    }
}

export async function deleteProduct(id: string) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        await prisma.product.delete({
            where: { id },
        });
        revalidatePath("/products");
        return { success: true };
    } catch (error) {
        console.error("Error deleting product:", error);
        return { success: false, error: "Failed to delete product" };
    }
}
