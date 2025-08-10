import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { verifyJwt } from "~/utils/jwt";
import { db } from "~/server/api/trpc";
import { sql } from "drizzle-orm";

const authGuard = async (headers: Headers) => {
    const auth = headers.get("authorization") ?? headers.get("Authorization");
    if (!auth) throw new Error("Não autenticado");
    const token = auth.replace(/^Bearer\s+/i, "");
    const payload = verifyJwt(token);
    if (!payload) throw new Error("Token inválido");
    return payload;
};

export const metricsRouter = createTRPCRouter({
    byApiKey: publicProcedure
        .input(z.object({ apiKeyId: z.string().uuid(), days: z.number().min(1).max(90).default(7) }))
        .query(async ({ ctx, input }) => {
            const payload = await authGuard(ctx.headers);

            // Aggregations: count per day, avg latency, cache hit ratio
            const res = await ctx.db.execute(sql`
        with d as (
          select date_trunc('day', "createdAt") as day,
                 count(*) as total,
                 avg("latency_ms") as avg_latency,
                 sum(case when "cache_hit" then 1 else 0 end)::float / count(*) as cache_ratio
          from "telos-proxy_log"
          where "user_id" = ${payload.sub}::uuid
            and "api_key_id" = ${input.apiKeyId}::uuid
            and "createdAt" >= now() - (${input.days} || ' days')::interval
          group by 1
          order by 1
        )
        select * from d;
      `);

            return (res as unknown as Array<{ day: string; total: number; avg_latency: number; cache_ratio: number }>).map(
                (r) => ({
                    day: r.day,
                    total: Number(r.total ?? 0),
                    avgLatencyMs: Number(r.avg_latency ?? 0),
                    cacheRatio: Number(r.cache_ratio ?? 0),
                }),
            );
        }),
});

