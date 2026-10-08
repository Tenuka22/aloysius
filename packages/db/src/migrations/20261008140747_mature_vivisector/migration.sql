CREATE TABLE `account_audit_log` (
	`id` text PRIMARY KEY,
	`actor_user_id` text,
	`actor_role` text,
	`action` text NOT NULL,
	`target_user_id` text,
	`outcome` text NOT NULL,
	`detail` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `account_audit_log_actor_idx` ON `account_audit_log` (`actor_user_id`);--> statement-breakpoint
CREATE INDEX `account_audit_log_target_idx` ON `account_audit_log` (`target_user_id`);