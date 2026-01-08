import { Queue } from "bullmq";
import { redis } from "./redis";

export const BROADCAST_QUEUE_NAME = "send-broadcast";

export const broadcastQueue = new Queue(BROADCAST_QUEUE_NAME, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    connection: redis as any,
});
