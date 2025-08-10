import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { verifyJwt } from "~/utils/jwt";
import { processAgentMessage } from "~/server/services/agentPipeline";

const authGuard = async (headers: Headers) => {
    const auth = headers.get("authorization") ?? headers.get("Authorization");
    if (!auth) throw new Error("Não autenticado");
    const token = auth.replace(/^Bearer\s+/i, "");
    const payload = verifyJwt(token);
    if (!payload) throw new Error("Token inválido");
    return payload;
};

export const agentRouter = createTRPCRouter({
    sendMessage: publicProcedure
        .input(z.object({ input: z.string().min(1), sessionId: z.string().min(1).default("default") }))
        .mutation(async ({ ctx, input }) => {
            const payload = await authGuard(ctx.headers);

            const result = await processAgentMessage({
                db: ctx.db,
                userId: payload.sub,
                input: input.input,
                sessionId: input.sessionId,
            });
            return result;
        }),
});

