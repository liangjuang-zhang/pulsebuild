ALTER TABLE "user" ADD COLUMN "phone" varchar(20);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "country_code" varchar(8);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "timezone" varchar(64);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "job_title" varchar(120);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "company_name" varchar(120);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "status" varchar(20) DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "last_login_at" timestamp;--> statement-breakpoint
CREATE UNIQUE INDEX "user_phone_unique" ON "user" USING btree ("country_code","phone");--> statement-breakpoint
CREATE INDEX "user_status_idx" ON "user" USING btree ("status");