import crypto from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { apiKeys, users } from "~/server/db/schema";

export async function findUserByApiKey(db: typeof import("~/server/db").db, providedKey: string) {
    const match = providedKey.match(/^tel_([a-f0-9]{12})_/);
    if (!match) return null;
    const prefix = match[1] as string;
    const keyHash = crypto.createHash("sha256").update(providedKey).digest("hex");

    const rec = await db.query.apiKeys.findFirst({
        where: (k, { and, eq, isNull }) => and(eq(k.keyPrefix, prefix), isNull(k.revokedAt)),
    });
    if (!rec) return null;
    if (rec.keyHash !== keyHash) return null;

    const user = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.id, rec.userId) });
    if (!user) return null;

    return { user, apiKey: rec };
}

