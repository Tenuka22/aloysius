CREATE TABLE `exam_results` (
	`id` text PRIMARY KEY NOT NULL,
	`exam_type` text NOT NULL,
	`exam_year` integer NOT NULL,
	`results_year` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`user_id` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `exam_results_type_year_idx` ON `exam_results` (`exam_type`,`exam_year`);--> statement-breakpoint
CREATE TABLE `exam_students` (
	`id` text PRIMARY KEY NOT NULL,
	`exam_result_id` text NOT NULL,
	`name` text NOT NULL,
	`photo` text,
	`quote` text,
	`marks` integer,
	`stream` text,
	`subjects` text DEFAULT '[]',
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`exam_result_id`) REFERENCES `exam_results`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `exam_students_result_idx` ON `exam_students` (`exam_result_id`);