PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_user` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`email` text NOT NULL UNIQUE,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`role` text,
	`banned` integer DEFAULT false,
	`ban_reason` text,
	`ban_expires` integer,
	`username` text UNIQUE,
	`display_username` text
);
--> statement-breakpoint
INSERT INTO `__new_user`(`id`, `name`, `email`, `email_verified`, `image`, `username`, `display_username`, `role`, `banned`, `ban_reason`, `ban_expires`, `created_at`, `updated_at`) SELECT `id`, `name`, `email`, `email_verified`, `image`, `username`, `display_username`, `role`, `banned`, `ban_reason`, `ban_expires`, `created_at`, `updated_at` FROM `user`;--> statement-breakpoint
DROP TABLE `user`;--> statement-breakpoint
ALTER TABLE `__new_user` RENAME TO `user`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
DROP INDEX IF EXISTS `account_providerId_accountId_uidx`;