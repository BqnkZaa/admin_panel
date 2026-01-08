import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
    title: string;
    value: string;
    change?: string;
    changeType?: "positive" | "negative" | "neutral";
    icon: LucideIcon;
}

export function StatsCard({ title, value, change, changeType, icon: Icon }: StatsCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {change && (
                    <p
                        className={`text-xs ${changeType === "positive"
                                ? "text-green-600"
                                : changeType === "negative"
                                    ? "text-red-600"
                                    : "text-muted-foreground"
                            }`}
                    >
                        {change}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
