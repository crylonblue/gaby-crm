ALTER TABLE `invoices` ALTER COLUMN "status" TO "status" text NOT NULL DEFAULT 'offen';--> statement-breakpoint
ALTER TABLE `invoices` ADD `sent_at` text;--> statement-breakpoint
ALTER TABLE `invoices` ADD `send_email_automatically` integer DEFAULT true NOT NULL;