import { StatsCard } from "@/components/dashboard/stats-card";
import { MessageChart } from "@/components/dashboard/message-chart";
import { Users, MessageSquare, Send, Activity } from "lucide-react";
import { getDashboardStats, getDailyMessageCount } from "@/actions/dashboard.actions";

export default async function DashboardPage() {
    // Fetch data in parallel
    const [stats, chartData] = await Promise.all([
        getDashboardStats(),
        getDailyMessageCount()
    ]);

    const displayStats = [
        {
            name: "ผู้ติดตามทั้งหมด",
            value: stats?.totalUsers.toLocaleString() || "0",
            change: stats?.newUsersToday ? `+${stats.newUsersToday} คนวันนี้` : "ไม่มีผู้ติดตามใหม่",
            changeType: (stats?.newUsersToday || 0) > 0 ? "positive" as const : "neutral" as const,
            icon: Users,
        },
        {
            name: "ข้อความทั้งหมด (Outbound)",
            value: stats?.totalMessages.toLocaleString() || "0",
            change: "จากระบบทั้งหมด",
            changeType: "neutral" as const,
            icon: MessageSquare,
        },
        {
            name: "โควต้าคงเหลือ",
            value: stats?.remainingQuota.toLocaleString() || "0",
            change: "ประมาณการ (Mock)",
            changeType: "neutral" as const,
            icon: Send,
        },
        {
            name: "สถานะระบบ",
            value: "Normal",
            change: "ระบบทำงานปกติ",
            changeType: "positive" as const,
            icon: Activity,
        },
    ];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">ภาพรวมระบบ LINE OA Admin Panel</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {displayStats.map((stat) => (
                    <StatsCard
                        key={stat.name}
                        title={stat.name}
                        value={stat.value}
                        change={stat.change}
                        changeType={stat.changeType}
                        icon={stat.icon}
                    />
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                {/* Chart */}
                <div className="col-span-12 md:col-span-7">
                    <MessageChart data={chartData} />
                </div>

                {/* NOTE: Hidden "Recent Activity" for now as we don't have a dedicated Activity Log table yet. 
                    Can re-enable when ActivityLog model is fully utilized. 
                */}
            </div>
        </div>
    );
}
