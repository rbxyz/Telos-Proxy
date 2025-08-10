// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTableCreator,
  uniqueIndex,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `telos-proxy_${name}`);

export const posts = createTable(
  "post",
  (d) => ({
    id: integer().primaryKey().generatedByDefaultAsIdentity(),
    name: varchar({ length: 256 }),
    createdAt: timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [index("name_idx").on(t.name)],
);

export const userStatusEnum = pgEnum("user_status", [
  "active",
  "inactive",
]);

export const users = createTable("user", (d) => ({
  id: uuid().primaryKey().defaultRandom(),
  email: varchar({ length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  status: userStatusEnum().default("active").notNull(),
  createdAt: timestamp({ withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

export const modelProvidersEnum = pgEnum("model_provider", ["hf"]);

export const modelConfigs = createTable("model_config", (d) => ({
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  provider: modelProvidersEnum().notNull(),
  apiKeyRef: text("api_key_ref"),
  baseUrl: text("base_url"),
  modelName: varchar("model_name", { length: 255 }).notNull(),
  defaults: jsonb().$type<Record<string, unknown>>().default({}),
  createdAt: timestamp({ withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

export const logs = createTable("log", (d) => ({
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  apiKeyId: uuid("api_key_id").references(() => apiKeys.id),
  modelName: varchar("model_name", { length: 255 }),
  requestHash: varchar("request_hash", { length: 128 }),
  promptTruncated: text("prompt_truncated"),
  responseTruncated: text("response_truncated"),
  latencyMs: integer("latency_ms"),
  cacheHit: boolean("cache_hit").default(false).notNull(),
  status: varchar({ length: 64 }),
  errorCode: varchar("error_code", { length: 64 }),
  createdAt: timestamp({ withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
}));

export const apiKeys = createTable(
  "api_key",
  (d) => ({
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id),
    name: varchar({ length: 128 }).notNull(),
    keyPrefix: varchar("key_prefix", { length: 16 }).notNull(),
    keyHash: varchar("key_hash", { length: 128 }).notNull(),
    scopes: jsonb().$type<string[]>().default(sql`'[]'::jsonb`),
    expiresAt: timestamp({ withTimezone: true }),
    revokedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }),
  (t) => [
    uniqueIndex("api_key_key_prefix_unique").on(t.keyPrefix),
  ],
);
