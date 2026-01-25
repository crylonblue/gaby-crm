CREATE TABLE `templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`unit` text DEFAULT 'piece' NOT NULL,
	`unit_price` real DEFAULT 0 NOT NULL,
	`default_vat_rate` real DEFAULT 19 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
