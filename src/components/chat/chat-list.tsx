"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import { type MessageContent } from "@/components/chat/message-list";

export interface Conversation {
    id: string;
    customerId: string;
    customer: {
        id: string;
        displayName: string | null;
        pictureUrl: string | null;
        isFollowing: boolean;
    };
    lastMessage: {
        content: MessageContent;
        createdAt: Date;
    } | null;
    unreadCount: number;
    status: string;
    lastMessageAt: Date | null;
}

interface ChatListProps {
    conversations: Conversation[];
}

export function ChatList({ conversations }: ChatListProps) {
    const pathname = usePathname();

    return (
        <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
                {conversations.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                        ไม่มีการสนทนา
                    </div>
                ) : (
                    conversations.map((conv) => {
                        const isActive = pathname === `/chat/${conv.customerId}`;
                        const content = conv.lastMessage?.content;
                        const lastMessageText = content?.text || "ส่งข้อความ...";

                        return (
                            <Link
                                key={conv.id}
                                href={`/chat/${conv.customerId}`}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg transition-colors",
                                    "hover:bg-accent",
                                    isActive && "bg-accent"
                                )}
                            >
                                <div className="relative">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage
                                            src={conv.customer.pictureUrl || ""}
                                            alt={conv.customer.displayName || ""}
                                        />
                                        <AvatarFallback>
                                            {conv.customer.displayName?.[0] || "?"}
                                        </AvatarFallback>
                                    </Avatar>
                                    {conv.customer.isFollowing && (
                                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <p className="font-medium truncate">
                                            {conv.customer.displayName || "ไม่ทราบชื่อ"}
                                        </p>
                                        {conv.lastMessageAt && (
                                            <span className="text-xs text-muted-foreground">
                                                {formatTime(conv.lastMessageAt)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-muted-foreground truncate">
                                            {lastMessageText}
                                        </p>
                                        {conv.unreadCount > 0 && (
                                            <Badge variant="destructive" className="ml-2">
                                                {conv.unreadCount}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>
        </ScrollArea>
    );
}

function formatTime(date: Date | string) {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();

    if (diff < 60000) return "ตอนนี้";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} นาที`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ชม.`;
    return d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}
