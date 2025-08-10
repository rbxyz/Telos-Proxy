import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "~/server/db";
import { findUserByApiKey } from "~/server/utils/apiKey";
import { processAgentMessage } from "~/server/services/agentPipeline";

const BodySchema = z.object({
    input: z.string(),
    sessionId: z.string().optional(),
});

export async function POST(req: Request) {
    try {
        const apiKey = req.headers.get("x-api-key") ?? "";
        if (!apiKey) return NextResponse.json({ error: "missing api key" }, { status: 401 });
        const auth = await findUserByApiKey(db, apiKey);
        if (!auth) return NextResponse.json({ error: "invalid api key" }, { status: 401 });

        const json = await req.json().catch(() => null);
        const parse = BodySchema.safeParse(json);
        if (!parse.success) {
            return NextResponse.json({ error: "invalid body" }, { status: 400 });
        }
        const { input, sessionId } = parse.data;

        const result = await processAgentMessage({
            db,
            userId: auth.user.id,
            apiKeyId: auth.apiKey.id,
            input,
            sessionId: sessionId ?? "default",
        });
        return NextResponse.json(result);
    } catch (e) {
        const err = e as Error;
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

