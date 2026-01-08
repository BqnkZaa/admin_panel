"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import { sendMessage } from "@/actions/chat.actions";

interface MessageInputProps {
    customerId: string;
}

export function MessageInput({ customerId }: MessageInputProps) {
    const [message, setMessage] = useState("");
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || isPending) return;

        const text = message.trim();
        setMessage("");

        startTransition(async () => {
            const result = await sendMessage(customerId, text);
            if (!result.success) {
                console.error("Failed to send message:", result.error);
                setMessage(text); // Restore message on error
            }
        });
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 p-4 border-t bg-card"
        >
            <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="พิมพ์ข้อความ..."
                disabled={isPending}
                className="flex-1"
            />
            <Button type="submit" size="icon" disabled={isPending || !message.trim()}>
                {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Send className="h-4 w-4" />
                )}
            </Button>
        </form>
    );
}
