CREATE TABLE `entry_completions` (
	`entry_id` text NOT NULL,
	`occurrence` text NOT NULL,
	PRIMARY KEY(`entry_id`, `occurrence`),
	FOREIGN KEY (`entry_id`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `entries` ADD `recurrence` text;