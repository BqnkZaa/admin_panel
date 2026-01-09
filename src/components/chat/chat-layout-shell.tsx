"use client";

import { usePathname } from "next/navigation";
import { ChatList, type Conversation } from "@/components/chat/chat-list";
import { cn } from "@/lib/utils";

interface ChatLayoutShellProps {
    children: React.ReactNode;
    conversations: Conversation[];
}

export function ChatLayoutShell({ children, conversations }: ChatLayoutShellProps) {
    const pathname = usePathname();
    const isRoot = pathname === "/chat";

    return (
        <div className="flex h-[calc(100vh-5rem)] gap-4">
            {/* Conversation List Sidebar */}
            <div
                className={cn(
                    "border rounded-lg bg-card flex-shrink-0 flex flex-col",
                    isRoot ? "flex w-full md:w-80" : "hidden md:flex md:w-80"
                )}
            >
                <div className="p-4 border-b">
                    <h2 className="font-semibold text-slate-900">การสนทนา</h2>
                    <p className="text-sm text-slate-500">
                        {conversations.length} รายการ
                    </p>
                </div>
                <ChatList conversations={conversations} />
            </div>

            {/* Chat Window */}
            <div
                className={cn(
                    "flex-1 border rounded-lg bg-card flex flex-col min-w-0",
                    isRoot ? "hidden md:flex" : "flex"
                )}
            >
                {children}
            </div>
        </div>
    );
}
