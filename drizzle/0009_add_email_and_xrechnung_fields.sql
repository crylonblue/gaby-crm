-- Add email subject and body fields for invoice sending
ALTER TABLE `invoices` ADD `email_subject` text;
ALTER TABLE `invoices` ADD `email_body` text;

-- Add XRechnung XML URL field
ALTER TABLE `invoices` ADD `xrechnung_xml_url` text;
