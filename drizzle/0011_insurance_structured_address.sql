-- Replace health_insurance_address with structured address for XRechnung/eRechnung
-- Add new columns to customers
ALTER TABLE `customers` ADD `health_insurance_street` text;
ALTER TABLE `customers` ADD `health_insurance_house_number` text;
ALTER TABLE `customers` ADD `health_insurance_postal_code` text;
ALTER TABLE `customers` ADD `health_insurance_city` text;
ALTER TABLE `customers` ADD `health_insurance_country` text;

-- Add new columns to invoices
ALTER TABLE `invoices` ADD `health_insurance_street` text;
ALTER TABLE `invoices` ADD `health_insurance_house_number` text;
ALTER TABLE `invoices` ADD `health_insurance_postal_code` text;
ALTER TABLE `invoices` ADD `health_insurance_city` text;
ALTER TABLE `invoices` ADD `health_insurance_country` text;
ALTER TABLE `invoices` ADD `health_insurance_email` text;
