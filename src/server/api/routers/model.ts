import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { verifyJwt } from "~/utils/jwt";
import { modelConfigs } from "~/server/db/schema";
import { eq } from "drizzle-orm";

const authGuard = async (headers: Headers) => {
    const auth = headers.get("authorization") ?? headers.get("Authorization");
    if (!auth) throw new Error("Não autenticado");
    const token = auth.replace(/^Bearer\s+/i, "");
    const payload = verifyJwt(token);
    if (!payload) throw new Error("Token inválido");
    return payload;
};

const providerEnum = z.enum(["hf"]);

const upsertInput = z.object({
    provider: providerEnum,
    modelName: z.string().min(1),
    baseUrl: z.string().url().optional().or(z.literal("")).transform((v) => (v === "" ? undefined : v)),
    apiKeyRef: z.string().optional().or(z.literal("")).transform((v) => (v === "" ? undefined : v)),
});

export const modelRouter = createTRPCRouter({
    get: publicProcedure.query(async ({ ctx }) => {
        const payload = await authGuard(ctx.headers);
        const existing = await ctx.db.query.modelConfigs.findFirst({
            where: (m, { eq }) => eq(m.userId, payload.sub),
        });
        return existing ?? null;
    }),

    upsert: publicProcedure.input(upsertInput).mutation(async ({ ctx, input }) => {
        const payload = await authGuard(ctx.headers);
        const existing = await ctx.db.query.modelConfigs.findFirst({
            where: (m, { eq }) => eq(m.userId, payload.sub),
        });

        if (!existing) {
            const [created] = await ctx.db
                .insert(modelConfigs)
                .values({
                    userId: payload.sub,
                    provider: input.provider,
                    modelName: input.modelName,
                    baseUrl: input.baseUrl,
                    apiKeyRef: input.apiKeyRef,
                })
                .returning();
            return created;
        }

        const [updated] = await ctx.db
            .update(modelConfigs)
            .set({
                provider: input.provider,
                modelName: input.modelName,
                baseUrl: input.baseUrl,
                apiKeyRef: input.apiKeyRef,
                updatedAt: new Date(),
            })
            .where(eq(modelConfigs.userId, payload.sub))
            .returning();
        return updated;
    }),
});

