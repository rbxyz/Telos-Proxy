CREATE TABLE "telos-proxy_api_key" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(128) NOT NULL,
	"key_prefix" varchar(16) NOT NULL,
	"key_hash" varchar(128) NOT NULL,
	"scopes" jsonb DEFAULT ARRAY[]::text[],
	"expiresAt" timestamp with time zone,
	"revokedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "telos-proxy_api_key" ADD CONSTRAINT "telos-proxy_api_key_user_id_telos-proxy_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."telos-proxy_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "api_key_key_prefix_unique" ON "telos-proxy_api_key" USING btree ("key_prefix");