ALTER TABLE "user" ADD COLUMN "notifications_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "onboarding_completed_at" timestamp;