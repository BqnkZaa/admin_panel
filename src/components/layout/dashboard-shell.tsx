"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { User } from "next-auth";

interface DashboardShellProps {
    children: React.ReactNode;
    user: User;
}

export function DashboardShell({ children, user }: DashboardShellProps) {
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background flex">
            {/* Desktop Sidebar */}
            <Sidebar />

            {/* Mobile Nav */}
            <MobileNav
                isOpen={mobileNavOpen}
                onClose={() => setMobileNavOpen(false)}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                <Header
                    onMenuClick={() => setMobileNavOpen(true)}
                    user={user}
                />

                <main className="flex-1 p-4 md:p-6 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
