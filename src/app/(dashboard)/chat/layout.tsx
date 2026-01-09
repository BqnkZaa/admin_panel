import { getConversations } from "@/actions/chat.actions";
import { type Conversation } from "@/components/chat/chat-list";
import { ChatLayoutShell } from "@/components/chat/chat-layout-shell";

export default async function ChatLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const rawConversations = await getConversations();
    // Cast to expected type - handling the JSON value mismatch
    const conversations = rawConversations.map(c => ({
        ...c,
        lastMessage: c.lastMessage ? {
            ...c.lastMessage,
            content: c.lastMessage.content as unknown as import("@/components/chat/message-list").MessageContent
        } : null
    })) as Conversation[];

    return (
        <ChatLayoutShell conversations={conversations}>
            {children}
        </ChatLayoutShell>
    );
}
