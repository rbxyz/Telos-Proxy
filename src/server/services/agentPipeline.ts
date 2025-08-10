import crypto from "node:crypto";
import { getRedis } from "~/server/redis/client";
import { logs } from "~/server/db/schema";
import { HuggingFaceModel } from "~/server/models/hfModel";

type Db = typeof import("~/server/db").db;

export async function processAgentMessage(params: {
    db: Db;
    userId: string;
    apiKeyId?: string;
    input: string;
    sessionId: string;
}) {
    const { db, userId, apiKeyId, input, sessionId } = params;

    // Load model config for user (first one or default HF)
    const config = await db.query.modelConfigs.findFirst({
        where: (m, { eq }) => eq(m.userId, userId),
    });

    const model = new HuggingFaceModel({
        apiKey: config?.apiKeyRef ?? undefined,
        baseUrl: config?.baseUrl ?? undefined,
        modelName: config?.modelName ?? undefined,
    });

    const requestKey = `agent:${userId}:${config?.modelName ?? "hf-default"}:${crypto
        .createHash("sha256")
        .update(input)
        .digest("hex")}`;

    const redis = getRedis();
    if (redis) {
        const cached = await redis.get(requestKey);
        if (cached) {
            await db.insert(logs).values({
                userId,
                apiKeyId,
                modelName: config?.modelName ?? "google/flan-t5-base",
                requestHash: requestKey,
                promptTruncated: input.slice(0, 5000),
                responseTruncated: cached.slice(0, 5000),
                latencyMs: 0,
                cacheHit: true,
                status: "OK",
            });
            return { output: cached, cached: true } as const;
        }
    }

    const start = Date.now();
    let output = "";
    try {
        output = await model.sendMessage(input, sessionId);
    } catch (e) {
        const err = e as Error;
        await db.insert(logs).values({
            userId,
            apiKeyId,
            modelName: config?.modelName ?? "google/flan-t5-base",
            requestHash: requestKey,
            promptTruncated: input.slice(0, 5000),
            responseTruncated: (err.message ?? "").slice(0, 5000),
            latencyMs: Date.now() - start,
            cacheHit: false,
            status: "ERR",
            errorCode: err.name,
        });
        throw err;
    }
    const latencyMs = Date.now() - start;

    if (redis) {
        await redis.set(requestKey, output, "EX", 60 * 5);
    }

    await db.insert(logs).values({
        userId,
        apiKeyId,
        modelName: config?.modelName ?? "google/flan-t5-base",
        requestHash: requestKey,
        promptTruncated: input.slice(0, 5000),
        responseTruncated: output.slice(0, 5000),
        latencyMs,
        cacheHit: false,
        status: "OK",
    });

    return { output, cached: false } as const;
}

