import { NextRequest, NextResponse } from 'next/server';
import { validateSignature, WebhookEvent, MessageEvent as LineMessageEvent } from '@line/bot-sdk';
import { prisma } from '@/lib/prisma';
import { lineClient } from '@/lib/line';
import { revalidatePath } from 'next/cache';
import { MessageType, Prisma } from '@prisma/client';

export async function POST(req: NextRequest) {
    try {
        // 1. Get the signature from the header
        const signature = req.headers.get('x-line-signature');
        if (!signature) {
            return NextResponse.json({ message: 'Missing signature' }, { status: 400 });
        }

        // 2. Get the request body as text
        const body = await req.text();

        // 3. Validate the signature
        const channelSecret = process.env.LINE_CHANNEL_SECRET;
        if (!channelSecret) {
            console.error('LINE_CHANNEL_SECRET is not defined');
            return NextResponse.json({ message: 'Server configuration error' }, { status: 500 });
        }

        if (!validateSignature(body, channelSecret, signature)) {
            return NextResponse.json({ message: 'Invalid signature' }, { status: 403 });
        }

        // 4. Parse the body to get events
        const { events } = JSON.parse(body) as { events: WebhookEvent[] };

        // 5. Process events
        await Promise.all(events.map(handleEvent));

        // 6. Return 200 OK
        return NextResponse.json({ message: 'OK' }, { status: 200 });

    } catch (error) {
        console.error('Error handling webhook:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

async function handleEvent(event: WebhookEvent) {
    try {
        const userId = event.source.userId;
        if (!userId) return;

        switch (event.type) {
            case 'follow':
                await handleFollowEvent(userId);
                break;
            case 'unfollow':
                await handleUnfollowEvent(userId);
                break;
            case 'message':
                if (event.message.type === 'text' || event.message.type === 'image' || event.message.type === 'sticker') {
                    await handleMessageEvent(userId, event);
                }
                break;
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
    } catch (error) {
        console.error(`Error processing event ${event.type}:`, error);
    }
}

async function handleFollowEvent(userId: string) {
    try {
        const profile = await lineClient.getProfile(userId);

        await prisma.customer.upsert({
            where: { lineUserId: userId },
            update: {
                isFollowing: true,
                displayName: profile.displayName,
                pictureUrl: profile.pictureUrl,
                statusMessage: profile.statusMessage,
                followedAt: new Date(),
                unfollowedAt: null,
            },
            create: {
                lineUserId: userId,
                displayName: profile.displayName,
                pictureUrl: profile.pictureUrl,
                statusMessage: profile.statusMessage,
                isFollowing: true,
                followedAt: new Date(),
            },
        });

        console.log(`Customer followed: ${profile.displayName}`);

        // --- NEW: Handle Welcome Message ---
        const welcomeMsg = await prisma.welcomeMessage.findFirst({
            where: { isActive: true },
        });

        if (welcomeMsg && welcomeMsg.content) {
            // Cast content to any to access properties safely
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const content = welcomeMsg.content as any;
            if (content.type === 'text' && content.text) {
                await lineClient.pushMessage({
                    to: userId,
                    messages: [{ type: 'text', text: content.text }],
                });
                console.log(`Sent welcome message to ${userId}`);
            }
        }
        // -----------------------------------

    } catch (error) {
        console.error('Error handling follow event:', error);
        // Fallback if profile fetch fails (e.g., user blocked immediately)
        await prisma.customer.upsert({
            where: { lineUserId: userId },
            update: { isFollowing: true, followedAt: new Date() },
            create: { lineUserId: userId, isFollowing: true, followedAt: new Date() },
        });
    }
}

async function handleUnfollowEvent(userId: string) {
    await prisma.customer.updateMany({
        where: { lineUserId: userId },
        data: {
            isFollowing: false,
            unfollowedAt: new Date(),
        },
    });
    console.log(`Customer unfollowed: ${userId}`);
}

async function handleMessageEvent(userId: string, event: LineMessageEvent) {
    // 1. Ensure user profile exists (in case they messaged without following explicitly or database is fresh)
    let customer = await prisma.customer.findUnique({
        where: { lineUserId: userId },
    });

    if (!customer) {
        try {
            const profile = await lineClient.getProfile(userId);
            customer = await prisma.customer.create({
                data: {
                    lineUserId: userId,
                    displayName: profile.displayName,
                    pictureUrl: profile.pictureUrl,
                    isFollowing: true,
                    // If they message us, they are interacting, but 'isFollowing' is stricter (added as friend).
                    // We'll set isFollowing=true for simplicity or check interaction.
                    // Usually safe to assume true if we can get profile.
                }
            });
        } catch {
            // If can't get profile, create basic record
            customer = await prisma.customer.create({
                data: { lineUserId: userId, isFollowing: true }
            });
        }
    }

    // 2. Get or create conversation
    let conversation = await prisma.conversation.findUnique({
        where: { customerId: customer.id },
    });

    if (!conversation) {
        conversation = await prisma.conversation.create({
            data: {
                customerId: customer.id,
                status: 'OPEN',
                unreadCount: 0,
            },
        });
    }

    // 3. Map LINE message type to Prisma enum
    let messageType = 'TEXT';
    let content = {};
    let userMessageText = "";

    if (event.message.type === 'text') {
        messageType = 'TEXT';
        userMessageText = event.message.text;
        content = { type: 'text', text: event.message.text };
    } else if (event.message.type === 'image') {
        messageType = 'IMAGE';
        content = { type: 'image', id: event.message.id, contentProvider: event.message.contentProvider };
    } else if (event.message.type === 'sticker') {
        messageType = 'STICKER';
        content = {
            type: 'sticker',
            packageId: event.message.packageId,
            stickerId: event.message.stickerId
        };
    }

    // 4. Check for Auto-Reply Keyword (Only for text messages)
    if (messageType === 'TEXT' && userMessageText) {
        const keywordMatch = await prisma.autoReplyKeyword.findFirst({
            where: {
                isActive: true,
                keyword: userMessageText.trim(), // Simple exact match logic for now
                // For 'CONTAINS' we might need raw query or fetch all and filter in JS if list is small.
                // Assuming schema has MatchType, but findFirst with 'contains' is not dynamic based on row value.
                // For Phase 5 MVP, we'll strip to exact match or simple query.
                // Let's rely on finding WHERE keyword equals user input for EXACT.
            },
        });

        if (keywordMatch && keywordMatch.replyContent) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const replyContent = keywordMatch.replyContent as any;
            if (replyContent.type === 'text' && replyContent.text) {
                try {
                    // Send Reply
                    if (event.replyToken) {
                        await lineClient.replyMessage({
                            replyToken: event.replyToken,
                            messages: [{ type: 'text', text: replyContent.text }]
                        });
                    }

                    // Log the Auto-Reply Message (Outbound)
                    await prisma.message.create({
                        data: {
                            customerId: customer.id,
                            conversationId: conversation.id,
                            type: 'TEXT',
                            direction: 'OUTBOUND',
                            content: { type: 'text', text: replyContent.text },
                            status: 'DELIVERED',
                            sentAt: new Date(),
                        }
                    });

                    console.log(`Auto-replied to ${userId} with: ${replyContent.text}`);

                } catch (err) {
                    console.error("Failed to send auto-reply:", err);
                }
            }
        }
    }

    // 5. Create Inbound message record (User's message)
    await prisma.message.create({
        data: {
            customerId: customer.id,
            conversationId: conversation.id,
            type: messageType as MessageType,
            direction: 'INBOUND',
            content: content as Prisma.InputJsonValue,
            status: 'DELIVERED',
            sentAt: new Date(event.timestamp),
        },
    });

    // 6. Update conversation
    await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
            lastMessageAt: new Date(),
            unreadCount: { increment: 1 },
            // If we auto-replied, maybe we shouldn't mark as OPEN? 
            // But usually user message means it needs attention unless handled. 
            // We'll keep it simple for now.
            status: conversation.status === 'RESOLVED' ? 'OPEN' : conversation.status,
        },
    });

    // Update Customer last active
    await prisma.customer.update({
        where: { id: customer.id },
        data: { lastActiveAt: new Date() }
    });

    // 7. Revalidate cache
    revalidatePath('/chat');
    revalidatePath(`/chat/${customer.id}`);
}

// Optional: Handle GET request for simple health check
export async function GET() {
    return NextResponse.json({ message: 'LINE Webhook Endpoint' });
}
