import { notFound } from "next/navigation";
import { getMessages, getCustomer } from "@/actions/chat.actions";
import { MessageList, type MessageContent } from "@/components/chat/message-list";
import { MessageInput } from "@/components/chat/message-input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical, Phone, ChevronLeft } from "lucide-react";
import { getRichMenus, getRichMenuIdOfUser } from "@/actions/rich-menu.actions";
import { CustomerProfileSheet } from "@/components/chat/customer-profile-sheet";
import { RichMenuResponse } from "@line/bot-sdk";
import { RichMenuSelector } from "@/components/chat/rich-menu-selector";
import Link from "next/link";

interface ChatPageProps {
    params: { customerId: string };
}

export default async function CustomerChatPage({ params }: ChatPageProps) {
    const { customerId } = params;

    const [customer, messages] = await Promise.all([
        getCustomer(customerId),
        getMessages(customerId),
    ]);

    if (!customer) {
        notFound();
    }

    // Fetch Rich Menu Data
    const availableRichMenus = await getRichMenus();
    const currentRichMenuId = await getRichMenuIdOfUser(customer.lineUserId);

    return (
        <>
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2 md:gap-3">
                    <Link href="/chat" className="md:hidden">
                        <Button variant="ghost" size="icon" className="-ml-2 h-8 w-8 text-slate-500">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={customer.pictureUrl || ""} />
                        <AvatarFallback>{customer.displayName?.[0] || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h2 className="font-semibold">
                                {customer.displayName || "ไม่ทราบชื่อ"}
                            </h2>
                            {customer.isFollowing ? (
                                <Badge variant="outline" className="text-green-600 border-green-600">
                                    Following
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="text-red-600 border-red-600">
                                    Unfollowed
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {customer.lastActiveAt
                                ? `ใช้งานล่าสุด: ${new Date(customer.lastActiveAt).toLocaleString("th-TH")}`
                                : "ไม่มีข้อมูล"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <div className="mr-2">
                        <RichMenuSelector
                            userId={customer.lineUserId}
                            currentRichMenuId={currentRichMenuId}
                            availableRichMenus={availableRichMenus as RichMenuResponse[]}
                            variant="minimal"
                        />
                    </div>
                    <Button variant="ghost" size="icon">
                        <Phone className="h-4 w-4" />
                    </Button>

                    <CustomerProfileSheet
                        customer={customer}
                        currentRichMenuId={currentRichMenuId}
                        availableRichMenus={availableRichMenus as RichMenuResponse[]}
                    />

                    <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Messages */}
            <MessageList
                customerId={customerId}
                messages={messages.map((m) => ({
                    ...m,
                    content: m.content as unknown as MessageContent,
                }))}
                customer={{
                    displayName: customer.displayName,
                    pictureUrl: customer.pictureUrl,
                }}
            />

            {/* Input */}
            <MessageInput customerId={customerId} />
        </>
    );
}
