CREATE TABLE `grade_subject_config` (
	`id` text PRIMARY KEY,
	`academic_year_id` text NOT NULL,
	`grade_level` integer NOT NULL,
	`basket_category` text NOT NULL,
	`subject_key` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_grade_subject_config_academic_year_id_academic_year_id_fk` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_year`(`id`) ON DELETE CASCADE,
	CONSTRAINT `gsc_unique` UNIQUE(`academic_year_id`,`grade_level`,`basket_category`,`subject_key`)
);
--> statement-breakpoint
CREATE TABLE `exam_type` (
	`id` text PRIMARY KEY,
	`academic_year_id` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`max_mark` integer DEFAULT 100 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_exam_type_academic_year_id_academic_year_id_fk` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_year`(`id`) ON DELETE CASCADE,
	CONSTRAINT `exam_type_year_name_unique` UNIQUE(`academic_year_id`,`name`)
);
--> statement-breakpoint
CREATE TABLE `grade_scale` (
	`id` text PRIMARY KEY,
	`academic_year_id` text NOT NULL,
	`subject_key` text,
	`grade` text NOT NULL,
	`min_mark` integer NOT NULL,
	`max_mark` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_grade_scale_academic_year_id_academic_year_id_fk` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_year`(`id`) ON DELETE CASCADE,
	CONSTRAINT `grade_scale_unique` UNIQUE(`academic_year_id`,`subject_key`,`grade`)
);
--> statement-breakpoint
CREATE TABLE `student` (
	`id` text PRIMARY KEY,
	`admission_number` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`date_of_birth` text,
	`gender` text,
	`phone` text,
	`parent_phone` text,
	`admission_year` integer,
	`admission_type` text,
	`birth_certificate_number` text,
	`admission_grade` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `student_admission` (
	`id` text PRIMARY KEY,
	`student_id` text NOT NULL,
	`academic_year_id` text NOT NULL,
	`admission_type` text NOT NULL,
	`birth_certificate_number` text,
	`previous_school` text,
	`documents` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_student_admission_student_id_student_id_fk` FOREIGN KEY (`student_id`) REFERENCES `student`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_student_admission_academic_year_id_academic_year_id_fk` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_year`(`id`) ON DELETE CASCADE,
	CONSTRAINT `sa_student_year_unique` UNIQUE(`student_id`,`academic_year_id`)
);
--> statement-breakpoint
CREATE TABLE `student_class_assignment` (
	`id` text PRIMARY KEY,
	`student_id` text NOT NULL,
	`academic_year_id` text NOT NULL,
	`class_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_student_class_assignment_student_id_student_id_fk` FOREIGN KEY (`student_id`) REFERENCES `student`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_student_class_assignment_academic_year_id_academic_year_id_fk` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_year`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_student_class_assignment_class_id_class_id_fk` FOREIGN KEY (`class_id`) REFERENCES `class`(`id`) ON DELETE CASCADE,
	CONSTRAINT `sca_student_year_unique` UNIQUE(`student_id`,`academic_year_id`)
);
--> statement-breakpoint
CREATE TABLE `subject_mark` (
	`id` text PRIMARY KEY,
	`student_class_assignment_id` text NOT NULL,
	`exam_type_id` text NOT NULL,
	`subject_key` text NOT NULL,
	`mark` integer NOT NULL,
	`grade` text,
	`entered_by_staff_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_subject_mark_student_class_assignment_id_student_class_assignment_id_fk` FOREIGN KEY (`student_class_assignment_id`) REFERENCES `student_class_assignment`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_subject_mark_exam_type_id_exam_type_id_fk` FOREIGN KEY (`exam_type_id`) REFERENCES `exam_type`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_subject_mark_entered_by_staff_id_staff_id_fk` FOREIGN KEY (`entered_by_staff_id`) REFERENCES `staff`(`id`) ON DELETE CASCADE,
	CONSTRAINT `sm_unique` UNIQUE(`student_class_assignment_id`,`exam_type_id`,`subject_key`)
);
--> statement-breakpoint
ALTER TABLE `academic_year` ADD `start_date` text;--> statement-breakpoint
ALTER TABLE `academic_year` ADD `end_date` text;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_subject_assignment` (
	`id` text PRIMARY KEY,
	`staff_id` text NOT NULL,
	`academic_year_id` text NOT NULL,
	`subject_key` text NOT NULL,
	`grade_level` integer NOT NULL,
	`class_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_subject_assignment_staff_id_staff_id_fk` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_subject_assignment_academic_year_id_academic_year_id_fk` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_year`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_subject_assignment_class_id_class_id_fk` FOREIGN KEY (`class_id`) REFERENCES `class`(`id`) ON DELETE CASCADE,
	CONSTRAINT `subject_assignment_unique` UNIQUE(`staff_id`,`academic_year_id`,`subject_key`,`class_id`)
);
--> statement-breakpoint
INSERT INTO `__new_subject_assignment`(`id`, `staff_id`, `academic_year_id`, `subject_key`, `grade_level`, `class_id`, `created_at`) SELECT `id`, `staff_id`, `academic_year_id`, `subject_key`, `grade_level`, `class_id`, `created_at` FROM `subject_assignment`;--> statement-breakpoint
DROP TABLE `subject_assignment`;--> statement-breakpoint
ALTER TABLE `__new_subject_assignment` RENAME TO `subject_assignment`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `subject_assignment_staff_idx` ON `subject_assignment` (`staff_id`);--> statement-breakpoint
CREATE INDEX `subject_assignment_year_idx` ON `subject_assignment` (`academic_year_id`);--> statement-breakpoint
CREATE INDEX `subject_assignment_subject_idx` ON `subject_assignment` (`subject_key`);--> statement-breakpoint
CREATE INDEX `gsc_year_idx` ON `grade_subject_config` (`academic_year_id`);--> statement-breakpoint
CREATE INDEX `gsc_grade_idx` ON `grade_subject_config` (`grade_level`);--> statement-breakpoint
CREATE INDEX `gsc_basket_idx` ON `grade_subject_config` (`basket_category`);--> statement-breakpoint
CREATE INDEX `exam_type_year_idx` ON `exam_type` (`academic_year_id`);--> statement-breakpoint
CREATE INDEX `exam_type_category_idx` ON `exam_type` (`category`);--> statement-breakpoint
CREATE INDEX `grade_scale_year_idx` ON `grade_scale` (`academic_year_id`);--> statement-breakpoint
CREATE INDEX `grade_scale_subject_idx` ON `grade_scale` (`subject_key`);--> statement-breakpoint
CREATE INDEX `student_admission_number_idx` ON `student` (`admission_number`);--> statement-breakpoint
CREATE INDEX `student_name_idx` ON `student` (`last_name`,`first_name`);--> statement-breakpoint
CREATE INDEX `student_admission_type_idx` ON `student` (`admission_type`);--> statement-breakpoint
CREATE INDEX `sa_student_idx` ON `student_admission` (`student_id`);--> statement-breakpoint
CREATE INDEX `sa_year_idx` ON `student_admission` (`academic_year_id`);--> statement-breakpoint
CREATE INDEX `sa_type_idx` ON `student_admission` (`admission_type`);--> statement-breakpoint
CREATE INDEX `sca_student_idx` ON `student_class_assignment` (`student_id`);--> statement-breakpoint
CREATE INDEX `sca_year_idx` ON `student_class_assignment` (`academic_year_id`);--> statement-breakpoint
CREATE INDEX `sca_class_idx` ON `student_class_assignment` (`class_id`);--> statement-breakpoint
CREATE INDEX `sm_assignment_idx` ON `subject_mark` (`student_class_assignment_id`);--> statement-breakpoint
CREATE INDEX `sm_exam_idx` ON `subject_mark` (`exam_type_id`);--> statement-breakpoint
CREATE INDEX `sm_subject_idx` ON `subject_mark` (`subject_key`);--> statement-breakpoint
CREATE INDEX `sm_entered_by_idx` ON `subject_mark` (`entered_by_staff_id`);