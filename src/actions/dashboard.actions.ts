"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getDashboardStats() {
    const session = await auth();
    if (!session?.user) return null;

    try {
        const [totalUsers, totalMessages, newUsersToday] = await Promise.all([
            prisma.customer.count({ where: { isFollowing: true } }),
            prisma.message.count({ where: { direction: "OUTBOUND" } }), // Count outbound messages
            prisma.customer.count({
                where: {
                    isFollowing: true,
                    createdAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0))
                    }
                }
            })
        ]);

        return {
            totalUsers,
            totalMessages,
            newUsersToday,
            remainingQuota: 1000 - totalMessages // Mock quota for now, assuming free tier approx?
        };
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return null;
    }
}

export async function getDailyMessageCount() {
    // Group messages by date for the last 7 days
    const session = await auth();
    if (!session?.user) return [];

    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Prisma groupBy date returns full timestamp, need to aggregate by day in JS or raw query
        // Raw query is cleaner for date truncation, but let's stick to Prisma safe mode: fetch and reduce
        // Or simpler: fetch all messages last 7 days select createdAt

        const rawMessages = await prisma.message.findMany({
            where: {
                createdAt: { gte: sevenDaysAgo }
            },
            select: { createdAt: true }
        });

        const grouped = rawMessages.reduce((acc, msg) => {
            const date = msg.createdAt.toLocaleDateString('en-CA'); // YYYY-MM-DD
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Fill in missing days
        const result = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('en-CA');
            result.push({
                name: d.toLocaleDateString('th-TH', { weekday: 'short' }),
                total: grouped[dateStr] || 0
            });
        }

        return result;

    } catch (error) {
        console.error("Error fetching chart data:", error);
        return [];
    }
}
