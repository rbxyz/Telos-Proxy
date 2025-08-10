import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { verifyJwt } from "~/utils/jwt";
import { apiKeys } from "~/server/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import crypto from "node:crypto";

const authGuard = async (headers: Headers) => {
    const auth = headers.get("authorization") ?? headers.get("Authorization");
    if (!auth) throw new Error("Não autenticado");
    const token = auth.replace(/^Bearer\s+/i, "");
    const payload = verifyJwt(token);
    if (!payload) throw new Error("Token inválido");
    return payload;
};

function generateApiKey() {
    const prefix = crypto.randomBytes(6).toString("hex"); // 12 hex chars
    const suffix = crypto.randomBytes(24).toString("hex"); // 48 hex chars
    const key = `tel_${prefix}_${suffix}`;
    const keyHash = crypto.createHash("sha256").update(key).digest("hex");
    return { key, prefix, keyHash };
}

export const keysRouter = createTRPCRouter({
    list: publicProcedure.query(async ({ ctx }) => {
        const payload = await authGuard(ctx.headers);
        return ctx.db.query.apiKeys.findMany({
            where: (k, { eq }) => eq(k.userId, payload.sub),
            columns: { keyHash: false },
        });
    }),

    create: publicProcedure
        .input(z.object({ name: z.string().min(1), expiresAt: z.string().datetime().optional() }))
        .mutation(async ({ ctx, input }) => {
            const payload = await authGuard(ctx.headers);
            const { key, prefix, keyHash } = generateApiKey();
            const [created] = await ctx.db
                .insert(apiKeys)
                .values({
                    userId: payload.sub,
                    name: input.name,
                    keyPrefix: prefix,
                    keyHash,
                    expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
                })
                .returning();
            return { apiKey: key, record: { ...created, keyHash: undefined } };
        }),

    revoke: publicProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
        const payload = await authGuard(ctx.headers);
        const [updated] = await ctx.db
            .update(apiKeys)
            .set({ revokedAt: new Date() })
            .where(and(eq(apiKeys.id, input.id), eq(apiKeys.userId, payload.sub), isNull(apiKeys.revokedAt)))
            .returning();
        return updated;
    }),
});

