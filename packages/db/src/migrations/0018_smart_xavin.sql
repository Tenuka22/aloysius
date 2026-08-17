CREATE TABLE `university_admissions` (
	`id` text PRIMARY KEY NOT NULL,
	`exam_result_id` text NOT NULL,
	`student_name` text NOT NULL,
	`university` text NOT NULL,
	`course` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`exam_result_id`) REFERENCES `exam_results`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `university_admissions_result_idx` ON `university_admissions` (`exam_result_id`);