"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    MessageSquare,
    Send,
    Palette,
    Users,
    Grid3X3,
    Bot,
    Package,
    Settings,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navigation = [
    { name: "ภาพรวมระบบ", href: "/dashboard", icon: LayoutDashboard },
    { name: "แชท", href: "/chat", icon: MessageSquare },
    { name: "บรอดแคสต์", href: "/broadcast", icon: Send },
    { name: "Flex Builder", href: "/flex-builder", icon: Palette },
    { name: "ลูกค้า", href: "/customers", icon: Users },
    { name: "ริชเมนู", href: "/rich-menu", icon: Grid3X3 },
    { name: "ระบบอัตโนมัติ", href: "/automation", icon: Bot },
    { name: "สินค้า", href: "/products", icon: Package },
    { name: "ตั้งค่า", href: "/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside
            className={cn(
                "hidden md:flex flex-col bg-card border-r border-border transition-all duration-300",
                collapsed ? "w-16" : "w-64"
            )}
        >
            {/* Logo */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-border">
                {!collapsed && (
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <span className="text-primary-foreground font-bold text-sm">L</span>
                        </div>
                        <span className="font-semibold text-lg">LINE Admin</span>
                    </Link>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCollapsed(!collapsed)}
                    className={cn("h-8 w-8", collapsed && "mx-auto")}
                >
                    {collapsed ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <ChevronLeft className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navigation.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                                collapsed && "justify-center px-2"
                            )}
                            title={collapsed ? item.name : undefined}
                        >
                            <item.icon className="h-5 w-5 shrink-0" />
                            {!collapsed && <span>{item.name}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            {!collapsed && (
                <div className="p-4 border-t border-border">
                    <div className="text-xs text-muted-foreground">
                        <p>LINE OA Admin Panel</p>
                        <p>v1.0.0</p>
                    </div>
                </div>
            )}
        </aside>
    );
}
