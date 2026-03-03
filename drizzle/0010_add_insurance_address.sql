-- Add insurance address to customers and invoices
ALTER TABLE `customers` ADD `health_insurance_address` text;
ALTER TABLE `invoices` ADD `health_insurance_address` text;
