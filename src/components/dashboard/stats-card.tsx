import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
    title: string;
    value: string;
    change?: string;
    changeType?: "positive" | "negative" | "neutral";
    icon: LucideIcon;
    iconColor?: string;
    iconBg?: string;
}

export function StatsCard({ title, value, change, changeType, icon: Icon, iconColor = "text-blue-600", iconBg = "bg-blue-100" }: StatsCardProps) {
    return (
        <Card className="rounded-xl border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
                        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
                    </div>
                    <div className={cn("p-3 rounded-lg", iconBg)}>
                        <Icon className={cn("w-6 h-6", iconColor)} />
                    </div>
                </div>
                {change && (
                    <div className="mt-4 flex items-center text-xs">
                        <span
                            className={cn(
                                "font-medium",
                                changeType === "positive" && "text-emerald-600",
                                changeType === "negative" && "text-red-600",
                                changeType === "neutral" && "text-slate-500"
                            )}
                        >
                            {change}
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
