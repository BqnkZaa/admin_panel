import { getConversations } from "@/actions/chat.actions";
import { ChatList, type Conversation } from "@/components/chat/chat-list";

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
        <div className="flex h-[calc(100vh-5rem)] gap-4">
            {/* Conversation List Sidebar */}
            <div className="w-80 border rounded-lg bg-card flex-shrink-0 hidden md:flex flex-col">
                <div className="p-4 border-b">
                    <h2 className="font-semibold">การสนทนา</h2>
                    <p className="text-sm text-muted-foreground">
                        {conversations.length} รายการ
                    </p>
                </div>
                <ChatList conversations={conversations} />
            </div>

            {/* Chat Window */}
            <div className="flex-1 border rounded-lg bg-card flex flex-col min-w-0">
                {children}
            </div>
        </div>
    );
}
