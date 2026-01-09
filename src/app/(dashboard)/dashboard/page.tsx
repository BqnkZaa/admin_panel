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
            name: "กำลังติดตาม", // Friendlier Thai: "Following" -> "กำลังติดตาม"
            value: stats?.totalUsers.toLocaleString() || "0",
            change: stats?.newUsersToday ? `+${stats.newUsersToday} คนวันนี้` : "ไม่มีผู้ใช้ใหม่",
            changeType: (stats?.newUsersToday || 0) > 0 ? "positive" as const : "neutral" as const,
            icon: Users,
            iconColor: "text-blue-600",
            iconBg: "bg-blue-100",
        },
        {
            name: "ส่งข้อความแล้ว",
            value: stats?.totalMessages.toLocaleString() || "0",
            change: "ข้อความทั้งหมด",
            changeType: "neutral" as const,
            icon: MessageSquare,
            iconColor: "text-emerald-600",
            iconBg: "bg-emerald-100",
        },
        {
            name: "โควต้าคงเหลือ",
            value: stats?.remainingQuota.toLocaleString() || "0",
            change: "ประมาณการ",
            changeType: "neutral" as const,
            icon: Send,
            iconColor: "text-purple-600",
            iconBg: "bg-purple-100",
        },
        {
            name: "สถานะระบบ",
            value: "ปกติ",
            change: "พร้อมใช้งาน",
            changeType: "positive" as const,
            icon: Activity,
            iconColor: "text-orange-600",
            iconBg: "bg-orange-100",
        },
    ];

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">ภาพรวมระบบ</h1>
                <p className="text-slate-500">สรุปข้อมูลสำคัญของ LINE Official Account</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {displayStats.map((stat) => (
                    <StatsCard
                        key={stat.name}
                        title={stat.name}
                        value={stat.value}
                        change={stat.change}
                        changeType={stat.changeType}
                        icon={stat.icon}
                        iconColor={stat.iconColor}
                        iconBg={stat.iconBg}
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
