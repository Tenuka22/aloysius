ALTER TABLE `student_works` ADD `student_names` text;--> statement-breakpoint
ALTER TABLE `student_works` DROP COLUMN `student_name`;--> statement-breakpoint
ALTER TABLE `achievements` ADD `recipient_names` text;--> statement-breakpoint
ALTER TABLE `achievements` DROP COLUMN `recipient_name`;
