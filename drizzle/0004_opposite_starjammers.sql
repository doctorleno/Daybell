CREATE TABLE `account_activity` (
	`user_id` text NOT NULL,
	`day` text NOT NULL,
	`last_seen` integer NOT NULL,
	PRIMARY KEY(`user_id`, `day`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_activity_day` ON `account_activity` (`day`);--> statement-breakpoint
CREATE TABLE `analytics_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`started_at` integer NOT NULL
);

--> statement-breakpoint
INSERT INTO analytics_settings (id,started_at) VALUES (1,CAST(strftime('%s','now') AS INTEGER)*1000);
