import "dotenv/config";
import postgres from "postgres";
import bcrypt from "bcryptjs";

function parseArgs(argv) {
    const out = {};
    for (const arg of argv.slice(2)) {
        const [k, v] = arg.split("=");
        if (k.startsWith("--")) out[k.slice(2)] = v ?? "";
    }
    return out;
}

async function main() {
    const args = parseArgs(process.argv);
    const email = args.email;
    const password = args.password;
    if (!email || !password) {
        console.error("Uso: npm run user:create -- --email=<email> --password=<senha>");
        process.exit(1);
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error("DATABASE_URL não definida. Configure no .env ou exporte no shell.");
        process.exit(1);
    }

    const sql = postgres(databaseUrl);
    const passwordHash = await bcrypt.hash(password, 12);

    try {
        const rows = await sql`
      INSERT INTO "public"."telos-proxy_user" ("email","password_hash","status")
      VALUES (${email}, ${passwordHash}, 'active')
      RETURNING "id", "email", "createdAt";
    `;
        console.log({ user: rows[0] });
    } finally {
        await sql.end({ timeout: 5 });
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});

