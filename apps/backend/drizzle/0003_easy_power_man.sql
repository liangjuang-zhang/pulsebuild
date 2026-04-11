CREATE TABLE "sys_file" (
	"id" text PRIMARY KEY NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_key" varchar(500) NOT NULL,
	"file_size" bigint NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"storage_provider" varchar(20) NOT NULL,
	"group_name" varchar(50) NOT NULL,
	"biz_id" varchar(100),
	"user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "sys_permission" (
	"id" text PRIMARY KEY NOT NULL,
	"code" varchar(100) NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" varchar(20) DEFAULT 'api' NOT NULL,
	"parent_id" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sys_permission_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "sys_role" (
	"id" text PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"type" varchar(20) DEFAULT 'project' NOT NULL,
	"level" integer DEFAULT 100 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_builtin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sys_role_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "sys_role_permission" (
	"role_id" text NOT NULL,
	"permission_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sys_user_role" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"role_id" text NOT NULL,
	"project_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sys_file" ADD CONSTRAINT "sys_file_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sys_role_permission" ADD CONSTRAINT "sys_role_permission_role_id_sys_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."sys_role"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sys_role_permission" ADD CONSTRAINT "sys_role_permission_permission_id_sys_permission_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."sys_permission"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sys_user_role" ADD CONSTRAINT "sys_user_role_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sys_user_role" ADD CONSTRAINT "sys_user_role_role_id_sys_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."sys_role"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sys_file_user_idx" ON "sys_file" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sys_file_group_idx" ON "sys_file" USING btree ("group_name");--> statement-breakpoint
CREATE INDEX "sys_file_biz_idx" ON "sys_file" USING btree ("biz_id");--> statement-breakpoint
CREATE INDEX "sys_file_provider_idx" ON "sys_file" USING btree ("storage_provider");--> statement-breakpoint
CREATE INDEX "sys_permission_type_idx" ON "sys_permission" USING btree ("type");--> statement-breakpoint
CREATE INDEX "sys_permission_parent_idx" ON "sys_permission" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "sys_role_type_idx" ON "sys_role" USING btree ("type");--> statement-breakpoint
CREATE INDEX "sys_role_level_idx" ON "sys_role" USING btree ("level");--> statement-breakpoint
CREATE UNIQUE INDEX "sys_role_permission_unique" ON "sys_role_permission" USING btree ("role_id","permission_id");--> statement-breakpoint
CREATE INDEX "sys_role_permission_role_idx" ON "sys_role_permission" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "sys_role_permission_perm_idx" ON "sys_role_permission" USING btree ("permission_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sys_user_role_unique" ON "sys_user_role" USING btree ("user_id","role_id","project_id");--> statement-breakpoint
CREATE INDEX "sys_user_role_user_idx" ON "sys_user_role" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sys_user_role_role_idx" ON "sys_user_role" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "sys_user_role_project_idx" ON "sys_user_role" USING btree ("project_id");