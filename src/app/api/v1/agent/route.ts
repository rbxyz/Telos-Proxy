import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { findUserByApiKey } from "~/server/utils/apiKey";
import { processAgentMessage } from "~/server/services/agentPipeline";

export async function POST(req: Request) {
    try {
        const apiKey = req.headers.get("x-api-key") ?? "";
        if (!apiKey) return NextResponse.json({ error: "missing api key" }, { status: 401 });
        const auth = await findUserByApiKey(db, apiKey);
        if (!auth) return NextResponse.json({ error: "invalid api key" }, { status: 401 });

        const body = await req.json().catch(() => null);
        if (!body || typeof body.input !== "string") {
            return NextResponse.json({ error: "invalid body" }, { status: 400 });
        }
        const sessionId = typeof body.sessionId === "string" ? body.sessionId : "default";

        const result = await processAgentMessage({
            db,
            userId: auth.user.id,
            apiKeyId: auth.apiKey.id,
            input: body.input,
            sessionId,
        });
        return NextResponse.json(result);
    } catch (e) {
        const err = e as Error;
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

