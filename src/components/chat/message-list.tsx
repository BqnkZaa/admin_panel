"use client";

import { useEffect, useRef, useState } from "react";
import { getMessages } from "@/actions/chat.actions";
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

export function MessageList({ messages: initialMessages, customer, customerId }: MessageListProps & { customerId: string }) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [messages, setMessages] = useState<Message[]>(initialMessages);

    // Initial scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, []);

    // Scroll linearly when new messages are added, but only if user was already near bottom or it's the first load
    // Actually, for simplicity in this "fix" phase, let's keep the original behavior: scroll to bottom on every message update
    // We can refine this later if it's annoying.
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Polling for new messages
    useEffect(() => {
        // Sync initial messages if they change from parent (e.g. server re-render)
        setMessages(initialMessages);

        const intervalId = setInterval(async () => {
            try {
                // We need to import getMessages dynamically or pass it as a prop to avoid server action issues if any
                // But typically importing server action in client component is fine in Next.js
                // However, we need to handle the type casting
                const newMessages = await getMessages(customerId);

                // Only update if there are changes to avoid unnecessary re-renders (simple length check or deep compare)
                // For now, let's just update if length is different or last message ID is different
                setMessages(prev => {
                    if (newMessages.length !== prev.length ||
                        (newMessages.length > 0 && newMessages[newMessages.length - 1].id !== prev[prev.length - 1].id)) {
                        return newMessages.map((m) => ({
                            ...m,
                            content: m.content as unknown as MessageContent,
                        }));
                    }
                    return prev;
                });
            } catch (error) {
                console.error("Failed to poll messages:", error);
            }
        }, 3000); // Poll every 3 seconds

        return () => clearInterval(intervalId);
    }, [customerId, initialMessages]);

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
                {(contentType === "flex" || contentType === "FLEX") && (
                    <div className="text-sm">
                        <span className="opacity-70 font-semibold text-xs">[Flex Message]</span>
                        <p className="mt-1">{(content as any).altText || "กดเพื่อดูรายละเอียด"}</p>
                    </div>
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
