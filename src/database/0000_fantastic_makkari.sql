-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."event_states" AS ENUM('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."event_variants" AS ENUM('CRM_CONTACT_ADD', 'CRM_LEAD_ADD', 'CRM_COMPANY_ADD', 'CRM_DEAL_ADD');--> statement-breakpoint
CREATE TABLE "bitrix24_outbox" (
	"boid" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "bitrix24_outbox_boid_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"created_at" timestamp with time zone DEFAULT now(),
	"processed_at" timestamp with time zone,
	"processing_at" timestamp with time zone,
	"payload" jsonb NOT NULL,
	"attempts" smallint DEFAULT 0 NOT NULL,
	"event_state" "event_states" DEFAULT 'PENDING' NOT NULL,
	"event_variant" "event_variants" NOT NULL,
	"error_message" text,
	"idempotency_key" varchar(255) NOT NULL,
	"bitrix_id" varchar(50),
	CONSTRAINT "bitrix24_outbox_idempotency_key_key" UNIQUE("idempotency_key"),
	CONSTRAINT "chk_outbox_attempts_positive" CHECK (attempts >= 0)
);
--> statement-breakpoint
CREATE TABLE "bitrix_tokens" (
	"btid" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "bitrix_tokens_btid_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"domain" varchar(200) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_bitrix_tokens_expires_in_1_hour" CHECK (expires_at > (now() + '01:00:00'::interval))
);
--> statement-breakpoint
CREATE INDEX "idx_outbox_created_at" ON "bitrix24_outbox" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_outbox_event_state_pending" ON "bitrix24_outbox" USING btree ("event_state" enum_ops) WHERE (event_state = 'PENDING'::event_states);
*/