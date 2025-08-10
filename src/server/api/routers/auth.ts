import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { users } from "~/server/db/schema";
import bcrypt from "bcryptjs";
import { signJwt } from "~/utils/jwt";

const registerInput = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

const loginInput = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

export const authRouter = createTRPCRouter({
    register: publicProcedure.input(registerInput).mutation(async ({ ctx, input }) => {
        const existing = await ctx.db.query.users.findFirst({
            where: (u, { eq }) => eq(u.email, input.email),
        });
        if (existing) {
            throw new Error("Email já registrado");
        }

        const passwordHash = await bcrypt.hash(input.password, 10);
        const [created] = (await ctx.db.insert(users).values({
            email: input.email,
            passwordHash,
        }).returning()) as [{ id: string; email: string }];

        const token = signJwt({ sub: created.id, email: created.email });
        return { token };
    }),

    login: publicProcedure.input(loginInput).mutation(async ({ ctx, input }) => {
        const user = await ctx.db.query.users.findFirst({
            where: (u, { eq }) => eq(u.email, input.email),
        });
        if (!user) throw new Error("Credenciais inválidas");

        const ok = await bcrypt.compare(input.password, user.passwordHash);
        if (!ok) throw new Error("Credenciais inválidas");

        const token = signJwt({ sub: user.id, email: user.email });
        return { token };
    }),
});

