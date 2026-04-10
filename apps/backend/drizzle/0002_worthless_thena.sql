ALTER TABLE "user" RENAME COLUMN "phone" TO "phone_number";--> statement-breakpoint
DROP INDEX "user_phone_unique";--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "phone_number_verified" boolean;--> statement-breakpoint
CREATE UNIQUE INDEX "user_phone_unique" ON "user" USING btree ("country_code","phone_number");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_phone_number_unique" UNIQUE("phone_number");