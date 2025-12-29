CREATE TABLE `customer_budgets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`year` integer NOT NULL,
	`amount` real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`last_name` text NOT NULL,
	`first_name` text NOT NULL,
	`birth_date` text,
	`mobile_phone` text,
	`landline_phone` text,
	`street` text,
	`house_number` text,
	`postal_code` text,
	`city` text,
	`insurance_number` text,
	`health_insurance` text,
	`health_insurance_phone` text,
	`health_insurance_email` text,
	`care_level` text,
	`email` text,
	`notes` text,
	`abtretungserklaerung_url` text
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`status` text DEFAULT 'processing' NOT NULL,
	`date` text NOT NULL,
	`invoice_number` text,
	`last_name` text NOT NULL,
	`first_name` text NOT NULL,
	`health_insurance` text,
	`insurance_number` text,
	`birth_date` text,
	`care_level` text,
	`street` text,
	`house_number` text,
	`postal_code` text,
	`city` text,
	`invoice_email` text,
	`hours` real NOT NULL,
	`description` text NOT NULL,
	`rate_per_hour` real DEFAULT 47 NOT NULL,
	`km` real DEFAULT 0 NOT NULL,
	`rate_per_km` real DEFAULT 0.3 NOT NULL,
	`created_at` text NOT NULL,
	`invoice_pdf_url` text,
	`abtretungserklaerung_url` text,
	`paid` integer DEFAULT false NOT NULL
);
