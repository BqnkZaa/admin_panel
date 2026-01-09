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

const quickAccess = [
    { name: "Chat", href: "/chat", icon: MessageSquare, color: "bg-green-500" },
    { name: "Products", href: "/products", icon: Package, color: "bg-orange-500" },
    { name: "Automation", href: "/automation", icon: Bot, color: "bg-blue-500" },
    { name: "Broadcast", href: "/broadcast", icon: Send, color: "bg-purple-500" },
];

const menuGroups = [
    {
        title: "Main",
        items: [
            { name: "ภาพรวมระบบ", href: "/dashboard", icon: LayoutDashboard },
        ]
    },
    {
        title: "Chat & CRM",
        items: [
            { name: "แชท", href: "/chat", icon: MessageSquare },
            { name: "บรอดแคสต์", href: "/broadcast", icon: Send },
            { name: "ลูกค้า", href: "/customers", icon: Users },
        ]
    },
    {
        title: "Content & Products",
        items: [
            { name: "ริชเมนู", href: "/rich-menu", icon: Grid3X3 },
            { name: "Flex Builder", href: "/flex-builder", icon: Palette },
            { name: "สินค้า", href: "/products", icon: Package },
        ]
    },
    {
        title: "Automation",
        items: [
            { name: "ระบบอัตโนมัติ", href: "/automation", icon: Bot },
        ]
    },
    {
        title: "System",
        items: [
            { name: "ตั้งค่า", href: "/settings", icon: Settings },
        ]
    }
];

export function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside
            className={cn(
                "hidden md:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 relative z-10",
                collapsed ? "w-20" : "w-72"
            )}
        >
            {/* Gradient Header */}
            <div className={cn(
                "h-16 flex items-center px-4 bg-gradient-to-r from-blue-600 to-purple-600 shrink-0",
                collapsed ? "justify-center" : "justify-between"
            )}>
                {!collapsed && (
                    <div className="flex items-center gap-2 text-white overflow-hidden">
                        <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center shrink-0">
                            <span className="font-bold">L</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-lg leading-none truncate">Admin Panel</span>
                            <span className="text-[10px] text-white/80 opacity-80">Management System</span>
                        </div>
                    </div>
                )}
                {collapsed && (
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-white font-bold">
                        L
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                {/* Toggle Button */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-20 bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:bg-gray-50 z-20 text-gray-500"
                >
                    {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>

                {/* Quick Access Grid */}
                {!collapsed && (
                    <div className="p-4 pb-2">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3 px-1">Quick Access</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {quickAccess.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all group border border-transparent hover:border-gray-200"
                                >
                                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm mb-2 transition-transform group-hover:scale-110", item.color)}>
                                        <item.icon size={20} />
                                    </div>
                                    <span className="text-xs font-medium text-gray-600">{item.name}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Divider */}
                {!collapsed && <div className="mx-4 my-2 border-b border-gray-100" />}

                {/* Navigation Menu */}
                <nav className="p-3 space-y-6">
                    {menuGroups.map((group) => (
                        <div key={group.title}>
                            {!collapsed && (
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-3">
                                    {group.title}
                                </h3>
                            )}
                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const isActive = pathname.startsWith(item.href);
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                                                isActive
                                                    ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                                                collapsed && "justify-center px-2 py-3"
                                            )}
                                            title={collapsed ? item.name : undefined}
                                        >
                                            <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-white" : "text-gray-500 group-hover:text-gray-700")} />
                                            {!collapsed && <span>{item.name}</span>}
                                            {collapsed && isActive && (
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full" />
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>
            </div>

            {/* Footer */}
            {!collapsed && (
                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                            A
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium text-gray-900 truncate">Admin User</p>
                            <p className="text-xs text-gray-500 truncate">admin@lineoa.com</p>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}
