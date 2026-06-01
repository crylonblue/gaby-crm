-- Invoice cancellation (Storno): invoices are never deleted, only cancelled.
-- Link the original invoice and its reversal (Storno) invoice to each other.
ALTER TABLE `invoices` ADD `cancels_invoice_id` integer;
ALTER TABLE `invoices` ADD `cancelled_by_invoice_id` integer;
