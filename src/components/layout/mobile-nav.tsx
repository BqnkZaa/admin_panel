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

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Chat", href: "/chat", icon: MessageSquare },
    { name: "Broadcast", href: "/broadcast", icon: Send },
    { name: "Flex Builder", href: "/flex-builder", icon: Palette },
    { name: "Customers", href: "/customers", icon: Users },
    { name: "Rich Menu", href: "/rich-menu", icon: Grid3X3 },
    { name: "Automation", href: "/automation", icon: Bot },
    { name: "Products", href: "/products", icon: Package },
    { name: "Settings", href: "/settings", icon: Settings },
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
            <aside className="fixed inset-y-0 left-0 w-72 bg-card shadow-xl z-50 md:hidden flex flex-col animate-in slide-in-from-left duration-300">
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-border">
                    <Link href="/dashboard" className="flex items-center gap-2" onClick={onClose}>
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <span className="text-primary-foreground font-bold text-sm">L</span>
                        </div>
                        <span className="font-semibold text-lg">LINE Admin</span>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Navigation */}
                <ScrollArea className="flex-1 p-4">
                    <nav className="space-y-1">
                        {navigation.map((item) => {
                            const isActive = pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={onClose}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                    )}
                                >
                                    <item.icon className="h-5 w-5 shrink-0" />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </ScrollArea>

                {/* Footer */}
                <div className="p-4 border-t border-border">
                    <div className="text-xs text-muted-foreground text-center">
                        <p>LINE OA Admin Panel v1.0.0</p>
                    </div>
                </div>
            </aside>
        </>
    );
}
