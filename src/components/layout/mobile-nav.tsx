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
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

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

interface MobileNavProps {
    isOpen: boolean;
    onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
    const pathname = usePathname();

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
                onClick={onClose}
            />

            {/* Drawer */}
            <aside className="fixed inset-y-0 left-0 w-80 bg-white shadow-xl z-50 md:hidden flex flex-col animate-in slide-in-from-left duration-300">
                {/* Gradient Header */}
                <div className="h-16 flex items-center justify-between px-4 bg-gradient-to-r from-blue-600 to-purple-600 shrink-0">
                    <div className="flex items-center gap-2 text-white">
                        <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                            <span className="font-bold">L</span>
                        </div>
                        <span className="font-semibold text-lg">LINE Admin</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20 hover:text-white">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Navigation */}
                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-6">
                        {/* Quick Access */}
                        <div>
                            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3 px-1">Quick Access</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {quickAccess.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={onClose}
                                        className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200"
                                    >
                                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm mb-2", item.color)}>
                                            <item.icon size={20} />
                                        </div>
                                        <span className="text-xs font-medium text-gray-600">{item.name}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="border-b border-gray-100" />

                        {/* Groups */}
                        <nav className="space-y-6">
                            {menuGroups.map((group) => (
                                <div key={group.title}>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-3">
                                        {group.title}
                                    </h3>
                                    <div className="space-y-1">
                                        {group.items.map((item) => {
                                            const isActive = pathname.startsWith(item.href);
                                            return (
                                                <Link
                                                    key={item.name}
                                                    href={item.href}
                                                    onClick={onClose}
                                                    className={cn(
                                                        "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                                                        isActive
                                                            ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                                                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                                    )}
                                                >
                                                    <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-white" : "text-gray-500")} />
                                                    <span>{item.name}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </nav>
                    </div>
                </ScrollArea>

                {/* Footer */}
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
            </aside>
        </>
    );
}
