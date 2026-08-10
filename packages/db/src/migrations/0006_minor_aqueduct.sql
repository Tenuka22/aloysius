ALTER TABLE `gallery` ADD `student_work_id` text REFERENCES student_works(id);--> statement-breakpoint
ALTER TABLE `gallery` ADD `achievement_id` text REFERENCES achievements(id);