"use client";

import { useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// Define local type for JSON content
// Define local type for JSON content
export type MessageContent = {
    type?: string;
    text?: string;
    [key: string]: unknown;
} | null;

export interface Message {
    id: string;
    direction: "INBOUND" | "OUTBOUND";
    content: MessageContent;
    createdAt: Date;
    status: string;
}

interface Customer {
    displayName: string | null;
    pictureUrl: string | null;
}

interface MessageListProps {
    messages: Message[];
    customer: Customer;
}

export function MessageList({ messages, customer }: MessageListProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Auto-scroll to bottom on new messages
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    เริ่มการสนทนา
                </div>
            ) : (
                messages.map((msg) => (
                    <MessageBubble
                        key={msg.id}
                        message={msg}
                        customer={customer}
                    />
                ))
            )}
        </div>
    );
}

function MessageBubble({
    message,
    customer,
}: {
    message: Message;
    customer: Customer;
}) {
    const isInbound = message.direction === "INBOUND";
    const content = message.content;
    const text = content?.text || "";
    const contentType = content?.type || "text";

    return (
        <div
            className={cn(
                "flex items-end gap-2 max-w-[80%]",
                isInbound ? "justify-start" : "justify-end ml-auto"
            )}
        >
            {isInbound && (
                <Avatar className="h-8 w-8">
                    <AvatarImage src={customer.pictureUrl || ""} />
                    <AvatarFallback>{customer.displayName?.[0] || "?"}</AvatarFallback>
                </Avatar>
            )}

            <div
                className={cn(
                    "px-4 py-2 rounded-2xl max-w-full break-words",
                    isInbound
                        ? "bg-accent text-accent-foreground rounded-bl-md"
                        : "bg-primary text-primary-foreground rounded-br-md"
                )}
            >
                {contentType === "text" && <p>{text}</p>}
                {contentType === "image" && (
                    <div className="text-sm opacity-70">[รูปภาพ]</div>
                )}
                {contentType === "sticker" && (
                    <div className="text-sm opacity-70">[สติกเกอร์]</div>
                )}
                {contentType === "video" && (
                    <div className="text-sm opacity-70">[วิดีโอ]</div>
                )}
                {contentType === "audio" && (
                    <div className="text-sm opacity-70">[เสียง]</div>
                )}
                {contentType === "location" && (
                    <div className="text-sm opacity-70">[ตำแหน่ง]</div>
                )}
            </div>

            <span className="text-[10px] text-muted-foreground self-end">
                {new Date(message.createdAt).toLocaleTimeString("th-TH", {
                    hour: "2-digit",
                    minute: "2-digit",
                })}
            </span>
        </div>
    );
}
