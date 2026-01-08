import { messagingApi } from "@line/bot-sdk";
import crypto from "crypto";

const config = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
    channelSecret: process.env.LINE_CHANNEL_SECRET!,
};

// LINE Messaging API Client
export const lineClient = new messagingApi.MessagingApiClient({
    channelAccessToken: config.channelAccessToken,
});

// LINE Messaging API Blob Client (for binary data like images)
export const lineBlobClient = new messagingApi.MessagingApiBlobClient({
    channelAccessToken: config.channelAccessToken,
});

// Helper to validate signature manually (for Next.js API routes)
export function validateSignature(body: string, signature: string): boolean {
    const hash = crypto
        .createHmac("sha256", config.channelSecret)
        .update(body)
        .digest("base64");
    return hash === signature;
}

export { config as lineConfig };
