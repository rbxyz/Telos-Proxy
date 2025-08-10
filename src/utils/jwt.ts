import jwt, { type SignOptions, type Secret } from "jsonwebtoken";
import { env } from "~/env";

export type JwtPayload = {
    sub: string; // user id
    email: string;
};

const DEFAULT_EXPIRATION = "7d";

export function signJwt(payload: JwtPayload, expiresIn: string = DEFAULT_EXPIRATION): string {
    const options: SignOptions = { algorithm: "HS256", expiresIn };
    return jwt.sign(payload, env.JWT_SECRET as Secret, options);
}

export function verifyJwt(token: string): JwtPayload | null {
    try {
        return jwt.verify(token, env.JWT_SECRET as Secret) as JwtPayload;
    } catch {
        return null;
    }
}

