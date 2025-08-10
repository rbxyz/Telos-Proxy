import { postRouter } from "~/server/api/routers/post";
import { authRouter } from "~/server/api/routers/auth";
import { agentRouter } from "~/server/api/routers/agent";
import { modelRouter } from "~/server/api/routers/model";
import { keysRouter } from "~/server/api/routers/keys";
import { metricsRouter } from "~/server/api/routers/metrics";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  auth: authRouter,
  agent: agentRouter,
  model: modelRouter,
  keys: keysRouter,
  metrics: metricsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
